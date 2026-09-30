import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Role } from '../types';

export interface User {
  id?: number;
  username: string;
  role: Role;
  synthetic_client_id?: string;
  display_name?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  role: Role | null;
  username: string | null;
  syntheticClientId: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  switchRolePreview: (newRole: Role) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('access_token') || localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('user_info');
    if (!savedUser) return null;
    try {
      return JSON.parse(savedUser);
    } catch {
      return null;
    }
  });

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('access_token', newToken);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user_info', JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('token');
    localStorage.removeItem('user_info');
  };

  const switchRolePreview = (newRole: Role) => {
    if (user) {
      const updatedUser = { ...user, role: newRole };
      setUser(updatedUser);
      localStorage.setItem('user_info', JSON.stringify(updatedUser));
    }
  };

  const value = {
    user,
    token,
    role: (user?.role as Role) || null,
    username: user?.username || null,
    syntheticClientId: user?.synthetic_client_id || null,
    isAuthenticated: !!token && !!user,
    login,
    logout,
    switchRolePreview,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
