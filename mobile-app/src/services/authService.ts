import * as SecureStore from 'expo-secure-store';
import { supabase } from '../config/supabase';
import { User } from '../types';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

export const authService = {
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    if (!data.user || !data.session) throw new Error('Login failed');

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle();

    if (userError) throw userError;
    if (!userData) throw new Error('User not found');

    const user: User = {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      role: userData.role,
    };

    const token = data.session.access_token;

    await SecureStore.setItemAsync(TOKEN_KEY, token);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));

    return { user, token };
  },

  async logout(): Promise<void> {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    await supabase.auth.signOut();
  },

  async getStoredAuth(): Promise<{ user: User; token: string } | null> {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      const userJson = await SecureStore.getItemAsync(USER_KEY);

      if (!token || !userJson) return null;

      const user = JSON.parse(userJson);
      return { user, token };
    } catch {
      return null;
    }
  },

  async refreshToken(): Promise<string | null> {
    const { data, error } = await supabase.auth.refreshSession();

    if (error || !data.session) return null;

    const token = data.session.access_token;
    await SecureStore.setItemAsync(TOKEN_KEY, token);

    return token;
  },

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      throw new Error('Not authenticated');
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: sessionData.session.user.email!,
      password: oldPassword,
    });

    if (signInError) {
      throw new Error('Current password is incorrect');
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;
  },

  async requestPasswordReset(email: string): Promise<string> {
    const { data: users, error } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (error) throw error;
    if (!users) throw new Error('No account found with this email address');

    const resetToken = Math.random().toString(36).substring(2, 15) +
                      Math.random().toString(36).substring(2, 15);
    const expiresAt = new Date(Date.now() + 3600000);

    const { error: tokenError } = await supabase
      .from('password_reset_tokens')
      .insert({
        email,
        token: resetToken,
        expires_at: expiresAt.toISOString(),
      });

    if (tokenError) throw tokenError;

    return resetToken;
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const { data: tokenData, error: tokenError } = await supabase
      .from('password_reset_tokens')
      .select('*')
      .eq('token', token)
      .maybeSingle();

    if (tokenError) throw tokenError;
    if (!tokenData) throw new Error('Invalid or expired reset token');

    if (new Date(tokenData.expires_at) < new Date()) {
      throw new Error('Reset token has expired');
    }

    if (tokenData.used) {
      throw new Error('Reset token has already been used');
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', tokenData.email)
      .maybeSingle();

    if (userError) throw userError;
    if (!userData) throw new Error('User not found');

    const { error: updateError } = await supabase.auth.admin.updateUserById(
      userData.id,
      { password: newPassword }
    );

    if (updateError) {
      const { error: directUpdateError } = await supabase
        .from('users')
        .update({ password: newPassword })
        .eq('id', userData.id);

      if (directUpdateError) throw new Error('Failed to update password');
    }

    await supabase
      .from('password_reset_tokens')
      .update({ used: true })
      .eq('token', token);
  },
};
