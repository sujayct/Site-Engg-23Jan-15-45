import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/authService';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  configError: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [configError, setConfigError] = useState<string | null>(null);

  useEffect(() => {
    authService.getCurrentUser().then(currentUser => {
      setUser(currentUser);
      setLoading(false);
    }).catch((error) => {
      console.error('Error loading user:', error);
      setLoading(false);
    });

    const { data: subscription } = authService.onAuthStateChange((newUser) => {
      setUser(newUser);
    });

    return () => {
      subscription?.subscription?.unsubscribe();
    };
  }, []);

  async function signIn(email: string, password: string) {
    console.log('Attempting login for:', email);
    const { user: authenticatedUser, error } = await authService.signIn(email, password);

    if (error || !authenticatedUser) {
      console.error('Login failed for:', email, 'Error:', error);
      throw new Error(error || 'Invalid email or password');
    }

    console.log('Logged in as:', email, 'Role:', authenticatedUser.role);
    setUser(authenticatedUser);
  }

  async function signOut() {
    const { error } = await authService.signOut();
    if (error) {
      throw new Error(error);
    }
    setUser(null);
  }

  async function resetPassword(_email: string) {
    throw new Error('Password reset is not yet implemented');
  }

  return (
    <AuthContext.Provider value={{ user, loading, configError, signIn, signOut, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
