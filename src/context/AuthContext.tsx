import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { DEMO_USERS } from '../services/demoUsers';

interface AuthContextType {
  user: User | null;
  pendingUser: User | null;
  isAuthenticated: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; requiresOtp?: boolean; error?: string }>;
  selectDemoUser: (role: UserRole) => void;
  verifyOtp: (code: string) => Promise<{ success: boolean; error?: string }>;
  switchRole: (role: UserRole) => void;
  logout: () => void;
  hasRole: (allowedRoles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default to Employee (Priya Sharma) for an immediate rich prototype experience
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('itsupport_demo_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return DEMO_USERS[0];
      }
    }
    return DEMO_USERS[0];
  });

  const [pendingUser, setPendingUser] = useState<User | null>(null);

  useEffect(() => {
    if (user) {
      localStorage.setItem('itsupport_demo_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('itsupport_demo_user');
    }
  }, [user]);

  const selectDemoUser = (role: UserRole) => {
    const matched = DEMO_USERS.find(u => u.role === role) || DEMO_USERS[0];
    setPendingUser(matched);
  };

  const login = async (email: string, _password?: string) => {
    const matched = DEMO_USERS.find(u => u.email.toLowerCase() === email.toLowerCase()) || {
      id: `usr-${Date.now()}`,
      name: email.split('@')[0],
      email,
      role: 'employee' as UserRole,
      departmentId: 1,
      departmentName: 'Corporate IT',
      title: 'Business User'
    };
    setPendingUser(matched);
    return { success: true, requiresOtp: true };
  };

  const verifyOtp = async (code: string) => {
    // Governed deterministic demo code: 123456
    if (code === '123456') {
      if (pendingUser) {
        setUser(pendingUser);
        setPendingUser(null);
        return { success: true };
      }
      return { success: false, error: 'No authentication session found. Please sign in again.' };
    }
    return { success: false, error: 'Invalid verification code. Please enter 123456 for the demo environment.' };
  };

  const switchRole = (role: UserRole) => {
    const matched = DEMO_USERS.find(u => u.role === role);
    if (matched) {
      setUser(matched);
    }
  };

  const logout = () => {
    setUser(null);
    setPendingUser(null);
    localStorage.removeItem('itsupport_demo_user');
  };

  const hasRole = (allowedRoles: UserRole[]) => {
    if (!user) return false;
    return allowedRoles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        pendingUser,
        isAuthenticated: !!user,
        login,
        selectDemoUser,
        verifyOtp,
        switchRole,
        logout,
        hasRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
