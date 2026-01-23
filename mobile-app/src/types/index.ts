export type UserRole = 'engineer' | 'hr' | 'client' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface CheckIn {
  id: string;
  userId: string;
  userName: string;
  latitude: number;
  longitude: number;
  address?: string;
  timestamp: string;
  synced: boolean;
  localId?: string;
}

export interface DailyReport {
  id: string;
  userId: string;
  userName: string;
  date: string;
  siteLocation: string;
  workDescription: string;
  progress: number;
  issues?: string;
  materialsUsed?: string;
  timestamp: string;
  synced: boolean;
  localId?: string;
}

export interface LeaveRequest {
  id: string;
  userId: string;
  userName: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: string;
  synced: boolean;
  localId?: string;
}

export interface Assignment {
  id: string;
  engineerId: string;
  engineerName: string;
  clientId: string;
  clientName: string;
  siteLocation: string;
  startDate: string;
  endDate?: string;
  status: 'active' | 'completed';
}

export interface SyncQueueItem {
  id: string;
  type: 'checkin' | 'report' | 'leave';
  data: any;
  timestamp: string;
  retries: number;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
}
