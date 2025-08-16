import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { DataProvider } from './contexts/DataContext';

const EnvironmentalDashboard = React.lazy(() => import('./components/EnvironmentalDashboard'));
const DetaineesMap = React.lazy(() => import('./components/DetaineesMap'));
const OperationsPage = React.lazy(() => import('./components/OperationsPage'));
const ChartBuilder = React.lazy(() => import('./components/ChartBuilder'));

const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
  </div>
);

function App() {
  return (
    <DataProvider>
      <Router>
        <div className="min-h-screen bg-neutral-50 font-sans antialiased">
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/" element={<EnvironmentalDashboard />} />
              <Route path="/operations" element={<OperationsPage />} />
              <Route path="/detainees-map" element={<DetaineesMap />} />
              <Route path="/chart-builder" element={<ChartBuilder />} />
            </Routes>
          </Suspense>
        </div>
      </Router>
    </DataProvider>
  );
}

export default App;