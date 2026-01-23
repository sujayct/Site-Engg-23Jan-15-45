import { StorageService } from '../lib/storage';
import type { DailyReport } from '../types';

export const reportService = {
  async createReport(engineerId: string, clientId: string, workDone: string, issues?: string, siteId?: string): Promise<DailyReport> {
    return StorageService.createDailyReport({
      engineerId,
      clientId,
      workDone,
      issues,
      siteId,
      date: new Date().toISOString().split('T')[0],
    });
  },

  async getReports(engineerId: string): Promise<DailyReport[]> {
    const reports = await StorageService.getDailyReports();
    return reports.filter(r => r.engineerId === engineerId);
  },

  async getAllReports(): Promise<DailyReport[]> {
    return StorageService.getDailyReports();
  }
};
