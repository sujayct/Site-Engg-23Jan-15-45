import { useState, useEffect } from 'react';
import { Calendar, FileText, CheckCircle, XCircle, Loader, RefreshCw } from 'lucide-react';
import { checkInService } from '../../services/checkInService';
import { reportService } from '../../services/reportService';
import { leaveService } from '../../services/leaveService';
import { StorageService } from '../../lib/storage';
import type { CheckIn, DailyReport, LeaveRequest, Engineer } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import MobileClientWiseView from './MobileClientWiseView';

export default function MobileHRDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [todayCheckIns, setTodayCheckIns] = useState<CheckIn[]>([]);
  const [pendingLeaves, setPendingLeaves] = useState<LeaveRequest[]>([]);
  const [recentReports, setRecentReports] = useState<DailyReport[]>([]);
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [activeTab, setActiveTab] = useState<'attendance' | 'leaves' | 'reports' | 'clientwise'>('attendance');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData(isRefresh = false) {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const today = new Date().toISOString().split('T')[0];

      const engineersList = await StorageService.getEngineers();

      const [checkIns, leaves, reports] = await Promise.all([
        checkInService.getAllCheckIns(),
        leaveService.getAllLeaveRequests(),
        reportService.getReports(),
      ]);

      const filteredCheckIns = checkIns.filter((c: CheckIn) => c.date === today);
      const filteredReports = reports.filter((r: DailyReport) => r.date === today);
      const pendingLeavesList = leaves.filter((l: LeaveRequest) => l.status === 'pending');

      setTodayCheckIns(filteredCheckIns);
      setPendingLeaves(pendingLeavesList);
      setRecentReports(filteredReports);
      setEngineers(engineersList);
    } catch (error) {
      console.error('Failed to load HR data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function handleLeaveAction(leaveId: string, action: 'approve' | 'reject', backupEngineerId?: string) {
    if (!user) return;

    try {
      if (action === 'approve') {
        await leaveService.approveLeave(leaveId, user.id, backupEngineerId);
      } else {
        await leaveService.rejectLeave(leaveId, user.id);
      }
      await loadData();
    } catch (error) {
      console.error('Failed to process leave:', error);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex items-center justify-center p-4">
        <div className="text-center">
          <Loader className="w-12 h-12 text-emerald-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  const attendanceRate = engineers.length > 0 ? Math.round((todayCheckIns.length / engineers.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white pb-20">
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-4 py-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">HR Dashboard</h1>
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/10 backdrop-blur rounded-xl p-3">
            <p className="text-xs text-emerald-100 mb-1">Attendance</p>
            <p className="text-2xl font-bold">{attendanceRate}%</p>
            <p className="text-xs text-emerald-100">{todayCheckIns.length}/{engineers.length}</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-3">
            <p className="text-xs text-emerald-100 mb-1">Pending</p>
            <p className="text-2xl font-bold">{pendingLeaves.length}</p>
            <p className="text-xs text-emerald-100">Leave requests</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-3">
            <p className="text-xs text-emerald-100 mb-1">Reports</p>
            <p className="text-2xl font-bold">{recentReports.length}</p>
            <p className="text-xs text-emerald-100">Today</p>
          </div>
        </div>
      </div>

      <div className="flex border-b border-slate-200 bg-white sticky top-0 z-10 shadow-sm overflow-x-auto scrollbar-hide">
        <button
          onClick={() => setActiveTab('attendance')}
          className={`flex-1 py-3 text-sm font-medium transition-colors whitespace-nowrap min-w-[80px] ${
            activeTab === 'attendance'
              ? 'text-emerald-600 border-b-2 border-emerald-600'
              : 'text-slate-600'
          }`}
        >
          Attendance
        </button>
        <button
          onClick={() => setActiveTab('clientwise')}
          className={`flex-1 py-3 text-sm font-medium transition-colors whitespace-nowrap min-w-[80px] ${
            activeTab === 'clientwise'
              ? 'text-emerald-600 border-b-2 border-emerald-600'
              : 'text-slate-600'
          }`}
        >
          Client-wise
        </button>
        <button
          onClick={() => setActiveTab('leaves')}
          className={`flex-1 py-3 text-sm font-medium transition-colors relative whitespace-nowrap min-w-[80px] ${
            activeTab === 'leaves'
              ? 'text-emerald-600 border-b-2 border-emerald-600'
              : 'text-slate-600'
          }`}
        >
          Leaves
          {pendingLeaves.length > 0 && (
            <span className="absolute top-2 right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {pendingLeaves.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`flex-1 py-3 text-sm font-medium transition-colors whitespace-nowrap min-w-[80px] ${
            activeTab === 'reports'
              ? 'text-emerald-600 border-b-2 border-emerald-600'
              : 'text-slate-600'
          }`}
        >
          Reports
        </button>
      </div>

      <div className="p-4">
        {activeTab === 'attendance' && (
          <AttendanceTab checkIns={todayCheckIns} engineers={engineers} />
        )}
        {activeTab === 'clientwise' && (
          <MobileClientWiseView />
        )}
        {activeTab === 'leaves' && (
          <LeavesTab
            leaves={pendingLeaves}
            engineers={engineers}
            onAction={handleLeaveAction}
          />
        )}
        {activeTab === 'reports' && (
          <ReportsTab reports={recentReports} engineers={engineers} />
        )}
      </div>
    </div>
  );
}

function AttendanceTab({ checkIns, engineers }: { checkIns: CheckIn[]; engineers: Engineer[] }) {
  const checkedInIds = new Set(checkIns.map(c => c.engineerId));
  const absent = engineers.filter(e => !checkedInIds.has(e.id));

  return (
    <div className="space-y-4">
      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
        <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          Present ({checkIns.length})
        </h3>
        {checkIns.length === 0 ? (
          <p className="text-sm text-green-700">No check-ins yet today</p>
        ) : (
          <div className="space-y-2">
            {checkIns.map((checkIn) => {
              const engineer = engineers.find(e => e.id === checkIn.engineerId);
              return (
                <div key={checkIn.id} className="bg-white rounded-lg p-3 shadow-sm">
                  <p className="font-medium text-slate-900">{engineer?.name || 'Unknown'}</p>
                  <p className="text-xs text-slate-600 mt-1">
                    {new Date(checkIn.checkInTime).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {absent.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <h3 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
            <XCircle className="w-5 h-5" />
            Not Checked In ({absent.length})
          </h3>
          <div className="space-y-2">
            {absent.map((engineer) => (
              <div key={engineer.id} className="bg-white rounded-lg p-3 shadow-sm">
                <p className="font-medium text-slate-900">{engineer.name}</p>
                <p className="text-xs text-slate-600">{engineer.email}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function LeavesTab({
  leaves,
  engineers,
  onAction,
}: {
  leaves: LeaveRequest[];
  engineers: Engineer[];
  onAction: (leaveId: string, action: 'approve' | 'reject', backupEngineerId?: string) => void;
}) {
  const [selectedBackup, setSelectedBackup] = useState<{ [key: string]: string }>({});
  const [processing, setProcessing] = useState<string | null>(null);

  async function handleAction(leaveId: string, action: 'approve' | 'reject') {
    setProcessing(leaveId);
    await onAction(leaveId, action, action === 'approve' ? selectedBackup[leaveId] : undefined);
    setProcessing(null);
  }

  if (leaves.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-600">No pending leave requests</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {leaves.map((leave) => {
        const engineer = engineers.find(e => e.id === leave.engineerId);
        return (
          <div key={leave.id} className="bg-white rounded-xl shadow-sm border-2 border-yellow-200 p-4">
            <div className="mb-3">
              <p className="font-semibold text-slate-900">{engineer?.name || 'Unknown'}</p>
              <p className="text-sm text-slate-600 mt-1">
                {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
              </p>
              <p className="text-sm text-slate-700 mt-2">{leave.reason}</p>
            </div>

            <div className="mb-3">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Assign Backup Engineer
              </label>
              <select
                value={selectedBackup[leave.id] || ''}
                onChange={(e) => setSelectedBackup({ ...selectedBackup, [leave.id]: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              >
                <option value="">Select backup engineer...</option>
                {engineers
                  .filter(e => e.id !== leave.engineerId)
                  .map(eng => (
                    <option key={eng.id} value={eng.id}>
                      {eng.name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleAction(leave.id, 'approve')}
                disabled={processing === leave.id || !selectedBackup[leave.id]}
                className="flex-1 bg-green-600 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {processing === leave.id ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Approve
                  </>
                )}
              </button>
              <button
                onClick={() => handleAction(leave.id, 'reject')}
                disabled={processing === leave.id}
                className="flex-1 bg-red-600 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {processing === leave.id ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <XCircle className="w-4 h-4" />
                    Reject
                  </>
                )}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ReportsTab({ reports, engineers }: { reports: DailyReport[]; engineers: Engineer[] }) {
  if (reports.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-600">No reports today</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reports.map((report) => {
        const engineer = engineers.find(e => e.id === report.engineerId);
        return (
          <div key={report.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-medium text-slate-900">{engineer?.name || 'Unknown'}</p>
              </div>
              <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                {new Date(report.createdAt).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
            <p className="text-sm text-slate-700 line-clamp-3">{report.workDone}</p>
            {report.issues && (
              <div className="mt-2 p-2 bg-red-50 rounded-lg border border-red-200">
                <p className="text-xs font-medium text-red-900">Issues:</p>
                <p className="text-xs text-red-700 mt-1">{report.issues}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
