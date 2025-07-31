import React, { useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { isEmailAuthorized } from '../authorizedUsers';

interface LoginProps {
  user: any;
  onAuthChange: (user: any) => void;
}

const Login: React.FC<LoginProps> = ({ user, onAuthChange }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Usar signInWithRedirect en lugar de popup para evitar redirect_uri_mismatch
      const { signInWithRedirect, getRedirectResult } = await import('firebase/auth');
      
      // Verificar si hay resultado de redirección pendiente
      const result = await getRedirectResult(auth);
      if (result) {
        const userEmail = result.user.email;
        
        // Verificar si el email está autorizado
        if (!userEmail || !isEmailAuthorized(userEmail)) {
          await signOut(auth);
          setError(`Acceso denegado. El email ${userEmail} no está autorizado para acceder al Dashboard SENPA.`);
          return;
        }
        
        console.log('✅ Usuario autorizado:', userEmail);
        onAuthChange(result.user);
      } else {
        // Iniciar redirección
        await signInWithRedirect(auth, googleProvider);
      }
    } catch (error: any) {
      console.error('Error de autenticación:', error);
      setError('Error al iniciar sesión. Por favor, intenta de nuevo.');
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      onAuthChange(null);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  // Si el usuario ya está autenticado, mostrar botón de logout
  if (user) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <div className="bg-white rounded-lg shadow-lg p-4 flex items-center gap-4">
          <div className="flex items-center gap-3">
            <img 
              src={user.photoURL} 
              alt={user.displayName}
              className="w-8 h-8 rounded-full"
            />
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-gray-900">{user.displayName}</p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="btn-sm btn-outline text-red-600 hover:bg-red-50"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>
    );
  }

  // Pantalla de login
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 animate-fade-in">
          {/* Logo y Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-primary-600 rounded-xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <span className="text-white text-4xl">🌿</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Dashboard SENPA
            </h1>
            <p className="text-gray-600">
              Sistema de Monitoreo de Operaciones Ambientales
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <span className="text-red-500 text-xl">⚠️</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Login Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full bg-white border border-gray-300 rounded-lg px-6 py-3 flex items-center justify-center gap-3 hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-gray-700">Iniciando sesión...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="text-gray-700 font-medium">Iniciar sesión con Google</span>
              </>
            )}
          </button>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              🔒 Solo usuarios autorizados de SENPA pueden acceder
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;