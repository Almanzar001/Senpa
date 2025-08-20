import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import DebugAuth from './components/DebugAuth';
import SimpleDashboard from './components/SimpleDashboard';

function App() {
  console.log('🟢 App-simple-test iniciando...');
  
  return (
    <AuthProvider>
      <div>
        <DebugAuth />
        <div style={{ marginTop: '100px' }}>
          <SimpleDashboard />
        </div>
      </div>
    </AuthProvider>
  );
}

export default App;