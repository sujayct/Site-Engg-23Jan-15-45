import { useState, useEffect } from 'react';
import { Users, FileText, MapPin, Loader, AlertCircle, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { assignmentService } from '../../services/assignmentService';
import { reportService } from '../../services/reportService';
import { checkInService } from '../../services/checkInService';
import { StorageService } from '../../lib/storage';
import type { Assignment, DailyReport, CheckIn, Client, Engineer, Site } from '../../types';

export default function MobileClientDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [client, setClient] = useState<Client | null>(null);
  const [engineers, setEngineers] = useState<Assignment[]>([]);
  const [engineersList, setEngineersList] = useState<Engineer[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [todayCheckIns, setTodayCheckIns] = useState<CheckIn[]>([]);
  const [activeTab, setActiveTab] = useState<'engineers' | 'reports' | 'attendance'>('engineers');

  useEffect(() => {
    loadData();
  }, [user]);

  async function loadData(isRefresh = false) {
    if (!user?.clientId) return;

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [clientsData, engineersData, sitesData] = await Promise.all([
        StorageService.getClients(),
        StorageService.getEngineers(),
        StorageService.getSites(),
      ]);

      const clientData = clientsData.find((c: Client) => c.id === user.clientId);

      if (!clientData) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      setClient(clientData);
      setEngineersList(engineersData);
      setSites(sitesData);

      const today = new Date().toISOString().split('T')[0];

      const [allAssignments, reportsData, checkInsData] = await Promise.all([
        assignmentService.getAllAssignments(),
        reportService.getReports(),
        checkInService.getAllCheckIns(),
      ]);

      const assignmentsData = allAssignments.filter((a: Assignment) => a.clientId === clientData.id);
      setEngineers(assignmentsData);

      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const filteredReports = reportsData.filter((r: DailyReport) => 
        r.clientId === clientData.id && r.date >= weekAgo && r.date <= today
      );
      setReports(filteredReports);

      setTodayCheckIns(checkInsData.filter((c: CheckIn) =>
        c.date === today && assignmentsData.some((a: Assignment) => a.engineerId === c.engineerId)
      ));
    } catch (error) {
      console.error('Failed to load client data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white flex items-center justify-center p-4">
        <div className="text-center">
          <Loader className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600">No client profile found</p>
          <p className="text-sm text-slate-500 mt-2">Contact support for assistance</p>
        </div>
      </div>
    );
  }

  const todayReports = reports.filter(r =>
    r.date === new Date().toISOString().split('T')[0]
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white pb-20">
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-4 py-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">{client.name}</h1>
            <p className="text-indigo-100 text-sm">{client.email}</p>
          </div>
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
            <p className="text-xs text-indigo-100 mb-1">Engineers</p>
            <p className="text-2xl font-bold">{engineers.length}</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-3">
            <p className="text-xs text-indigo-100 mb-1">Present</p>
            <p className="text-2xl font-bold">{todayCheckIns.length}</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-3">
            <p className="text-xs text-indigo-100 mb-1">Reports</p>
            <p className="text-2xl font-bold">{todayReports.length}</p>
          </div>
        </div>
      </div>

      <div className="flex border-b border-slate-200 bg-white sticky top-0 z-10 shadow-sm">
        <button
          onClick={() => setActiveTab('engineers')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === 'engineers'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-slate-600'
          }`}
        >
          Engineers
        </button>
        <button
          onClick={() => setActiveTab('attendance')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === 'attendance'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-slate-600'
          }`}
        >
          Attendance
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === 'reports'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-slate-600'
          }`}
        >
          Reports
        </button>
      </div>

      <div className="p-4">
        {activeTab === 'engineers' && (
          <EngineersTab engineers={engineers} engineersList={engineersList} sites={sites} />
        )}
        {activeTab === 'attendance' && (
          <AttendanceTab checkIns={todayCheckIns} engineers={engineers} engineersList={engineersList} />
        )}
        {activeTab === 'reports' && (
          <ReportsTab reports={reports} engineersList={engineersList} sites={sites} />
        )}
      </div>
    </div>
  );
}

function EngineersTab({ engineers, engineersList, sites }: { engineers: Assignment[]; engineersList: Engineer[]; sites: Site[] }) {
  if (engineers.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-600">No engineers assigned</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {engineers.map((assignment) => {
        const engineer = engineersList.find(e => e.id === assignment.engineerId);
        const site = assignment.siteId ? sites.find(s => s.id === assignment.siteId) : null;
        return (
          <div key={assignment.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-semibold text-slate-900">{engineer?.name || 'Unknown'}</p>
                <p className="text-sm text-slate-600">{engineer?.email}</p>
                {engineer?.phone && (
                  <p className="text-sm text-slate-600">{engineer.phone}</p>
                )}
              </div>
            </div>

            {site && (
              <div className="flex items-start gap-2 mt-3 p-2 bg-slate-50 rounded-lg">
                <MapPin className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-700">{site.name}</p>
                  <p className="text-xs text-slate-600 mt-1">{site.location}</p>
                </div>
              </div>
            )}

            <p className="text-xs text-slate-500 mt-2">
              Assigned: {new Date(assignment.createdAt).toLocaleDateString()}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function AttendanceTab({
  checkIns,
  engineers,
  engineersList,
}: {
  checkIns: CheckIn[];
  engineers: Assignment[];
  engineersList: Engineer[];
}) {
  const checkedInIds = new Set(checkIns.map(c => c.engineerId));
  const absent = engineers.filter(e => !checkedInIds.has(e.engineerId));

  return (
    <div className="space-y-4">
      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
        <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          Present Today ({checkIns.length})
        </h3>
        {checkIns.length === 0 ? (
          <p className="text-sm text-green-700">No check-ins yet today</p>
        ) : (
          <div className="space-y-2">
            {checkIns.map((checkIn) => {
              const engineer = engineersList.find(e => e.id === checkIn.engineerId);
              return (
                <div key={checkIn.id} className="bg-white rounded-lg p-3 shadow-sm">
                  <p className="font-medium text-slate-900">{engineer?.name || 'Unknown'}</p>
                  <p className="text-xs text-slate-600 mt-1">
                    {new Date(checkIn.checkInTime).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                  {checkIn.locationName && (
                    <p className="text-xs text-slate-500 mt-1">{checkIn.locationName}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {absent.length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <XCircle className="w-5 h-5 text-slate-500" />
            Not Checked In ({absent.length})
          </h3>
          <div className="space-y-2">
            {absent.map((assignment) => {
              const engineer = engineersList.find(e => e.id === assignment.engineerId);
              return (
                <div key={assignment.id} className="bg-white rounded-lg p-3 shadow-sm">
                  <p className="font-medium text-slate-900">{engineer?.name || 'Unknown'}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function ReportsTab({ reports, engineersList, sites }: { reports: DailyReport[]; engineersList: Engineer[]; sites: Site[] }) {
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
      {reports.map((report) => {
        const engineer = engineersList.find(e => e.id === report.engineerId);
        const site = report.siteId ? sites.find(s => s.id === report.siteId) : null;
        return (
          <div key={report.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-medium text-slate-900">{engineer?.name || 'Unknown'}</p>
                {site && (
                  <p className="text-sm text-slate-600">{site.name}</p>
                )}
              </div>
              <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                {new Date(report.date).toLocaleDateString()}
              </span>
            </div>
            <p className="text-sm text-slate-700 mb-2 line-clamp-3">{report.workDone}</p>
            {report.issues && (
              <div className="flex items-start gap-2 mt-2 p-2 bg-red-50 rounded-lg border border-red-200">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-red-900">Issues Reported:</p>
                  <p className="text-xs text-red-700 mt-1">{report.issues}</p>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
