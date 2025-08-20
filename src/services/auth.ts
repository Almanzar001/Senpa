import { supabase } from '../config';
import type { UserProfile, LoginCredentials, User } from '../contexts/AuthContext';

export class AuthService {
  // Login del usuario
  static async login(credentials: LoginCredentials) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) throw error;

      // Obtener el perfil del usuario con su rol
      const profile = await this.getUserProfile(data.user.id);
      
      if (!profile) {
        throw new Error('Usuario no autorizado');
      }

      if (!profile.is_active) {
        throw new Error('Usuario desactivado');
      }

      return {
        user: data.user,
        profile,
        session: data.session
      };
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  }

  // Logout del usuario
  static async logout() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Error en logout:', error);
      throw error;
    }
  }

  // Obtener usuario actual
  static async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      // Si no hay sesión, retornar null sin error
      if (error?.message?.includes('Auth session missing')) {
        return null;
      }
      
      if (error) throw error;
      if (!user) return null;

      const profile = await this.getUserProfile(user.id);
      
      return {
        user,
        profile
      };
    } catch (error) {
      // No mostrar error si simplemente no hay sesión
      if (error?.message?.includes('Auth session missing')) {
        return null;
      }
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
      const profile = userId 
        ? await this.getUserProfile(userId)
        : (await this.getCurrentUser())?.profile;

      return profile?.role_name === 'admin';
    } catch (error) {
      console.error('Error verificando admin:', error);
      return false;
    }
  }

  // Verificar permisos del usuario
  static async hasPermission(permission: 'read' | 'write' | 'delete'): Promise<boolean> {
    try {
      const current = await this.getCurrentUser();
      if (!current?.profile) return false;

      const { role_name } = current.profile;

      switch (permission) {
        case 'read':
          return ['admin', 'viewer'].includes(role_name);
        case 'write':
        case 'delete':
          return role_name === 'admin';
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
    return supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const profile = await this.getUserProfile(session.user.id);
        callback(session.user, profile);
      } else {
        callback(null, null);
      }
    });
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