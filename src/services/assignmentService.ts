import { StorageService } from '../lib/storage';
import type { Assignment } from '../types';

export const assignmentService = {
  async getMyAssignments(engineerId: string): Promise<Assignment[]> {
    const response = await fetch('/api/assignments');
    if (!response.ok) throw new Error('Failed to fetch assignments');
    const assignments = await response.json();
    return assignments.filter((a: any) => a.engineerId === engineerId);
  },

  async getAllAssignments(): Promise<Assignment[]> {
    const response = await fetch('/api/assignments');
    if (!response.ok) throw new Error('Failed to fetch assignments');
    return response.json();
  },

  async createAssignment(data: { engineerId: string; clientId: string; siteId?: string; assignedDate: string }): Promise<Assignment> {
    const response = await fetch('/api/assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to create assignment');
    return response.json();
  }
};
