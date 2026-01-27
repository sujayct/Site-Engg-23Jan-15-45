import { StorageService } from '../lib/storage';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'engineer' | 'hr' | 'client';
  phone: string | null;
  designation: string | null;
  profile_photo_url: string | null;
  mobile_number: string | null;
  alternate_number: string | null;
  personal_email: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  pincode: string | null;
  date_of_birth: string | null;
  gender: string | null;
  years_of_experience: number | null;
  skills: string | null;
  reporting_manager: string | null;
  linkedin_url: string | null;
  portfolio_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileUpdateInput {
  full_name?: string;
  phone?: string;
  designation?: string;
  profile_photo_url?: string;
  mobile_number?: string;
  alternate_number?: string;
  personal_email?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  date_of_birth?: string;
  gender?: string;
  years_of_experience?: number;
  skills?: string;
  reporting_manager?: string;
  linkedin_url?: string;
  portfolio_url?: string;
}

const PROFILES_STORAGE_KEY = 'user_profiles_json';

function getStoredProfiles(): Record<string, ProfileUpdateInput> {
  try {
    const stored = localStorage.getItem(PROFILES_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveStoredProfiles(profiles: Record<string, ProfileUpdateInput>): void {
  localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(profiles));
}

class ProfileService {
  async getProfile(userId: string): Promise<UserProfile | null> {
    const users = await StorageService.getUsers();
    const user = users.find(u => u.id === userId);
    if (!user) return null;

    const storedProfiles = getStoredProfiles();
    const storedProfile = storedProfiles[userId] || {};

    return {
      id: user.id,
      email: user.email,
      full_name: storedProfile.full_name || user.name,
      role: user.role as any,
      phone: storedProfile.phone || user.phone || null,
      designation: storedProfile.designation || null,
      profile_photo_url: storedProfile.profile_photo_url || null,
      mobile_number: storedProfile.mobile_number || null,
      alternate_number: storedProfile.alternate_number || null,
      personal_email: storedProfile.personal_email || null,
      address_line1: storedProfile.address_line1 || null,
      address_line2: storedProfile.address_line2 || null,
      city: storedProfile.city || null,
      state: storedProfile.state || null,
      country: storedProfile.country || null,
      pincode: storedProfile.pincode || null,
      date_of_birth: storedProfile.date_of_birth || null,
      gender: storedProfile.gender || null,
      years_of_experience: storedProfile.years_of_experience || null,
      skills: storedProfile.skills || null,
      reporting_manager: storedProfile.reporting_manager || null,
      linkedin_url: storedProfile.linkedin_url || null,
      portfolio_url: storedProfile.portfolio_url || null,
      created_at: user.createdAt,
      updated_at: new Date().toISOString(),
    };
  }

  async getMyProfile(): Promise<UserProfile | null> {
    const userJson = localStorage.getItem('auth_user');
    if (!userJson) return null;
    return this.getProfile(JSON.parse(userJson).id);
  }

  async getAllEngineers(): Promise<UserProfile[]> {
    const users = await StorageService.getUsers();
    const storedProfiles = getStoredProfiles();
    
    return users.filter(u => u.role === 'engineer').map(u => {
      const storedProfile = storedProfiles[u.id] || {};
      return {
        id: u.id,
        email: u.email,
        full_name: storedProfile.full_name || u.name,
        role: u.role as any,
        phone: storedProfile.phone || u.phone || null,
        designation: storedProfile.designation || null,
        profile_photo_url: storedProfile.profile_photo_url || null,
        mobile_number: storedProfile.mobile_number || null,
        alternate_number: storedProfile.alternate_number || null,
        personal_email: storedProfile.personal_email || null,
        address_line1: storedProfile.address_line1 || null,
        address_line2: storedProfile.address_line2 || null,
        city: storedProfile.city || null,
        state: storedProfile.state || null,
        country: storedProfile.country || null,
        pincode: storedProfile.pincode || null,
        date_of_birth: storedProfile.date_of_birth || null,
        gender: storedProfile.gender || null,
        years_of_experience: storedProfile.years_of_experience || null,
        skills: storedProfile.skills || null,
        reporting_manager: storedProfile.reporting_manager || null,
        linkedin_url: storedProfile.linkedin_url || null,
        portfolio_url: storedProfile.portfolio_url || null,
        created_at: u.createdAt,
        updated_at: new Date().toISOString(),
      };
    });
  }

  async updateProfile(userId: string, updates: ProfileUpdateInput): Promise<UserProfile> {
    const storedProfiles = getStoredProfiles();
    
    storedProfiles[userId] = {
      ...storedProfiles[userId],
      ...updates,
    };
    
    saveStoredProfiles(storedProfiles);
    
    window.dispatchEvent(new Event('storage'));
    
    const profile = await this.getProfile(userId);
    if (!profile) throw new Error('Profile not found');
    return profile;
  }

  async updateMyProfile(updates: ProfileUpdateInput): Promise<UserProfile> {
    const profile = await this.getMyProfile();
    if (!profile) throw new Error('Not authenticated');
    return this.updateProfile(profile.id, updates);
  }

  async getManagersList(): Promise<{ id: string; name: string }[]> {
    const users = await StorageService.getUsers();
    return users.filter(u => u.role === 'admin' || u.role === 'hr').map(u => ({ id: u.id, name: u.name }));
  }

  async uploadProfilePhoto(file: File, userId: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        const storedProfiles = getStoredProfiles();
        storedProfiles[userId] = {
          ...storedProfiles[userId],
          profile_photo_url: base64,
        };
        saveStoredProfiles(storedProfiles);
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async deleteProfilePhoto(photoUrl: string): Promise<void> {
  }

  validateProfilePhoto(file: File): { valid: boolean; error?: string } {
    const maxSize = 2 * 1024 * 1024;
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Only PNG and JPG images are allowed' };
    }
    
    if (file.size > maxSize) {
      return { valid: false, error: 'Image must be less than 2MB' };
    }
    
    return { valid: true };
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  isValidURL(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  exportProfilesAsJson(): string {
    const storedProfiles = getStoredProfiles();
    return JSON.stringify(storedProfiles, null, 2);
  }

  importProfilesFromJson(jsonString: string): void {
    try {
      const profiles = JSON.parse(jsonString);
      saveStoredProfiles(profiles);
    } catch (error) {
      throw new Error('Invalid JSON format');
    }
  }
}

export const profileService = new ProfileService();
