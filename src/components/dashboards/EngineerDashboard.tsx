import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Clock, 
  MapPin, 
  Calendar, 
  Plus, 
  Send, 
  CheckCircle, 
  AlertCircle,
  LogOut,
  Navigation,
  Briefcase,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { checkInService } from '../../services/checkInService';
import { reportService } from '../../services/reportService';
import { leaveService } from '../../services/leaveService';
import { assignmentService } from '../../services/assignmentService';
import type { DailyReport, CheckIn, LeaveRequest, Assignment } from '../../types';

export default function EngineerDashboard() {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'attendance' | 'reports' | 'leave'>('attendance');
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [todayCheckIn, setTodayCheckIn] = useState<CheckIn | null>(null);
  const [loading, setLoading] = useState(true);

  const [reportForm, setReportForm] = useState({
    clientId: '',
    siteId: '',
    workDone: '',
    issues: ''
  });

  const [leaveForm, setLeaveForm] = useState({
    startDate: '',
    endDate: '',
    reason: ''
  });

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      const engId = user?.engineerId || user?.id;
      if (!engId) return;

      const [reportsData, checkInsData, leavesData, assignmentsData, todayCheck] = await Promise.all([
        reportService.getReports(engId),
        checkInService.getAllCheckIns(),
        leaveService.getMyLeaveRequests(engId),
        assignmentService.getMyAssignments(engId),
        checkInService.getTodayCheckIn(engId)
      ]);
      
      // Update state immediately with all fetched data
      setReports([...reportsData]);
      setCheckIns(checkInsData.filter((c: CheckIn) => c.engineerId === engId));
      setLeaves([...leavesData]);
      setAssignments(assignmentsData);
      setTodayCheckIn(todayCheck);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!user) return;
    try {
      const lat = 19.0760 + (Math.random() - 0.5) * 0.01;
      const lng = 72.8777 + (Math.random() - 0.5) * 0.01;
      const assignment = assignments[0];
      
      const newCheckIn = await checkInService.createCheckIn(
        user.engineerId || user.id,
        lat,
        lng,
        'Site Location (Simulated)',
        assignment?.siteId
      );
      setTodayCheckIn(newCheckIn);
      loadData();
    } catch (error) {
      alert('Check-in failed');
    }
  };

  const handleCheckOut = async () => {
    if (!todayCheckIn) return;
    try {
      await checkInService.checkOut(todayCheckIn.id);
      setTodayCheckIn(null);
      loadData();
    } catch (error) {
      alert('Check-out failed');
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !reportForm.clientId) return;
    try {
      const result = await reportService.createReport(
        user.engineerId || user.id,
        reportForm.clientId,
        reportForm.workDone,
        reportForm.issues,
        reportForm.siteId || undefined
      );
      
      const newReport = {
        ...result,
        clientName: assignments.find(a => a.clientId === reportForm.clientId)?.clientName || 'Project Report',
        date: result.reportDate || result.date || new Date().toISOString()
      };

      setReports(prev => [newReport, ...prev]);
      setReportForm({ clientId: '', siteId: '', workDone: '', issues: '' });
      
      // Force update by re-loading data after a small delay
      setTimeout(() => loadData(), 500);
      alert('Report submitted successfully');
    } catch (error) {
      alert('Failed to submit report');
    }
  };

  const handleLeaveRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const result = await leaveService.createLeaveRequest(
        user.engineerId || user.id,
        leaveForm.startDate,
        leaveForm.endDate,
        leaveForm.reason
      );
      
      const newLeave = {
        ...result,
        engineerName: user.name,
        status: 'pending'
      };

      setLeaves(prev => [newLeave, ...prev]);
      setLeaveForm({ startDate: '', endDate: '', reason: '' });
      
      // Force update by re-loading data after a small delay
      setTimeout(() => loadData(), 500);
      alert('Leave request submitted');
    } catch (error) {
      alert('Failed to submit leave request');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const tabs = [
    { id: 'attendance', label: 'Attendance', icon: Clock },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'leave', label: 'Leave', icon: Calendar },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-500 text-white">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Briefcase className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Engineer Portal</h1>
                <p className="text-blue-100 mt-1">{user?.name}</p>
              </div>
            </div>
            <button 
              onClick={signOut}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors backdrop-blur-sm"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 -mt-8">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-5 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-sm font-medium text-slate-600">Today's Status</span>
            </div>
            <p className="text-xl font-bold text-slate-900">
              {todayCheckIn ? (todayCheckIn.checkOutTime ? 'Completed' : 'Checked In') : 'Not Checked In'}
            </p>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-5 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-slate-600">Total Reports</span>
            </div>
            <p className="text-xl font-bold text-slate-900">{reports.length}</p>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-5 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-sm font-medium text-slate-600">Assignments</span>
            </div>
            <p className="text-xl font-bold text-slate-900">{assignments.length}</p>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-5 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Calendar className="w-5 h-5 text-orange-600" />
              </div>
              <span className="text-sm font-medium text-slate-600">Leave Requests</span>
            </div>
            <p className="text-xl font-bold text-slate-900">{leaves.length}</p>
          </div>
        </div>

        <div className="flex gap-2 p-1 bg-white rounded-2xl shadow-sm border border-slate-200 w-full max-w-md mx-auto mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                activeTab === tab.id 
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md' 
                : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'attendance' && (
          <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-lg">
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                Daily Check-in
              </h2>
              
              <div className="space-y-6">
                <div className="p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200">
                  <p className="text-sm text-slate-500 mb-1">Current Status</p>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${todayCheckIn ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></div>
                    <p className="font-bold text-slate-900">
                      {todayCheckIn ? (todayCheckIn.checkOutTime ? 'Completed' : 'Checked In') : 'Not Checked In'}
                    </p>
                  </div>
                </div>

                {!todayCheckIn ? (
                  <button
                    onClick={handleCheckIn}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2 transform active:scale-95"
                  >
                    <Navigation className="w-5 h-5" />
                    Check In (Simulate GPS)
                  </button>
                ) : !todayCheckIn.checkOutTime ? (
                  <button
                    onClick={handleCheckOut}
                    className="w-full py-4 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl font-bold hover:from-red-700 hover:to-rose-700 transition-all shadow-lg shadow-red-200 flex items-center justify-center gap-2 transform active:scale-95"
                  >
                    <LogOut className="w-5 h-5" />
                    Check Out
                  </button>
                ) : (
                  <div className="text-center p-6 bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 rounded-xl border border-green-200 flex flex-col items-center justify-center gap-2">
                    <CheckCircle className="w-10 h-10" />
                    <p className="font-bold text-lg">Work session completed</p>
                    <p className="text-sm opacity-75">Great job today!</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-lg">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Recent Check-ins</h2>
              <div className="space-y-4">
                {checkIns.slice(0, 5).map(checkIn => (
                  <div key={checkIn.id} className="flex items-start gap-3 p-3 border-l-4 border-blue-500 bg-gradient-to-r from-blue-50 to-white rounded-r-xl">
                    <div className="mt-1">
                      <Clock className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {new Date(checkIn.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {checkIn.checkOutTime && ` - ${new Date(checkIn.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                      </p>
                      <p className="text-xs text-slate-500">{checkIn.locationName || 'Main Site'}</p>
                    </div>
                  </div>
                ))}
                {checkIns.length === 0 && (
                  <p className="text-center py-8 text-slate-500">No check-ins yet</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="grid gap-6 md:grid-cols-2 max-w-6xl mx-auto">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-lg h-fit">
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Submit Daily Report
              </h2>
              <form onSubmit={handleReportSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Select Client</label>
                  <select
                    required
                    value={reportForm.clientId}
                    onChange={(e) => setReportForm({ ...reportForm, clientId: e.target.value })}
                    className="w-full rounded-xl border-slate-300 focus:ring-blue-500 focus:border-blue-500 py-3"
                  >
                    <option value="">Choose a client...</option>
                    {assignments.map((a, idx) => (
                      <option key={`${a.clientId}-${idx}`} value={a.clientId}>{a.clientName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Work Done</label>
                  <textarea
                    required
                    value={reportForm.workDone}
                    onChange={(e) => setReportForm({ ...reportForm, workDone: e.target.value })}
                    className="w-full rounded-xl border-slate-300 focus:ring-blue-500 focus:border-blue-500 h-32"
                    placeholder="What tasks were completed today?"
                  ></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Issues/Remarks (Optional)</label>
                  <textarea
                    value={reportForm.issues}
                    onChange={(e) => setReportForm({ ...reportForm, issues: e.target.value })}
                    className="w-full rounded-xl border-slate-300 focus:ring-blue-500 focus:border-blue-500 h-20"
                    placeholder="Any roadblocks or concerns?"
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-bold hover:from-blue-700 hover:to-blue-800 transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  <Send className="w-5 h-5" />
                  Submit Report
                </button>
              </form>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-lg overflow-y-auto max-h-[600px]">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Recent Reports</h2>
              <div className="space-y-4">
                {reports.length > 0 ? (
                  reports.sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime()).slice(0, 10).map(report => (
                    <div key={report.id} className="border border-slate-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-md transition-all bg-gradient-to-r from-white to-slate-50">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-bold text-slate-900">{report.clientName || 'Project Report'}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <p className="text-xs text-slate-500">{new Date(report.date || report.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <button
                          onClick={async () => {
                            const email = prompt("Enter recipient email:");
                            if (email) {
                              try {
                                const res = await fetch(`/api/reports/${report.id}/send-email`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ email })
                                });
                                const data = await res.json();
                                alert(data.message || "Report sent!");
                              } catch (e) {
                                alert("Failed to send report");
                              }
                            }
                          }}
                          className="text-xs px-3 py-1 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 flex items-center gap-1 transition-colors"
                        >
                          <Send className="w-3 h-3" />
                          Email
                        </button>
                      </div>
                      <p className="text-sm text-slate-700 line-clamp-2 mt-2">{report.workDone}</p>
                      {report.issues && (
                        <div className="mt-2 flex items-start gap-2 text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-100">
                          <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
                          <span>{report.issues}</span>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-slate-500">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>No reports submitted yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'leave' && (
          <div className="grid gap-6 md:grid-cols-2 max-w-6xl mx-auto">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-lg h-fit">
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Request Leave
              </h2>
              <form onSubmit={handleLeaveRequest} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Start Date</label>
                    <input
                      required
                      type="date"
                      value={leaveForm.startDate}
                      onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                      className="w-full rounded-xl border-slate-300 focus:ring-blue-500 focus:border-blue-500 py-3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">End Date</label>
                    <input
                      required
                      type="date"
                      value={leaveForm.endDate}
                      onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                      className="w-full rounded-xl border-slate-300 focus:ring-blue-500 focus:border-blue-500 py-3"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Reason</label>
                  <textarea
                    required
                    value={leaveForm.reason}
                    onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                    className="w-full rounded-xl border-slate-300 focus:ring-blue-500 focus:border-blue-500 h-24"
                    placeholder="Briefly explain your reason for leave"
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-bold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Submit Request
                </button>
              </form>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-lg overflow-y-auto max-h-[600px]">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Leave Status</h2>
              <div className="space-y-4">
                {leaves.length > 0 ? (
                  leaves.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()).map(leave => (
                    <div key={leave.id} className="border border-slate-200 rounded-xl p-4 bg-gradient-to-r from-white to-slate-50 hover:shadow-md transition-all">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <span className="text-sm font-medium text-slate-700">
                            {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                          </span>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          leave.status === 'approved' ? 'bg-green-100 text-green-700' :
                          leave.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {leave.status}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 italic bg-slate-50 p-2 rounded-lg">"{leave.reason}"</p>
                      {leave.status === 'approved' && leave.backupEngineerId && (
                        <p className="mt-3 text-xs text-slate-500 bg-blue-50 p-2 rounded-lg border border-blue-100">
                          Backup assigned: Engineer ID {leave.backupEngineerId}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-slate-500">
                    <Calendar className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>No leave requests found</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
