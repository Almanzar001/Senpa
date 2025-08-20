import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { simpleAuth } from '../services/simpleAuth';

// Definir todos los tipos aquí para evitar problemas de importación circular
export interface User {
  id: string;
  email?: string;
  [key: string]: any;
}

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

  // Función para cargar AuthService dinámicamente
  const getAuthService = async () => {
    const { AuthService } = await import('../services/auth');
    return AuthService;
  };

  useEffect(() => {
    // Verificar usuario al cargar
    const initAuth = async () => {
      try {
        await checkCurrentUser();
      } catch (error) {
        console.warn('Auth initialization failed:', error);
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const checkCurrentUser = async () => {
    try {
      setLoading(true);
      
      // Primero intentar con simpleAuth
      const simpleUser = simpleAuth.getCurrentUser();
      if (simpleUser) {
        setUser({ 
          id: simpleUser.id, 
          email: simpleUser.email 
        });
        setProfile({ 
          id: simpleUser.id,
          email: simpleUser.email,
          full_name: simpleUser.name,
          role_name: simpleUser.role,
          role_description: simpleUser.role,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        return;
      }

      // Fallback al sistema original
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
      
      // Intentar login con simpleAuth primero
      const result = await simpleAuth.login(credentials.email, credentials.password);
      if (result.success && result.user) {
        setUser({ 
          id: result.user.id, 
          email: result.user.email 
        });
        setProfile({ 
          id: result.user.id,
          email: result.user.email,
          full_name: result.user.name,
          role_name: result.user.role,
          role_description: result.user.role,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        return;
      }

      // Fallback al sistema original si simpleAuth falla
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
      
      // Logout de simpleAuth
      simpleAuth.logout();
      
      // Logout del sistema original también
      try {
        const AuthService = await getAuthService();
        await AuthService.logout();
      } catch (error) {
        // Ignore errors from old system
      }
      
      setUser(null);
      setProfile(null);
    } catch (error) {
      console.error('Error en logout:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = profile?.role_name === 'admin' || profile?.role_name === 'superadmin';

  const hasPermission = (permission: 'read' | 'write' | 'delete'): boolean => {
    if (!profile) return false;

    const { role_name } = profile;

    // Superadmin tiene todos los permisos
    if (role_name === 'superadmin') return true;

    switch (permission) {
      case 'read':
        return ['admin', 'viewer', 'user'].includes(role_name);
      case 'write':
      case 'delete':
        return ['admin', 'superadmin'].includes(role_name);
      default:
        return false;
    }
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