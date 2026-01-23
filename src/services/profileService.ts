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

class ProfileService {
  async getProfile(userId: string): Promise<UserProfile | null> {
    const users = await StorageService.getUsers();
    const user = users.find(u => u.id === userId);
    if (!user) return null;
    return {
      ...user,
      full_name: user.name,
      role: user.role as any,
      phone: user.phone || null,
      designation: null,
      profile_photo_url: null,
      mobile_number: null,
      alternate_number: null,
      personal_email: null,
      address_line1: null,
      address_line2: null,
      city: null,
      state: null,
      country: null,
      pincode: null,
      date_of_birth: null,
      gender: null,
      years_of_experience: null,
      skills: null,
      reporting_manager: null,
      linkedin_url: null,
      portfolio_url: null,
      created_at: user.createdAt,
      updated_at: user.createdAt,
    } as unknown as UserProfile;
  }

  async getMyProfile(): Promise<UserProfile | null> {
    const userJson = localStorage.getItem('auth_user');
    if (!userJson) return null;
    return this.getProfile(JSON.parse(userJson).id);
  }

  async getAllEngineers(): Promise<UserProfile[]> {
    const users = await StorageService.getUsers();
    return users.filter(u => u.role === 'engineer').map(u => ({
      ...u,
      full_name: u.name,
      role: u.role as any,
      phone: u.phone || null,
      designation: null,
      profile_photo_url: null,
      mobile_number: null,
      alternate_number: null,
      personal_email: null,
      address_line1: null,
      address_line2: null,
      city: null,
      state: null,
      country: null,
      pincode: null,
      date_of_birth: null,
      gender: null,
      years_of_experience: null,
      skills: null,
      reporting_manager: null,
      linkedin_url: null,
      portfolio_url: null,
      created_at: u.createdAt,
      updated_at: u.createdAt,
    })) as unknown as UserProfile[];
  }

  async updateProfile(userId: string, updates: ProfileUpdateInput): Promise<UserProfile> {
    const users = await StorageService.getUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index === -1) throw new Error('Profile not found');
    
    users[index] = { ...users[index], ...(updates as any) };
    localStorage.setItem('mock_users', JSON.stringify(users));
    window.dispatchEvent(new Event('storage'));
    
    return (await this.getProfile(userId)) as UserProfile;
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
}

export const profileService = new ProfileService();
