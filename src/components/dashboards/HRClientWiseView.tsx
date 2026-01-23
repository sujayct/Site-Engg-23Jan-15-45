import React, { useState, useEffect } from 'react';
import { Users, MapPin, FileText, Download, Filter, Calendar } from 'lucide-react';
import { exportToCSV } from '../../lib/export';
import { assignmentService } from '../../services/assignmentService';
import { checkInService } from '../../services/checkInService';
import { reportService } from '../../services/reportService';
import { StorageService } from '../../lib/storage';

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

export default function HRClientWiseView() {
  const [clientWiseData, setClientWiseData] = useState<ClientWiseEngineer[]>([]);
  const [filteredData, setFilteredData] = useState<ClientWiseEngineer[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [engineers, setEngineers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedClient, setSelectedClient] = useState<string>('all');
  const [selectedEngineer, setSelectedEngineer] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [expandedReport, setExpandedReport] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  useEffect(() => {
    applyFilters();
  }, [selectedClient, selectedEngineer, clientWiseData]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [assignments, allCheckIns, allReports, clientsList, engineersList] = await Promise.all([
        assignmentService.getAllAssignments(),
        checkInService.getAllCheckIns(),
        reportService.getAllReports(),
        StorageService.getClients(),
        StorageService.getEngineers()
      ]);

      // Filter check-ins and reports by selected date
      const checkIns = allCheckIns.filter(ci => ci.date === selectedDate);
      const reports = allReports.filter(r => r.date === selectedDate);

      setClients(clientsList);
      setEngineers(engineersList);

      const clientWiseEngineers: ClientWiseEngineer[] = assignments.map((assignment: any) => {
        const checkIn = checkIns.find((ci: any) => ci.engineerId === assignment.engineerId);
        const report = reports.find((r: any) =>
          r.engineerId === assignment.engineerId &&
          r.clientId === assignment.clientId
        );

        return {
          engineerId: assignment.engineerId,
          engineerName: assignment.engineerName || 'Unknown',
          designation: assignment.engineerDesignation || 'Engineer',
          clientId: assignment.clientId,
          clientName: assignment.clientName || 'Unknown Client',
          siteId: assignment.siteId,
          siteName: assignment.siteName || 'N/A',
          todayCheckedIn: !!checkIn,
          checkInTime: checkIn?.checkInTime,
          checkOutTime: checkIn?.checkOutTime,
          lastLocation: checkIn?.locationName || 'No location',
          hasReport: !!report,
          reportWorkDone: report?.workDone,
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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Users className="w-8 h-8 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Client-wise Engineers</h2>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors w-full sm:w-auto justify-center"
        >
          <Download className="w-4 h-4" />
          <span>Export Data</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Client
            </label>
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Engineer
            </label>
            <select
              value={selectedEngineer}
              onChange={(e) => setSelectedEngineer(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Engineers</option>
              {engineers.map(engineer => (
                <option key={engineer.id} value={engineer.id}>
                  {engineer.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>Date</span>
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {Object.entries(groupedByClient).length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No engineers assigned to clients</p>
          </div>
        ) : (
          Object.entries(groupedByClient).map(([clientId, { clientName, engineers: clientEngineers }]) => (
            <div key={clientId} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                <h3 className="text-xl font-bold text-white">{clientName}</h3>
                <p className="text-blue-100 text-sm">
                  {clientEngineers.length} {clientEngineers.length === 1 ? 'Engineer' : 'Engineers'}
                </p>
              </div>

              <div className="overflow-x-auto -mx-6 sm:mx-0">
                <div className="inline-block min-w-full align-middle">
                  <table className="min-w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Engineer
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                          Designation
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                          Site
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Check-in Status
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden xl:table-cell">
                          Location
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Report
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {clientEngineers.map((engineer, idx) => (
                        <React.Fragment key={idx}>
                          <tr className="hover:bg-gray-50 transition-colors">
                            <td className="px-3 sm:px-6 py-4">
                              <div className="text-sm font-medium text-gray-900">
                                {engineer.engineerName}
                              </div>
                              <div className="text-xs text-gray-500 lg:hidden">
                                {engineer.designation}
                              </div>
                            </td>
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                              <div className="text-sm text-gray-700">
                                {engineer.designation}
                              </div>
                            </td>
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden md:table-cell">
                              <div className="text-sm text-gray-700">
                                {engineer.siteName}
                              </div>
                            </td>
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                            {engineer.todayCheckedIn ? (
                              <div className="space-y-1">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Checked In
                                </span>
                                {engineer.checkInTime && (
                                  <div className="text-xs text-gray-500">
                                    In: {new Date(engineer.checkInTime).toLocaleTimeString()}
                                  </div>
                                )}
                                {engineer.checkOutTime && (
                                  <div className="text-xs text-gray-500">
                                    Out: {new Date(engineer.checkOutTime).toLocaleTimeString()}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Not Checked In
                              </span>
                            )}
                            </td>
                            <td className="px-3 sm:px-6 py-4 hidden xl:table-cell">
                              <div className="flex items-center space-x-1 text-sm text-gray-700">
                                <MapPin className="w-4 h-4 text-gray-400" />
                                <span>{engineer.lastLocation}</span>
                              </div>
                            </td>
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                            {engineer.hasReport ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Submitted
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                Pending
                              </span>
                            )}
                            </td>
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm">
                              {engineer.hasReport && (
                                <button
                                  onClick={() => setExpandedReport(
                                    expandedReport === engineer.engineerId ? null : engineer.engineerId
                                  )}
                                  className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                                >
                                  <FileText className="w-4 h-4" />
                                  <span className="hidden sm:inline">View Report</span>
                                </button>
                              )}
                            </td>
                          </tr>
                          {expandedReport === engineer.engineerId && engineer.hasReport && (
                            <tr>
                              <td colSpan={7} className="px-3 sm:px-6 py-4 bg-gray-50">
                              <div className="space-y-3">
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                                    Work Done:
                                  </h4>
                                  <p className="text-sm text-gray-600">
                                    {engineer.reportWorkDone}
                                  </p>
                                </div>
                                {engineer.reportIssues && (
                                  <div>
                                    <h4 className="text-sm font-semibold text-gray-700 mb-2">
                                      Issues:
                                    </h4>
                                    <p className="text-sm text-red-600">
                                      {engineer.reportIssues}
                                    </p>
                                  </div>
                                )}
                              </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-sm text-blue-600 font-medium">Total Engineers</div>
            <div className="text-2xl font-bold text-blue-900">{filteredData.length}</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-sm text-green-600 font-medium">Checked In</div>
            <div className="text-2xl font-bold text-green-900">
              {filteredData.filter(e => e.todayCheckedIn).length}
            </div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="text-sm text-yellow-600 font-medium">Reports Submitted</div>
            <div className="text-2xl font-bold text-yellow-900">
              {filteredData.filter(e => e.hasReport).length}
            </div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-sm text-purple-600 font-medium">Active Clients</div>
            <div className="text-2xl font-bold text-purple-900">
              {Object.keys(groupedByClient).length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
