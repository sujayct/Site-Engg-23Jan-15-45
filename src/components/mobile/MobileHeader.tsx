import { Building2 } from 'lucide-react';
import { useCompanyBranding } from '../../contexts/CompanyBrandingContext';

interface MobileHeaderProps {
  userName: string;
  userRole?: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export default function MobileHeader({ userName, userRole, subtitle, children }: MobileHeaderProps) {
  const { branding } = useCompanyBranding();

  const primaryColor = branding?.primary_color || '#2563eb';
  const secondaryColor = branding?.secondary_color || '#1e40af';
  const brandName = branding?.brand_name || 'Site Engineer';
  const logoUrl = branding?.logo_url;

  return (
    <div
      className="text-white px-4 py-6 shadow-lg"
      style={{
        background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <img src={logoUrl} alt={brandName} className="h-10 object-contain bg-white/90 rounded px-2 py-1" />
          ) : (
            <div className="bg-white/90 p-2 rounded">
              <Building2 className="w-6 h-6" style={{ color: primaryColor }} />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold">Hello, {userName.split(' ')[0]}</h1>
            {userRole && (
              <p className="text-white/80 text-xs mt-0.5 capitalize">{userRole}</p>
            )}
          </div>
        </div>
        {children}
      </div>

      {subtitle && (
        <p className="text-white/80 text-sm">
          {subtitle}
        </p>
      )}
    </div>
  );
}
