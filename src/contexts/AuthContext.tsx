import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import { isEmailAuthorized } from '../authorizedUsers';

interface AuthContextType {
  user: any | null;
  loading: boolean;
  isAuthorized: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAuthorized: false
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('🔍 Auth state changed:', user?.email);
      
      if (user && user.email && isEmailAuthorized(user.email)) {
        console.log('✅ Usuario autorizado:', user.email);
        setUser(user);
      } else if (user) {
        console.log('❌ Usuario no autorizado:', user.email);
        // Cerrar sesión automáticamente si no está autorizado
        auth.signOut();
        setUser(null);
      } else {
        setUser(null);
      }
      
      setLoading(false);
    });

    // Verificar resultado de redirección al cargar
    const checkRedirectResult = async () => {
      try {
        const { getRedirectResult } = await import('firebase/auth');
        const result = await getRedirectResult(auth);
        if (result) {
          console.log('🔄 Resultado de redirección obtenido');
        }
      } catch (error) {
        console.error('Error verificando redirección:', error);
      }
    };

    checkRedirectResult();
    return unsubscribe;
  }, []);

  const isAuthorized = user?.email ? isEmailAuthorized(user.email) : false;

  const value = {
    user,
    loading,
    isAuthorized
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};