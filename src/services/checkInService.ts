import { StorageService } from '../lib/storage';
import type { CheckIn } from '../types';

export const checkInService = {
  async getTodayCheckIn(engineerId: string): Promise<CheckIn | null> {
    const response = await fetch('/api/check-ins');
    if (!response.ok) throw new Error('Failed to fetch check-ins');
    const checkIns = await response.json();
    const today = new Date().toISOString().split('T')[0];
    return checkIns.find((c: any) => c.engineerId === engineerId && c.date === today) || null;
  },

  async createCheckIn(engineerId: string, latitude: number, longitude: number, locationName: string, siteId?: string): Promise<CheckIn> {
    const response = await fetch('/api/check-ins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ engineerId, latitude, longitude, locationName, siteId })
    });
    if (!response.ok) throw new Error('Failed to create check-in');
    return response.json();
  },

  async checkOut(checkInId: string): Promise<CheckIn> {
    const response = await fetch(`/api/check-ins/${checkInId}/checkout`, {
      method: 'POST'
    });
    if (!response.ok) throw new Error('Failed to check out');
    return response.json();
  },

  async getAllCheckIns(): Promise<CheckIn[]> {
    const response = await fetch('/api/check-ins');
    if (!response.ok) throw new Error('Failed to fetch check-ins');
    return response.json();
  },
};
