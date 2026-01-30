import type { LeaveRequest } from '../types';

export const leaveService = {
  async getMyLeaveRequests(engineerId: string): Promise<LeaveRequest[]> {
    const response = await fetch('/api/leaves');
    if (!response.ok) throw new Error('Failed to fetch leaves');
    const leaves = await response.json();
    return leaves.filter((l: any) => l.engineerId === engineerId);
  },

  async getAllLeaveRequests(): Promise<LeaveRequest[]> {
    const response = await fetch('/api/leaves');
    if (!response.ok) throw new Error('Failed to fetch leaves');
    return response.json();
  },

  async createLeaveRequest(_engineerId: string, startDate: string, endDate: string, reason: string): Promise<LeaveRequest> {
    const response = await fetch('/api/leaves', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startDate, endDate, reason })
    });
    if (!response.ok) throw new Error('Failed to create leave request');
    return response.json();
  },

  async approveLeave(leaveId: string, approvedBy: string, backupEngineerId?: string): Promise<LeaveRequest | null> {
    const response = await fetch(`/api/leaves/${leaveId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approvedBy, backupEngineerId })
    });
    if (!response.ok) throw new Error('Failed to approve leave');
    return response.json();
  },

  async rejectLeave(leaveId: string, rejectedBy: string): Promise<LeaveRequest | null> {
    const response = await fetch(`/api/leaves/${leaveId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rejectedBy })
    });
    if (!response.ok) throw new Error('Failed to reject leave');
    return response.json();
  }
};
