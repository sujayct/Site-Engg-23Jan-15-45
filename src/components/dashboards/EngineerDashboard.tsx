import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { MapPin, Clock, Calendar, CheckCircle } from 'lucide-react';
import { CheckIn, DailyReport, LeaveRequest, Assignment } from '../../types';
import { checkInService } from '../../services/checkInService';
import { reportService } from '../../services/reportService';
import { leaveService } from '../../services/leaveService';
import { assignmentService } from '../../services/assignmentService';

export default function EngineerDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'checkin' | 'report' | 'leave'>('checkin');
  const [todayCheckIn, setTodayCheckIn] = useState<CheckIn | null>(null);
  const [loading, setLoading] = useState(false);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [reports, setReports] = useState<DailyReport[]>([]);

  useEffect(() => {
    loadData();
  }, [user]);

  async function loadData() {
    if (!user?.engineerId) return;

    try {
      const [checkIn, assignmentsList, leavesList, reportsList] = await Promise.all([
        checkInService.getTodayCheckIn(user.engineerId),
        assignmentService.getMyAssignments(user.engineerId),
        leaveService.getMyLeaveRequests(user.engineerId),
        reportService.getReports(user.engineerId)
      ]);

      console.log('Today Check-in:', checkIn); // Debug log
      setTodayCheckIn(checkIn);
      setAssignments(assignmentsList);
      setLeaveRequests(leavesList);
      setReports(reportsList);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }

  async function handleCheckIn() {
    if (!user?.engineerId) return;
    setLoading(true);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });

      const { latitude, longitude } = position.coords;
      const locationName = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
      console.log('Current coordinates:', latitude, longitude); // Debug log

      const newCheckIn = await checkInService.createCheckIn(
        user.engineerId,
        latitude,
        longitude,
        locationName,
        assignments[0]?.siteId
      );

      console.log('New check-in created:', newCheckIn); // Debug log
      setTodayCheckIn(newCheckIn);
      await loadData();
      alert('Check-in successful!');
    } catch (error: any) {
      console.error('Check-in error:', error);
      alert(error.message || 'Failed to check in');
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckOut() {
    if (!todayCheckIn) return;
    setLoading(true);

    try {
      await checkInService.checkOut(todayCheckIn.id);
      await loadData();
      alert('Check-out successful!');
    } catch (error: any) {
      alert(error.message || 'Failed to check out');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitReport(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user?.engineerId) return;

    const formData = new FormData(e.currentTarget);
    setLoading(true);

    try {
      await reportService.createReport(
        user.engineerId,
        formData.get('client_id') as string,
        formData.get('work_done') as string,
        (formData.get('issues') as string) || undefined,
        (formData.get('site_id') as string) || undefined
      );

      await loadData();
      alert('Report submitted successfully!');
      e.currentTarget.reset();
    } catch (error: any) {
      alert(error.message || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  }

  async function handleLeaveRequest(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user?.engineerId) return;

    const formData = new FormData(e.currentTarget);
    setLoading(true);

    try {
      await leaveService.createLeaveRequest(
        user.engineerId,
        formData.get('start_date') as string,
        formData.get('end_date') as string,
        formData.get('reason') as string
      );

      await loadData();
      alert('Leave request submitted successfully!');
      e.currentTarget.reset();
    } catch (error: any) {
      alert(error.message || 'Failed to submit leave request');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-slate-900">Engineer Dashboard</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-slate-900">Today's Status</h3>
            </div>
            {todayCheckIn ? (
              <div className="space-y-1">
                <p className="text-sm font-medium text-green-600 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  Checked In
                </p>
                <p className="text-sm text-slate-600">Time: {new Date(todayCheckIn.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                {todayCheckIn.checkOutTime && (
                  <p className="text-sm text-slate-600">Checked out: {new Date(todayCheckIn.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-600 italic">Not checked in yet</p>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-slate-900">Assignments</h3>
            </div>
            <p className="text-2xl font-bold text-slate-900">{assignments.length}</p>
            <p className="text-sm text-slate-600">Active clients</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-5 h-5 text-orange-600" />
              <h3 className="font-semibold text-slate-900">Leave Requests</h3>
            </div>
            <p className="text-2xl font-bold text-slate-900">{leaveRequests.filter(l => l.status === 'pending').length}</p>
            <p className="text-sm text-slate-600">Pending approval</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="border-b border-slate-200">
            <nav className="flex space-x-8 px-6">
              {(['checkin', 'report', 'leave'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tab === 'checkin' ? 'Check-In' : tab === 'report' ? 'Daily Report' : 'Leave Request'}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'checkin' && (
              <div className="max-w-xl mx-auto">
                <div className="text-center mb-8">
                  <MapPin className="w-16 h-16 mx-auto text-blue-500 mb-4" />
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Daily Attendance</h2>
                  <p className="text-slate-600">Check in and out with GPS location tracking</p>
                </div>

                {!todayCheckIn ? (
                  <button
                    onClick={handleCheckIn}
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {loading ? 'Processing...' : 'Check In Now'}
                  </button>
                ) : !todayCheckIn.checkOutTime ? (
                  <button
                    onClick={handleCheckOut}
                    disabled={loading}
                    className="w-full bg-green-600 text-white py-4 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    {loading ? 'Processing...' : 'Check Out Now'}
                  </button>
                ) : (
                  <div className="text-center py-8 bg-green-50 rounded-lg">
                    <CheckCircle className="w-12 h-12 mx-auto text-green-600 mb-2" />
                    <p className="text-green-700 font-medium">Attendance completed for today</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'report' && (
              <div className="max-w-2xl mx-auto space-y-8">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 mb-6">Submit Daily Work Report</h2>
                  <form onSubmit={handleSubmitReport} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Client</label>
                      <select name="client_id" required className="w-full px-4 py-2 border border-slate-300 rounded-lg">
                        <option value="">Select Client</option>
                        {assignments.map(a => (
                          <option key={a.id} value={a.clientId}>{a.clientName}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Site (Optional)</label>
                      <select name="site_id" className="w-full px-4 py-2 border border-slate-300 rounded-lg">
                        <option value="">Select Site</option>
                        {assignments.map(a => a.siteId ? (
                          <option key={`${a.id}-site-${a.siteId}`} value={a.siteId}>{a.siteName}</option>
                        ) : null)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Work Done</label>
                      <textarea
                        name="work_done"
                        required
                        rows={4}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                        placeholder="Describe the work completed today..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Issues (Optional)</label>
                      <textarea
                        name="issues"
                        rows={3}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                        placeholder="Any issues or concerns..."
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      {loading ? 'Submitting...' : 'Submit Report'}
                    </button>
                  </form>
                </div>

                        {reports.length > 0 ? (
                    reports.map(report => (
                      <div key={report.id} className="border border-slate-200 rounded-lg p-4 bg-white">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium text-slate-900">{report.clientName}</p>
                            <p className="text-xs text-slate-500">{new Date(report.date).toLocaleDateString()}</p>
                          </div>
                          <div className="flex gap-2">
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
                              className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                            >
                              Email
                            </button>
                            {report.siteName && (
                              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
                                {report.siteName}
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-slate-700 line-clamp-2">{report.workDone}</p>
                        {report.issues && (
                          <p className="text-xs text-red-600 mt-2 italic">Issue: {report.issues}</p>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500 text-center py-4">No reports submitted yet</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'leave' && (
              <div className="max-w-2xl mx-auto">
                <h2 className="text-xl font-bold text-slate-900 mb-6">Leave Request</h2>
                <form onSubmit={handleLeaveRequest} className="space-y-6 mb-8">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Start Date</label>
                      <input type="date" name="start_date" required className="w-full px-4 py-2 border border-slate-300 rounded-lg" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">End Date</label>
                      <input type="date" name="end_date" required className="w-full px-4 py-2 border border-slate-300 rounded-lg" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Reason</label>
                    <textarea
                      name="reason"
                      required
                      rows={3}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                      placeholder="Reason for leave..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {loading ? 'Submitting...' : 'Submit Leave Request'}
                  </button>
                </form>

                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-900">My Leave Requests</h3>
                  {leaveRequests.length > 0 ? (
                    leaveRequests.map(leave => (
                      <div key={leave.id} className="border border-slate-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium text-slate-900">
                              {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-slate-600">{leave.reason}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                            leave.status === 'approved' ? 'bg-green-100 text-green-700' :
                            leave.status === 'rejected' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {leave.status}
                          </span>
                        </div>
                        {leave.backupEngineerName && (
                          <p className="text-sm text-slate-600">Backup: {leave.backupEngineerName}</p>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500 text-center py-4">No leave requests found</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
