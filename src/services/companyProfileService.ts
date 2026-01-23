export interface CompanyProfile {
  id: string;
  company_name: string;
  brand_name: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  support_email: string;
  contact_number: string;
  address: string;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
}

export interface CompanyProfileInput {
  company_name: string;
  brand_name: string;
  logo_url?: string | null;
  primary_color: string;
  secondary_color: string;
  support_email: string;
  contact_number: string;
  address: string;
}

class CompanyProfileService {
  async getCompanyProfile(): Promise<CompanyProfile | null> {
    const profiles = JSON.parse(localStorage.getItem('mock_company_profiles') || '[]');
    return profiles.length > 0 ? profiles[0] : null;
  }

  async createCompanyProfile(profile: CompanyProfileInput, userId: string): Promise<CompanyProfile> {
    const newProfile = {
      ...profile,
      id: Math.random().toString(36).substr(2, 9),
      updated_by: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    } as CompanyProfile;
    localStorage.setItem('mock_company_profiles', JSON.stringify([newProfile]));
    window.dispatchEvent(new Event('storage'));
    return newProfile;
  }

  async updateCompanyProfile(id: string, profile: Partial<CompanyProfileInput>, userId: string): Promise<CompanyProfile> {
    const profiles = JSON.parse(localStorage.getItem('mock_company_profiles') || '[]');
    const index = profiles.findIndex((p: any) => p.id === id);
    if (index === -1) throw new Error('Profile not found');
    
    profiles[index] = {
      ...profiles[index],
      ...profile,
      updated_by: userId,
      updated_at: new Date().toISOString()
    };
    localStorage.setItem('mock_company_profiles', JSON.stringify(profiles));
    window.dispatchEvent(new Event('storage'));
    return profiles[index];
  }

  async uploadLogo(_file: File): Promise<string> {
    return 'https://via.placeholder.com/150';
  }

  async deleteLogo(_logoUrl: string): Promise<void> {
    // No-op
  }

  validateLogoFile(file: File): { valid: boolean; error?: string } {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    const maxSize = 5 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Invalid file type. Please upload PNG or JPG images only.',
      };
    }

    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'File size too large. Maximum size is 5MB.',
      };
    }

    return { valid: true };
  }

  isValidHexColor(color: string): boolean {
    return /^#[0-9A-F]{6}$/i.test(color);
  }

  isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}

export const companyProfileService = new CompanyProfileService();
