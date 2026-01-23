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
  LayoutDashboard,
  Navigation
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { checkInService } from '../../services/checkInService';
import { reportService } from '../../services/reportService';
import { leaveService } from '../../services/leaveService';
import { assignmentService } from '../../services/assignmentService';
import type { DailyReport, CheckIn, LeaveRequest, Assignment } from '../../types';

export default function EngineerDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'attendance' | 'reports' | 'leave'>('attendance');
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [todayCheckIn, setTodayCheckIn] = useState<CheckIn | null>(null);
  const [loading, setLoading] = useState(true);

  // Form states
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
      const [reportsData, checkInsData, leavesData, assignmentsData, todayCheck] = await Promise.all([
        reportService.getReports(user!.id),
        checkInService.getAllCheckIns(),
        leaveService.getMyLeaveRequests(user!.id),
        assignmentService.getMyAssignments(user!.id),
        checkInService.getTodayCheckIn(user!.id)
      ]);
      setReports(reportsData);
      setCheckIns(checkInsData.filter(c => c.engineerId === user!.id));
      setLeaves(leavesData);
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
        user.id,
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
      await reportService.createReport(
        user.id,
        reportForm.clientId,
        reportForm.workDone,
        reportForm.issues,
        reportForm.siteId || undefined
      );
      setReportForm({ clientId: '', siteId: '', workDone: '', issues: '' });
      loadData();
      alert('Report submitted successfully');
    } catch (error) {
      alert('Failed to submit report');
    }
  };

  const handleLeaveRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await leaveService.createLeaveRequest(
        user.id,
        leaveForm.startDate,
        leaveForm.endDate,
        leaveForm.reason
      );
      setLeaveForm({ startDate: '', endDate: '', reason: '' });
      loadData();
      alert('Leave request submitted');
    } catch (error) {
      alert('Failed to submit leave request');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-blue-600" />
            <span className="font-bold text-slate-900">Engineer Portal</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-slate-900">{user?.name}</p>
              <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
            </div>
            <button 
              onClick={logout}
              className="p-2 text-slate-500 hover:text-red-600 transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-2 p-1 bg-slate-200 rounded-lg w-full max-w-md mx-auto mb-8">
          {(['attendance', 'reports', 'leave'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                activeTab === tab 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {activeTab === 'attendance' && (
          <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                Daily Check-in
              </h2>
              
              <div className="space-y-6">
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="text-sm text-slate-500 mb-1">Current Status</p>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${todayCheckIn ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                    <p className="font-semibold text-slate-900">
                      {todayCheckIn ? (todayCheckIn.checkOutTime ? 'Completed' : 'Checked In') : 'Not Checked In'}
                    </p>
                  </div>
                </div>

                {!todayCheckIn ? (
                  <button
                    onClick={handleCheckIn}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-bold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2 transform active:scale-95"
                  >
                    <Navigation className="w-5 h-5 animate-pulse" />
                    Check In (Simulate GPS)
                  </button>
                ) : !todayCheckIn.checkOutTime ? (
                  <button
                    onClick={handleCheckOut}
                    className="w-full py-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-bold hover:from-red-700 hover:to-red-800 transition-all shadow-lg shadow-red-200 flex items-center justify-center gap-2 transform active:scale-95"
                  >
                    <LogOut className="w-5 h-5" />
                    Check Out
                  </button>
                ) : (
                  <div className="text-center p-6 bg-green-50 text-green-700 rounded-xl border border-green-100 flex flex-col items-center justify-center gap-2">
                    <CheckCircle className="w-8 h-8" />
                    <p className="font-bold">Work session completed</p>
                    <p className="text-xs opacity-75">Great job today!</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Today's History</h2>
              <div className="space-y-4">
                {checkIns.slice(0, 5).map(checkIn => (
                  <div key={checkIn.id} className="flex items-start gap-3 p-3 border-l-2 border-blue-500 bg-blue-50/30">
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
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="grid gap-6 md:grid-cols-2 max-w-6xl mx-auto">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-fit">
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Submit Daily Report
              </h2>
              <form onSubmit={handleReportSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Select Client</label>
                  <select
                    required
                    value={reportForm.clientId}
                    onChange={(e) => setReportForm({ ...reportForm, clientId: e.target.value })}
                    className="w-full rounded-lg border-slate-300 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Choose a client...</option>
                    {assignments.map(a => (
                      <option key={a.clientId} value={a.clientId}>{a.clientName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Work Done</label>
                  <textarea
                    required
                    value={reportForm.workDone}
                    onChange={(e) => setReportForm({ ...reportForm, workDone: e.target.value })}
                    className="w-full rounded-lg border-slate-300 focus:ring-blue-500 focus:border-blue-500 h-32"
                    placeholder="What tasks were completed today?"
                  ></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Issues/Remarks (Optional)</label>
                  <textarea
                    value={reportForm.issues}
                    onChange={(e) => setReportForm({ ...reportForm, issues: e.target.value })}
                    className="w-full rounded-lg border-slate-300 focus:ring-blue-500 focus:border-blue-500 h-20"
                    placeholder="Any roadblocks or concerns?"
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-md"
                >
                  <Send className="w-5 h-5" />
                  Submit Report
                </button>
              </form>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Recent Activity</h2>
              <div className="space-y-4">
                {reports.length > 0 ? (
                  reports.map(report => (
                    <div key={report.id} className="border border-slate-200 rounded-lg p-4 hover:border-blue-300 transition-colors bg-white">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-bold text-slate-900">{report.clientName}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <p className="text-xs text-slate-500">{new Date(report.date).toLocaleDateString()}</p>
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
                          className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 flex items-center gap-1"
                        >
                          <Send className="w-3 h-3" />
                          Email
                        </button>
                      </div>
                      <p className="text-sm text-slate-700 line-clamp-2 mt-2">{report.workDone}</p>
                      {report.issues && (
                        <div className="mt-2 flex items-start gap-2 text-xs text-red-600 bg-red-50 p-2 rounded border border-red-100">
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
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-fit">
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Request Leave
              </h2>
              <form onSubmit={handleLeaveRequest} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                    <input
                      required
                      type="date"
                      value={leaveForm.startDate}
                      onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                      className="w-full rounded-lg border-slate-300 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                    <input
                      required
                      type="date"
                      value={leaveForm.endDate}
                      onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                      className="w-full rounded-lg border-slate-300 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Reason</label>
                  <textarea
                    required
                    value={leaveForm.reason}
                    onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                    className="w-full rounded-lg border-slate-300 focus:ring-blue-500 focus:border-blue-500 h-24"
                    placeholder="Briefly explain your reason for leave"
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-md flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Submit Request
                </button>
              </form>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Leave Status</h2>
              <div className="space-y-4">
                {leaves.length > 0 ? (
                  leaves.map(leave => (
                    <div key={leave.id} className="border border-slate-200 rounded-lg p-4 bg-white">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <span className="text-sm font-medium text-slate-700">
                            {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                          </span>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium uppercase tracking-wider ${
                          leave.status === 'approved' ? 'bg-green-100 text-green-700' :
                          leave.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {leave.status}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 italic">"{leave.reason}"</p>
                      {leave.status === 'approved' && leave.backupEngineerId && (
                        <p className="mt-3 text-xs text-slate-500 bg-slate-50 p-2 rounded border border-slate-100">
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
      </main>
    </div>
  );
}
