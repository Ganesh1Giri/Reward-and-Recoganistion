import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { INITIAL_USERS } from '../api/seedData';

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  switchUser: (userId: string) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'rr_token';
const USER_KEY = 'rr_user';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      const storedUser = localStorage.getItem(USER_KEY);
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error('Failed to load auth from localStorage', e);
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (identifier: string, password: string): Promise<{ success: boolean; message?: string }> => {
    setIsLoading(true);
    try {
      const cleanId = identifier.trim().toLowerCase();
      // Match against stored users or initial users
      const storedUsersRaw = localStorage.getItem('rr_seed_data');
      let usersList: User[] = INITIAL_USERS;
      if (storedUsersRaw) {
        try {
          const parsed = JSON.parse(storedUsersRaw);
          if (Array.isArray(parsed.users)) {
            usersList = parsed.users;
          }
        } catch {
          // fallback
        }
      }

      const foundUser = usersList.find(
        (u) =>
          u.is_active &&
          (u.vcreatek_id.toLowerCase() === cleanId || u.email.toLowerCase() === cleanId)
      );

      if (!foundUser) {
        setIsLoading(false);
        return { success: false, message: 'Invalid VCreaTek ID or Email.' };
      }

      // In production/demo, check password or accept demo default
      if (password !== 'Welcome@123') {
        setIsLoading(false);
        return { success: false, message: 'Invalid password. (For demo use: Welcome@123)' };
      }

      const generatedToken = `jwt_${foundUser.id}_${Date.now()}`;
      localStorage.setItem(TOKEN_KEY, generatedToken);
      localStorage.setItem(USER_KEY, JSON.stringify(foundUser));

      setToken(generatedToken);
      setUser(foundUser);
      setIsLoading(false);
      return { success: true };
    } catch {
      setIsLoading(false);
      return { success: false, message: 'An unexpected error occurred during login.' };
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  };

  const switchUser = (userId: string) => {
    const storedUsersRaw = localStorage.getItem('rr_seed_data');
    let usersList: User[] = INITIAL_USERS;
    if (storedUsersRaw) {
      try {
        const parsed = JSON.parse(storedUsersRaw);
        if (Array.isArray(parsed.users)) {
          usersList = parsed.users;
        }
      } catch {
        // fallback
      }
    }

    const foundUser = usersList.find((u) => u.id === userId);
    if (foundUser) {
      const generatedToken = `jwt_${foundUser.id}_${Date.now()}`;
      localStorage.setItem(TOKEN_KEY, generatedToken);
      localStorage.setItem(USER_KEY, JSON.stringify(foundUser));
      setToken(generatedToken);
      setUser(foundUser);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        logout,
        switchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
