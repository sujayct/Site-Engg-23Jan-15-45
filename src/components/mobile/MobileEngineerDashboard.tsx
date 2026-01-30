import { useState, useEffect } from 'react';
import {
  FileText,
  Clock,
  AlertCircle,
  Loader,
  RefreshCw,
  Download
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { checkInService } from '../../services/checkInService';
import { reportService } from '../../services/reportService';
import { leaveService } from '../../services/leaveService';
import { assignmentService } from '../../services/assignmentService';
import type { CheckIn, DailyReport, LeaveRequest, Assignment } from '../../types';
import CheckInCard from './CheckInCard';
import ReportCard from './ReportCard';
import LeaveCard from './LeaveCard';

export default function MobileEngineerDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [todayCheckIn, setTodayCheckIn] = useState<CheckIn | null>(null);
  const [todayReport, setTodayReport] = useState<DailyReport | null>(null);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [activeTab, setActiveTab] = useState<'today' | 'reports' | 'leave'>('today');

  useEffect(() => {
    loadData();
  }, [user]);

  async function loadData(isRefresh = false) {
    if (!user) return;
    const engineerId = user.engineerId || user.id;

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const [checkIn, leaves, assign, reportsData] = await Promise.all([
        checkInService.getTodayCheckIn(engineerId),
        leaveService.getMyLeaveRequests(engineerId),
        assignmentService.getMyAssignments(engineerId),
        reportService.getReports(engineerId),
      ]);

      const today = new Date().toISOString().split('T')[0];
      const todayReportData = (reportsData || []).find((r: DailyReport) => r.date === today) || null;

      setTodayCheckIn(checkIn);
      setTodayReport(todayReportData);
      setLeaveRequests(leaves || []);
      setAssignments(assign || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const activeAssignment = assignments[0];
  const pendingLeave = leaveRequests.find(l => l.status === 'pending');

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
        <div className="text-center">
          <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white pb-20">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-6 py-8 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Hi, {user?.name?.split(' ')[0]}!</h1>
            <p className="text-blue-100 text-sm mt-2 font-medium opacity-90">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="p-3 bg-white/20 backdrop-blur-md rounded-2xl hover:bg-white/30 transition-all border border-white/20 shadow-lg active:scale-95"
          >
            <RefreshCw className={`w-6 h-6 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {activeAssignment && (
          <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 border border-white/20 shadow-inner flex items-center gap-3">
            <div className="bg-blue-500/30 p-2 rounded-xl">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-blue-100 mb-0.5">Current Status</p>
              <p className="font-bold">On Active Assignment</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex border-b border-slate-200 bg-white sticky top-0 z-10 shadow-sm">
        <button
          onClick={() => setActiveTab('today')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === 'today'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-600'
          }`}
        >
          Today
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === 'reports'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-600'
          }`}
        >
          Reports
        </button>
        <button
          onClick={() => setActiveTab('leave')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === 'leave'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-600'
          }`}
        >
          Leave
        </button>
      </div>

      <div className="p-4 space-y-4">
        {activeTab === 'today' && (
          <>
            <CheckInCard
              checkIn={todayCheckIn}
              onCheckInComplete={(checkIn) => setTodayCheckIn(checkIn)}
            />

            <ReportCard
              report={todayReport}
              assignment={activeAssignment}
              onReportSubmit={(report) => setTodayReport(report)}
            />

            {pendingLeave && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-yellow-900">Pending Leave Request</p>
                    <p className="text-sm text-yellow-700 mt-1">
                      {new Date(pendingLeave.startDate).toLocaleDateString()} - {new Date(pendingLeave.endDate).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-yellow-600 mt-1">{pendingLeave.reason}</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'reports' && (
          <ReportsTab />
        )}

        {activeTab === 'leave' && (
          <LeaveCard
            leaveRequests={leaveRequests}
            onLeaveSubmit={(leave) => setLeaveRequests([leave, ...leaveRequests])}
          />
        )}
      </div>
    </div>
  );
}

function ReportsTab() {
  const { user } = useAuth();
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(true);

  const downloadReports = () => {
    const headers = ['Date', 'Work Done', 'Issues'];
    const csvData = reports.map(report => [
      new Date(report.date).toLocaleDateString(),
      `"${(report.workDone || '').replace(/"/g, '""')}"`,
      `"${(report.issues || '').replace(/"/g, '""')}"`
    ].join(','));
    const csvContent = [headers.join(','), ...csvData].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `my_reports_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    loadReports();
  }, [user]);

  async function loadReports() {
    if (!user || !user.engineerId) return;

    try {
      const data = await reportService.getReports(user.engineerId);
      setReports(data);
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-600">No reports yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end mb-2">
        <button
          onClick={downloadReports}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium shadow-sm hover:bg-blue-700 active:scale-95 transition-all"
        >
          <Download className="w-4 h-4" />
          Download All
        </button>
      </div>
      {reports.map((report) => (
        <div key={report.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-start justify-between mb-2">
            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
              {new Date(report.date).toLocaleDateString()}
            </span>
          </div>
          <p className="text-sm text-slate-700 mb-2 line-clamp-3">{report.workDone}</p>
          {report.issues && (
            <div className="flex items-start gap-2 mt-2 p-2 bg-red-50 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700">{report.issues}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
