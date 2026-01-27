import { useState, useEffect } from 'react';
import { Users, Building2, CheckCircle, Loader, RefreshCw, FileText } from 'lucide-react';
import { StorageService } from '../../lib/storage';
import { checkInService } from '../../services/checkInService';
import { reportService } from '../../services/reportService';
import DataManagement from '../DataManagement';
import type { Engineer, Client, CheckIn, DailyReport } from '../../types';

export default function MobileAdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [todayCheckIns, setTodayCheckIns] = useState<CheckIn[]>([]);
  const [todayReports, setTodayReports] = useState<DailyReport[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'engineers' | 'clients' | 'data'>('overview');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData(isRefresh = false) {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const today = new Date().toISOString().split('T')[0];

      const [engineersData, clientsData] = await Promise.all([
        StorageService.getEngineers(),
        StorageService.getClients(),
      ]);

      const [checkIns, reports] = await Promise.all([
        checkInService.getAllCheckIns(),
        reportService.getReports(),
      ]);

      const filteredCheckIns = checkIns.filter((c: CheckIn) => c.date === today);
      const filteredReports = reports.filter((r: DailyReport) => r.date === today);

      setEngineers(engineersData);
      setClients(clientsData);
      setTodayCheckIns(filteredCheckIns);
      setTodayReports(filteredReports);
    } catch (error) {
      console.error('Failed to load admin data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-4">
        <div className="text-center">
          <Loader className="w-12 h-12 text-slate-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  const attendanceRate = engineers.length > 0 ? Math.round((todayCheckIns.length / engineers.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-20">
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white px-4 py-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/10 backdrop-blur rounded-xl p-3">
            <p className="text-xs text-slate-300 mb-1">Engineers</p>
            <p className="text-2xl font-bold">{engineers.length}</p>
            <p className="text-xs text-slate-300">{todayCheckIns.length} present today</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-3">
            <p className="text-xs text-slate-300 mb-1">Clients</p>
            <p className="text-2xl font-bold">{clients.length}</p>
            <p className="text-xs text-slate-300">Active projects</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-3">
            <p className="text-xs text-slate-300 mb-1">Attendance</p>
            <p className="text-2xl font-bold">{attendanceRate}%</p>
            <p className="text-xs text-slate-300">Today's rate</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-3">
            <p className="text-xs text-slate-300 mb-1">Reports</p>
            <p className="text-2xl font-bold">{todayReports.length}</p>
            <p className="text-xs text-slate-300">Submitted today</p>
          </div>
        </div>
      </div>

      <div className="flex border-b border-slate-200 bg-white sticky top-0 z-10 shadow-sm overflow-x-auto scrollbar-hide">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 py-3 px-2 text-sm font-medium transition-colors whitespace-nowrap min-w-[70px] ${
            activeTab === 'overview'
              ? 'text-slate-900 border-b-2 border-slate-900'
              : 'text-slate-600'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('engineers')}
          className={`flex-1 py-3 px-2 text-sm font-medium transition-colors whitespace-nowrap min-w-[70px] ${
            activeTab === 'engineers'
              ? 'text-slate-900 border-b-2 border-slate-900'
              : 'text-slate-600'
          }`}
        >
          Engineers
        </button>
        <button
          onClick={() => setActiveTab('clients')}
          className={`flex-1 py-3 px-2 text-sm font-medium transition-colors whitespace-nowrap min-w-[70px] ${
            activeTab === 'clients'
              ? 'text-slate-900 border-b-2 border-slate-900'
              : 'text-slate-600'
          }`}
        >
          Clients
        </button>
        <button
          onClick={() => setActiveTab('data')}
          className={`flex-1 py-3 px-2 text-sm font-medium transition-colors whitespace-nowrap min-w-[70px] ${
            activeTab === 'data'
              ? 'text-slate-900 border-b-2 border-slate-900'
              : 'text-slate-600'
          }`}
        >
          Data
        </button>
      </div>

      <div className="p-4">
        {activeTab === 'overview' && (
          <OverviewTab
            checkIns={todayCheckIns}
            reports={todayReports}
            engineers={engineers}
            clients={clients}
          />
        )}
        {activeTab === 'engineers' && (
          <EngineersTab engineers={engineers} checkIns={todayCheckIns} />
        )}
        {activeTab === 'clients' && (
          <ClientsTab clients={clients} />
        )}
        {activeTab === 'data' && (
          <DataManagement />
        )}
      </div>
    </div>
  );
}

function OverviewTab({
  checkIns,
  reports,
  engineers,
  clients,
}: {
  checkIns: CheckIn[];
  reports: DailyReport[];
  engineers: Engineer[];
  clients: Client[];
}) {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          Today's Activity
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-green-50 rounded-lg p-3">
            <p className="text-2xl font-bold text-green-900">{checkIns.length}</p>
            <p className="text-xs text-green-700">Check-ins</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-2xl font-bold text-blue-900">{reports.length}</p>
            <p className="text-xs text-blue-700">Reports</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <h3 className="font-semibold text-slate-900 mb-3">System Health</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
            <span className="text-sm text-slate-600">Total Engineers</span>
            <span className="font-medium text-slate-900">{engineers.length}</span>
          </div>
          <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
            <span className="text-sm text-slate-600">Active Clients</span>
            <span className="font-medium text-slate-900">{clients.length}</span>
          </div>
          <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
            <span className="text-sm text-slate-600">Attendance Rate</span>
            <span className="font-medium text-slate-900">
              {engineers.length > 0 ? Math.round((checkIns.length / engineers.length) * 100) : 0}%
            </span>
          </div>
          <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
            <span className="text-sm text-slate-600">Report Submission</span>
            <span className="font-medium text-slate-900">
              {engineers.length > 0 ? Math.round((reports.length / engineers.length) * 100) : 0}%
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          Recent Reports
        </h3>
        {reports.length === 0 ? (
          <p className="text-sm text-slate-500">No reports today</p>
        ) : (
          <div className="space-y-2">
            {reports.slice(0, 5).map((report) => {
              const engineer = engineers.find(e => e.id === report.engineerId);
              return (
                <div key={report.id} className="border-b border-slate-100 pb-2 last:border-0">
                  <p className="text-sm font-medium text-slate-900">{engineer?.name || 'Unknown'}</p>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-1">{report.workDone}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function EngineersTab({
  engineers,
  checkIns,
}: {
  engineers: Engineer[];
  checkIns: CheckIn[];
}) {
  const checkedInIds = new Set(checkIns.map(c => c.engineerId));

  return (
    <div className="space-y-3">
      {engineers.map((engineer) => {
        const isPresent = checkedInIds.has(engineer.id);
        return (
          <div
            key={engineer.id}
            className={`bg-white rounded-xl shadow-sm border-2 p-4 ${
              isPresent ? 'border-green-200' : 'border-slate-200'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="font-semibold text-slate-900">{engineer.name}</p>
                <p className="text-sm text-slate-600">{engineer.email}</p>
                {engineer.phone && (
                  <p className="text-sm text-slate-600">{engineer.phone}</p>
                )}
              </div>
              <div
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  isPresent
                    ? 'bg-green-100 text-green-700'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {isPresent ? 'Present' : 'Absent'}
              </div>
            </div>
          </div>
        );
      })}
      {engineers.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600">No engineers found</p>
        </div>
      )}
    </div>
  );
}

function ClientsTab({ clients }: { clients: Client[] }) {
  return (
    <div className="space-y-3">
      {clients.map((client) => (
        <div key={client.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <p className="font-semibold text-slate-900">{client.name}</p>
          <div className="mt-2 space-y-1">
            <p className="text-sm text-slate-600">{client.email}</p>
            {client.phone && (
              <p className="text-sm text-slate-600">{client.phone}</p>
            )}
          </div>
        </div>
      ))}
      {clients.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600">No clients found</p>
        </div>
      )}
    </div>
  );
}
