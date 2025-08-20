import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const DebugAuth: React.FC = () => {
  const { user, profile, loading, login, logout, isAdmin, hasPermission } = useAuth();
  const [email, setEmail] = useState('fuapp01@gmail.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState<string | null>(null);
  const [isLogging, setIsLogging] = useState(false);

  const handleLogin = async () => {
    try {
      setIsLogging(true);
      setError(null);
      console.log('🔐 Intentando login con:', { email, password });
      
      await login({ email, password });
      
      console.log('✅ Login exitoso');
    } catch (err) {
      console.error('❌ Error en login:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLogging(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      console.log('✅ Logout exitoso');
    } catch (err) {
      console.error('❌ Error en logout:', err);
    }
  };

  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      right: 0, 
      width: '300px', 
      background: 'white', 
      border: '1px solid #ccc', 
      padding: '10px', 
      zIndex: 9999,
      fontSize: '12px'
    }}>
      <h3>🔍 Debug Auth</h3>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>Estado:</strong><br/>
        Loading: {loading ? '✅' : '❌'}<br/>
        User: {user ? `✅ ${user.email}` : '❌'}<br/>
        Profile: {profile ? `✅ ${profile.role_name}` : '❌'}<br/>
        Is Admin: {isAdmin ? '✅' : '❌'}<br/>
        Can Read: {hasPermission('read') ? '✅' : '❌'}<br/>
        Can Write: {hasPermission('write') ? '✅' : '❌'}<br/>
      </div>

      {!user && (
        <div style={{ marginBottom: '10px' }}>
          <div>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              style={{ width: '100%', marginBottom: '5px' }}
            />
          </div>
          <div>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              style={{ width: '100%', marginBottom: '5px' }}
            />
          </div>
          <button 
            onClick={handleLogin} 
            disabled={isLogging}
            style={{ width: '100%' }}
          >
            {isLogging ? 'Logging in...' : 'Login'}
          </button>
        </div>
      )}

      {user && (
        <button onClick={handleLogout} style={{ width: '100%' }}>
          Logout
        </button>
      )}

      {error && (
        <div style={{ color: 'red', marginTop: '10px', fontSize: '10px' }}>
          Error: {error}
        </div>
      )}
    </div>
  );
};

export default DebugAuth;