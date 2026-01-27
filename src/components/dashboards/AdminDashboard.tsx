import { useState, useEffect } from 'react';
import { Users, Building2, UserCog, Activity, Plus, UserPlus, X, Shield, Settings, TrendingUp } from 'lucide-react';
import { User, Client, Assignment } from '../../types';
import { StorageService } from '../../lib/storage';
import CompanyProfile from '../CompanyProfile';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'clients' | 'assignments' | 'company-profile' | 'settings'>('overview');
  const [users, setUsers] = useState<User[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [engineers, setEngineers] = useState<User[]>([]);
  const [stats, setStats] = useState({ totalEngineers: 0, totalClients: 0, activeAssignments: 0, todayCheckIns: 0 });
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [userRole, setUserRole] = useState<'engineer' | 'hr' | 'admin'>('engineer');
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '' });
  const [clientFormData, setClientFormData] = useState({ name: '', contactPerson: '', email: '', phone: '' });
  const [assignFormData, setAssignFormData] = useState({ engineerId: '', clientId: '' });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  async function loadData() {
    try {
      const [allUsers, allClients, allAssignments, allCheckIns] = await Promise.all([
        StorageService.getUsers(),
        StorageService.getClients(),
        StorageService.getAssignments(),
        StorageService.getCheckIns()
      ]);

      const activeAssignments = allAssignments.filter(a => a.status === 'active');
      const allEngineers = allUsers.filter(u => u.role === 'engineer');

      const today = new Date().toISOString().split('T')[0];
      const todayCheckIns = allCheckIns.filter(c => c.date === today);

      setUsers(allUsers);
      setClients(allClients);
      setAssignments(activeAssignments);
      setEngineers(allEngineers);
      setStats({
        totalEngineers: allEngineers.length,
        totalClients: allClients.length,
        activeAssignments: activeAssignments.length,
        todayCheckIns: todayCheckIns.length
      });
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }

  async function handleAddUser() {
    try {
      await StorageService.addUser({
        id: Math.random().toString(36).substr(2, 9),
        email: formData.email,
        name: formData.name,
        role: userRole,
        phone: formData.phone,
        createdAt: new Date().toISOString()
      });

      setMessage({ type: 'success', text: `${userRole.toUpperCase()} added successfully!` });
      setShowAddUserModal(false);
      setFormData({ name: '', email: '', phone: '', password: '' });
      await loadData();
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to add user' });
      setTimeout(() => setMessage(null), 3000);
    }
  }

  async function handleAddClient() {
    try {
      await StorageService.createClient({
        name: clientFormData.name,
        contactPerson: clientFormData.contactPerson,
        email: clientFormData.email,
        phone: clientFormData.phone,
        userId: ''
      });

      setMessage({ type: 'success', text: 'Client added successfully!' });
      setShowAddClientModal(false);
      setClientFormData({ name: '', contactPerson: '', email: '', phone: '' });
      await loadData();
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to add client' });
      setTimeout(() => setMessage(null), 3000);
    }
  }

  async function handleAssignEngineer() {
    try {
      await StorageService.createAssignment({
        engineerId: assignFormData.engineerId,
        clientId: assignFormData.clientId,
        assignedDate: new Date().toISOString().split('T')[0],
        status: 'active',
        siteId: ''
      });

      setMessage({ type: 'success', text: 'Engineer assigned successfully!' });
      setShowAssignModal(false);
      setAssignFormData({ engineerId: '', clientId: '' });
      await loadData();
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to assign engineer' });
      setTimeout(() => setMessage(null), 3000);
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'clients', label: 'Clients', icon: Building2 },
    { id: 'assignments', label: 'Assignments', icon: UserCog },
    { id: 'company-profile', label: 'Company', icon: Shield },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="bg-gradient-to-r from-red-600 via-red-500 to-rose-500 text-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-red-100 mt-1">System Management & Configuration</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 -mt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard icon={Users} label="Total Engineers" value={stats.totalEngineers} color="blue" />
          <StatCard icon={Building2} label="Total Clients" value={stats.totalClients} color="green" />
          <StatCard icon={UserCog} label="Active Assignments" value={stats.activeAssignments} color="orange" />
          <StatCard icon={TrendingUp} label="Today's Check-ins" value={stats.todayCheckIns} color="purple" />
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-xl flex items-center gap-2 shadow-sm ${message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
            <span className="text-sm font-medium">{message.text}</span>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
            <nav className="flex space-x-1 px-4 overflow-x-auto">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-4 flex items-center gap-2 border-b-2 font-medium text-sm transition-all whitespace-nowrap ${activeTab === tab.id
                    ? 'border-red-500 text-red-600 bg-red-50/50'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-6">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                  <button
                    onClick={() => { setUserRole('engineer'); setShowAddUserModal(true); }}
                    className="flex items-center gap-3 p-4 border-2 border-blue-200 rounded-xl hover:bg-blue-50 hover:border-blue-300 transition-all text-left group"
                  >
                    <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                      <UserPlus className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">Add Engineer</p>
                      <p className="text-xs text-slate-600">Create new engineer account</p>
                    </div>
                  </button>
                  <button
                    onClick={() => { setUserRole('hr'); setShowAddUserModal(true); }}
                    className="flex items-center gap-3 p-4 border-2 border-green-200 rounded-xl hover:bg-green-50 hover:border-green-300 transition-all text-left group"
                  >
                    <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                      <UserPlus className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">Add HR</p>
                      <p className="text-xs text-slate-600">Create new HR account</p>
                    </div>
                  </button>
                  <button
                    onClick={() => setShowAddClientModal(true)}
                    className="flex items-center gap-3 p-4 border-2 border-orange-200 rounded-xl hover:bg-orange-50 hover:border-orange-300 transition-all text-left group"
                  >
                    <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
                      <Building2 className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">Add Client</p>
                      <p className="text-xs text-slate-600">Create new client</p>
                    </div>
                  </button>
                  <button
                    onClick={() => setShowAssignModal(true)}
                    className="flex items-center gap-3 p-4 border-2 border-purple-200 rounded-xl hover:bg-purple-50 hover:border-purple-300 transition-all text-left group"
                  >
                    <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                      <UserCog className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">Assign Engineer</p>
                      <p className="text-xs text-slate-600">Assign engineer to client</p>
                    </div>
                  </button>
                  <button
                    onClick={() => { setUserRole('admin'); setShowAddUserModal(true); }}
                    className="flex items-center gap-3 p-4 border-2 border-red-200 rounded-xl hover:bg-red-50 hover:border-red-300 transition-all text-left group"
                  >
                    <div className="p-2 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors">
                      <UserPlus className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">Add Admin</p>
                      <p className="text-xs text-slate-600">Create new admin account</p>
                    </div>
                  </button>
                </div>
                <div className="text-center py-8 border-t border-slate-200">
                  <Activity className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                  <h3 className="text-base font-medium text-slate-900 mb-1">System Overview</h3>
                  <p className="text-sm text-slate-600">Use quick actions above or navigate through tabs to manage system</p>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-bold text-slate-900">User Management</h2>
                  <button
                    onClick={() => { setUserRole('engineer'); setShowAddUserModal(true); }}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-md"
                  >
                    <Plus className="w-4 h-4" />
                    Add User
                  </button>
                </div>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Name</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Email</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Role</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Phone</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {users.map(user => (
                        <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 text-sm font-medium text-slate-900">{user.name}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{user.email}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.role === 'admin' ? 'bg-red-100 text-red-700' :
                              user.role === 'engineer' ? 'bg-blue-100 text-blue-700' :
                                user.role === 'hr' ? 'bg-green-100 text-green-700' :
                                  'bg-orange-100 text-orange-700'
                              }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">{user.phone || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'clients' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-bold text-slate-900">Client Management</h2>
                  <button
                    onClick={() => setShowAddClientModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-xl hover:from-orange-700 hover:to-orange-800 transition-all shadow-md"
                  >
                    <Plus className="w-4 h-4" />
                    Add Client
                  </button>
                </div>
                <div className="grid gap-4">
                  {clients.map(client => (
                    <div key={client.id} className="border border-slate-200 rounded-xl p-4 hover:border-orange-300 hover:shadow-md transition-all bg-gradient-to-r from-white to-slate-50">
                      <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-orange-600" />
                        {client.name}
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                        <div>
                          <span className="text-slate-500">Email:</span>
                          <span className="ml-2 text-slate-900">{client.email}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Phone:</span>
                          <span className="ml-2 text-slate-900">{client.phone || '-'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Contact:</span>
                          <span className="ml-2 text-slate-900">{client.contactPerson || '-'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'assignments' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-bold text-slate-900">Engineer Assignments</h2>
                  <button
                    onClick={() => setShowAssignModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all shadow-md"
                  >
                    <Plus className="w-4 h-4" />
                    Assign Engineer
                  </button>
                </div>
                <div className="space-y-4">
                  {assignments.map(assignment => {
                    const engineer = engineers.find(e => e.id === assignment.engineerId);
                    const client = clients.find(c => c.id === assignment.clientId);
                    return (
                      <div key={assignment.id} className="border border-slate-200 rounded-xl p-4 flex justify-between items-center hover:border-purple-300 hover:shadow-md transition-all bg-gradient-to-r from-white to-slate-50">
                        <div>
                          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                            <Users className="w-4 h-4 text-blue-600" />
                            {engineer?.name || 'Unknown Engineer'}
                          </h3>
                          <p className="text-sm text-slate-600 flex items-center gap-2 mt-1">
                            <Building2 className="w-3 h-3" />
                            Assigned to: {client?.name || 'Unknown Client'}
                          </p>
                        </div>
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                          Active
                        </span>
                      </div>
                    );
                  })}
                  {assignments.length === 0 && (
                    <p className="text-center py-8 text-slate-500">No active assignments</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'company-profile' && (
              <CompanyProfile />
            )}

            {activeTab === 'settings' && (
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-6">System Settings</h2>
                <div className="space-y-4">
                  <div className="p-4 border border-slate-200 rounded-xl bg-gradient-to-r from-white to-slate-50">
                    <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                      <Settings className="w-4 h-4 text-slate-600" />
                      System Information
                    </h3>
                    <div className="space-y-2 text-sm text-slate-600">
                      <p>Version: 1.0.0</p>
                      <p>Environment: Development</p>
                      <p>Database: PostgreSQL</p>
                    </div>
                  </div>
                  <div className="p-4 border border-slate-200 rounded-xl bg-gradient-to-r from-white to-slate-50">
                    <h3 className="font-semibold text-slate-900 mb-2">Admin Actions</h3>
                    <p className="text-sm text-slate-600 mb-4">Manage system-wide configurations and settings</p>
                    <div className="flex gap-3">
                      <button className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium">
                        View Logs
                      </button>
                      <button className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium">
                        System Reports
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showAddUserModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Add {userRole.toUpperCase()}</h2>
              <button onClick={() => setShowAddUserModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="+1234567890"
                />
              </div>
              <button
                onClick={handleAddUser}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-xl font-medium hover:from-blue-700 hover:to-blue-800 transition-all shadow-md"
              >
                Add {userRole.toUpperCase()}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddClientModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Add Client</h2>
              <button onClick={() => setShowAddClientModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Client Name</label>
                <input
                  type="text"
                  value={clientFormData.name}
                  onChange={(e) => setClientFormData({ ...clientFormData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  placeholder="Client Name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Contact Person</label>
                <input
                  type="text"
                  value={clientFormData.contactPerson}
                  onChange={(e) => setClientFormData({ ...clientFormData, contactPerson: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                <input
                  type="email"
                  value={clientFormData.email}
                  onChange={(e) => setClientFormData({ ...clientFormData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  placeholder="contact@client.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
                <input
                  type="tel"
                  value={clientFormData.phone}
                  onChange={(e) => setClientFormData({ ...clientFormData, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  placeholder="+1234567890"
                />
              </div>
              <button
                onClick={handleAddClient}
                className="w-full bg-gradient-to-r from-orange-600 to-orange-700 text-white py-3 rounded-xl font-medium hover:from-orange-700 hover:to-orange-800 transition-all shadow-md"
              >
                Add Client
              </button>
            </div>
          </div>
        </div>
      )}

      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Assign Engineer</h2>
              <button onClick={() => setShowAssignModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Select Engineer</label>
                <select
                  value={assignFormData.engineerId}
                  onChange={(e) => setAssignFormData({ ...assignFormData, engineerId: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                >
                  <option value="">Choose an engineer...</option>
                  {engineers.map(eng => (
                    <option key={eng.id} value={eng.id}>{eng.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Select Client</label>
                <select
                  value={assignFormData.clientId}
                  onChange={(e) => setAssignFormData({ ...assignFormData, clientId: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                >
                  <option value="">Choose a client...</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>{client.name}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleAssignEngineer}
                disabled={!assignFormData.engineerId || !assignFormData.clientId}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 rounded-xl font-medium hover:from-purple-700 hover:to-purple-800 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Assign Engineer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: 'blue' | 'green' | 'orange' | 'purple' }) {
  const colors = {
    blue: 'from-blue-500 to-blue-600 bg-blue-100 text-blue-600',
    green: 'from-green-500 to-green-600 bg-green-100 text-green-600',
    orange: 'from-orange-500 to-orange-600 bg-orange-100 text-orange-600',
    purple: 'from-purple-500 to-purple-600 bg-purple-100 text-purple-600'
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-shadow">
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-lg ${colors[color].split(' ').slice(2).join(' ')}`}>
          <Icon className="w-5 h-5" />
        </div>
        <h3 className="font-semibold text-slate-700">{label}</h3>
      </div>
      <p className="text-3xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
