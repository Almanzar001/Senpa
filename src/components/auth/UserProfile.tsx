import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  Box,
  Button,
  Typography,
  Menu,
  MenuItem,
  Avatar,
  Divider,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  AccountCircle,
  Logout,
  AdminPanelSettings,
  Visibility,
  ExitToApp
} from '@mui/icons-material';

const UserProfile: React.FC = () => {
  const { user, profile, logout, isAdmin } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogoutClick = () => {
    setLogoutDialogOpen(true);
    handleClose();
  };

  const handleLogoutConfirm = async () => {
    try {
      await logout();
      setLogoutDialogOpen(false);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const handleLogoutCancel = () => {
    setLogoutDialogOpen(false);
  };

  if (!user || !profile) {
    return null;
  }

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

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <AdminPanelSettings fontSize="small" />;
      case 'viewer':
        return <Visibility fontSize="small" />;
      default:
        return <AccountCircle fontSize="small" />;
    }
  };

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <IconButton
          onClick={handleClick}
          size="small"
          sx={{ ml: 2 }}
          aria-controls={open ? 'account-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
        >
          <Avatar
            sx={{
              width: 32,
              height: 32,
              bgcolor: isAdmin ? 'error.main' : 'primary.main',
              fontSize: '0.875rem'
            }}
          >
            {profile.full_name 
              ? profile.full_name.charAt(0).toUpperCase()
              : profile.email.charAt(0).toUpperCase()
            }
          </Avatar>
        </IconButton>

        <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
          <Typography variant="body2" fontWeight="medium">
            {profile.full_name || 'Usuario'}
          </Typography>
          <Chip
            icon={getRoleIcon(profile.role_name)}
            label={profile.role_name.toUpperCase()}
            size="small"
            color={getRoleColor(profile.role_name) as any}
            variant="outlined"
            sx={{ height: 20, fontSize: '0.7rem' }}
          />
        </Box>
      </Box>

      <Menu
        anchorEl={anchorEl}
        id="account-menu"
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        PaperProps={{
          elevation: 3,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
            mt: 1.5,
            minWidth: 280,
            '& .MuiAvatar-root': {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1,
            },
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {/* Información del usuario */}
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="h6" gutterBottom>
            {profile.full_name || 'Usuario'}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {profile.email}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
            <Chip
              icon={getRoleIcon(profile.role_name)}
              label={`Rol: ${profile.role_name.toUpperCase()}`}
              size="small"
              color={getRoleColor(profile.role_name) as any}
              variant="filled"
            />
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Última conexión: {new Date().toLocaleDateString('es-ES')}
          </Typography>
        </Box>

        <Divider />

        {/* Opciones del menú */}
        <MenuItem onClick={handleLogoutClick}>
          <ListItemIcon>
            <ExitToApp fontSize="small" />
          </ListItemIcon>
          <ListItemText>
            Cerrar Sesión
          </ListItemText>
        </MenuItem>
      </Menu>

      {/* Dialog de confirmación de logout */}
      <Dialog
        open={logoutDialogOpen}
        onClose={handleLogoutCancel}
        aria-labelledby="logout-dialog-title"
      >
        <DialogTitle id="logout-dialog-title">
          Confirmar Cierre de Sesión
        </DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que quieres cerrar la sesión?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleLogoutCancel} color="inherit">
            Cancelar
          </Button>
          <Button 
            onClick={handleLogoutConfirm} 
            color="primary" 
            variant="contained"
            startIcon={<Logout />}
          >
            Cerrar Sesión
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default UserProfile;