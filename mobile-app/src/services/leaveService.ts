import { supabase } from '../config/supabase';
import { storageService } from './storageService';
import { syncService } from './syncService';
import { LeaveRequest } from '../types';

export const leaveService = {
  async requestLeave(
    userId: string,
    userName: string,
    leaveData: {
      startDate: string;
      endDate: string;
      reason: string;
    }
  ): Promise<LeaveRequest> {
    const timestamp = new Date().toISOString();
    const localId = `local_${Date.now()}`;

    const leave: LeaveRequest = {
      id: localId,
      userId,
      userName,
      startDate: leaveData.startDate,
      endDate: leaveData.endDate,
      reason: leaveData.reason,
      status: 'pending',
      timestamp,
      synced: false,
      localId,
    };

    await storageService.saveLeaveRequest(leave);

    if (syncService.isOnline) {
      try {
        const { data, error } = await supabase
          .from('leave_requests')
          .insert({
            user_id: userId,
            user_name: userName,
            start_date: leaveData.startDate,
            end_date: leaveData.endDate,
            reason: leaveData.reason,
            status: 'pending',
            timestamp,
          })
          .select()
          .single();

        if (!error && data) {
          leave.id = data.id;
          leave.synced = true;
          await storageService.updateLeaveRequest(localId, {
            id: data.id,
            synced: true,
          });
        } else {
          throw error;
        }
      } catch (error) {
        console.error('Leave request sync failed, adding to queue:', error);
        await storageService.addToSyncQueue({
          id: localId,
          type: 'leave',
          data: leave,
          timestamp,
          retries: 0,
        });
      }
    } else {
      await storageService.addToSyncQueue({
        id: localId,
        type: 'leave',
        data: leave,
        timestamp,
        retries: 0,
      });
    }

    return leave;
  },

  async getLeaveRequests(userId?: string): Promise<LeaveRequest[]> {
    const local = await storageService.getLeaveRequests();

    if (syncService.isOnline) {
      try {
        let query = supabase.from('leave_requests').select('*').order('timestamp', { ascending: false });

        if (userId) {
          query = query.eq('user_id', userId);
        }

        const { data } = await query;

        if (data) {
          const merged = [...local];
          for (const item of data) {
            if (!merged.find(l => l.id === item.id)) {
              merged.push({
                id: item.id,
                userId: item.user_id,
                userName: item.user_name,
                startDate: item.start_date,
                endDate: item.end_date,
                reason: item.reason,
                status: item.status,
                timestamp: item.timestamp,
                synced: true,
              });
            }
          }
          return merged.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        }
      } catch (error) {
        console.error('Failed to fetch leave requests:', error);
      }
    }

    return local.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  async updateLeaveStatus(leaveId: string, status: 'approved' | 'rejected'): Promise<void> {
    if (!syncService.isOnline) {
      throw new Error('Must be online to update leave status');
    }

    const { error } = await supabase
      .from('leave_requests')
      .update({ status })
      .eq('id', leaveId);

    if (error) throw error;

    await storageService.updateLeaveRequest(leaveId, { status });
  },
};
