import { useAuth } from '../contexts/AuthContext';
import { useCompanyBranding } from '../contexts/CompanyBrandingContext';
import { LogOut, User, Building2 } from 'lucide-react';

interface HeaderProps {
  currentRole: string;
  userName: string;
  onProfileClick?: () => void;
}

export default function Header({ currentRole, userName, onProfileClick }: HeaderProps) {
  const { signOut } = useAuth();
  const { branding } = useCompanyBranding();

  function handleSignOut() {
    signOut();
  }

  const normalizedRole = currentRole.toLowerCase().trim();
  console.log('Rendering menu for role:', normalizedRole);

  const roleColors = {
    admin: 'from-blue-500 to-blue-600',
    engineer: 'from-green-500 to-green-600',
    hr: 'from-purple-500 to-purple-600',
    client: 'from-orange-500 to-orange-600',
  };

  const roleColor = roleColors[normalizedRole as keyof typeof roleColors] || 'from-blue-500 to-blue-600';

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-6">
            {branding?.logo_url ? (
              <div className="flex items-center gap-3">
                <img src={branding.logo_url} alt={branding.brand_name} className="h-10 w-auto object-contain" />
                <span
                  className="text-lg font-bold"
                  style={{ color: branding?.primary_color || '#0f172a' }}
                >
                  {branding?.brand_name || 'Site Engineer'}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{
                    background: branding
                      ? `linear-gradient(to bottom right, ${branding.primary_color}, ${branding.secondary_color})`
                      : 'linear-gradient(to bottom right, #3b82f6, #2563eb)',
                  }}
                >
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <span
                  className="text-lg font-bold"
                  style={{ color: branding?.primary_color || '#0f172a' }}
                >
                  {branding?.brand_name || 'Site Engineer'}
                </span>
              </div>
            )}
            <div className="h-8 w-px bg-slate-300" />
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-lg`}
                style={{
                  background: branding
                    ? `linear-gradient(to bottom right, ${branding.primary_color}, ${branding.secondary_color})`
                    : 'linear-gradient(to bottom right, #3b82f6, #2563eb)',
                }}
              >
                <User className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 leading-none mb-1">{userName}</h2>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{normalizedRole}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onProfileClick && (
              <button
                onClick={onProfileClick}
                className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <User className="w-4 h-4" />
                <span className="text-sm font-medium">My Profile</span>
              </button>
            )}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
