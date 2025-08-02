import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import EnvironmentalDashboard from './components/EnvironmentalDashboard';
import DetaineesMap from './components/DetaineesMap';
import OperationsPage from './components/OperationsPage';
import { DataProvider } from './contexts/DataContext';

function App() {
  return (
    <DataProvider>
      <Router>
        <div className="min-h-screen bg-neutral-50 font-sans antialiased">
          <Routes>
            <Route path="/" element={<EnvironmentalDashboard />} />
            <Route path="/operations" element={<OperationsPage />} />
            <Route path="/detainees-map" element={<DetaineesMap />} />
          </Routes>
        </div>
      </Router>
    </DataProvider>
  );
}

export default App;