import { StorageService } from '../lib/storage';
import type { Assignment } from '../types';

export const assignmentService = {
  async getMyAssignments(engineerId: string): Promise<Assignment[]> {
    const assignments = await StorageService.getAssignments();
    return assignments.filter(a => a.engineerId === engineerId && (a.status === 'active' || (a as any).is_active));
  },

  async getAllAssignments(): Promise<Assignment[]> {
    return StorageService.getAssignments();
  },

  async createAssignment(data: { engineerId: string; clientId: string; siteId?: string; assignedDate: string }): Promise<Assignment> {
    return StorageService.createAssignment({
      ...data,
      status: 'active',
      siteId: data.siteId || ''
    });
  }
};
