import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import SimpleDashboard from './components/SimpleDashboard';
import LoginForm from './components/auth/LoginForm';
import SimpleProtectedRoute from './components/auth/SimpleProtectedRoute';
import ProtectedHome from './components/auth/ProtectedHome';
import SimpleUserManagement from './components/SimpleUserManagement';

const EnvironmentalDashboard = React.lazy(() => import('./components/EnvironmentalDashboard'));
const ExecutiveDashboard = React.lazy(() => import('./components/ExecutiveDashboard'));
const DetaineesMap = React.lazy(() => import('./components/DetaineesMap'));
const VehiclesMap = React.lazy(() => import('./components/VehiclesMap'));
const OperationsPage = React.lazy(() => import('./components/OperationsPage'));
const NotificadosPage = React.lazy(() => import('./components/NotificadosPage'));
const ChartBuilder = React.lazy(() => import('./components/ChartBuilder'));

const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <Router>
          <div className="min-h-screen bg-neutral-50 font-sans antialiased">
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                <Route path="/" element={<ProtectedHome />} />
                <Route path="/dashboard" element={
                  <SimpleProtectedRoute requiredPermission="read">
                    <EnvironmentalDashboard />
                  </SimpleProtectedRoute>
                } />
                <Route path="/executive" element={
                  <SimpleProtectedRoute requiredPermission="read">
                    <ExecutiveDashboard />
                  </SimpleProtectedRoute>
                } />
                <Route path="/simple" element={
                  <SimpleProtectedRoute requiredPermission="read">
                    <SimpleDashboard />
                  </SimpleProtectedRoute>
                } />
                <Route path="/login" element={<LoginForm />} />
                
                {/* Rutas del dashboard */}
                <Route 
                  path="/detainees-map" 
                  element={
                    <SimpleProtectedRoute requiredPermission="read">
                      <DetaineesMap />
                    </SimpleProtectedRoute>
                  } 
                />
                <Route 
                  path="/vehicles-map" 
                  element={
                    <SimpleProtectedRoute requiredPermission="read">
                      <VehiclesMap />
                    </SimpleProtectedRoute>
                  } 
                />
                <Route 
                  path="/operations" 
                  element={
                    <SimpleProtectedRoute requiredPermission="read">
                      <OperationsPage />
                    </SimpleProtectedRoute>
                  } 
                />
                <Route 
                  path="/operations/detenidos" 
                  element={
                    <SimpleProtectedRoute requiredPermission="read">
                      <OperationsPage />
                    </SimpleProtectedRoute>
                  } 
                />
                <Route 
                  path="/operations/vehiculos" 
                  element={
                    <SimpleProtectedRoute requiredPermission="read">
                      <OperationsPage />
                    </SimpleProtectedRoute>
                  } 
                />
                <Route 
                  path="/operations/incautaciones" 
                  element={
                    <SimpleProtectedRoute requiredPermission="read">
                      <OperationsPage />
                    </SimpleProtectedRoute>
                  } 
                />
                <Route 
                  path="/operations/notificados" 
                  element={
                    <SimpleProtectedRoute requiredPermission="read">
                      <NotificadosPage />
                    </SimpleProtectedRoute>
                  } 
                />
                <Route 
                  path="/chart-builder" 
                  element={
                    <SimpleProtectedRoute requiredPermission="read">
                      <ChartBuilder />
                    </SimpleProtectedRoute>
                  } 
                />
                
                {/* Rutas de administración */}
                <Route 
                  path="/admin/users" 
                  element={
                    <SimpleProtectedRoute superadminOnly>
                      <SimpleUserManagement />
                    </SimpleProtectedRoute>
                  } 
                />
                
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </div>
        </Router>
      </DataProvider>
    </AuthProvider>
  );
}

export default App;
