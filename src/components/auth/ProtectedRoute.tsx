import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Box, CircularProgress, Typography } from '@mui/material';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: 'read' | 'write' | 'delete';
  adminOnly?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredPermission = 'read',
  adminOnly = false 
}) => {
  const { user, profile, loading, hasPermission, isAdmin } = useAuth();

  // Mostrar spinner mientras carga
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: '#f5f5f5'
        }}
      >
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" sx={{ mt: 2, color: '#666' }}>
          Verificando autenticación...
        </Typography>
      </Box>
    );
  }

  // Si no hay usuario autenticado, redirigir al login
  if (!user || !profile) {
    return <Navigate to="/login" replace />;
  }

  // Si el usuario no está activo
  if (!profile.is_active) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: '#f5f5f5',
          textAlign: 'center',
          p: 3
        }}
      >
        <Typography variant="h4" color="error" gutterBottom>
          Acceso Denegado
        </Typography>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Tu cuenta ha sido desactivada
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Contacta al administrador para reactivar tu cuenta
        </Typography>
      </Box>
    );
  }

  // Si se requiere admin y el usuario no es admin
  if (adminOnly && !isAdmin) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: '#f5f5f5',
          textAlign: 'center',
          p: 3
        }}
      >
        <Typography variant="h4" color="error" gutterBottom>
          Acceso Denegado
        </Typography>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Se requieren permisos de administrador
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Tu rol actual: <strong>{profile.role_name}</strong>
        </Typography>
      </Box>
    );
  }

  // Si no tiene el permiso requerido
  if (!hasPermission(requiredPermission)) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: '#f5f5f5',
          textAlign: 'center',
          p: 3
        }}
      >
        <Typography variant="h4" color="error" gutterBottom>
          Permisos Insuficientes
        </Typography>
        <Typography variant="h6" sx={{ mb: 2 }}>
          No tienes permisos para acceder a esta sección
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Tu rol actual: <strong>{profile.role_name}</strong>
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Permiso requerido: <strong>{requiredPermission}</strong>
        </Typography>
      </Box>
    );
  }

  // Si todo está bien, mostrar el contenido
  return <>{children}</>;
};

export default ProtectedRoute;