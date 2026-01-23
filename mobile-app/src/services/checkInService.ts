import * as Location from 'expo-location';
import { supabase } from '../config/supabase';
import { storageService } from './storageService';
import { syncService } from './syncService';
import { CheckIn } from '../types';

export const checkInService = {
  async requestLocationPermission(): Promise<boolean> {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  },

  async getCurrentLocation(): Promise<{ latitude: number; longitude: number; address?: string }> {
    const hasPermission = await this.requestLocationPermission();
    if (!hasPermission) {
      throw new Error('Location permission not granted');
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    let address: string | undefined;
    try {
      const geocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (geocode.length > 0) {
        const result = geocode[0];
        address = [
          result.street,
          result.city,
          result.region,
          result.postalCode,
          result.country,
        ]
          .filter(Boolean)
          .join(', ');
      }
    } catch (error) {
      console.error('Geocoding failed:', error);
    }

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      address,
    };
  },

  async checkIn(userId: string, userName: string): Promise<CheckIn> {
    const location = await this.getCurrentLocation();
    const timestamp = new Date().toISOString();
    const localId = `local_${Date.now()}`;

    const checkIn: CheckIn = {
      id: localId,
      userId,
      userName,
      latitude: location.latitude,
      longitude: location.longitude,
      address: location.address,
      timestamp,
      synced: false,
      localId,
    };

    await storageService.saveCheckIn(checkIn);

    if (syncService.isOnline) {
      try {
        const { data, error } = await supabase
          .from('check_ins')
          .insert({
            user_id: userId,
            user_name: userName,
            latitude: location.latitude,
            longitude: location.longitude,
            address: location.address,
            timestamp,
          })
          .select()
          .single();

        if (!error && data) {
          checkIn.id = data.id;
          checkIn.synced = true;
          await storageService.updateCheckIn(localId, {
            id: data.id,
            synced: true,
          });
        } else {
          throw error;
        }
      } catch (error) {
        console.error('Check-in sync failed, adding to queue:', error);
        await storageService.addToSyncQueue({
          id: localId,
          type: 'checkin',
          data: checkIn,
          timestamp,
          retries: 0,
        });
      }
    } else {
      await storageService.addToSyncQueue({
        id: localId,
        type: 'checkin',
        data: checkIn,
        timestamp,
        retries: 0,
      });
    }

    return checkIn;
  },

  async getCheckIns(userId?: string): Promise<CheckIn[]> {
    const local = await storageService.getCheckIns();

    if (syncService.isOnline) {
      try {
        let query = supabase.from('check_ins').select('*').order('timestamp', { ascending: false });

        if (userId) {
          query = query.eq('user_id', userId);
        }

        const { data } = await query;

        if (data) {
          const merged = [...local];
          for (const item of data) {
            if (!merged.find(c => c.id === item.id)) {
              merged.push({
                id: item.id,
                userId: item.user_id,
                userName: item.user_name,
                latitude: item.latitude,
                longitude: item.longitude,
                address: item.address,
                timestamp: item.timestamp,
                synced: true,
              });
            }
          }
          return merged.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        }
      } catch (error) {
        console.error('Failed to fetch check-ins:', error);
      }
    }

    return local.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },
};
