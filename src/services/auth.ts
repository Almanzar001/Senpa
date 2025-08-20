import { simpleAuth, type AuthResult } from './simpleAuth';
import type { UserProfile, LoginCredentials, User } from '../contexts/AuthContext';

export class AuthService {
  // Login del usuario usando autenticación simple
  static async login(credentials: LoginCredentials) {
    try {
      console.log('🟦 Llamando login...');
      
      const result: AuthResult = await simpleAuth.login(
        credentials.email, 
        credentials.password
      );

      if (!result.success) {
        throw new Error(result.error || 'Error de autenticación');
      }

      // Convertir el usuario simple al formato esperado
      const user = result.user;
      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      // Crear un perfil compatible con el sistema existente
      const profile: UserProfile = {
        id: user.id,
        email: user.email,
        full_name: user.name,
        role_name: user.role,
        is_active: true,
        created_at: new Date().toISOString()
      };

      // Crear una sesión mock compatible
      const mockSession = {
        access_token: simpleAuth.getAuthToken() || '',
        refresh_token: '',
        expires_in: 3600,
        token_type: 'bearer',
        user: {
          id: user.id,
          email: user.email,
          app_metadata: {},
          user_metadata: { name: user.name },
          aud: 'authenticated',
          created_at: new Date().toISOString()
        }
      };

      return {
        user: mockSession.user,
        profile,
        session: mockSession
      };
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  }

  // Logout del usuario
  static async logout() {
    try {
      simpleAuth.logout();
    } catch (error) {
      console.error('Error en logout:', error);
      throw error;
    }
  }

  // Obtener usuario actual
  static async getCurrentUser() {
    try {
      const currentUser = simpleAuth.getCurrentUser();
      
      if (!currentUser) {
        return null;
      }

      // Crear un perfil compatible
      const profile: UserProfile = {
        id: currentUser.id,
        email: currentUser.email,
        full_name: currentUser.name,
        role_name: currentUser.role,
        is_active: true,
        created_at: new Date().toISOString()
      };

      // Crear usuario mock compatible
      const mockUser = {
        id: currentUser.id,
        email: currentUser.email,
        app_metadata: {},
        user_metadata: { name: currentUser.name },
        aud: 'authenticated',
        created_at: new Date().toISOString()
      };
      
      return {
        user: mockUser,
        profile
      };
    } catch (error) {
      console.error('Error obteniendo usuario actual:', error);
      return null;
    }
  }

  // Obtener perfil del usuario con rol
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .rpc('get_user_profile', { user_id: userId });

      if (error) {
        console.error('Error obteniendo perfil:', error);
        return null;
      }

      return data && data.length > 0 ? data[0] : null;
    } catch (error) {
      console.error('Error en getUserProfile:', error);
      return null;
    }
  }

  // Verificar si el usuario tiene permisos de admin
  static async isAdmin(userId?: string): Promise<boolean> {
    try {
      return simpleAuth.hasRole('admin');
    } catch (error) {
      console.error('Error verificando admin:', error);
      return false;
    }
  }

  // Verificar permisos del usuario
  static async hasPermission(permission: 'read' | 'write' | 'delete'): Promise<boolean> {
    try {
      if (!simpleAuth.isAuthenticated()) return false;

      const currentUser = simpleAuth.getCurrentUser();
      if (!currentUser) return false;

      switch (permission) {
        case 'read':
          return ['admin', 'user'].includes(currentUser.role);
        case 'write':
        case 'delete':
          return currentUser.role === 'admin';
        default:
          return false;
      }
    } catch (error) {
      console.error('Error verificando permisos:', error);
      return false;
    }
  }

  // Escuchar cambios en la autenticación
  static onAuthStateChange(callback: (user: User | null, profile: UserProfile | null) => void) {
    // Para el sistema simple, verificamos el estado inicial
    const checkAuthState = () => {
      const current = this.getCurrentUser();
      current.then(result => {
        if (result) {
          callback(result.user as User, result.profile);
        } else {
          callback(null, null);
        }
      });
    };

    // Verificar estado inicial
    checkAuthState();

    // Retornar una función de limpieza (mock)
    return {
      data: { subscription: { unsubscribe: () => {} } },
      error: null
    };
  }

  // Obtener todos los usuarios (solo admins)
  static async getAllUsers(): Promise<UserProfile[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_all_users_with_roles');

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error obteniendo usuarios:', error);
      throw error;
    }
  }

  // Activar/desactivar usuario (solo admins)
  static async toggleUserStatus(userId: string, isActive: boolean): Promise<void> {
    try {
      const isAdmin = await this.isAdmin();
      if (!isAdmin) {
        throw new Error('No tienes permisos para modificar usuarios');
      }

      const { error } = await supabase
        .from('user_profiles')
        .update({ is_active: isActive })
        .eq('id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error modificando estado del usuario:', error);
      throw error;
    }
  }
}