import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  username: string;
  full_name: string;
  email: string;
  role_id: string;
  status: string;
  roles?: {
    name: string;
    permissions: any[];
  };
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>({
    id: 'demo-user',
    username: 'demo',
    full_name: 'Demo User',
    email: 'demo@example.com',
    role_id: 'admin',
    status: 'active',
    roles: {
      name: 'Administrator',
      permissions: []
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (email: string, password: string): Promise<boolean> => {
    setError(null);
    setIsLoading(true);
    
    try {
      // Simulate login for demo
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setUser({
        id: 'demo-user',
        username: 'demo',
        full_name: 'Demo User',
        email: email,
        role_id: 'admin',
        status: 'active',
        roles: {
          name: 'Administrator',
          permissions: []
        }
      });
      
      return true;
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'An error occurred during login');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setUser(null);
  };

  const value = {
    user,
    isLoading,
    login,
    logout,
    error
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};