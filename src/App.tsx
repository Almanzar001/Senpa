import React from 'react';
// import { AuthProvider, useAuth } from './contexts/AuthContext';
import EnvironmentalDashboard from './components/EnvironmentalDashboard';
// import Login from './components/Login';
import { CONFIG } from './config';

// AUTENTICACIÓN DESHABILITADA TEMPORALMENTE PARA PRUEBAS
function App() {
  return (
    <div className="min-h-screen bg-neutral-50 font-sans antialiased">
      {/* Mensaje temporal */}
      <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4">
        <p className="font-bold">🚧 Modo Prueba - Autenticación Deshabilitada</p>
        <p className="text-sm">Dashboard en modo demo para pruebas de funcionalidad - v1.1</p>
      </div>
      
      <EnvironmentalDashboard
        spreadsheetId={CONFIG.SPREADSHEET_ID}
        apiKey={CONFIG.API_KEY}
      />
    </div>
  );
}

export default App;