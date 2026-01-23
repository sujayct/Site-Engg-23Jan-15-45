import { StorageService } from '../lib/storage';
import type { DailyReport } from '../types';

export const reportService = {
  async createReport(engineerId: string, clientId: string, workDone: string, issues?: string, siteId?: string): Promise<DailyReport> {
    const response = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, siteId, workDone, issues })
    });
    if (!response.ok) throw new Error('Failed to create report');
    return response.json();
  },

  async getReports(engineerId: string): Promise<DailyReport[]> {
    const response = await fetch('/api/reports');
    if (!response.ok) throw new Error('Failed to fetch reports');
    const reports = await response.json();
    return reports.filter((r: any) => r.engineerId === engineerId);
  },

  async getAllReports(): Promise<DailyReport[]> {
    const response = await fetch('/api/reports');
    if (!response.ok) throw new Error('Failed to fetch reports');
    return response.json();
  }
};
