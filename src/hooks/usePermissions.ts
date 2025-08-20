import { useAuth } from '../contexts/AuthContext';

export const usePermissions = () => {
  const { profile, isAdmin, hasPermission } = useAuth();

  const permissions = {
    // Permisos básicos
    canRead: hasPermission('read'),
    canWrite: hasPermission('write'),
    canDelete: hasPermission('delete'),
    
    // Permisos específicos por rol
    isAdmin,
    isViewer: profile?.role_name === 'viewer',
    
    // Permisos específicos del dashboard
    canViewDashboard: hasPermission('read'),
    canEditData: hasPermission('write'),
    canDeleteData: hasPermission('delete'),
    
    // Permisos específicos para tablas
    canCreateRecords: hasPermission('write'),
    canEditRecords: hasPermission('write'),
    canDeleteRecords: hasPermission('delete'),
    canViewRecords: hasPermission('read'),
    
    // Permisos de gestión de usuarios (solo admin)
    canManageUsers: isAdmin,
    canViewAllUsers: isAdmin,
    canToggleUserStatus: isAdmin,
    
    // Permisos de configuración
    canAccessSettings: isAdmin,
    canModifySettings: isAdmin,
    
    // Permisos de exportación
    canExportData: hasPermission('read'),
    canImportData: hasPermission('write'),
    
    // Información del usuario actual
    currentRole: profile?.role_name || 'unauthorized',
    userId: profile?.id,
    userEmail: profile?.email,
    isActive: profile?.is_active || false,
  };

  // Función helper para verificar múltiples permisos
  const hasAnyPermission = (...permissionList: ('read' | 'write' | 'delete')[]): boolean => {
    return permissionList.some(permission => hasPermission(permission));
  };

  // Función helper para verificar todos los permisos
  const hasAllPermissions = (...permissionList: ('read' | 'write' | 'delete')[]): boolean => {
    return permissionList.every(permission => hasPermission(permission));
  };

  // Función para obtener mensaje de permiso denegado
  const getPermissionDeniedMessage = (requiredPermission: string): string => {
    const messages = {
      'read': 'No tienes permisos para ver esta información',
      'write': 'No tienes permisos para editar esta información',
      'delete': 'No tienes permisos para eliminar esta información',
      'admin': 'Se requieren permisos de administrador para realizar esta acción'
    };
    
    return messages[requiredPermission as keyof typeof messages] || 
           'No tienes los permisos necesarios para realizar esta acción';
  };

  return {
    ...permissions,
    hasAnyPermission,
    hasAllPermissions,
    getPermissionDeniedMessage,
  };
};

export default usePermissions;