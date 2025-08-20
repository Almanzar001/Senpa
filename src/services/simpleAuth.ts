import { supabase } from '../config';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
}

export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

// Función para hashear contraseñas de manera simple
function simpleHash(password: string): string {
  // Hash simple para comparar (en producción usarías bcrypt o similar)
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}

class SimpleAuthService {
  private currentUser: User | null = null;
  private authToken: string | null = null;

  constructor() {
    // Restaurar sesión del localStorage si existe
    this.restoreSession();
  }

  async login(email: string, password: string): Promise<AuthResult> {
    try {
      console.log('🔐 Intentando login con base de datos:', email);
      
      if (!supabase) {
        // Fallback a usuarios hardcodeados si no hay Supabase
        return this.loginFallback(email, password);
      }

      // Buscar usuario en la base de datos
      const { data: users, error } = await supabase
        .from('senpa_usuarios')
        .select('*')
        .eq('email', email.toLowerCase())
        .eq('is_active', true)
        .limit(1);

      if (error) {
        console.error('❌ Error consultando usuarios:', error);
        // Fallback a usuarios hardcodeados
        return this.loginFallback(email, password);
      }

      if (!users || users.length === 0) {
        return {
          success: false,
          error: 'Usuario no encontrado'
        };
      }

      const user = users[0];
      
      // Verificar contraseña (hash simple por ahora)
      const passwordHash = simpleHash(password);
      const isPasswordValid = user.password_hash === passwordHash || 
                            this.checkFallbackPassword(email, password);

      if (!isPasswordValid) {
        return {
          success: false,
          error: 'Contraseña incorrecta'
        };
      }

      // Crear sesión exitosa
      const authUser: User = {
        id: user.id,
        email: user.email,
        name: user.full_name,
        role: user.role as 'admin' | 'user'
      };

      // Generar token simple
      this.authToken = btoa(JSON.stringify({
        userId: user.id,
        timestamp: Date.now(),
        role: user.role
      }));

      this.currentUser = authUser;
      
      // Guardar sesión
      this.saveSession();
      
      console.log('✅ Login exitoso desde BD:', authUser.name);
      
      return {
        success: true,
        user: authUser
      };

    } catch (error: any) {
      console.error('❌ Error en login:', error);
      // Fallback a usuarios hardcodeados
      return this.loginFallback(email, password);
    }
  }

  private checkFallbackPassword(email: string, password: string): boolean {
    // Contraseñas temporales para compatibilidad
    const fallbackUsers = {
      'admin@senpa.gov.do': 'SenpaAdmin2025!',
      'operador@senpa.gov.do': 'SenpaOp2025!'
    };
    return fallbackUsers[email as keyof typeof fallbackUsers] === password;
  }

  private async loginFallback(email: string, password: string): Promise<AuthResult> {
    console.log('🔄 Usando autenticación fallback para:', email);
    
    const fallbackUsers = [
      {
        id: 'admin-fallback',
        email: 'admin@senpa.gov.do',
        password: 'SenpaAdmin2025!',
        name: 'Administrador SENPA',
        role: 'admin' as const
      },
      {
        id: 'user-fallback',
        email: 'operador@senpa.gov.do',
        password: 'SenpaOp2025!',
        name: 'Operador SENPA',
        role: 'user' as const
      }
    ];

    const user = fallbackUsers.find(u => 
      u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );

    if (!user) {
      return {
        success: false,
        error: 'Credenciales inválidas'
      };
    }

    const authUser: User = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    };

    this.authToken = btoa(JSON.stringify({
      userId: user.id,
      timestamp: Date.now(),
      role: user.role
    }));

    this.currentUser = authUser;
    this.saveSession();
    
    return {
      success: true,
      user: authUser
    };
  }

  logout(): void {
    console.log('🚪 Cerrando sesión...');
    this.currentUser = null;
    this.authToken = null;
    this.clearSession();
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  getAuthToken(): string | null {
    return this.authToken;
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null && this.authToken !== null;
  }

  hasRole(role: 'admin' | 'user'): boolean {
    if (!this.currentUser) return false;
    return this.currentUser.role === 'admin' || this.currentUser.role === role;
  }

  private saveSession(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('senpa_user', JSON.stringify(this.currentUser));
      localStorage.setItem('senpa_token', this.authToken || '');
    }
  }

  private restoreSession(): void {
    if (typeof window !== 'undefined') {
      try {
        const userData = localStorage.getItem('senpa_user');
        const token = localStorage.getItem('senpa_token');
        
        if (userData && token) {
          this.currentUser = JSON.parse(userData);
          this.authToken = token;
          console.log('🔄 Sesión restaurada:', this.currentUser?.name);
        }
      } catch (error) {
        console.warn('⚠️ Error restaurando sesión:', error);
        this.clearSession();
      }
    }
  }

  private clearSession(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('senpa_user');
      localStorage.removeItem('senpa_token');
    }
  }

  // Métodos para gestión de usuarios (solo admins)
  async getAllUsers(): Promise<User[]> {
    if (!this.isAuthenticated() || !this.hasRole('admin')) {
      throw new Error('No tienes permisos para ver usuarios');
    }

    if (!supabase) {
      throw new Error('Base de datos no disponible');
    }

    try {
      const { data: users, error } = await supabase
        .from('senpa_usuarios')
        .select('id, email, full_name, role, is_active, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return users?.map(user => ({
        id: user.id,
        email: user.email,
        name: user.full_name,
        role: user.role as 'admin' | 'user'
      })) || [];
    } catch (error) {
      console.error('Error obteniendo usuarios:', error);
      throw error;
    }
  }

  async createUser(userData: {
    email: string;
    password: string;
    name: string;
    role: 'admin' | 'user';
  }): Promise<void> {
    if (!this.isAuthenticated() || !this.hasRole('admin')) {
      throw new Error('No tienes permisos para crear usuarios');
    }

    if (!supabase) {
      throw new Error('Base de datos no disponible');
    }

    try {
      const passwordHash = simpleHash(userData.password);

      const { error } = await supabase
        .from('senpa_usuarios')
        .insert({
          email: userData.email.toLowerCase(),
          password_hash: passwordHash,
          full_name: userData.name,
          role: userData.role,
          is_active: true
        });

      if (error) throw error;

      console.log('✅ Usuario creado:', userData.email);
    } catch (error) {
      console.error('Error creando usuario:', error);
      throw error;
    }
  }

  async updateUser(userId: string, userData: {
    email?: string;
    name?: string;
    role?: 'admin' | 'user';
    is_active?: boolean;
  }): Promise<void> {
    if (!this.isAuthenticated() || !this.hasRole('admin')) {
      throw new Error('No tienes permisos para actualizar usuarios');
    }

    if (!supabase) {
      throw new Error('Base de datos no disponible');
    }

    try {
      const updateData: any = {};
      
      if (userData.email) updateData.email = userData.email.toLowerCase();
      if (userData.name) updateData.full_name = userData.name;
      if (userData.role) updateData.role = userData.role;
      if (userData.is_active !== undefined) updateData.is_active = userData.is_active;

      const { error } = await supabase
        .from('senpa_usuarios')
        .update(updateData)
        .eq('id', userId);

      if (error) throw error;

      console.log('✅ Usuario actualizado:', userId);
    } catch (error) {
      console.error('Error actualizando usuario:', error);
      throw error;
    }
  }

  async changePassword(userId: string, newPassword: string): Promise<void> {
    if (!this.isAuthenticated() || !this.hasRole('admin')) {
      throw new Error('No tienes permisos para cambiar contraseñas');
    }

    if (!supabase) {
      throw new Error('Base de datos no disponible');
    }

    try {
      const passwordHash = simpleHash(newPassword);

      const { error } = await supabase
        .from('senpa_usuarios')
        .update({ password_hash: passwordHash })
        .eq('id', userId);

      if (error) throw error;

      console.log('✅ Contraseña actualizada para usuario:', userId);
    } catch (error) {
      console.error('Error cambiando contraseña:', error);
      throw error;
    }
  }

  async deleteUser(userId: string): Promise<void> {
    if (!this.isAuthenticated() || !this.hasRole('admin')) {
      throw new Error('No tienes permisos para eliminar usuarios');
    }

    if (!supabase) {
      throw new Error('Base de datos no disponible');
    }

    if (userId === this.currentUser?.id) {
      throw new Error('No puedes eliminar tu propio usuario');
    }

    try {
      const { error } = await supabase
        .from('senpa_usuarios')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      console.log('✅ Usuario eliminado:', userId);
    } catch (error) {
      console.error('Error eliminando usuario:', error);
      throw error;
    }
  }
}

export const simpleAuth = new SimpleAuthService();
export default SimpleAuthService;