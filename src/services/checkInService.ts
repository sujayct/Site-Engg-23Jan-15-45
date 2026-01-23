import { StorageService } from '../lib/storage';
import type { CheckIn } from '../types';

export const checkInService = {
  async getTodayCheckIn(engineerId: string): Promise<CheckIn | null> {
    const today = new Date().toISOString().split('T')[0];
    const checkIns = await StorageService.getCheckIns();
    return checkIns.find(c => c.engineerId === engineerId && c.date === today) || null;
  },

  async createCheckIn(engineerId: string, latitude?: number, longitude?: number, locationName?: string, siteId?: string): Promise<CheckIn> {
    const now = new Date();
    return StorageService.createCheckIn({
      engineerId,
      checkInTime: now.toISOString(),
      latitude,
      longitude,
      locationName,
      siteId,
      date: now.toISOString().split('T')[0],
    });
  },

  async checkOut(checkInId: string): Promise<void> {
    await StorageService.updateCheckIn(checkInId, { checkOutTime: new Date().toISOString() });
  },

  async getAllCheckIns(): Promise<CheckIn[]> {
    return StorageService.getCheckIns();
  }
};
