import React, { useState } from 'react';
import { Card, CardContent, CircularProgress, Tabs, Tab, Box, Button, Tooltip } from '@mui/material';
import { Dashboard as DashboardIcon, TableChart, BarChart, PieChart, Refresh as RefreshIcon } from '@mui/icons-material';
import { type SheetData } from '../services/supabase';
import SheetVisualization from './SheetVisualization';
import DataTable from './DataTable';
import SpecificMetrics from './SpecificMetrics';
import OperationalSummary from './OperationalSummary';
import DemoData from './DemoData';
import AdvancedFilters, { type FilterOptions } from './AdvancedFilters';
import FilterSummary from './FilterSummary';
import ExportButton from './ExportButton';
import { useFilteredData } from '../hooks/useFilteredData';
import { useData } from '../contexts/DataContext';

interface DashboardProps {
  // Props vacío ya que ahora usa DataContext
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const Dashboard: React.FC<DashboardProps> = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table');
  const [filters, setFilters] = useState<FilterOptions>({
    dateFrom: '',
    dateTo: '',
    states: [],
    locations: [],
    types: [],
    provinces: [],
    searchText: ''
  });

  // Usar el DataContext para obtener los datos de Supabase
  const { cases, loading, error, fetchData } = useData();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Convertir los casos a formato SheetData para mantener compatibilidad
  const sheets: SheetData[] = cases.length > 0 ? [
    {
      name: 'supabase_data',
      data: [
        Object.keys(cases[0]),
        ...cases.map(caso => Object.values(caso))
      ]
    }
  ] : [];

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Función para refrescar los datos
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchData();
      console.log('✅ Datos actualizados correctamente');
    } catch (error) {
      console.error('❌ Error al actualizar datos:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Apply filters to the data
  const filteredSheets = useFilteredData(sheets, filters);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(to bottom right, #eff6ff, #e0e7ff)'
      }} className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <CircularProgress size={60} className="mb-4" />
          <p className="text-gray-600 text-lg">Cargando datos del dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    // Si hay error, mostrar la demostración con datos de ejemplo
    return <DemoData />;
  }

  return (
    <div className="dashboard-container">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="dashboard-header">
          <div className="flex items-center">
            <DashboardIcon className="text-verde-musgo-600 mr-3" style={{ fontSize: 40 }} />
            <div>
              <h1 className="dashboard-title">Dashboard Operativo SENPA</h1>
              <p className="text-gris-suave-600 text-lg">
                Sistema de monitoreo en tiempo real - {new Date().toLocaleDateString('es-ES', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Refresh Button */}
            <Tooltip title="Actualizar datos">
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={handleRefresh}
                disabled={isRefreshing}
                sx={{
                  backgroundColor: 'rgba(34, 197, 94, 0.1)',
                  borderColor: 'rgb(34, 197, 94)',
                  color: 'rgb(34, 197, 94)',
                  fontSize: '0.875rem',
                  padding: '8px 16px',
                  textTransform: 'none',
                  fontWeight: 600,
                  '&:hover': {
                    backgroundColor: 'rgba(34, 197, 94, 0.2)',
                    borderColor: 'rgb(21, 128, 61)',
                  },
                  '&:disabled': {
                    borderColor: 'rgba(34, 197, 94, 0.5)',
                    color: 'rgba(34, 197, 94, 0.5)',
                  }
                }}
              >
                {isRefreshing ? 'Actualizando...' : 'Actualizar'}
              </Button>
            </Tooltip>
            <ExportButton sheetsData={filteredSheets} filters={filters} />
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="mb-6">
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={() => setViewMode('table')}
              className={`view-toggle-btn ${
                viewMode === 'table' ? 'view-toggle-active' : 'view-toggle-inactive'
              }`}
            >
              <TableChart className="w-5 h-5" />
              <span>Vista Tabla</span>
            </button>
            <button
              onClick={() => setViewMode('chart')}
              className={`view-toggle-btn ${
                viewMode === 'chart' ? 'view-toggle-active' : 'view-toggle-inactive'
              }`}
            >
              <BarChart className="w-5 h-5" />
              <span>Vista Gráfica</span>
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        <AdvancedFilters 
          sheetsData={sheets}
          onFiltersChange={setFilters}
          activeFilters={filters}
        />

        {/* Debug Info */}
        {(filters.dateFrom || filters.dateTo) && (
          <div className="mb-4 p-4 bg-yellow-100 border-l-4 border-yellow-500">
            <h3 className="font-bold">Debug - Filtros Activos:</h3>
            <p>Fecha desde: {filters.dateFrom || 'No especificada'}</p>
            <p>Fecha hasta: {filters.dateTo || 'No especificada'}</p>
            <p>Registros originales: {sheets.reduce((total, sheet) => total + Math.max(0, sheet.data.length - 1), 0)}</p>
            <p>Registros filtrados: {filteredSheets.reduce((total, sheet) => total + Math.max(0, sheet.data.length - 1), 0)}</p>
          </div>
        )}

        {/* Filter Summary */}
        <FilterSummary 
          filters={filters}
          totalRecords={sheets.reduce((total, sheet) => total + Math.max(0, sheet.data.length - 1), 0)}
          filteredRecords={filteredSheets.reduce((total, sheet) => total + Math.max(0, sheet.data.length - 1), 0)}
        />

        {/* Specific Metrics */}
        <SpecificMetrics sheetsData={filteredSheets} filters={filters} />

        {/* Operational Summary */}
        <OperationalSummary sheetsData={filteredSheets} filters={filters} />

        {/* Stats Cards - HORIZONTAL */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 max-w-6xl mx-auto">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">Total Hojas</p>
                  <p className="text-3xl font-bold">{sheets.length}</p>
                </div>
                <TableChart style={{ fontSize: 48, opacity: 0.8 }} />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100">Total Registros</p>
                  <p className="text-3xl font-bold">
                    {filteredSheets.reduce((total, sheet) => total + Math.max(0, sheet.data.length - 1), 0)}
                  </p>
                </div>
                <BarChart style={{ fontSize: 48, opacity: 0.8 }} />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100">Visualizaciones</p>
                  <p className="text-3xl font-bold">{filteredSheets.length * 2}</p>
                </div>
                <PieChart style={{ fontSize: 48, opacity: 0.8 }} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Card className="bg-primary-50/80 backdrop-blur-sm shadow-xl border-0 max-w-6xl mx-auto">
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              className="px-4"
            >
              {filteredSheets.map((sheet) => (
                <Tab
                  key={sheet.name}
                  label={sheet.name}
                  className="font-medium text-gray-700"
                  sx={{
                    textTransform: 'none',
                    fontSize: '1rem',
                    fontWeight: 500,
                  }}
                />
              ))}
            </Tabs>
          </Box>

          {filteredSheets.map((sheet, index) => (
            <TabPanel key={sheet.name} value={activeTab} index={index}>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-800">{sheet.name}</h2>
                  <div className="text-sm text-gray-500">
                    {Math.max(0, sheet.data.length - 1)} registros
                  </div>
                </div>

                {viewMode === 'table' ? (
                  <DataTable sheetData={sheet} filters={filters} />
                ) : (
                  <SheetVisualization sheetData={sheet} filters={filters} />
                )}
              </div>
            </TabPanel>
          ))}
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
