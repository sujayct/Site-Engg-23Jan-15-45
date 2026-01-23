import type { CheckIn } from '../types';
import { StorageService } from '../lib/storage';

export interface AttendanceRecord {
  date: string;
  engineerId: string;
  engineerName: string;
  status: 'present' | 'absent' | 'leave';
  checkInTime?: string;
  checkOutTime?: string;
  hoursWorked?: number;
  site?: string;
}

export interface EngineerSummary {
  engineerId: string;
  engineerName: string;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  leaveDays: number;
  totalHours: number;
  averageHoursPerDay: number;
}

export interface ClientReport {
  clientId: string;
  clientName: string;
  totalAssignments: number;
  activeEngineers: number;
  totalCheckIns: number;
  totalReports: number;
  sitesCount: number;
}

export interface BackupUsage {
  totalBackups: number;
  storageUsedMB: number;
  avgBackupSizeMB: number;
  lastBackupDate: string;
}

export interface PayrollRecord {
  engineerId: string;
  engineerName: string;
  email: string;
  phone: string;
  workingDays: number;
  totalHours: number;
  leaveDays: number;
  overtimeHours: number;
}

const calculateHoursWorked = (checkIn: CheckIn): number => {
  if (!checkIn.checkInTime || !checkIn.checkOutTime) return 0;

  const checkInDate = new Date(checkIn.checkInTime);
  const checkOutDate = new Date(checkIn.checkOutTime);
  const hours = (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60);

  return Math.max(0, hours);
};

export const hrReportService = {
  async getDailyAttendanceRegister(date: string): Promise<AttendanceRecord[]> {
    const { profileService } = await import('./profileService');
    const { checkInService } = await import('./checkInService');
    const { leaveService } = await import('./leaveService');
    
    const engineers = await profileService.getAllEngineers();
    const checkIns = await checkInService.getAllCheckIns();
    const leaves = await leaveService.getAllLeaveRequests();

    const dailyCheckIns = checkIns.filter(c => c.date === date);
    const dailyLeaves = leaves.filter(l => {
      return l.status === 'approved' && date >= l.startDate && date <= l.endDate;
    });

    const records: AttendanceRecord[] = engineers.map(engineer => {
      const engineerId = (engineer as any).id || (engineer as any).engineer_id;
      const checkIn = dailyCheckIns.find(c => c.engineerId === engineerId);
      const onLeave = dailyLeaves.find(l => l.engineerId === engineerId);

      if (checkIn) {
        return {
          date,
          engineerId: engineerId,
          engineerName: (engineer as any).full_name || 'Engineer',
          status: 'present',
          checkInTime: checkIn.checkInTime,
          checkOutTime: checkIn.checkOutTime,
          hoursWorked: calculateHoursWorked(checkIn),
          site: checkIn.locationName
        } as AttendanceRecord;
      } else if (onLeave) {
        return {
          date,
          engineerId: engineerId,
          engineerName: (engineer as any).full_name || 'Engineer',
          status: 'leave'
        } as AttendanceRecord;
      } else {
        return {
          date,
          engineerId: engineerId,
          engineerName: (engineer as any).full_name || 'Engineer',
          status: 'absent'
        } as AttendanceRecord;
      }
    });

    return records;
  },

  async getWeeklyEngineerSummary(startDate: string, endDate: string): Promise<EngineerSummary[]> {
    const { profileService } = await import('./profileService');
    const { checkInService } = await import('./checkInService');
    const { leaveService } = await import('./leaveService');

    const engineers = await profileService.getAllEngineers();
    const checkIns = await checkInService.getAllCheckIns();
    const leaves = await leaveService.getAllLeaveRequests();

    const weekCheckIns = checkIns.filter(c => c.date >= startDate && c.date <= endDate);
    const weekLeaves = leaves.filter(l => {
      return l.status === 'approved' &&
             ((l.startDate >= startDate && l.startDate <= endDate) ||
              (l.endDate >= startDate && l.endDate <= endDate) ||
              (l.startDate <= startDate && l.endDate >= endDate));
    });

    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const summaries: EngineerSummary[] = engineers.map(engineer => {
      const engineerId = (engineer as any).id || (engineer as any).engineer_id;
      const engineerCheckIns = weekCheckIns.filter(c => c.engineerId === engineerId);
      const engineerLeaves = weekLeaves.filter(l => l.engineerId === engineerId);

      const presentDays = new Set(engineerCheckIns.map(c => c.date)).size;

      const leaveDays = engineerLeaves.reduce((sum, leave) => {
        const leaveStart = new Date(leave.startDate > startDate ? leave.startDate : startDate);
        const leaveEnd = new Date(leave.endDate < endDate ? leave.endDate : endDate);
        return sum + Math.ceil((leaveEnd.getTime() - leaveStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      }, 0);

      const absentDays = totalDays - presentDays - leaveDays;

      const totalHours = engineerCheckIns.reduce((sum, checkIn) =>
        sum + calculateHoursWorked(checkIn), 0
      );

      return {
        engineerId: engineerId,
        engineerName: (engineer as any).full_name || '',
        totalDays,
        presentDays,
        absentDays: Math.max(0, absentDays),
        leaveDays,
        totalHours: Math.round(totalHours * 100) / 100,
        averageHoursPerDay: presentDays > 0 ? Math.round((totalHours / presentDays) * 100) / 100 : 0
      };
    });

    return summaries;
  },

  async getMonthlyClientReport(month: string): Promise<ClientReport[]> {
    const { checkInService } = await import('./checkInService');
    const { reportService } = await import('./reportService');
    const { assignmentService } = await import('./assignmentService');
    
    const clients = await StorageService.getClients();

    const assignments = await assignmentService.getAllAssignments();
    const checkIns = await checkInService.getAllCheckIns();
    const reports = await reportService.getAllReports();

    const sites = await StorageService.getSites();

    const startOfMonth = month + '-01';
    const lastDay = new Date(new Date(month).getFullYear(), new Date(month).getMonth() + 1, 0).getDate();
    const endOfMonth = month + '-' + (lastDay < 10 ? '0' + lastDay : lastDay);

    const monthCheckIns = checkIns.filter(c => c.date >= startOfMonth && c.date <= endOfMonth);
    const monthReports = reports.filter(r => r.date >= startOfMonth && r.date <= endOfMonth);

    const clientReports: ClientReport[] = (clients || []).map((client: any) => {
      const clientSites = (sites || []).filter((s: any) => s.client_id === client.id);
      const clientAssignments = assignments.filter(a => a.clientId === client.id);

      const activeEngineers = new Set(
        clientAssignments
          .filter(a => a.status === 'active')
          .map(a => a.engineerId)
      ).size;

      const clientCheckIns = monthCheckIns.filter(c =>
        clientSites.some((s: any) => s.id === (c as any).siteId) || clientAssignments.some(a => a.engineerId === c.engineerId)
      );

      const clientReportsList = monthReports.filter(r =>
        r.clientId === client.id || clientAssignments.some(a => a.engineerId === r.engineerId)
      );

      return {
        clientId: client.id,
        clientName: client.name,
        totalAssignments: clientAssignments.length,
        activeEngineers,
        totalCheckIns: clientCheckIns.length,
        totalReports: clientReportsList.length,
        sitesCount: clientSites.length
      };
    });

    return clientReports;
  },

  async getBackupUsage(): Promise<BackupUsage> {
    const backups = localStorage.getItem('system_backups');

    if (!backups) {
      return {
        totalBackups: 0,
        storageUsedMB: 0,
        avgBackupSizeMB: 0,
        lastBackupDate: 'Never'
      };
    }

    const backupList = JSON.parse(backups);
    const totalBackups = backupList.length;

    const totalSize = backupList.reduce((sum: number, backup: any) => {
      const sizeInBytes = new Blob([JSON.stringify(backup.data)]).size;
      return sum + sizeInBytes;
    }, 0);

    const storageUsedMB = Math.round((totalSize / (1024 * 1024)) * 100) / 100;
    const avgBackupSizeMB = totalBackups > 0
      ? Math.round((storageUsedMB / totalBackups) * 100) / 100
      : 0;

    const lastBackup = backupList.length > 0
      ? backupList[backupList.length - 1].timestamp
      : 'Never';

    return {
      totalBackups,
      storageUsedMB,
      avgBackupSizeMB,
      lastBackupDate: lastBackup
    };
  },

  async getPayrollData(month: string): Promise<PayrollRecord[]> {
    const { profileService } = await import('./profileService');
    const { checkInService } = await import('./checkInService');
    const { leaveService } = await import('./leaveService');

    const engineers = await profileService.getAllEngineers();
    const checkIns = await checkInService.getAllCheckIns();
    const leaves = await leaveService.getAllLeaveRequests();

    const startOfMonth = month + '-01';
    const lastDay = new Date(new Date(month).getFullYear(), new Date(month).getMonth() + 1, 0).getDate();
    const endOfMonth = month + '-' + (lastDay < 10 ? '0' + lastDay : lastDay);

    const monthCheckIns = checkIns.filter(c => c.date >= startOfMonth && c.date <= endOfMonth);
    const monthLeaves = leaves.filter(l => {
      return l.status === 'approved' &&
             ((l.startDate >= startOfMonth && l.startDate <= endOfMonth) ||
              (l.endDate >= startOfMonth && l.endDate <= endOfMonth) ||
              (l.startDate <= startOfMonth && l.endDate >= endOfMonth));
    });

    const payrollRecords: PayrollRecord[] = engineers.map(engineer => {
      const engineerId = (engineer as any).id || (engineer as any).engineer_id;
      const engineerCheckIns = monthCheckIns.filter(c => c.engineerId === engineerId);
      const engineerLeaves = monthLeaves.filter(l => l.engineerId === engineerId);

      const workingDays = new Set(engineerCheckIns.map(c => c.date)).size;

      const totalHours = engineerCheckIns.reduce((sum, checkIn) =>
        sum + calculateHoursWorked(checkIn), 0
      );

      const leaveDays = engineerLeaves.reduce((sum, leave) => {
        const leaveStart = new Date(leave.startDate > startOfMonth ? leave.startDate : startOfMonth);
        const leaveEnd = new Date(leave.endDate < endOfMonth ? leave.endDate : endOfMonth);
        return sum + Math.ceil((leaveEnd.getTime() - leaveStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      }, 0);

      const standardHoursPerDay = 8;
      const overtimeHours = Math.max(0, totalHours - (workingDays * standardHoursPerDay));

      return {
        engineerId: engineerId,
        engineerName: (engineer as any).full_name || '',
        email: engineer.email || '',
        phone: (engineer as any).phone || '',
        workingDays,
        totalHours: Math.round(totalHours * 100) / 100,
        leaveDays,
        overtimeHours: Math.round(overtimeHours * 100) / 100
      };
    });

    return payrollRecords;
  },

  exportPayrollToCSV(payrollData: PayrollRecord[], _month: string): string {
    const headers = [
      'Employee ID',
      'Employee Name',
      'Email',
      'Phone',
      'Working Days',
      'Total Hours',
      'Leave Days',
      'Overtime Hours'
    ];

    const rows = payrollData.map(record => [
      record.engineerId,
      record.engineerName,
      record.email,
      record.phone,
      record.workingDays.toString(),
      record.totalHours.toString(),
      record.leaveDays.toString(),
      record.overtimeHours.toString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    return csvContent;
  },

  downloadCSV(csvContent: string, filename: string): void {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
