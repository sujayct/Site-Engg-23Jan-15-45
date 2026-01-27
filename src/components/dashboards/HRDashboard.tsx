import { useState, useEffect } from 'react';
import { Users, CheckCircle, Clock, Download, FileText, TrendingUp, Database, Mail, Send, BarChart3, Calendar, AlertCircle, ChevronRight, Filter, RefreshCw } from 'lucide-react';
import { CheckIn, LeaveRequest, Engineer, DailyReport } from '../../types';
import { exportToCSV } from '../../lib/export';
import { checkInService } from '../../services/checkInService';
import { reportService } from '../../services/reportService';
import { leaveService } from '../../services/leaveService';
import { StorageService } from '../../lib/storage';
import { useAuth } from '../../contexts/AuthContext';
import { hrReportService, AttendanceRecord, EngineerSummary, ClientReport, PayrollRecord } from '../../services/hrReportService';
import { profileService } from '../../services/profileService';
import HRClientWiseView from './HRClientWiseView';
import ProfileViewer from '../ProfileViewer';

interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  role: string;
  phone?: string;
  designation?: string;
  createdAt: string;
}

const API_BASE = '';

export default function HRDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'leave' | 'reports' | 'clientwise' | 'enterprise' | 'profiles'>('overview');
  const [engineerProfiles, setEngineerProfiles] = useState<UserProfile[]>([]);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [emailSending, setEmailSending] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  const [enterpriseTab, setEnterpriseTab] = useState<'daily' | 'weekly' | 'monthly' | 'backup' | 'payroll'>('daily');
  const [attendanceRegister, setAttendanceRegister] = useState<AttendanceRecord[]>([]);
  const [weeklyStart, setWeeklyStart] = useState(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [weeklyEnd, setWeeklyEnd] = useState(new Date().toISOString().split('T')[0]);
  const [engineerSummary, setEngineerSummary] = useState<EngineerSummary[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [clientReports, setClientReports] = useState<ClientReport[]>([]);
  const [backupUsage, setBackupUsage] = useState<any>(null);
  const [payrollData, setPayrollData] = useState<PayrollRecord[]>([]);

  useEffect(() => {
    loadData();
    if (activeTab === 'profiles') {
      loadEngineerProfiles();
    }
    if (activeTab === 'enterprise' || activeTab === 'overview') {
      loadEnterpriseReports();
    }
  }, [activeTab, selectedDate, enterpriseTab, weeklyStart, weeklyEnd, selectedMonth]);

  async function loadEngineerProfiles() {
    try {
      const profiles = await profileService.getAllEngineers();
      setEngineerProfiles(profiles);
    } catch (error) {
      console.error('Error loading engineer profiles:', error);
    }
  }

  async function loadData() {
    try {
      const engineersList = await StorageService.getEngineers();
      setEngineers(engineersList);

      const [checkInsList, leavesList, reportsList] = await Promise.all([
        checkInService.getAllCheckIns(),
        leaveService.getAllLeaveRequests(),
        reportService.getReports()
      ]);

      setLeaveRequests(leavesList);
      setCheckIns(checkInsList.filter(c => c.date === selectedDate));
      setReports(reportsList.filter(r => r.date === selectedDate));
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }

  async function loadEnterpriseReports() {
    try {
      setLoading(true);

      if (enterpriseTab === 'daily' || activeTab === 'overview') {
        const register = await hrReportService.getDailyAttendanceRegister(selectedDate);
        setAttendanceRegister(register);
      }
      if (enterpriseTab === 'weekly') {
        const summary = await hrReportService.getWeeklyEngineerSummary(weeklyStart, weeklyEnd);
        setEngineerSummary(summary);
      }
      if (enterpriseTab === 'monthly') {
        const clientReport = await hrReportService.getMonthlyClientReport(selectedMonth);
        setClientReports(clientReport);
      }
      if (enterpriseTab === 'backup') {
        const usage = await hrReportService.getBackupUsage();
        setBackupUsage(usage);
      }
      if (enterpriseTab === 'payroll') {
        const payroll = await hrReportService.getPayrollData(selectedMonth);
        setPayrollData(payroll);
      }
    } catch (error) {
      console.error('Error loading enterprise reports:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleLeaveAction(leaveId: string, status: 'approved' | 'rejected', backupEngineerId?: string) {
    if (!user) return;
    setLoading(true);

    try {
      if (status === 'approved') {
        await leaveService.approveLeave(leaveId, user.id);
      } else {
        await leaveService.rejectLeave(leaveId, user.id);
      }

      await loadData();
      alert(`Leave request ${status} successfully!`);
    } catch (error: any) {
      alert(error.message || 'Failed to update leave request');
    } finally {
      setLoading(false);
    }
  }

  async function sendReportEmail(reportType: string, reportData: any[], subject: string) {
    setEmailSending(true);
    setEmailError(null);
    setEmailSuccess(null);

    try {
      const response = await fetch(`${API_BASE}/api/send-report-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          reportType,
          reportData,
          subject
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send email');
      }

      setEmailSuccess('Report sent successfully!');
      setTimeout(() => setEmailSuccess(null), 5000);
    } catch (error: any) {
      setEmailError(error.message || 'Failed to send email');
      setTimeout(() => setEmailError(null), 5000);
    } finally {
      setEmailSending(false);
    }
  }

  function exportPayrollCSV() {
    const csv = hrReportService.exportPayrollToCSV(payrollData, selectedMonth);
    hrReportService.downloadCSV(csv, `payroll-${selectedMonth}.csv`);
  }

  const pendingLeaves = leaveRequests.filter(l => l.status === 'pending').length;
  const presentToday = attendanceRegister.filter(r => r.status === 'present').length;
  const onLeaveToday = attendanceRegister.filter(r => r.status === 'leave').length;
  const absentToday = attendanceRegister.filter(r => r.status === 'absent').length;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'attendance', label: 'Attendance', icon: CheckCircle },
    { id: 'leave', label: 'Leave Requests', icon: Calendar },
    { id: 'reports', label: 'Daily Reports', icon: FileText },
    { id: 'clientwise', label: 'Client-wise', icon: Users },
    { id: 'enterprise', label: 'Enterprise Reports', icon: TrendingUp },
    { id: 'profiles', label: 'Profiles', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {emailSuccess && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-pulse">
          <CheckCircle className="w-5 h-5" />
          {emailSuccess}
        </div>
      )}
      {emailError && (
        <div className="fixed top-4 right-4 z-50 bg-red-500 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          {emailError}
        </div>
      )}

      <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">HR Dashboard</h1>
              <p className="text-blue-100 mt-1">Manage attendance, leaves, and generate reports</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => loadData()}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-200 backdrop-blur-sm border border-white/20"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          <div className="mt-8 flex gap-2 overflow-x-auto pb-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-700 shadow-lg shadow-blue-500/25'
                    : 'text-blue-100 hover:bg-white/10'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 hover:border-green-200 cursor-pointer" onClick={() => setActiveTab('attendance')}>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/30">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-green-500 transition-colors" />
                </div>
                <p className="text-3xl font-bold text-slate-900">{presentToday}</p>
                <p className="text-slate-600 mt-1">Present Today</p>
                <div className="mt-3 text-sm text-green-600 font-medium">
                  {engineers.length > 0 ? `${Math.round((presentToday / engineers.length) * 100)}%` : '0%'} attendance
                </div>
              </div>

              <div className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 hover:border-yellow-200 cursor-pointer" onClick={() => setActiveTab('leave')}>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg shadow-yellow-500/30">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-yellow-500 transition-colors" />
                </div>
                <p className="text-3xl font-bold text-slate-900">{pendingLeaves}</p>
                <p className="text-slate-600 mt-1">Pending Leaves</p>
                <div className="mt-3 text-sm text-yellow-600 font-medium">
                  {onLeaveToday} on leave today
                </div>
              </div>

              <div className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 hover:border-blue-200 cursor-pointer" onClick={() => setActiveTab('profiles')}>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                </div>
                <p className="text-3xl font-bold text-slate-900">{engineers.length}</p>
                <p className="text-slate-600 mt-1">Total Engineers</p>
                <div className="mt-3 text-sm text-red-500 font-medium">
                  {absentToday} absent today
                </div>
              </div>

              <div className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 hover:border-purple-200 cursor-pointer" onClick={() => setActiveTab('reports')}>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-purple-500 transition-colors" />
                </div>
                <p className="text-3xl font-bold text-slate-900">{reports.length}</p>
                <p className="text-slate-600 mt-1">Reports Today</p>
                <div className="mt-3 text-sm text-purple-600 font-medium">
                  View all daily reports
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                    Quick Reports
                  </h3>
                  <button
                    onClick={() => setActiveTab('enterprise')}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                  >
                    View all <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">Daily Attendance Report</p>
                        <p className="text-sm text-slate-500">{selectedDate}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const exportData = attendanceRegister.map(record => ({
                            Engineer: record.engineerName,
                            Status: record.status,
                            'Check In': record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString() : '-',
                            'Check Out': record.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString() : '-',
                            Hours: record.hoursWorked ? record.hoursWorked.toFixed(1) : '-',
                          }));
                          exportToCSV(exportData, `attendance-${selectedDate}`);
                        }}
                        className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        title="Download CSV"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          const exportData = attendanceRegister.map(record => ({
                            Engineer: record.engineerName,
                            Status: record.status,
                            'Check In': record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString() : '-',
                            'Check Out': record.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString() : '-',
                            Hours: record.hoursWorked ? record.hoursWorked.toFixed(1) : '-',
                          }));
                          sendReportEmail('attendance', exportData, `Daily Attendance Report - ${selectedDate}`);
                        }}
                        disabled={emailSending}
                        className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                        title="Send via Email"
                      >
                        <Mail className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">Leave Summary Report</p>
                        <p className="text-sm text-slate-500">{leaveRequests.length} total requests</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const exportData = leaveRequests.map(leave => ({
                            Engineer: leave.engineerName || 'Unknown',
                            'Start Date': leave.startDate,
                            'End Date': leave.endDate,
                            Reason: leave.reason,
                            Status: leave.status,
                            Backup: leave.backupEngineerName || '-'
                          }));
                          exportToCSV(exportData, `leave-requests-${new Date().toISOString().split('T')[0]}`);
                        }}
                        className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        title="Download CSV"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          const exportData = leaveRequests.map(leave => ({
                            Engineer: leave.engineerName || 'Unknown',
                            'Start Date': leave.startDate,
                            'End Date': leave.endDate,
                            Reason: leave.reason,
                            Status: leave.status,
                            Backup: leave.backupEngineerName || '-'
                          }));
                          sendReportEmail('leave', exportData, `Leave Summary Report - ${new Date().toLocaleDateString()}`);
                        }}
                        disabled={emailSending}
                        className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                        title="Send via Email"
                      >
                        <Mail className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">Daily Work Reports</p>
                        <p className="text-sm text-slate-500">{reports.length} reports today</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const exportData = reports.map(r => ({
                            Engineer: r.engineerName || '',
                            Client: r.clientName || '',
                            Date: r.date,
                            'Work Done': r.workDone,
                            Issues: r.issues || 'None',
                          }));
                          exportToCSV(exportData, `work-reports-${selectedDate}`);
                        }}
                        className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        title="Download CSV"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          const exportData = reports.map(r => ({
                            Engineer: r.engineerName || '',
                            Client: r.clientName || '',
                            Date: r.date,
                            'Work Done': r.workDone,
                            Issues: r.issues || 'None',
                          }));
                          sendReportEmail('work-reports', exportData, `Daily Work Reports - ${selectedDate}`);
                        }}
                        disabled={emailSending}
                        className="p-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-50"
                        title="Send via Email"
                      >
                        <Mail className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                  <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-yellow-600" />
                    Recent Leave Requests
                  </h3>
                </div>
                <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                  {leaveRequests.slice(0, 5).map(leave => (
                    <div key={leave.id} className="px-6 py-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-slate-900">{leave.engineerName || 'Unknown'}</p>
                          <p className="text-sm text-slate-500">
                            {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          leave.status === 'approved' ? 'bg-green-100 text-green-700' :
                          leave.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {leave.status}
                        </span>
                      </div>
                    </div>
                  ))}
                  {leaveRequests.length === 0 && (
                    <div className="px-6 py-8 text-center text-slate-500">
                      No leave requests found
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'attendance' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Attendance for {new Date(selectedDate).toLocaleDateString()}
              </h2>
              <div className="flex items-center gap-3">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={() => {
                    const exportData = checkIns.map(c => ({
                      Engineer: c.engineerName || '',
                      Email: '',
                      CheckIn: new Date(c.checkInTime).toLocaleString(),
                      CheckOut: c.checkOutTime ? new Date(c.checkOutTime).toLocaleString() : '-',
                      Date: c.date,
                    }));
                    exportToCSV(exportData, `attendance-${selectedDate}`);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
                <button
                  onClick={() => {
                    const exportData = checkIns.map(c => ({
                      Engineer: c.engineerName || '',
                      CheckIn: c.checkInTime ? new Date(c.checkInTime).toLocaleString() : '-',
                      CheckOut: c.checkOutTime ? new Date(c.checkOutTime).toLocaleString() : '-',
                      Date: c.date,
                    }));
                    sendReportEmail('attendance', exportData, `Attendance Report - ${selectedDate}`);
                  }}
                  disabled={emailSending}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  {emailSending ? 'Sending...' : 'Send Email'}
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Engineer</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Check In</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Check Out</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {checkIns.map(checkIn => (
                    <tr key={checkIn.id} className="hover:bg-blue-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-medium">
                            {(checkIn.engineerName || 'U')[0].toUpperCase()}
                          </div>
                          <span className="font-medium text-slate-900">{checkIn.engineerName || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {checkIn.checkInTime ? new Date(checkIn.checkInTime).toLocaleTimeString() : '-'}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {checkIn.checkOutTime ? new Date(checkIn.checkOutTime).toLocaleTimeString() : '-'}
                      </td>
                      <td className="px-6 py-4">
                        {checkIn.latitude && checkIn.longitude ? (
                          <a
                            href={`https://www.google.com/maps?q=${checkIn.latitude},${checkIn.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
                          >
                            View Map
                          </a>
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                          checkIn.checkOutTime ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {checkIn.checkOutTime ? 'Completed' : 'Active'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {checkIns.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                        <CheckCircle className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                        No check-ins for this date
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'leave' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-yellow-600" />
                Leave Requests
              </h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    const exportData = leaveRequests.map(leave => ({
                      Engineer: leave.engineerName || 'Unknown',
                      'Start Date': leave.startDate,
                      'End Date': leave.endDate,
                      Reason: leave.reason,
                      Status: leave.status,
                      Backup: leave.backupEngineerName || '-'
                    }));
                    exportToCSV(exportData, `leave-requests-${new Date().toISOString().split('T')[0]}`);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
                <button
                  onClick={() => {
                    const exportData = leaveRequests.map(leave => ({
                      Engineer: leave.engineerName || 'Unknown',
                      'Start Date': leave.startDate,
                      'End Date': leave.endDate,
                      Reason: leave.reason,
                      Status: leave.status,
                      Backup: leave.backupEngineerName || '-'
                    }));
                    sendReportEmail('leave-requests', exportData, `Leave Requests Report - ${new Date().toLocaleDateString()}`);
                  }}
                  disabled={emailSending}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  {emailSending ? 'Sending...' : 'Send Email'}
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {leaveRequests.map(leave => (
                <div key={leave.id} className="border border-slate-200 rounded-2xl p-5 hover:border-blue-200 hover:shadow-md transition-all duration-200">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                        {(leave.engineerName || 'U')[0].toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 text-lg">{leave.engineerName || 'Unknown'}</h3>
                        <p className="text-slate-500 text-sm flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className={`px-4 py-1.5 rounded-full text-sm font-semibold ${
                      leave.status === 'approved' ? 'bg-green-100 text-green-700' :
                      leave.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                    </span>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 mb-4">
                    <p className="text-slate-700">{leave.reason}</p>
                    {leave.backupEngineerName && (
                      <p className="text-sm text-slate-500 mt-2 flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Backup: <span className="font-medium text-slate-700">{leave.backupEngineerName}</span>
                      </p>
                    )}
                  </div>
                  {leave.status === 'pending' && (
                    <div className="flex gap-3">
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            handleLeaveAction(leave.id, 'approved', e.target.value);
                          }
                        }}
                        className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={loading}
                      >
                        <option value="">Select backup engineer & approve</option>
                        {engineers.filter(eng => eng.id !== leave.engineerId).map(eng => (
                          <option key={eng.id} value={eng.id}>{eng.name}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleLeaveAction(leave.id, 'rejected')}
                        disabled={loading}
                        className="px-6 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors text-sm font-medium shadow-sm"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {leaveRequests.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                  <Calendar className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <p className="text-lg font-medium">No leave requests found</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-600" />
                Daily Reports for {new Date(selectedDate).toLocaleDateString()}
              </h2>
              <div className="flex items-center gap-3">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={() => {
                    const exportData = reports.map(r => ({
                      Engineer: r.engineerName || '',
                      Client: r.clientName || '',
                      Date: r.date,
                      WorkDone: r.workDone,
                      Issues: r.issues || 'None',
                    }));
                    exportToCSV(exportData, `reports-${selectedDate}`);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
                <button
                  onClick={() => {
                    const exportData = reports.map(r => ({
                      Engineer: r.engineerName || '',
                      Client: r.clientName || '',
                      Date: r.date,
                      'Work Done': r.workDone,
                      Issues: r.issues || 'None',
                    }));
                    sendReportEmail('daily-reports', exportData, `Daily Reports - ${selectedDate}`);
                  }}
                  disabled={emailSending}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  {emailSending ? 'Sending...' : 'Send Email'}
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {reports.map(report => (
                <div key={report.id} className="border border-slate-200 rounded-2xl p-5 hover:border-purple-200 hover:shadow-md transition-all duration-200">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                        {(report.engineerName || 'U')[0].toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{report.engineerName || 'Unknown'}</h3>
                        <p className="text-slate-500 text-sm">{report.clientName || 'Unknown'}</p>
                      </div>
                    </div>
                    <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                      {new Date(report.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                      <p className="text-sm font-semibold text-green-700 mb-1">Work Done:</p>
                      <p className="text-slate-700">{report.workDone}</p>
                    </div>
                    {report.issues && (
                      <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                        <p className="text-sm font-semibold text-red-700 mb-1">Issues:</p>
                        <p className="text-slate-700">{report.issues}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {reports.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <p className="text-lg font-medium">No reports for this date</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'clientwise' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <HRClientWiseView />
          </div>
        )}

        {activeTab === 'profiles' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden p-6">
            <ProfileViewer engineers={engineerProfiles} />
          </div>
        )}

        {activeTab === 'enterprise' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Enterprise Reports
              </h2>
            </div>
            <div className="p-6">
              <div className="flex gap-2 mb-6 flex-wrap">
                {(['daily', 'weekly', 'monthly', 'backup', 'payroll'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setEnterpriseTab(tab)}
                    className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 capitalize ${
                      enterpriseTab === tab
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {enterpriseTab === 'daily' && (
                <div>
                  <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                    <h3 className="font-semibold text-slate-900">Daily Attendance Register</h3>
                    <div className="flex gap-2 flex-wrap">
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="px-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => {
                          const exportData = attendanceRegister.map(record => ({
                            Engineer: record.engineerName,
                            Status: record.status,
                            'Check In': record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString() : '-',
                            'Check Out': record.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString() : '-',
                            Hours: record.hoursWorked ? record.hoursWorked.toFixed(1) : '-',
                          }));
                          exportToCSV(exportData, `attendance-register-${selectedDate}`);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        Export CSV
                      </button>
                      <button
                        onClick={() => {
                          const exportData = attendanceRegister.map(record => ({
                            Engineer: record.engineerName,
                            Status: record.status,
                            'Check In': record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString() : '-',
                            'Check Out': record.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString() : '-',
                            Hours: record.hoursWorked ? record.hoursWorked.toFixed(1) : '-',
                          }));
                          sendReportEmail('daily-attendance', exportData, `Daily Attendance Register - ${selectedDate}`);
                        }}
                        disabled={emailSending}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        <Send className="w-4 h-4" />
                        Send Email
                      </button>
                    </div>
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Engineer</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Check In</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Check Out</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Hours</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {attendanceRegister.map(record => (
                          <tr key={record.engineerId} className="hover:bg-blue-50/50">
                            <td className="px-6 py-4 font-medium text-slate-900">{record.engineerName}</td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                                record.status === 'present' ? 'bg-green-100 text-green-700' :
                                record.status === 'leave' ? 'bg-blue-100 text-blue-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {record.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-slate-600">
                              {record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString() : '-'}
                            </td>
                            <td className="px-6 py-4 text-slate-600">
                              {record.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString() : '-'}
                            </td>
                            <td className="px-6 py-4 text-slate-600">
                              {record.hoursWorked ? `${record.hoursWorked.toFixed(1)}h` : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {enterpriseTab === 'weekly' && (
                <div>
                  <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                    <h3 className="font-semibold text-slate-900">Weekly Engineer Summary</h3>
                    <div className="flex gap-2 items-center flex-wrap">
                      <input
                        type="date"
                        value={weeklyStart}
                        onChange={(e) => setWeeklyStart(e.target.value)}
                        className="px-4 py-2 border border-slate-200 rounded-xl text-sm"
                      />
                      <span className="text-slate-500">to</span>
                      <input
                        type="date"
                        value={weeklyEnd}
                        onChange={(e) => setWeeklyEnd(e.target.value)}
                        className="px-4 py-2 border border-slate-200 rounded-xl text-sm"
                      />
                      <button
                        onClick={() => {
                          const exportData = engineerSummary.map(summary => ({
                            Engineer: summary.engineerName,
                            'Present Days': summary.presentDays,
                            'Absent Days': summary.absentDays,
                            'Leave Days': summary.leaveDays,
                            'Total Hours': summary.totalHours,
                            'Avg Hours/Day': summary.averageHoursPerDay,
                          }));
                          exportToCSV(exportData, `weekly-summary-${weeklyStart}-to-${weeklyEnd}`);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        Export CSV
                      </button>
                      <button
                        onClick={() => {
                          const exportData = engineerSummary.map(summary => ({
                            Engineer: summary.engineerName,
                            'Present Days': summary.presentDays,
                            'Absent Days': summary.absentDays,
                            'Leave Days': summary.leaveDays,
                            'Total Hours': summary.totalHours,
                            'Avg Hours/Day': summary.averageHoursPerDay,
                          }));
                          sendReportEmail('weekly-summary', exportData, `Weekly Engineer Summary - ${weeklyStart} to ${weeklyEnd}`);
                        }}
                        disabled={emailSending}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        <Send className="w-4 h-4" />
                        Send Email
                      </button>
                    </div>
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Engineer</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Present</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Absent</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Leave</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Total Hours</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Avg Hours/Day</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {engineerSummary.map(summary => (
                          <tr key={summary.engineerId} className="hover:bg-blue-50/50">
                            <td className="px-6 py-4 font-medium text-slate-900">{summary.engineerName}</td>
                            <td className="px-6 py-4 text-green-600 font-semibold">{summary.presentDays}</td>
                            <td className="px-6 py-4 text-red-600 font-semibold">{summary.absentDays}</td>
                            <td className="px-6 py-4 text-blue-600 font-semibold">{summary.leaveDays}</td>
                            <td className="px-6 py-4 text-slate-600">{summary.totalHours}h</td>
                            <td className="px-6 py-4 text-slate-600">{summary.averageHoursPerDay}h</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {enterpriseTab === 'monthly' && (
                <div>
                  <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                    <h3 className="font-semibold text-slate-900">Monthly Client-Wise Report</h3>
                    <div className="flex gap-2">
                      <input
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="px-4 py-2 border border-slate-200 rounded-xl text-sm"
                      />
                      <button
                        onClick={() => {
                          const exportData = clientReports.map(report => ({
                            Client: report.clientName,
                            'Active Engineers': report.activeEngineers,
                            'Total Check-Ins': report.totalCheckIns,
                            'Total Reports': report.totalReports,
                          }));
                          exportToCSV(exportData, `monthly-client-report-${selectedMonth}`);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        Export CSV
                      </button>
                      <button
                        onClick={() => {
                          const exportData = clientReports.map(report => ({
                            Client: report.clientName,
                            'Active Engineers': report.activeEngineers,
                            'Total Check-Ins': report.totalCheckIns,
                            'Total Reports': report.totalReports,
                          }));
                          sendReportEmail('monthly-client', exportData, `Monthly Client Report - ${selectedMonth}`);
                        }}
                        disabled={emailSending}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        <Send className="w-4 h-4" />
                        Send Email
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {clientReports.map(report => (
                      <div key={report.clientId} className="border border-slate-200 rounded-2xl p-6 hover:border-blue-200 hover:shadow-md transition-all">
                        <h4 className="font-semibold text-slate-900 mb-4 text-lg">{report.clientName}</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center bg-slate-50 rounded-lg p-3">
                            <span className="text-slate-600">Sites:</span>
                            <span className="font-semibold text-slate-900">{report.sitesCount}</span>
                          </div>
                          <div className="flex justify-between items-center bg-slate-50 rounded-lg p-3">
                            <span className="text-slate-600">Assignments:</span>
                            <span className="font-semibold text-slate-900">{report.totalAssignments}</span>
                          </div>
                          <div className="flex justify-between items-center bg-green-50 rounded-lg p-3">
                            <span className="text-slate-600">Active Engineers:</span>
                            <span className="font-semibold text-green-700">{report.activeEngineers}</span>
                          </div>
                          <div className="flex justify-between items-center bg-blue-50 rounded-lg p-3">
                            <span className="text-slate-600">Check-ins:</span>
                            <span className="font-semibold text-blue-700">{report.totalCheckIns}</span>
                          </div>
                          <div className="flex justify-between items-center bg-purple-50 rounded-lg p-3">
                            <span className="text-slate-600">Reports:</span>
                            <span className="font-semibold text-purple-700">{report.totalReports}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {enterpriseTab === 'backup' && backupUsage && (
                <div>
                  <h3 className="font-semibold text-slate-900 mb-6">Backup Usage Report</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="border border-slate-200 rounded-2xl p-6 bg-gradient-to-br from-blue-50 to-white">
                      <Database className="w-10 h-10 text-blue-600 mb-4" />
                      <p className="text-slate-600 mb-1">Total Backups</p>
                      <p className="text-3xl font-bold text-slate-900">{backupUsage.totalBackups}</p>
                    </div>
                    <div className="border border-slate-200 rounded-2xl p-6 bg-gradient-to-br from-green-50 to-white">
                      <TrendingUp className="w-10 h-10 text-green-600 mb-4" />
                      <p className="text-slate-600 mb-1">Storage Used</p>
                      <p className="text-3xl font-bold text-slate-900">{backupUsage.storageUsedMB} MB</p>
                    </div>
                    <div className="border border-slate-200 rounded-2xl p-6 bg-gradient-to-br from-purple-50 to-white">
                      <FileText className="w-10 h-10 text-purple-600 mb-4" />
                      <p className="text-slate-600 mb-1">Avg Size</p>
                      <p className="text-3xl font-bold text-slate-900">{backupUsage.avgBackupSizeMB} MB</p>
                    </div>
                    <div className="border border-slate-200 rounded-2xl p-6 bg-gradient-to-br from-orange-50 to-white">
                      <Clock className="w-10 h-10 text-orange-600 mb-4" />
                      <p className="text-slate-600 mb-1">Last Backup</p>
                      <p className="text-xl font-bold text-slate-900">
                        {backupUsage.lastBackupDate === 'Never' ? 'Never' : new Date(backupUsage.lastBackupDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {enterpriseTab === 'payroll' && (
                <div>
                  <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                    <h3 className="font-semibold text-slate-900">Payroll Export</h3>
                    <div className="flex gap-3">
                      <input
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="px-4 py-2 border border-slate-200 rounded-xl text-sm"
                      />
                      <button
                        onClick={exportPayrollCSV}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        Export CSV
                      </button>
                      <button
                        onClick={() => {
                          const exportData = payrollData.map(record => ({
                            Engineer: record.engineerName,
                            Email: record.email,
                            Phone: record.phone,
                            'Working Days': record.workingDays,
                            'Total Hours': record.totalHours,
                            'Leave Days': record.leaveDays,
                            'Overtime': record.overtimeHours
                          }));
                          sendReportEmail('payroll', exportData, `Payroll Report - ${selectedMonth}`);
                        }}
                        disabled={emailSending}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        <Send className="w-4 h-4" />
                        Send Email
                      </button>
                    </div>
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Engineer</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Email</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Phone</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Working Days</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Total Hours</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Leave Days</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Overtime</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {payrollData.map(record => (
                          <tr key={record.engineerId} className="hover:bg-blue-50/50">
                            <td className="px-6 py-4 font-medium text-slate-900">{record.engineerName}</td>
                            <td className="px-6 py-4 text-slate-600">{record.email}</td>
                            <td className="px-6 py-4 text-slate-600">{record.phone}</td>
                            <td className="px-6 py-4 text-slate-600">{record.workingDays}</td>
                            <td className="px-6 py-4 text-slate-600">{record.totalHours}h</td>
                            <td className="px-6 py-4 text-slate-600">{record.leaveDays}</td>
                            <td className="px-6 py-4 text-slate-600">{record.overtimeHours}h</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
