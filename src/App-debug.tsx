import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import SimpleDashboard from './components/SimpleDashboard';
import LoginForm from './components/auth/LoginForm';

console.log('📍 App-debug.tsx - Archivo cargado');

function App() {
  console.log('📍 App-debug - Función App ejecutándose');
  
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-neutral-50 font-sans antialiased">
          <Routes>
            <Route path="/" element={<SimpleDashboard />} />
            <Route path="/login" element={<LoginForm />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

console.log('📍 App-debug.tsx - Exportando App');

export default App;
