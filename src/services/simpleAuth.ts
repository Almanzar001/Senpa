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

// Lista de usuarios autorizados (puedes moverla a una base de datos más tarde)
const AUTHORIZED_USERS = [
  {
    id: 'user1',
    email: 'admin@senpa.gov.do',
    password: 'SenpaAdmin2025!',
    name: 'Administrador SENPA',
    role: 'admin' as const
  },
  {
    id: 'user2', 
    email: 'operador@senpa.gov.do',
    password: 'SenpaOp2025!',
    name: 'Operador SENPA',
    role: 'user' as const
  }
];

class SimpleAuthService {
  private currentUser: User | null = null;
  private authToken: string | null = null;

  constructor() {
    // Restaurar sesión del localStorage si existe
    this.restoreSession();
  }

  async login(email: string, password: string): Promise<AuthResult> {
    try {
      console.log('🔐 Intentando login simple con:', email);
      
      // Buscar usuario en la lista autorizada
      const user = AUTHORIZED_USERS.find(u => 
        u.email.toLowerCase() === email.toLowerCase() && u.password === password
      );

      if (!user) {
        return {
          success: false,
          error: 'Credenciales inválidas'
        };
      }

      // Verificar conexión con Supabase usando el API Key
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('detenidos')
            .select('id')
            .limit(1);
          
          if (error) {
            console.warn('⚠️ Advertencia de conexión Supabase:', error.message);
          } else {
            console.log('✅ Conexión con Supabase verificada');
          }
        } catch (err) {
          console.warn('⚠️ Error de conexión Supabase:', err);
        }
      }

      // Crear sesión exitosa
      const authUser: User = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
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
      
      console.log('✅ Login exitoso:', authUser.name);
      
      return {
        success: true,
        user: authUser
      };

    } catch (error: any) {
      console.error('❌ Error en login simple:', error);
      return {
        success: false,
        error: 'Error de conexión'
      };
    }
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
}

export const simpleAuth = new SimpleAuthService();
export default SimpleAuthService;