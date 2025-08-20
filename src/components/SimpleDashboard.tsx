import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const SimpleDashboard: React.FC = () => {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      console.log('🔴 Iniciando logout...');
      await logout();
      console.log('✅ Logout exitoso');
      console.log('🔄 Redirigiendo a login...');
      navigate('/login');
    } catch (error) {
      console.error('❌ Error en logout:', error);
    }
  };

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>🎉 Dashboard SENPA</h1>
      <div style={{ margin: '20px 0' }}>
        <h2>¡Bienvenido al Dashboard!</h2>
        <p><strong>Usuario:</strong> {user?.email}</p>
        <p><strong>Rol:</strong> {profile?.role_name}</p>
        <p><strong>Nombre:</strong> {profile?.full_name || 'No especificado'}</p>
      </div>
      
      <div style={{ margin: '20px 0' }}>
        <button 
          onClick={handleLogout}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Cerrar Sesión
        </button>
      </div>

      <div style={{ marginTop: '40px', fontSize: '14px', color: '#666' }}>
        <p>✅ Autenticación funcionando correctamente</p>
        <p>✅ Rutas protegidas funcionando</p>
        <p>✅ Sistema de roles activo</p>
      </div>
    </div>
  );
};

export default SimpleDashboard;