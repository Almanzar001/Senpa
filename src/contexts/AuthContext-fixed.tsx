import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

// Definir nuestro propio tipo de User para evitar problemas de importación
export interface User {
  id: string;
  email?: string;
  [key: string]: any;
}

// Importar solo los tipos para evitar problemas de inicialización
export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  role_name: string;
  role_description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  hasPermission: (permission: 'read' | 'write' | 'delete') => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false); // Cambiar a false inicialmente

  // Función lazy para importar AuthService solo cuando se necesite
  const getAuthService = async () => {
    const { AuthService } = await import('../services/auth');
    return AuthService;
  };

  const checkCurrentUser = async () => {
    try {
      setLoading(true);
      const AuthService = await getAuthService();
      const current = await AuthService.getCurrentUser();
      setUser(current?.user || null);
      setProfile(current?.profile || null);
    } catch (error) {
      // Solo logear errores reales, no ausencia de sesión
      if (!error?.message?.includes('Auth session missing')) {
        console.error('Error verificando usuario actual:', error);
      }
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      setLoading(true);
      const AuthService = await getAuthService();
      const { user, profile } = await AuthService.login(credentials);
      setUser(user);
      setProfile(profile);
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      const AuthService = await getAuthService();
      await AuthService.logout();
      setUser(null);
      setProfile(null);
    } catch (error) {
      console.error('Error en logout:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = profile?.role_name === 'admin';

  const hasPermission = (permission: 'read' | 'write' | 'delete'): boolean => {
    if (!profile) return false;

    const { role_name } = profile;

    switch (permission) {
      case 'read':
        return ['admin', 'viewer'].includes(role_name);
      case 'write':
      case 'delete':
        return role_name === 'admin';
      default:
        return false;
    }
  };

  // Usar useEffect con dependencias controladas
  useEffect(() => {
    // Solo verificar usuario si no hay errores de configuración
    const initAuth = async () => {
      try {
        await checkCurrentUser();
      } catch (error) {
        console.warn('Auth initialization failed:', error);
        setLoading(false);
      }
    };

    initAuth();
  }, []); // Solo ejecutar una vez al montar

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