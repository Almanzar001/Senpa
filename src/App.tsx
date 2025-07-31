import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import EnvironmentalDashboard from './components/EnvironmentalDashboard';
import Login from './components/Login';
import { CONFIG } from './config';

// Componente principal que maneja la autenticación
const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-xl font-semibold text-neutral-800 mb-2">
            Verificando acceso...
          </h2>
          <p className="text-neutral-600">
            Validando credenciales de usuario
          </p>
        </div>
      </div>
    );
  }

  // Si no hay usuario autenticado, mostrar login
  if (!user) {
    return <Login user={user} onAuthChange={() => {}} />;
  }

  // Usuario autenticado - mostrar dashboard
  return (
    <div className="min-h-screen bg-neutral-50 font-sans antialiased">
      <Login user={user} onAuthChange={() => {}} />
      <EnvironmentalDashboard
        spreadsheetId={CONFIG.SPREADSHEET_ID}
        apiKey={CONFIG.API_KEY}
      />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;