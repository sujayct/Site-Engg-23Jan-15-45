import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Users, FileText, MapPin, Download, Building2, Clock, TrendingUp, Calendar } from 'lucide-react';
import { Assignment, DailyReport, CheckIn, LeaveRequest, Client, User, Site } from '../../types';
import { exportToCSV } from '../../lib/export';
import { StorageService } from '../../lib/storage';

export default function ClientDashboard() {
  const { user } = useAuth();
  const [client, setClient] = useState<Client | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [engineers, setEngineers] = useState<User[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user, selectedDate]);

  async function loadData() {
    if (!user) return;

    try {
      setLoading(true);
      const [allClients, allAssignments, allReports, allCheckIns, allLeaves, allEngineers, allSites] = await Promise.all([
        StorageService.getClients(),
        StorageService.getAssignments(),
        StorageService.getDailyReports(),
        StorageService.getCheckIns(),
        StorageService.getLeaveRequests(),
        StorageService.getEngineers(),
        StorageService.getSites()
      ]);

      setEngineers(allEngineers);
      setSites(allSites);

      const clientData = allClients.find((c: Client) => c.email === user.email || c.userId === user.id);
      if (!clientData) {
        setLoading(false);
        return;
      }
      setClient(clientData);

      const clientAssignments = allAssignments.filter((a: Assignment) => a.clientId === clientData.id);
      setAssignments(clientAssignments);

      const engineerIds = clientAssignments.map((a: Assignment) => a.engineerId);

      const filteredReports = allReports.filter((r: DailyReport) => 
        r.date === selectedDate && engineerIds.includes(r.engineerId)
      );
      setReports(filteredReports);

      const filteredCheckIns = allCheckIns.filter((c: CheckIn) =>
        c.date === selectedDate && engineerIds.includes(c.engineerId)
      );
      setCheckIns(filteredCheckIns);

      const filteredLeaves = allLeaves.filter((l: LeaveRequest) =>
        l.status === 'approved' && engineerIds.includes(l.engineerId)
      );
      setLeaves(filteredLeaves);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  function getEngineerById(id: string): User | undefined {
    return engineers.find(e => e.id === id);
  }

  function getSiteById(id: string): Site | undefined {
    return sites.find(s => s.id === id);
  }

  function isEngineerOnLeave(engineerId: string): LeaveRequest | undefined {
    const today = new Date(selectedDate);
    return leaves.find(leave => {
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      return leave.engineerId === engineerId && today >= start && today <= end;
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 text-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Building2 className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Client Dashboard</h1>
              {client && <p className="text-orange-100 mt-1">{client.name}</p>}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 -mt-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-slate-700">Assigned Engineers</h3>
            </div>
            <p className="text-3xl font-bold text-slate-900">{assignments.length}</p>
            <p className="text-sm text-slate-500 mt-1">Active assignments</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <FileText className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="font-semibold text-slate-700">Today's Reports</h3>
            </div>
            <p className="text-3xl font-bold text-slate-900">{reports.length}</p>
            <p className="text-sm text-slate-500 mt-1">Work reports submitted</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <MapPin className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="font-semibold text-slate-700">Check-ins Today</h3>
            </div>
            <p className="text-3xl font-bold text-slate-900">{checkIns.length}</p>
            <p className="text-sm text-slate-500 mt-1">Engineers checked in</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-orange-600" />
              </div>
              <h3 className="font-semibold text-slate-700">On Leave</h3>
            </div>
            <p className="text-3xl font-bold text-slate-900">
              {assignments.filter(a => isEngineerOnLeave(a.engineerId)).length}
            </p>
            <p className="text-sm text-slate-500 mt-1">Engineers on leave</p>
          </div>
        </div>

        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white rounded-xl p-4 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-orange-600" />
            <h2 className="text-xl font-bold text-slate-900">Date View</h2>
          </div>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
          />
        </div>

        <div className="grid gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Assigned Engineers
              </h3>
            </div>
            <div className="p-6">
              <div className="grid gap-4">
                {assignments.length > 0 ? assignments.map(assignment => {
                  const engineer = getEngineerById(assignment.engineerId);
                  const site = assignment.siteId ? getSiteById(assignment.siteId) : null;
                  const leave = isEngineerOnLeave(assignment.engineerId);
                  const backupEngineer = leave?.backupEngineerId ? getEngineerById(leave.backupEngineerId) : null;

                  return (
                    <div key={assignment.id} className="border border-slate-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-md transition-all bg-gradient-to-r from-white to-slate-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-slate-900">{engineer?.name || 'Unknown Engineer'}</h4>
                          <p className="text-sm text-slate-600">{engineer?.email}</p>
                          {site && (
                            <p className="text-sm text-slate-600 mt-1 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              Site: {site.name}
                            </p>
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
                }) : (
                  <p className="text-center py-8 text-slate-500">No engineers assigned yet</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-600" />
                Attendance for {new Date(selectedDate).toLocaleDateString()}
              </h3>
            </div>
            <div className="p-6 space-y-4">
              {checkIns.length > 0 ? checkIns.map(checkIn => {
                const engineer = getEngineerById(checkIn.engineerId);
                return (
                  <div key={checkIn.id} className="border border-slate-200 rounded-xl p-4 hover:border-purple-300 hover:shadow-md transition-all bg-gradient-to-r from-white to-slate-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-slate-900">{engineer?.name || 'Unknown Engineer'}</h4>
                        <p className="text-sm text-slate-600 mt-1 flex items-center gap-2">
                          <Clock className="w-3 h-3" />
                          Check-in: {new Date(checkIn.checkInTime).toLocaleTimeString()}
                        </p>
                        {checkIn.checkOutTime && (
                          <p className="text-sm text-slate-600 flex items-center gap-2">
                            <Clock className="w-3 h-3" />
                            Check-out: {new Date(checkIn.checkOutTime).toLocaleTimeString()}
                          </p>
                        )}
                      </div>
                      {checkIn.latitude && checkIn.longitude && (
                        <a
                          href={`https://www.google.com/maps?q=${checkIn.latitude},${checkIn.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm bg-blue-50 px-3 py-1 rounded-full transition-colors"
                        >
                          <MapPin className="w-3 h-3" />
                          View Location
                        </a>
                      )}
                    </div>
                  </div>
                );
              }) : (
                <p className="text-center py-8 text-slate-500">No check-ins for this date</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-green-50 to-green-100 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-green-600" />
                Daily Work Reports for {new Date(selectedDate).toLocaleDateString()}
              </h3>
              <button
                onClick={() => {
                  const exportData = reports.map(r => {
                    const engineer = getEngineerById(r.engineerId);
                    const site = r.siteId ? getSiteById(r.siteId) : null;
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
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all text-sm shadow-md"
              >
                <Download className="w-4 h-4" />
                Export Reports
              </button>
            </div>
            <div className="p-6 space-y-4">
              {reports.length > 0 ? reports.map(report => {
                const engineer = getEngineerById(report.engineerId);
                const site = report.siteId ? getSiteById(report.siteId) : null;
                return (
                  <div key={report.id} className="border border-slate-200 rounded-xl p-4 hover:border-green-300 hover:shadow-md transition-all bg-gradient-to-r from-white to-slate-50">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-slate-900">{engineer?.name || 'Unknown Engineer'}</h4>
                        {site && (
                          <p className="text-sm text-slate-600 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            Site: {site.name}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                        {new Date(report.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="bg-slate-50 rounded-lg p-3">
                        <p className="text-sm font-medium text-slate-700 mb-1">Work Done:</p>
                        <p className="text-sm text-slate-600 whitespace-pre-wrap">{report.workDone}</p>
                      </div>
                      {report.issues && (
                        <div className="bg-red-50 rounded-lg p-3 border border-red-100">
                          <p className="text-sm font-medium text-red-700 mb-1">Issues:</p>
                          <p className="text-sm text-red-600 whitespace-pre-wrap">{report.issues}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }) : (
                <p className="text-center py-8 text-slate-500">No reports for this date</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
