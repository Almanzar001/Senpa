import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Switch,
  Alert,
  CircularProgress,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Card,
  CardContent,
  Grid
} from '@mui/material';
import {
  AdminPanelSettings,
  Visibility,
  PersonOff,
  Person,
  Refresh,
  Warning
} from '@mui/icons-material';
import { AuthService } from '../../services/auth';
import { useAuth, type UserProfile } from '../../contexts/AuthContext';
import usePermissions from '../../hooks/usePermissions';

const UserManagement: React.FC = () => {
  const { isAdmin } = useAuth();
  const { canManageUsers, getPermissionDeniedMessage } = usePermissions();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    user: UserProfile | null;
    action: 'activate' | 'deactivate';
  }>({
    open: false,
    user: null,
    action: 'activate'
  });

  useEffect(() => {
    if (canManageUsers) {
      loadUsers();
    }
  }, [canManageUsers]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const usersData = await AuthService.getAllUsers();
      setUsers(usersData);
    } catch (err: any) {
      console.error('Error cargando usuarios:', err);
      setError(err.message || 'Error cargando usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUserStatus = async (user: UserProfile) => {
    const newStatus = !user.is_active;
    setConfirmDialog({
      open: true,
      user,
      action: newStatus ? 'activate' : 'deactivate'
    });
  };

  const confirmToggleStatus = async () => {
    if (!confirmDialog.user) return;

    try {
      setLoading(true);
      const newStatus = confirmDialog.action === 'activate';
      await AuthService.toggleUserStatus(confirmDialog.user.id, newStatus);
      
      // Actualizar la lista local
      setUsers(prev => prev.map(u => 
        u.id === confirmDialog.user!.id 
          ? { ...u, is_active: newStatus }
          : u
      ));

      setConfirmDialog({ open: false, user: null, action: 'activate' });
    } catch (err: any) {
      console.error('Error modificando usuario:', err);
      setError(err.message || 'Error modificando usuario');
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <AdminPanelSettings fontSize="small" />;
      case 'viewer':
        return <Visibility fontSize="small" />;
      default:
        return <Person fontSize="small" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'error';
      case 'viewer':
        return 'primary';
      default:
        return 'default';
    }
  };

  // Si no tiene permisos, mostrar mensaje
  if (!canManageUsers) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          {getPermissionDeniedMessage('admin')}
        </Alert>
      </Box>
    );
  }

  if (loading && users.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  const activeUsers = users.filter(u => u.is_active).length;
  const inactiveUsers = users.length - activeUsers;
  const adminUsers = users.filter(u => u.role_name === 'admin').length;
  const viewerUsers = users.filter(u => u.role_name === 'viewer').length;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Gestión de Usuarios
        </Typography>
        <Tooltip title="Actualizar lista">
          <IconButton onClick={loadUsers} disabled={loading}>
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Estadísticas */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" component="div">
                {users.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Usuarios
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" component="div" color="success.main">
                {activeUsers}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Usuarios Activos
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" component="div" color="error.main">
                {adminUsers}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Administradores
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" component="div" color="primary.main">
                {viewerUsers}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Visualizadores
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabla de usuarios */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Usuario</TableCell>
              <TableCell>Email</TableCell>
              <TableCell align="center">Rol</TableCell>
              <TableCell align="center">Estado</TableCell>
              <TableCell align="center">Fecha Registro</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        bgcolor: user.is_active ? 'primary.main' : 'grey.400',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 'bold'
                      }}
                    >
                      {user.full_name 
                        ? user.full_name.charAt(0).toUpperCase()
                        : user.email.charAt(0).toUpperCase()
                      }
                    </Box>
                    <Box>
                      <Typography variant="body1" fontWeight="medium">
                        {user.full_name || 'Sin nombre'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ID: {user.id.slice(0, 8)}...
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell align="center">
                  <Chip
                    icon={getRoleIcon(user.role_name)}
                    label={user.role_name.toUpperCase()}
                    size="small"
                    color={getRoleColor(user.role_name) as any}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell align="center">
                  <Chip
                    icon={user.is_active ? <Person /> : <PersonOff />}
                    label={user.is_active ? 'Activo' : 'Inactivo'}
                    size="small"
                    color={user.is_active ? 'success' : 'default'}
                    variant={user.is_active ? 'filled' : 'outlined'}
                  />
                </TableCell>
                <TableCell align="center">
                  <Typography variant="body2">
                    {new Date(user.created_at).toLocaleDateString('es-ES')}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Tooltip title={user.is_active ? 'Desactivar usuario' : 'Activar usuario'}>
                    <Switch
                      checked={user.is_active}
                      onChange={() => handleToggleUserStatus(user)}
                      disabled={loading}
                      color={user.is_active ? 'success' : 'default'}
                    />
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {users.length === 0 && !loading && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="text.secondary">
            No hay usuarios registrados
          </Typography>
        </Box>
      )}

      {/* Dialog de confirmación */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, user: null, action: 'activate' })}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Warning color="warning" />
          Confirmar Acción
        </DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que quieres{' '}
            <strong>
              {confirmDialog.action === 'activate' ? 'activar' : 'desactivar'}
            </strong>{' '}
            al usuario{' '}
            <strong>{confirmDialog.user?.email}</strong>?
          </Typography>
          {confirmDialog.action === 'deactivate' && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              El usuario no podrá acceder al sistema hasta que sea reactivado.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setConfirmDialog({ open: false, user: null, action: 'activate' })}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button 
            onClick={confirmToggleStatus}
            color={confirmDialog.action === 'activate' ? 'success' : 'error'}
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : 'Confirmar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement;