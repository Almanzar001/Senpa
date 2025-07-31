import React, { useState, useEffect, useMemo } from 'react';
// Removemos los iconos de Material-UI y usamos emojis
import GoogleSheetsService, { type SheetData } from '../services/googleSheets';
import EnvironmentalAnalyticsService from '../services/environmentalAnalytics';
import EnvironmentalMetrics from './EnvironmentalMetrics';
import EnvironmentalFiltersComponent, { type EnvironmentalFilters } from './EnvironmentalFilters';
import EnvironmentalCharts from './EnvironmentalCharts';
import EnvironmentalTable from './EnvironmentalTable';
import SecondaryIndicators from './SecondaryIndicators';
import AutoRefreshSettings from './AutoRefreshSettings';

// Función para crear datos de demostración
function createDemoEnvironmentalData(): SheetData[] {
  return [
    {
      name: 'Operativos',
      data: [
        ['numeroCaso', 'fecha', 'hora', 'provincia', 'localidad', 'tipoActividad', 'areaTemática'],
        ['CASO001', '2025-01-15', '08:30', 'Santo Domingo', 'Distrito Nacional', 'Operativo', 'Suelos y Aguas'],
        ['CASO002', '2025-01-16', '14:20', 'Santiago', 'Santiago Centro', 'Patrulla', 'Recursos Forestales'],
        ['CASO003', '2025-01-17', '09:15', 'La Vega', 'Concepción de La Vega', 'Operativo', 'Área Protegida'],
        ['CASO004', '2025-01-18', '16:45', 'San Pedro de Macorís', 'San Pedro Centro', 'Operativo', 'Costeros y Marinos'],
        ['CASO005', '2025-01-19', '11:30', 'Barahona', 'Barahona Centro', 'Patrulla', 'Gestión Ambiental']
      ]
    },
    {
      name: 'Detenidos',
      data: [
        ['numeroCaso', 'nombre', 'nacionalidad'],
        ['CASO001', 'Juan Pérez', 'Dominicana'],
        ['CASO001', 'María González', 'Dominicana'],
        ['CASO003', 'Carlos Rodríguez', 'Haitiana'],
        ['CASO004', 'Ana Martínez', 'Dominicana']
      ]
    },
    {
      name: 'Vehículos',
      data: [
        ['numeroCaso', 'tipo', 'placa'],
        ['CASO001', 'Camión', 'A123456'],
        ['CASO002', 'Motocicleta', 'B789012'],
        ['CASO004', 'Camioneta', 'C345678'],
        ['CASO005', 'Automóvil', 'D901234']
      ]
    },
    {
      name: 'Incautaciones',
      data: [
        ['numeroCaso', 'tipo', 'cantidad'],
        ['CASO001', 'Madera ilegal', '50'],
        ['CASO001', 'Herramientas', '10'],
        ['CASO003', 'Fauna silvestre', '5'],
        ['CASO004', 'Productos químicos', '20'],
        ['CASO005', 'Residuos tóxicos', '15']
      ]
    }
  ];
}

export interface EnvironmentalDashboardProps {
  spreadsheetId: string;
  apiKey: string;
}


const EnvironmentalDashboard: React.FC<EnvironmentalDashboardProps> = ({ spreadsheetId, apiKey }) => {
  console.log('🚀 EnvironmentalDashboard INICIADO');
  console.log('📋 Props recibidas - spreadsheetId:', spreadsheetId);
  console.log('🔑 Props recibidas - apiKey:', apiKey ? `${apiKey.substring(0, 15)}...` : 'UNDEFINED');
  
  const [sheets, setSheets] = useState<SheetData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30); // segundos
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  const [filters, setFilters] = useState<EnvironmentalFilters>({
    dateFrom: '',
    dateTo: '',
    provincia: [],
    division: [],
    tipoActividad: [],
    areaTemática: [],
    searchText: ''
  });

  const analyticsService = useMemo(() => new EnvironmentalAnalyticsService(), []);
  
  // Process environmental cases from sheets data
  const environmentalCases = useMemo(() => {
    if (!sheets || sheets.length === 0) return [];
    return analyticsService.analyzeSheetsData(sheets);
  }, [sheets, analyticsService]);

  // Apply filters to cases
  const filteredCases = useMemo(() => {
    return analyticsService.applyFilters(environmentalCases, filters);
  }, [environmentalCases, filters, analyticsService]);

  // Función para fetch de datos
  const fetchData = async () => {
    console.log('🔍 fetchData - Verificando configuración:');
    console.log('   📋 spreadsheetId:', spreadsheetId);
    console.log('   🔑 apiKey:', apiKey ? `${apiKey.substring(0, 10)}...` : 'NO DEFINIDA');
    
    if (!spreadsheetId || !apiKey || apiKey === 'TU_NUEVA_API_KEY_AQUI') {
      console.warn('API Key no configurada, usando datos de demostración');
      // Usar datos de demostración cuando no hay API key
      const demoSheets = createDemoEnvironmentalData();
      setSheets(demoSheets);
      setLastUpdated(new Date());
      setError(null);
      setLoading(false);
      return;
    }

    try {
      console.log('✅ Intentando obtener datos reales de Google Sheets...');
      setLoading(true);
      const sheetsService = new GoogleSheetsService(apiKey);
      const sheetsData = await sheetsService.getMultipleSheets(spreadsheetId);
      console.log('✅ Datos reales obtenidos exitosamente:', sheetsData.length, 'hojas');
      setSheets(sheetsData);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error('❌ Error fetching real data:', err);
      console.warn('🔄 Usando datos de demo como fallback');
      // Usar datos de demostración cuando falla la API
      const demoSheets = createDemoEnvironmentalData();
      setSheets(demoSheets);
      setLastUpdated(new Date());
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  // Effect inicial para cargar datos
  useEffect(() => {
    fetchData();
  }, [spreadsheetId, apiKey]);

  // Auto-refresh effect
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (autoRefresh && !loading) {
      intervalId = setInterval(() => {
        console.log('🔄 Auto-refresh activado - actualizando datos...');
        fetchData();
      }, refreshInterval * 1000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [autoRefresh, refreshInterval, loading]);


  const handleRefresh = () => {
    console.log('🔄 Actualización manual iniciada...');
    fetchData();
  };

  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
    console.log(`🔄 Auto-refresh ${!autoRefresh ? 'activado' : 'desactivado'}`);
  };


  const MemoizedEnvironmentalMetrics = React.memo(EnvironmentalMetrics);
  const MemoizedEnvironmentalCharts = React.memo(EnvironmentalCharts);
  const MemoizedEnvironmentalTable = React.memo(EnvironmentalTable);

  if (loading) {
    return (
      <div className="dashboard-container flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-xl font-semibold text-neutral-800 mb-2">
            Cargando datos ambientales...
          </h2>
          <p className="text-neutral-600">
            Analizando hojas y relacionando casos por número de caso
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-error-50 to-error-100 flex items-center justify-center p-8">
        <div className="max-w-lg animate-fade-in">
          <div className="bg-error-50 border border-error-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-error-100 rounded-full flex items-center justify-center">
                  <span className="text-error-600 text-lg">⚠</span>
                </div>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-error-800">
                  Error en Dashboard Ambiental
                </h3>
                <div className="mt-2 text-sm text-error-700">
                  {error}
                </div>
              </div>
            </div>
          </div>
          
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-neutral-800 mb-4 flex items-center gap-2">
              <span className="text-2xl">🔧</span>
              Configuración Requerida
            </h3>
            <div className="space-y-3 text-sm text-neutral-600 mb-6">
              <div className="flex gap-3">
                <span className="font-semibold text-primary-600">1.</span>
                <span>Ve a <a href="https://console.cloud.google.com/" target="_blank" rel="noopener" className="text-primary-600 hover:text-primary-700 underline">Google Cloud Console</a></span>
              </div>
              <div className="flex gap-3">
                <span className="font-semibold text-primary-600">2.</span>
                <span>APIs y servicios → Credenciales</span>
              </div>
              <div className="flex gap-3">
                <span className="font-semibold text-primary-600">3.</span>
                <span>Crear Credenciales → Clave de API</span>
              </div>
              <div className="flex gap-3">
                <span className="font-semibold text-primary-600">4.</span>
                <span>Copia la nueva API Key</span>
              </div>
              <div className="flex gap-3">
                <span className="font-semibold text-primary-600">5.</span>
                <span>Edita <code className="bg-neutral-100 text-neutral-800 px-2 py-1 rounded font-mono text-xs">src/config.ts</code> línea 7</span>
              </div>
            </div>
            
            <button 
              onClick={handleRefresh}
              className="btn-primary w-full"
            >
              Reintentar Conexión
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header Rediseñado */}
        <header className="dashboard-header p-6 mb-8 animate-fade-in">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Branding y título */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-3xl">🌿</span>
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="dashboard-title text-balance">
                  Dashboard Ambiental SENPA
                </h1>
                <p className="dashboard-subtitle mt-1">
                  Sistema de Monitoreo de Operaciones Ambientales
                </p>
                <div className="flex items-center gap-4 mt-3">
                  <time className="text-sm text-neutral-500">
                    {new Date().toLocaleDateString('es-ES', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </time>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full transition-colors duration-300 ${loading ? 'bg-warning-400 animate-pulse' : 'bg-success-500'}`}></div>
                    <span className="text-sm font-medium text-neutral-700">
                      {environmentalCases.length} casos
                      {loading && (
                        <span className="text-neutral-500 ml-1">(actualizando...)</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Controles de acción */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Info de última actualización */}
              <div className="hidden lg:block text-right">
                <div className="text-xs text-neutral-500 mb-1">
                  Última actualización
                </div>
                <div className="text-sm font-medium text-neutral-700">
                  {lastUpdated.toLocaleTimeString('es-ES', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
                {autoRefresh && (
                  <div className="text-xs text-primary-600 mt-1">
                    ⟳ Cada {refreshInterval}s
                  </div>
                )}
              </div>

              {/* Botones de control */}
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleAutoRefresh}
                  className={`btn-sm ${autoRefresh ? 'btn-primary' : 'btn-outline'} min-w-0`}
                  title={autoRefresh ? 'Pausar auto-refresh' : 'Activar auto-refresh'}
                >
                  <span className="text-base">{autoRefresh ? '⏸️' : '▶️'}</span>
                  <span className="hidden sm:inline ml-2">
                    {autoRefresh ? 'Pausar' : 'Auto'}
                  </span>
                </button>
                
                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  className="btn-sm btn-outline min-w-0"
                  title="Actualizar datos"
                >
                  <span className={`text-base ${loading ? 'animate-spin' : ''}`}>🔄</span>
                  <span className="hidden sm:inline ml-2">
                    {loading ? 'Cargando...' : 'Actualizar'}
                  </span>
                </button>
                
                <button
                  onClick={() => setSettingsOpen(true)}
                  className="btn-sm btn-ghost min-w-0"
                  title="Configuración"
                >
                  <span className="text-base">⚙️</span>
                  <span className="hidden lg:inline ml-2">Configuración</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Filtros */}
        <section className="mb-8">
          <EnvironmentalFiltersComponent
            cases={environmentalCases}
            onFiltersChange={setFilters}
            activeFilters={filters}
          />
        </section>

        {/* Métricas principales */}
        <section className="mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-up">
            <MemoizedEnvironmentalMetrics 
              cases={filteredCases} 
              filters={filters} 
              layout="horizontal"
            />
          </div>
        </section>

        {/* Contenido principal con pestañas */}
        <main className="space-y-6">
          <div className="card-environmental animate-slide-up">
            <div className="border-b border-neutral-200">
              <nav className="flex space-x-8 px-6" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab(0)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 flex items-center gap-2 ${
                    activeTab === 0
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                  }`}
                >
                  <span className="text-xl">📊</span>
                  Análisis y Gráficos
                </button>
                <button
                  onClick={() => setActiveTab(1)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 flex items-center gap-2 ${
                    activeTab === 1
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                  }`}
                >
                  <span className="text-xl">📋</span>
                  Tabla Detallada
                </button>
                <button
                  onClick={() => setActiveTab(2)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 flex items-center gap-2 ${
                    activeTab === 2
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                  }`}
                >
                  <span className="text-xl">📈</span>
                  Indicadores Secundarios
                </button>
              </nav>
            </div>

            <div className="p-6">
              {activeTab === 0 && (
                <div className="animate-fade-in">
                  <MemoizedEnvironmentalCharts cases={filteredCases} filters={filters} />
                </div>
              )}
              {activeTab === 1 && (
                <div className="animate-fade-in">
                  <MemoizedEnvironmentalTable cases={filteredCases} filters={filters} />
                </div>
              )}
              {activeTab === 2 && (
                <div className="animate-fade-in">
                  <SecondaryIndicators cases={filteredCases} filters={filters} />
                </div>
              )}
            </div>
          </div>
        </main>
      </div>


      {/* Auto-refresh Settings Dialog */}
      <AutoRefreshSettings
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        autoRefresh={autoRefresh}
        refreshInterval={refreshInterval}
        onAutoRefreshChange={setAutoRefresh}
        onIntervalChange={setRefreshInterval}
      />
    </div>
  );
};

export default EnvironmentalDashboard;
