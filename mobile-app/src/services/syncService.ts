import NetInfo from '@react-native-community/netinfo';
import { supabase } from '../config/supabase';
import { storageService } from './storageService';
import { SyncQueueItem } from '../types';

export const syncService = {
  isOnline: false,

  async initialize(): Promise<void> {
    NetInfo.addEventListener(state => {
      this.isOnline = state.isConnected ?? false;
      if (this.isOnline) {
        this.processSyncQueue();
      }
    });

    const state = await NetInfo.fetch();
    this.isOnline = state.isConnected ?? false;
  },

  async processSyncQueue(): Promise<void> {
    if (!this.isOnline) return;

    const queue = await storageService.getSyncQueue();
    if (queue.length === 0) return;

    for (const item of queue) {
      try {
        await this.syncItem(item);
        await storageService.removeFromSyncQueue(item.id);
      } catch (error) {
        console.error('Sync failed for item:', item.id, error);
        if (item.retries < 3) {
          await storageService.updateSyncQueueItem(item.id, {
            retries: item.retries + 1,
          });
        }
      }
    }
  },

  async syncItem(item: SyncQueueItem): Promise<void> {
    switch (item.type) {
      case 'checkin':
        await this.syncCheckIn(item);
        break;
      case 'report':
        await this.syncReport(item);
        break;
      case 'leave':
        await this.syncLeaveRequest(item);
        break;
    }
  },

  async syncCheckIn(item: SyncQueueItem): Promise<void> {
    const { error, data } = await supabase
      .from('check_ins')
      .insert({
        user_id: item.data.userId,
        user_name: item.data.userName,
        latitude: item.data.latitude,
        longitude: item.data.longitude,
        address: item.data.address,
        timestamp: item.data.timestamp,
      })
      .select()
      .single();

    if (error) throw error;

    await storageService.updateCheckIn(item.data.localId, {
      id: data.id,
      synced: true,
    });
  },

  async syncReport(item: SyncQueueItem): Promise<void> {
    const { error, data } = await supabase
      .from('daily_reports')
      .insert({
        user_id: item.data.userId,
        user_name: item.data.userName,
        date: item.data.date,
        site_location: item.data.siteLocation,
        work_description: item.data.workDescription,
        progress: item.data.progress,
        issues: item.data.issues,
        materials_used: item.data.materialsUsed,
        timestamp: item.data.timestamp,
      })
      .select()
      .single();

    if (error) throw error;

    await storageService.updateReport(item.data.localId, {
      id: data.id,
      synced: true,
    });
  },

  async syncLeaveRequest(item: SyncQueueItem): Promise<void> {
    const { error, data } = await supabase
      .from('leave_requests')
      .insert({
        user_id: item.data.userId,
        user_name: item.data.userName,
        start_date: item.data.startDate,
        end_date: item.data.endDate,
        reason: item.data.reason,
        status: item.data.status,
        timestamp: item.data.timestamp,
      })
      .select()
      .single();

    if (error) throw error;

    await storageService.updateLeaveRequest(item.data.localId, {
      id: data.id,
      synced: true,
    });
  },

  async fetchLatestData(): Promise<void> {
    if (!this.isOnline) return;

    const lastSync = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: checkIns } = await supabase
      .from('check_ins')
      .select('*')
      .gte('timestamp', lastSync);

    if (checkIns) {
      for (const item of checkIns) {
        const existing = await storageService.getCheckIns();
        if (!existing.find(c => c.id === item.id)) {
          await storageService.saveCheckIn({
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
    }
  },
};
