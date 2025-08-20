import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
// NO importamos DataProvider por ahora
import LoginForm from './components/auth/LoginForm';
import ProtectedRoute from './components/auth/ProtectedRoute';
import SimpleProtectedRoute from './components/auth/SimpleProtectedRoute';
import UserManagement from './components/admin/UserManagement';
import SimpleDashboard from './components/SimpleDashboard';

// Componentes lazy (comentados por ahora)
// const EnvironmentalDashboard = React.lazy(() => import('./components/EnvironmentalDashboard'));
// const DetaineesMap = React.lazy(() => import('./components/DetaineesMap'));
// const OperationsPage = React.lazy(() => import('./components/OperationsPage'));
// const ChartBuilder = React.lazy(() => import('./components/ChartBuilder'));

const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
  </div>
);

function App() {
  console.log('🟢 App-working iniciando...');
  
  return (
    <AuthProvider>
      {/* SIN DataProvider */}
      <Router>
        <div className="min-h-screen bg-neutral-50 font-sans antialiased">
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              {/* Ruta pública de login */}
              <Route path="/login" element={<LoginForm />} />
              
              {/* Rutas protegidas */}
              <Route 
                path="/" 
                element={<SimpleDashboard />} 
              />
              
              {/* Ruta de admin */}
              <Route 
                path="/admin/users" 
                element={
                  <SimpleProtectedRoute adminOnly>
                    <UserManagement />
                  </SimpleProtectedRoute>
                } 
              />
              
              {/* Redirección por defecto */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;