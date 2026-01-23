import { StorageService } from '../lib/storage';
import type { LeaveRequest } from '../types';

export const leaveService = {
  async createLeaveRequest(engineerId: string, startDate: string, endDate: string, reason: string): Promise<LeaveRequest> {
    return StorageService.createLeaveRequest({
      engineerId,
      startDate,
      endDate,
      reason,
      status: 'pending',
    });
  },

  async getAllLeaveRequests(): Promise<LeaveRequest[]> {
    return StorageService.getLeaveRequests();
  },

  async approveLeave(leaveId: string, approvedBy: string, backupEngineerId?: string): Promise<LeaveRequest | null> {
    return StorageService.updateLeaveRequest(leaveId, {
      status: 'approved',
      approvedBy,
      backupEngineerId,
      approvedAt: new Date().toISOString(),
    });
  },

  async rejectLeave(leaveId: string, rejectedBy: string): Promise<LeaveRequest | null> {
    return StorageService.updateLeaveRequest(leaveId, {
      status: 'rejected',
      approvedBy: rejectedBy,
      approvedAt: new Date().toISOString(),
    });
  }
};
