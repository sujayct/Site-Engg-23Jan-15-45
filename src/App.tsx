import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CompanyBrandingProvider } from './contexts/CompanyBrandingContext';
import Login from './components/Login';
import Header from './components/Header';
import ProfileEditor from './components/ProfileEditor';
import { Monitor, Smartphone } from 'lucide-react';
import EngineerDashboard from './components/dashboards/EngineerDashboard';
import AdminDashboard from './components/dashboards/AdminDashboard';
import HRDashboard from './components/dashboards/HRDashboard';
import ClientDashboard from './components/dashboards/ClientDashboard';
import MobileEngineerDashboard from './components/mobile/MobileEngineerDashboard';
import MobileHRDashboard from './components/mobile/MobileHRDashboard';
import MobileClientDashboard from './components/mobile/MobileClientDashboard';
import MobileAdminDashboard from './components/mobile/MobileAdminDashboard';

function AppContent() {
  const { user, loading, configError } = useAuth();
  const [viewMode, setViewMode] = useState<'web' | 'mobile'>('web');
  const [showProfile, setShowProfile] = useState(false);

  if (configError) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-white flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <div className="mb-4 text-5xl">⚠️</div>
          <h1 className="text-2xl font-bold text-red-900 mb-4">Configuration Error</h1>
          <p className="text-red-700 mb-4">{configError}</p>
          <div className="bg-red-100 border border-red-300 rounded-lg p-4 text-left text-sm text-red-800">
            <p className="font-semibold mb-2">Please contact support or try again later.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const isAdmin = user.role === 'admin';
  const effectiveViewMode = isAdmin ? 'web' : viewMode;

  console.log('Rendering dashboard - Role:', user.role, 'View mode:', effectiveViewMode);

  const renderDashboard = () => {
    if (effectiveViewMode === 'web') {
      switch (user.role) {
        case 'admin':
          return <AdminDashboard />;
        case 'engineer':
          return <EngineerDashboard />;
        case 'hr':
          return <HRDashboard />;
        case 'client':
          return <ClientDashboard />;
        default:
          return null;
      }
    } else {
      switch (user.role) {
        case 'admin':
          return <MobileAdminDashboard />;
        case 'engineer':
          return <MobileEngineerDashboard />;
        case 'hr':
          return <MobileHRDashboard />;
        case 'client':
          return <MobileClientDashboard />;
        default:
          return null;
      }
    }
  };

  return (
    <div className="min-h-screen">
      <Header
        currentRole={user.role}
        userName={user.name}
        onProfileClick={() => setShowProfile(true)}
      />

      {!isAdmin && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="bg-white rounded-full shadow-lg border border-slate-200 p-2 flex gap-2">
            <button
              onClick={() => setViewMode('web')}
              className={`p-3 rounded-full transition-all ${
                viewMode === 'web'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
              title="Web View"
            >
              <Monitor className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('mobile')}
              className={`p-3 rounded-full transition-all ${
                viewMode === 'mobile'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
              title="Mobile View"
            >
              <Smartphone className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {showProfile ? (
        <div className="p-6">
          <ProfileEditor onClose={() => setShowProfile(false)} />
        </div>
      ) : (
        renderDashboard()
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <CompanyBrandingProvider>
        <AppContent />
      </CompanyBrandingProvider>
    </AuthProvider>
  );
}

export default App;
