import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, getCurrentSession, login, logout, register, initMockUsers } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (username: string, password?: string) => Promise<void>;
  signUp: (username: string, password?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSession() {
      await initMockUsers();
      const sessionUser = await getCurrentSession();
      setUser(sessionUser);
      setIsLoading(false);
    }
    loadSession();
  }, []);

  const signIn = async (username: string, password?: string) => {
    const sessionUser = await login(username, password);
    setUser(sessionUser);
  };

  const signUp = async (username: string, password?: string) => {
    const newUser = await register(username, password);
    await login(username, password); // Auto-login after register
    setUser(newUser);
  };

  const signOut = async () => {
    await logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
