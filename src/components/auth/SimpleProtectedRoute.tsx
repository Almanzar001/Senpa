import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface SimpleProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: 'read' | 'write' | 'delete';
  adminOnly?: boolean;
}

const SimpleProtectedRoute: React.FC<SimpleProtectedRouteProps> = ({ 
  children, 
  requiredPermission = 'read',
  adminOnly = false 
}) => {
  const { user, profile, loading, hasPermission, isAdmin } = useAuth();

  console.log('🛡️ SimpleProtectedRoute - Estado detallado:');
  console.log('  - loading:', loading);
  console.log('  - user:', user);
  console.log('  - profile:', profile);
  console.log('  - isAdmin:', isAdmin);
  console.log('  - hasPermission(' + requiredPermission + '):', hasPermission(requiredPermission));

  // Si está cargando, mostrar mensaje simple
  if (loading) {
    console.log('🛡️ SimpleProtectedRoute - Mostrando loading...');
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        fontSize: '18px' 
      }}>
        Verificando autenticación...
      </div>
    );
  }

  // Si no hay usuario, redirigir al login
  if (!user || !profile) {
    console.log('🛡️ SimpleProtectedRoute - Sin usuario, redirigiendo a login...');
    return <Navigate to="/login" replace />;
  }

  // Si el usuario no está activo
  if (!profile.is_active) {
    console.log('🛡️ SimpleProtectedRoute - Usuario inactivo');
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <h2>Cuenta Desactivada</h2>
        <p>Tu cuenta ha sido desactivada. Contacta al administrador.</p>
      </div>
    );
  }

  // Si se requiere admin y no es admin
  if (adminOnly && !isAdmin) {
    console.log('🛡️ SimpleProtectedRoute - Se requiere admin pero usuario no es admin');
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <h2>Acceso Denegado</h2>
        <p>Se requieren permisos de administrador.</p>
        <p>Tu rol actual: <strong>{profile.role_name}</strong></p>
      </div>
    );
  }

  // Si no tiene el permiso requerido
  if (!hasPermission(requiredPermission)) {
    console.log('🛡️ SimpleProtectedRoute - Sin permisos suficientes');
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <h2>Permisos Insuficientes</h2>
        <p>No tienes permisos para acceder a esta sección.</p>
        <p>Tu rol actual: <strong>{profile.role_name}</strong></p>
        <p>Permiso requerido: <strong>{requiredPermission}</strong></p>
      </div>
    );
  }

  // Todo bien, mostrar contenido
  console.log('🛡️ SimpleProtectedRoute - Acceso permitido, mostrando contenido');
  return <>{children}</>;
};

export default SimpleProtectedRoute;