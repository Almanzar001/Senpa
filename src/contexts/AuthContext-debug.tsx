import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AuthContextType {
  user: any | null;
  profile: any | null;
  loading: boolean;
  login: (credentials: any) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  hasPermission: (permission: 'read' | 'write' | 'delete') => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const login = async (credentials: any) => {
    console.log('Login attempt:', credentials);
    // Simular login exitoso
    setUser({ email: credentials.email });
    setProfile({ role_name: 'admin', email: credentials.email });
  };

  const logout = async () => {
    setUser(null);
    setProfile(null);
  };

  const isAdmin = profile?.role_name === 'admin';

  const hasPermission = (permission: 'read' | 'write' | 'delete'): boolean => {
    return true; // Para debug, permitir todo
  };

  const value: AuthContextType = {
    user,
    profile,
    loading,
    login,
    logout,
    isAdmin,
    hasPermission
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};