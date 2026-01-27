import { useState, useEffect } from 'react';
import {
  FileText,
  Clock,
  AlertCircle,
  Loader,
  RefreshCw
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
    if (!user || !user.engineerId) return;

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const [checkIn, leaves, assign] = await Promise.all([
        checkInService.getTodayCheckIn(user.engineerId),
        leaveService.getMyLeaveRequests(user.engineerId),
        assignmentService.getMyAssignments(user.engineerId),
      ]);

      const reports = await reportService.getReports(user.engineerId);
      const today = new Date().toISOString().split('T')[0];
      const todayReportData = reports.find((r: DailyReport) => r.date === today) || null;

      setTodayCheckIn(checkIn);
      setTodayReport(todayReportData);
      setLeaveRequests(leaves);
      setAssignments(assign);
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
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Hello, {user?.name?.split(' ')[0]}</h1>
            <p className="text-blue-100 text-sm mt-1">
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
            className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {activeAssignment && (
          <div className="bg-white/10 backdrop-blur rounded-lg p-3">
            <p className="text-xs text-blue-100 mb-1">Current Assignment</p>
            <p className="font-semibold">Active Assignment</p>
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
