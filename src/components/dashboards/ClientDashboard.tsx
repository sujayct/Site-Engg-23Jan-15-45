import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Users, FileText, Calendar, MapPin, Download } from 'lucide-react';
import { Assignment, DailyReport, CheckIn, LeaveRequest, Client } from '../../types';
import { exportToCSV } from '../../lib/export';
import { assignmentService } from '../../services/assignmentService';
import { reportService } from '../../services/reportService';
import { checkInService } from '../../services/checkInService';
import { leaveService } from '../../services/leaveService';
import { StorageService } from '../../lib/storage';

export default function ClientDashboard() {
  const { user } = useAuth();
  const [client, setClient] = useState<Client | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadData();
  }, [user, selectedDate]);

  async function loadData() {
    if (!user?.clientId) return;

    try {
      const clientData = StorageService.getClientById(user.clientId);
      if (!clientData) return;
      setClient(clientData);

      const [assignmentsList, reportsList, allCheckIns, allLeaves] = await Promise.all([
        assignmentService.getAssignmentsByClient(user.clientId),
        reportService.getAllReports(user.clientId),
        checkInService.getAllCheckIns(),
        leaveService.getAllLeaveRequests()
      ]);

      setAssignments(assignmentsList);

      // Filter reports by date
      const filteredReports = reportsList.filter(r => r.date === selectedDate);
      setReports(filteredReports);

      // Filter check-ins by date and assigned engineers
      const engineerIds = assignmentsList.map(a => a.engineerId);
      const filteredCheckIns = allCheckIns.filter(c =>
        c.date === selectedDate && engineerIds.includes(c.engineerId)
      );
      setCheckIns(filteredCheckIns);

      // Filter approved leaves
      const filteredLeaves = allLeaves.filter(l =>
        l.status === 'approved' && engineerIds.includes(l.engineerId)
      );
      setLeaves(filteredLeaves);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }

  function isEngineerOnLeave(engineerId: string): LeaveRequest | undefined {
    const today = new Date(selectedDate);
    return leaves.find(leave => {
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      return leave.engineerId === engineerId && today >= start && today <= end;
    });
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-slate-900">Client Dashboard</h1>
          {client && <p className="text-slate-600 mt-1">{client.name}</p>}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-slate-900">Assigned Engineers</h3>
            </div>
            <p className="text-2xl font-bold text-slate-900">{assignments.length}</p>
            <p className="text-sm text-slate-600">Active assignments</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <FileText className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-slate-900">Today's Reports</h3>
            </div>
            <p className="text-2xl font-bold text-slate-900">{reports.length}</p>
            <p className="text-sm text-slate-600">Work reports submitted</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <MapPin className="w-5 h-5 text-orange-600" />
              <h3 className="font-semibold text-slate-900">Check-ins</h3>
            </div>
            <p className="text-2xl font-bold text-slate-900">{checkIns.length}</p>
            <p className="text-sm text-slate-600">Engineers checked in</p>
          </div>
        </div>

        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-900">Date View</h2>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg"
          />
        </div>

        <div className="grid gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Assigned Engineers</h3>
            <div className="grid gap-4">
              {assignments.map(assignment => {
                const engineer = StorageService.getEngineerById(assignment.engineerId);
                const site = assignment.siteId ? StorageService.getSiteById(assignment.siteId) : null;
                const leave = isEngineerOnLeave(assignment.engineerId);
                const backupEngineer = leave?.backupEngineerId ? StorageService.getEngineerById(leave.backupEngineerId) : null;

                return (
                  <div key={assignment.id} className="border border-slate-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-slate-900">{engineer?.name}</h4>
                        <p className="text-sm text-slate-600">{engineer?.email}</p>
                        {site && (
                          <p className="text-sm text-slate-600 mt-1">Site: {site.name}</p>
                        )}
                      </div>
                      {leave ? (
                        <div className="text-right">
                          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                            On Leave
                          </span>
                          {backupEngineer && (
                            <p className="text-sm text-slate-600 mt-2">
                              Backup: {backupEngineer.name}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          Active
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Attendance for {new Date(selectedDate).toLocaleDateString()}</h3>
            <div className="space-y-4">
              {checkIns.map(checkIn => {
                const engineer = StorageService.getEngineerById(checkIn.engineerId);
                return (
                  <div key={checkIn.id} className="border border-slate-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-slate-900">{engineer?.name}</h4>
                        <p className="text-sm text-slate-600 mt-1">
                          Check-in: {new Date(checkIn.checkInTime).toLocaleTimeString()}
                        </p>
                        {checkIn.checkOutTime && (
                          <p className="text-sm text-slate-600">
                            Check-out: {new Date(checkIn.checkOutTime).toLocaleTimeString()}
                          </p>
                        )}
                      </div>
                      {checkIn.latitude && checkIn.longitude && (
                        <a
                          href={`https://www.google.com/maps?q=${checkIn.latitude},${checkIn.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm"
                        >
                          View Location
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
              {checkIns.length === 0 && (
                <p className="text-center py-8 text-slate-500">No check-ins for this date</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Daily Work Reports for {new Date(selectedDate).toLocaleDateString()}</h3>
              <button
                onClick={() => {
                  const exportData = reports.map(r => {
                    const engineer = StorageService.getEngineerById(r.engineerId);
                    const site = r.siteId ? StorageService.getSiteById(r.siteId) : null;
                    return {
                      Engineer: engineer?.name || '',
                      Site: site?.name || '-',
                      Date: r.date,
                      WorkDone: r.workDone,
                      Issues: r.issues || 'None',
                    };
                  });
                  exportToCSV(exportData, `reports-${client?.name || 'client'}-${selectedDate}`);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                <Download className="w-4 h-4" />
                Export Reports
              </button>
            </div>
            <div className="space-y-4">
              {reports.map(report => {
                const engineer = StorageService.getEngineerById(report.engineerId);
                const site = report.siteId ? StorageService.getSiteById(report.siteId) : null;
                return (
                  <div key={report.id} className="border border-slate-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-slate-900">{engineer?.name}</h4>
                        {site && (
                          <p className="text-sm text-slate-600">Site: {site.name}</p>
                        )}
                      </div>
                      <span className="text-xs text-slate-500">
                        {new Date(report.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm font-medium text-slate-700">Work Done:</p>
                        <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">{report.workDone}</p>
                      </div>
                      {report.issues && (
                        <div>
                          <p className="text-sm font-medium text-slate-700">Issues:</p>
                          <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">{report.issues}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {reports.length === 0 && (
                <p className="text-center py-8 text-slate-500">No reports for this date</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
