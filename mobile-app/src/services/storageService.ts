import AsyncStorage from '@react-native-async-storage/async-storage';
import { CheckIn, DailyReport, LeaveRequest, SyncQueueItem } from '../types';

const KEYS = {
  CHECKINS: 'checkins',
  REPORTS: 'reports',
  LEAVES: 'leaves',
  SYNC_QUEUE: 'sync_queue',
};

export const storageService = {
  async saveCheckIn(checkIn: CheckIn): Promise<void> {
    const stored = await this.getCheckIns();
    stored.push(checkIn);
    await AsyncStorage.setItem(KEYS.CHECKINS, JSON.stringify(stored));
  },

  async getCheckIns(): Promise<CheckIn[]> {
    const data = await AsyncStorage.getItem(KEYS.CHECKINS);
    return data ? JSON.parse(data) : [];
  },

  async updateCheckIn(id: string, updates: Partial<CheckIn>): Promise<void> {
    const stored = await this.getCheckIns();
    const index = stored.findIndex(item => item.id === id || item.localId === id);
    if (index !== -1) {
      stored[index] = { ...stored[index], ...updates };
      await AsyncStorage.setItem(KEYS.CHECKINS, JSON.stringify(stored));
    }
  },

  async saveReport(report: DailyReport): Promise<void> {
    const stored = await this.getReports();
    stored.push(report);
    await AsyncStorage.setItem(KEYS.REPORTS, JSON.stringify(stored));
  },

  async getReports(): Promise<DailyReport[]> {
    const data = await AsyncStorage.getItem(KEYS.REPORTS);
    return data ? JSON.parse(data) : [];
  },

  async updateReport(id: string, updates: Partial<DailyReport>): Promise<void> {
    const stored = await this.getReports();
    const index = stored.findIndex(item => item.id === id || item.localId === id);
    if (index !== -1) {
      stored[index] = { ...stored[index], ...updates };
      await AsyncStorage.setItem(KEYS.REPORTS, JSON.stringify(stored));
    }
  },

  async saveLeaveRequest(leave: LeaveRequest): Promise<void> {
    const stored = await this.getLeaveRequests();
    stored.push(leave);
    await AsyncStorage.setItem(KEYS.LEAVES, JSON.stringify(stored));
  },

  async getLeaveRequests(): Promise<LeaveRequest[]> {
    const data = await AsyncStorage.getItem(KEYS.LEAVES);
    return data ? JSON.parse(data) : [];
  },

  async updateLeaveRequest(id: string, updates: Partial<LeaveRequest>): Promise<void> {
    const stored = await this.getLeaveRequests();
    const index = stored.findIndex(item => item.id === id || item.localId === id);
    if (index !== -1) {
      stored[index] = { ...stored[index], ...updates };
      await AsyncStorage.setItem(KEYS.LEAVES, JSON.stringify(stored));
    }
  },

  async addToSyncQueue(item: SyncQueueItem): Promise<void> {
    const queue = await this.getSyncQueue();
    queue.push(item);
    await AsyncStorage.setItem(KEYS.SYNC_QUEUE, JSON.stringify(queue));
  },

  async getSyncQueue(): Promise<SyncQueueItem[]> {
    const data = await AsyncStorage.getItem(KEYS.SYNC_QUEUE);
    return data ? JSON.parse(data) : [];
  },

  async removeFromSyncQueue(id: string): Promise<void> {
    const queue = await this.getSyncQueue();
    const filtered = queue.filter(item => item.id !== id);
    await AsyncStorage.setItem(KEYS.SYNC_QUEUE, JSON.stringify(filtered));
  },

  async updateSyncQueueItem(id: string, updates: Partial<SyncQueueItem>): Promise<void> {
    const queue = await this.getSyncQueue();
    const index = queue.findIndex(item => item.id === id);
    if (index !== -1) {
      queue[index] = { ...queue[index], ...updates };
      await AsyncStorage.setItem(KEYS.SYNC_QUEUE, JSON.stringify(queue));
    }
  },

  async clearSyncQueue(): Promise<void> {
    await AsyncStorage.setItem(KEYS.SYNC_QUEUE, JSON.stringify([]));
  },
};
