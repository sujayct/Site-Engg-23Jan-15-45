import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../utils/AuthContext';
import { checkInService } from '../services/checkInService';
import { useNavigation } from '@react-navigation/native';

export default function CheckInScreen() {
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number; address?: string } | null>(null);
  const { user } = useAuth();
  const navigation = useNavigation();

  const getLocation = async () => {
    setLoading(true);
    try {
      const loc = await checkInService.getCurrentLocation();
      setLocation(loc);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to get location');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!user || !location) return;

    setLoading(true);
    try {
      await checkInService.checkIn(user.id, user.name);
      Alert.alert('Success', 'Check-in successful!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Check-in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>GPS Check-In</Text>
        <Text style={styles.description}>
          Get your current location and check in to record your site visit.
        </Text>

        {!location && (
          <TouchableOpacity
            style={styles.button}
            onPress={getLocation}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Get Location</Text>
            )}
          </TouchableOpacity>
        )}

        {location && (
          <View style={styles.locationInfo}>
            <Text style={styles.locationTitle}>Current Location</Text>
            <Text style={styles.locationText}>
              Latitude: {location.latitude.toFixed(6)}
            </Text>
            <Text style={styles.locationText}>
              Longitude: {location.longitude.toFixed(6)}
            </Text>
            {location.address && (
              <Text style={styles.addressText}>{location.address}</Text>
            )}

            <TouchableOpacity
              style={[styles.button, styles.buttonSuccess]}
              onPress={handleCheckIn}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Confirm Check-In</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary]}
              onPress={getLocation}
              disabled={loading}
            >
              <Text style={styles.buttonSecondaryText}>Refresh Location</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonSuccess: {
    backgroundColor: '#10b981',
  },
  buttonSecondary: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonSecondaryText: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: '600',
  },
  locationInfo: {
    marginTop: 16,
  },
  locationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  locationText: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: '#1e293b',
    marginTop: 8,
    marginBottom: 16,
    fontWeight: '500',
  },
});
