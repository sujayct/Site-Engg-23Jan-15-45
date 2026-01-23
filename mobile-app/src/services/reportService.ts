import { supabase } from '../config/supabase';
import { storageService } from './storageService';
import { syncService } from './syncService';
import { DailyReport } from '../types';

export const reportService = {
  async submitReport(
    userId: string,
    userName: string,
    reportData: {
      siteLocation: string;
      workDescription: string;
      progress: number;
      issues?: string;
      materialsUsed?: string;
    }
  ): Promise<DailyReport> {
    const timestamp = new Date().toISOString();
    const date = new Date().toISOString().split('T')[0];
    const localId = `local_${Date.now()}`;

    const report: DailyReport = {
      id: localId,
      userId,
      userName,
      date,
      siteLocation: reportData.siteLocation,
      workDescription: reportData.workDescription,
      progress: reportData.progress,
      issues: reportData.issues,
      materialsUsed: reportData.materialsUsed,
      timestamp,
      synced: false,
      localId,
    };

    await storageService.saveReport(report);

    if (syncService.isOnline) {
      try {
        const { data, error } = await supabase
          .from('daily_reports')
          .insert({
            user_id: userId,
            user_name: userName,
            date,
            site_location: reportData.siteLocation,
            work_description: reportData.workDescription,
            progress: reportData.progress,
            issues: reportData.issues,
            materials_used: reportData.materialsUsed,
            timestamp,
          })
          .select()
          .single();

        if (!error && data) {
          report.id = data.id;
          report.synced = true;
          await storageService.updateReport(localId, {
            id: data.id,
            synced: true,
          });
        } else {
          throw error;
        }
      } catch (error) {
        console.error('Report sync failed, adding to queue:', error);
        await storageService.addToSyncQueue({
          id: localId,
          type: 'report',
          data: report,
          timestamp,
          retries: 0,
        });
      }
    } else {
      await storageService.addToSyncQueue({
        id: localId,
        type: 'report',
        data: report,
        timestamp,
        retries: 0,
      });
    }

    return report;
  },

  async getReports(userId?: string, startDate?: string, endDate?: string): Promise<DailyReport[]> {
    const local = await storageService.getReports();

    if (syncService.isOnline) {
      try {
        let query = supabase.from('daily_reports').select('*').order('date', { ascending: false });

        if (userId) {
          query = query.eq('user_id', userId);
        }
        if (startDate) {
          query = query.gte('date', startDate);
        }
        if (endDate) {
          query = query.lte('date', endDate);
        }

        const { data } = await query;

        if (data) {
          const merged = [...local];
          for (const item of data) {
            if (!merged.find(r => r.id === item.id)) {
              merged.push({
                id: item.id,
                userId: item.user_id,
                userName: item.user_name,
                date: item.date,
                siteLocation: item.site_location,
                workDescription: item.work_description,
                progress: item.progress,
                issues: item.issues,
                materialsUsed: item.materials_used,
                timestamp: item.timestamp,
                synced: true,
              });
            }
          }
          return merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        }
      } catch (error) {
        console.error('Failed to fetch reports:', error);
      }
    }

    return local.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },
};
