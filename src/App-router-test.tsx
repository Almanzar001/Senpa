import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import DebugAuth from './components/DebugAuth';
import SimpleDashboard from './components/SimpleDashboard';
import LoginForm from './components/auth/LoginForm';

function App() {
  console.log('🟡 App-router-test iniciando...');
  
  return (
    <AuthProvider>
      <Router>
        <DebugAuth />
        <div style={{ marginTop: '100px' }}>
          <Routes>
            <Route path="/login" element={<LoginForm />} />
            <Route path="/" element={<SimpleDashboard />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;