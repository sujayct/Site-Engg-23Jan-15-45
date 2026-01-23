import { useState, useEffect } from 'react';
import { Building2, MapPin, FileText, Download, Filter, Calendar, ChevronDown, ChevronUp, Loader, CheckCircle, XCircle } from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import { exportToCSV } from '../../lib/export';

interface ClientWiseEngineer {
  engineerId: string;
  engineerName: string;
  designation: string;
  clientId: string;
  clientName: string;
  siteId: string;
  siteName: string;
  todayCheckedIn: boolean;
  checkInTime?: string;
  checkOutTime?: string;
  lastLocation?: string;
  hasReport: boolean;
  reportWorkDone?: string;
  reportIssues?: string;
}

export default function MobileClientWiseView() {
  const [clientWiseData, setClientWiseData] = useState<ClientWiseEngineer[]>([]);
  const [filteredData, setFilteredData] = useState<ClientWiseEngineer[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [engineers, setEngineers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedClient, setSelectedClient] = useState<string>('all');
  const [selectedEngineer, setSelectedEngineer] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [expandedReport, setExpandedReport] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  useEffect(() => {
    applyFilters();
  }, [selectedClient, selectedEngineer, clientWiseData]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [assignmentsRes, checkInsRes, reportsRes, clientsRes, engineersRes] = await Promise.all([
        apiClient.get('/assignments'),
        apiClient.get(`/check-ins?date=${selectedDate}`),
        apiClient.get(`/reports?date=${selectedDate}`),
        apiClient.get('/clients'),
        apiClient.get('/engineers')
      ]);

      const assignments = assignmentsRes.data || [];
      const checkIns = checkInsRes.data || [];
      const reports = reportsRes.data || [];
      const clientsList = clientsRes.data || [];
      const engineersList = engineersRes.data || [];

      setClients(clientsList);
      setEngineers(engineersList);

      const clientWiseEngineers: ClientWiseEngineer[] = assignments
        .filter((assignment: any) => assignment.is_active)
        .map((assignment: any) => {
          const engineer = engineersList.find((e: any) => e.id === assignment.engineer_id);
          const client = clientsList.find((c: any) => c.id === assignment.client_id);
          const checkIn = checkIns.find((ci: any) => ci.engineer_id === assignment.engineer_id);
          const report = reports.find((r: any) =>
            r.engineer_id === assignment.engineer_id &&
            r.client_id === assignment.client_id
          );

          return {
            engineerId: assignment.engineer_id,
            engineerName: engineer?.full_name || 'Unknown',
            designation: engineer?.designation || 'Engineer',
            clientId: assignment.client_id,
            clientName: client?.name || 'Unknown Client',
            siteId: assignment.site_id,
            siteName: assignment.site_name || 'N/A',
            todayCheckedIn: !!checkIn,
            checkInTime: checkIn?.check_in_time,
            checkOutTime: checkIn?.check_out_time,
            lastLocation: checkIn?.location_name || 'No location',
            hasReport: !!report,
            reportWorkDone: report?.work_done,
            reportIssues: report?.issues
          };
        });

      setClientWiseData(clientWiseEngineers);
      setFilteredData(clientWiseEngineers);
    } catch (error) {
      console.error('Error fetching client-wise data:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...clientWiseData];

    if (selectedClient !== 'all') {
      filtered = filtered.filter(item => item.clientId === selectedClient);
    }

    if (selectedEngineer !== 'all') {
      filtered = filtered.filter(item => item.engineerId === selectedEngineer);
    }

    setFilteredData(filtered);
  };

  const handleExport = () => {
    const exportData = filteredData.map(item => ({
      'Engineer Name': item.engineerName,
      'Designation': item.designation,
      'Client Name': item.clientName,
      'Site Name': item.siteName,
      'Check-in Status': item.todayCheckedIn ? 'Checked In' : 'Not Checked In',
      'Check-in Time': item.checkInTime ? new Date(item.checkInTime).toLocaleTimeString() : '-',
      'Check-out Time': item.checkOutTime ? new Date(item.checkOutTime).toLocaleTimeString() : '-',
      'Last Location': item.lastLocation,
      'Report Status': item.hasReport ? 'Submitted' : 'Pending',
      'Work Done': item.reportWorkDone || '-',
      'Issues': item.reportIssues || '-'
    }));

    const fileName = `client-wise-engineers-${selectedDate}`;
    exportToCSV(exportData, fileName);
  };

  const groupedByClient = filteredData.reduce((acc, item) => {
    if (!acc[item.clientId]) {
      acc[item.clientId] = {
        clientName: item.clientName,
        engineers: []
      };
    }
    acc[item.clientId].engineers.push(item);
    return acc;
  }, {} as Record<string, { clientName: string; engineers: ClientWiseEngineer[] }>);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader className="w-12 h-12 text-emerald-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading client data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium"
        >
          <Filter className="w-4 h-4" />
          Filters
          {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium"
        >
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      {showFilters && (
        <div className="bg-white rounded-lg shadow-md p-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Client
            </label>
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="all">All Clients</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Engineer
            </label>
            <select
              value={selectedEngineer}
              onChange={(e) => setSelectedEngineer(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="all">All Engineers</option>
              {engineers.map(engineer => (
                <option key={engineer.id} value={engineer.id}>
                  {engineer.full_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-emerald-50 rounded-lg p-3">
          <p className="text-xs text-emerald-600 font-medium mb-1">Total Engineers</p>
          <p className="text-2xl font-bold text-emerald-900">{filteredData.length}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-3">
          <p className="text-xs text-green-600 font-medium mb-1">Checked In</p>
          <p className="text-2xl font-bold text-green-900">
            {filteredData.filter(e => e.todayCheckedIn).length}
          </p>
        </div>
        <div className="bg-blue-50 rounded-lg p-3">
          <p className="text-xs text-blue-600 font-medium mb-1">Reports</p>
          <p className="text-2xl font-bold text-blue-900">
            {filteredData.filter(e => e.hasReport).length}
          </p>
        </div>
        <div className="bg-purple-50 rounded-lg p-3">
          <p className="text-xs text-purple-600 font-medium mb-1">Clients</p>
          <p className="text-2xl font-bold text-purple-900">
            {Object.keys(groupedByClient).length}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {Object.entries(groupedByClient).length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <Building2 className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-500">No engineers assigned to clients</p>
          </div>
        ) : (
          Object.entries(groupedByClient).map(([clientId, { clientName, engineers: clientEngineers }]) => (
            <div key={clientId} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 py-3">
                <div className="flex items-center gap-2 text-white mb-1">
                  <Building2 className="w-5 h-5" />
                  <h3 className="font-bold text-lg">{clientName}</h3>
                </div>
                <p className="text-emerald-100 text-sm">
                  {clientEngineers.length} {clientEngineers.length === 1 ? 'Engineer' : 'Engineers'}
                </p>
              </div>

              <div className="divide-y divide-slate-200">
                {clientEngineers.map((engineer, idx) => (
                  <div key={idx} className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900">{engineer.engineerName}</p>
                        <p className="text-sm text-slate-600">{engineer.designation}</p>
                        <p className="text-xs text-slate-500 mt-1">{engineer.siteName}</p>
                      </div>
                      <div className="flex flex-col gap-1 items-end">
                        {engineer.todayCheckedIn ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3" />
                            Checked In
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <XCircle className="w-3 h-3" />
                            Not Checked In
                          </span>
                        )}
                        {engineer.hasReport ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Report Submitted
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Report Pending
                          </span>
                        )}
                      </div>
                    </div>

                    {engineer.todayCheckedIn && (
                      <div className="space-y-1 mb-3">
                        {engineer.checkInTime && (
                          <div className="text-xs text-slate-600">
                            In: {new Date(engineer.checkInTime).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        )}
                        {engineer.checkOutTime && (
                          <div className="text-xs text-slate-600">
                            Out: {new Date(engineer.checkOutTime).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-xs text-slate-600">
                          <MapPin className="w-3 h-3" />
                          {engineer.lastLocation}
                        </div>
                      </div>
                    )}

                    {engineer.hasReport && (
                      <button
                        onClick={() => setExpandedReport(
                          expandedReport === engineer.engineerId ? null : engineer.engineerId
                        )}
                        className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                      >
                        <FileText className="w-4 h-4" />
                        {expandedReport === engineer.engineerId ? 'Hide Report' : 'View Report'}
                      </button>
                    )}

                    {expandedReport === engineer.engineerId && engineer.hasReport && (
                      <div className="mt-3 p-3 bg-slate-50 rounded-lg space-y-2">
                        <div>
                          <h4 className="text-xs font-semibold text-slate-700 mb-1">
                            Work Done:
                          </h4>
                          <p className="text-sm text-slate-600">
                            {engineer.reportWorkDone}
                          </p>
                        </div>
                        {engineer.reportIssues && engineer.reportIssues !== 'None' && (
                          <div>
                            <h4 className="text-xs font-semibold text-red-700 mb-1">
                              Issues:
                            </h4>
                            <p className="text-sm text-red-600">
                              {engineer.reportIssues}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
