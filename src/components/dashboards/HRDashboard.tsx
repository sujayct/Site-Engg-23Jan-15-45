import { useState, useEffect } from 'react';
import { Users, CheckCircle, Clock, Download, FileText, TrendingUp, Database } from 'lucide-react';
import { CheckIn, LeaveRequest, Engineer, DailyReport } from '../../types';
import { exportToCSV } from '../../lib/export';
import { checkInService } from '../../services/checkInService';
import { reportService } from '../../services/reportService';
import { leaveService } from '../../services/leaveService';
import { StorageService } from '../../lib/storage';
import { useAuth } from '../../contexts/AuthContext';
import { hrReportService, AttendanceRecord, EngineerSummary, ClientReport, PayrollRecord } from '../../services/hrReportService';
import { profileService, UserProfile } from '../../services/profileService';
import HRClientWiseView from './HRClientWiseView';
import ProfileViewer from '../ProfileViewer';

export default function HRDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'attendance' | 'leave' | 'reports' | 'clientwise' | 'enterprise' | 'profiles'>('attendance');
  const [engineerProfiles, setEngineerProfiles] = useState<UserProfile[]>([]);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

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
  }, [activeTab, selectedDate]);

  useEffect(() => {
    if (activeTab === 'enterprise') {
      loadEnterpriseReports();
    } else if (activeTab === 'profiles') {
      loadEngineerProfiles();
    }
  }, [activeTab, enterpriseTab, weeklyStart, weeklyEnd, selectedMonth, selectedDate]);

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
        reportService.getAllReports()
      ]);

      const filteredCheckIns = checkInsList.filter(c => c.date === selectedDate);
      setCheckIns(filteredCheckIns);

      setLeaveRequests(leavesList);

      const filteredReports = reportsList.filter(r => r.date === selectedDate);
      setReports(filteredReports);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }

  async function loadEnterpriseReports() {
    try {
      setLoading(true);

      if (enterpriseTab === 'daily') {
        const register = await hrReportService.getDailyAttendanceRegister(selectedDate);
        setAttendanceRegister(register);
      } else if (enterpriseTab === 'weekly') {
        const summary = await hrReportService.getWeeklyEngineerSummary(weeklyStart, weeklyEnd);
        setEngineerSummary(summary);
      } else if (enterpriseTab === 'monthly') {
        const clientReport = await hrReportService.getMonthlyClientReport(selectedMonth);
        setClientReports(clientReport);
      } else if (enterpriseTab === 'backup') {
        const usage = await hrReportService.getBackupUsage();
        setBackupUsage(usage);
      } else if (enterpriseTab === 'payroll') {
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

  function exportPayrollCSV() {
    const csv = hrReportService.exportPayrollToCSV(payrollData, selectedMonth);
    hrReportService.downloadCSV(csv, `payroll-${selectedMonth}.csv`);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-slate-900">HR Dashboard</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-slate-900">Check-ins</h3>
            </div>
            <p className="text-2xl font-bold text-slate-900">{checkIns.length}</p>
            <p className="text-sm text-slate-600">Out of {engineers.length}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-yellow-600" />
              <h3 className="font-semibold text-slate-900">Pending</h3>
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {leaveRequests.filter(l => l.status === 'pending').length}
            </p>
            <p className="text-sm text-slate-600">Leave requests</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-slate-900">Engineers</h3>
            </div>
            <p className="text-2xl font-bold text-slate-900">{engineers.length}</p>
            <p className="text-sm text-slate-600">Total active</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <FileText className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-slate-900">Reports</h3>
            </div>
            <p className="text-2xl font-bold text-slate-900">{reports.length}</p>
            <p className="text-sm text-slate-600">Today</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="border-b border-slate-200">
            <div className="flex justify-between items-center px-6">
              <nav className="flex space-x-8">
                {(['attendance', 'leave', 'reports', 'clientwise', 'enterprise', 'profiles'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
                      activeTab === tab
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {tab === 'clientwise' ? 'Client-wise' : tab}
                  </button>
                ))}
              </nav>
              {activeTab !== 'enterprise' && activeTab !== 'clientwise' && activeTab !== 'profiles' && (
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm"
                />
              )}
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'attendance' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-semibold text-slate-900">Attendance for {new Date(selectedDate).toLocaleDateString()}</h2>
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
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Export CSV
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Engineer</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Check In</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Check Out</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Location</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {checkIns.map(checkIn => (
                        <tr key={checkIn.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 text-sm text-slate-900">{checkIn.engineerName || 'Unknown'}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {checkIn.checkInTime ? new Date(checkIn.checkInTime).toLocaleTimeString() : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {checkIn.checkOutTime ? new Date(checkIn.checkOutTime).toLocaleTimeString() : '-'}
                          </td>
                            <td className="px-4 py-3 text-sm text-slate-600">
                              {checkIn.latitude && checkIn.longitude ? (
                                <a
                                  href={`https://www.google.com/maps?q=${checkIn.latitude},${checkIn.longitude}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline"
                                >
                                  View Map
                                </a>
                              ) : '-'}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                checkIn.checkOutTime ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                              }`}>
                                {checkIn.checkOutTime ? 'Completed' : 'Active'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      {checkIns.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
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
              <div>
                <h2 className="text-lg font-semibold text-slate-900 mb-6">Leave Requests</h2>
                <div className="space-y-4">
                  {leaveRequests.map(leave => (
                    <div key={leave.id} className="border border-slate-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-slate-900">{leave.engineerName || 'Unknown'}</h3>
                          <p className="text-sm text-slate-600 mt-1">
                            {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-slate-700 mt-2">{leave.reason}</p>
                          {leave.backupEngineerName && (
                            <p className="text-sm text-slate-600 mt-1">Backup: {leave.backupEngineerName}</p>
                          )}
                        </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            leave.status === 'approved' ? 'bg-green-100 text-green-700' :
                            leave.status === 'rejected' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {leave.status}
                          </span>
                        </div>

                        {leave.status === 'pending' && (
                          <div className="flex gap-3 mt-4">
                            <select
                              onChange={(e) => {
                                if (e.target.value) {
                                  handleLeaveAction(leave.id, 'approved', e.target.value);
                                }
                              }}
                              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm"
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
                              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors text-sm"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  {leaveRequests.length === 0 && (
                    <div className="text-center py-12 text-slate-500">
                      No leave requests found
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'reports' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-semibold text-slate-900">Daily Reports for {new Date(selectedDate).toLocaleDateString()}</h2>
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
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Export CSV
                  </button>
                </div>
                <div className="space-y-4">
                  {reports.map(report => (
                    <div key={report.id} className="border border-slate-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-slate-900">{report.engineerName || 'Unknown'}</h3>
                          <p className="text-sm text-slate-600">{report.clientName || 'Unknown'}</p>
                        </div>
                        <span className="text-xs text-slate-500">{new Date(report.createdAt).toLocaleTimeString()}</span>
                      </div>
                        <div className="mt-3 space-y-2">
                          <div>
                            <p className="text-sm font-medium text-slate-700">Work Done:</p>
                            <p className="text-sm text-slate-600 mt-1">{report.workDone}</p>
                          </div>
                          {report.issues && (
                            <div>
                              <p className="text-sm font-medium text-slate-700">Issues:</p>
                              <p className="text-sm text-slate-600 mt-1">{report.issues}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  {reports.length === 0 && (
                    <div className="text-center py-12 text-slate-500">
                      No reports for this date
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'clientwise' && (
              <HRClientWiseView />
            )}

            {activeTab === 'profiles' && (
              <ProfileViewer engineers={engineerProfiles} />
            )}

            {activeTab === 'enterprise' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-slate-900 mb-4">Enterprise Reports</h2>
                  <div className="flex gap-2">
                    {(['daily', 'weekly', 'monthly', 'backup', 'payroll'] as const).map(tab => (
                      <button
                        key={tab}
                        onClick={() => setEnterpriseTab(tab)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                          enterpriseTab === tab
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>

                {enterpriseTab === 'daily' && (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="font-semibold text-slate-900">Daily Attendance Register</h3>
                      <div className="flex gap-2">
                        <input
                          type="date"
                          value={selectedDate}
                          onChange={(e) => setSelectedDate(e.target.value)}
                          className="px-4 py-2 border border-slate-300 rounded-lg text-sm"
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
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          Export CSV
                        </button>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Engineer</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Check In</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Check Out</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Hours</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {attendanceRegister.map(record => (
                            <tr key={record.engineerId} className="hover:bg-slate-50">
                              <td className="px-4 py-3 text-sm text-slate-900">{record.engineerName}</td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  record.status === 'present' ? 'bg-green-100 text-green-700' :
                                  record.status === 'leave' ? 'bg-blue-100 text-blue-700' :
                                  'bg-red-100 text-red-700'
                                }`}>
                                  {record.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-slate-600">
                                {record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString() : '-'}
                              </td>
                              <td className="px-4 py-3 text-sm text-slate-600">
                                {record.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString() : '-'}
                              </td>
                              <td className="px-4 py-3 text-sm text-slate-600">
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
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="font-semibold text-slate-900">Weekly Engineer Summary</h3>
                      <div className="flex gap-2">
                        <input
                          type="date"
                          value={weeklyStart}
                          onChange={(e) => setWeeklyStart(e.target.value)}
                          className="px-4 py-2 border border-slate-300 rounded-lg text-sm"
                        />
                        <span className="flex items-center text-slate-500">to</span>
                        <input
                          type="date"
                          value={weeklyEnd}
                          onChange={(e) => setWeeklyEnd(e.target.value)}
                          className="px-4 py-2 border border-slate-300 rounded-lg text-sm"
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
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          Export CSV
                        </button>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Engineer</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Present</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Absent</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Leave</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Total Hours</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Avg Hours/Day</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {engineerSummary.map(summary => (
                            <tr key={summary.engineerId} className="hover:bg-slate-50">
                              <td className="px-4 py-3 text-sm text-slate-900">{summary.engineerName}</td>
                              <td className="px-4 py-3 text-sm text-green-600 font-medium">{summary.presentDays}</td>
                              <td className="px-4 py-3 text-sm text-red-600 font-medium">{summary.absentDays}</td>
                              <td className="px-4 py-3 text-sm text-blue-600 font-medium">{summary.leaveDays}</td>
                              <td className="px-4 py-3 text-sm text-slate-600">{summary.totalHours}h</td>
                              <td className="px-4 py-3 text-sm text-slate-600">{summary.averageHoursPerDay}h</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {enterpriseTab === 'monthly' && (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="font-semibold text-slate-900">Monthly Client-Wise Report</h3>
                      <div className="flex gap-2">
                        <input
                          type="month"
                          value={selectedMonth}
                          onChange={(e) => setSelectedMonth(e.target.value)}
                          className="px-4 py-2 border border-slate-300 rounded-lg text-sm"
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
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          Export CSV
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {clientReports.map(report => (
                        <div key={report.clientId} className="border border-slate-200 rounded-lg p-4">
                          <h4 className="font-semibold text-slate-900 mb-3">{report.clientName}</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-slate-600">Sites:</span>
                              <span className="text-sm font-medium text-slate-900">{report.sitesCount}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-slate-600">Assignments:</span>
                              <span className="text-sm font-medium text-slate-900">{report.totalAssignments}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-slate-600">Active Engineers:</span>
                              <span className="text-sm font-medium text-slate-900">{report.activeEngineers}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-slate-600">Check-ins:</span>
                              <span className="text-sm font-medium text-slate-900">{report.totalCheckIns}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-slate-600">Reports:</span>
                              <span className="text-sm font-medium text-slate-900">{report.totalReports}</span>
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
                      <div className="border border-slate-200 rounded-lg p-6">
                        <Database className="w-8 h-8 text-blue-600 mb-3" />
                        <p className="text-sm text-slate-600 mb-1">Total Backups</p>
                        <p className="text-2xl font-bold text-slate-900">{backupUsage.totalBackups}</p>
                      </div>
                      <div className="border border-slate-200 rounded-lg p-6">
                        <TrendingUp className="w-8 h-8 text-green-600 mb-3" />
                        <p className="text-sm text-slate-600 mb-1">Storage Used</p>
                        <p className="text-2xl font-bold text-slate-900">{backupUsage.storageUsedMB} MB</p>
                      </div>
                      <div className="border border-slate-200 rounded-lg p-6">
                        <FileText className="w-8 h-8 text-purple-600 mb-3" />
                        <p className="text-sm text-slate-600 mb-1">Avg Size</p>
                        <p className="text-2xl font-bold text-slate-900">{backupUsage.avgBackupSizeMB} MB</p>
                      </div>
                      <div className="border border-slate-200 rounded-lg p-6">
                        <Clock className="w-8 h-8 text-orange-600 mb-3" />
                        <p className="text-sm text-slate-600 mb-1">Last Backup</p>
                        <p className="text-lg font-bold text-slate-900">
                          {backupUsage.lastBackupDate === 'Never' ? 'Never' : new Date(backupUsage.lastBackupDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {enterpriseTab === 'payroll' && (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="font-semibold text-slate-900">Payroll Export</h3>
                      <div className="flex gap-3">
                        <input
                          type="month"
                          value={selectedMonth}
                          onChange={(e) => setSelectedMonth(e.target.value)}
                          className="px-4 py-2 border border-slate-300 rounded-lg text-sm"
                        />
                        <button
                          onClick={exportPayrollCSV}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          Export CSV
                        </button>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Engineer</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Email</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Phone</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Working Days</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Total Hours</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Leave Days</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Overtime</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {payrollData.map(record => (
                            <tr key={record.engineerId} className="hover:bg-slate-50">
                              <td className="px-4 py-3 text-sm text-slate-900">{record.engineerName}</td>
                              <td className="px-4 py-3 text-sm text-slate-600">{record.email}</td>
                              <td className="px-4 py-3 text-sm text-slate-600">{record.phone}</td>
                              <td className="px-4 py-3 text-sm text-slate-600">{record.workingDays}</td>
                              <td className="px-4 py-3 text-sm text-slate-600">{record.totalHours}h</td>
                              <td className="px-4 py-3 text-sm text-slate-600">{record.leaveDays}</td>
                              <td className="px-4 py-3 text-sm text-slate-600">{record.overtimeHours}h</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
