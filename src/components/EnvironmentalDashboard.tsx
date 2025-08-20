import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import EnvironmentalMetrics from './EnvironmentalMetrics';
import EnvironmentalFiltersComponent from './EnvironmentalFilters';
import EnvironmentalCharts from './EnvironmentalCharts';
import EnvironmentalTable from './EnvironmentalTable';
import SecondaryIndicators from './SecondaryIndicators';
import AutoRefreshSettings from './AutoRefreshSettings';


const EnvironmentalDashboard: React.FC = () => {
  const {
    cases: environmentalCases,
    filteredCases,
    loading,
    error,
    filters,
    setFilters,
    fetchData,
    updateCase,
    deleteCase
  } = useData();
  
  const { user, profile, logout } = useAuth();
  const permissions = usePermissions();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error en logout:', error);
    }
  };

  const [activeTab, setActiveTab] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30); // segundos
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    // This will be triggered by the context's fetchData, but we can update the timestamp
    if (!loading) {
      setLastUpdated(new Date());
    }
  }, [loading]);

  // Auto-refresh effect
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (autoRefresh && !loading) {
      intervalId = setInterval(() => {
        fetchData();
      }, refreshInterval * 1000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [autoRefresh, refreshInterval, loading, fetchData]);

  const handleRefresh = useCallback(() => {
    fetchData().then(() => setLastUpdated(new Date()));
  }, [fetchData]);

  const toggleAutoRefresh = useCallback(() => {
    setAutoRefresh(!autoRefresh);
  }, [autoRefresh]);

  const MemoizedEnvironmentalMetrics = useMemo(() => React.memo(EnvironmentalMetrics), []);
  const MemoizedEnvironmentalCharts = useMemo(() => React.memo(EnvironmentalCharts), []);
  const MemoizedEnvironmentalTable = useMemo(() => React.memo(EnvironmentalTable), []);

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
        <header className="dashboard-header p-6 mb-8 animate-fade-in relative">
          {/* Botones de admin y logout en esquina superior derecha */}
          <div className="absolute top-4 left-4">
            <Link 
              to="/"
              className="px-3 py-1 bg-slate-500 text-white text-sm rounded hover:bg-slate-600 transition-colors"
            >
              📊 Dashboard Ejecutivo
            </Link>
          </div>

          <div className="absolute top-4 right-4">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">
                {user?.email} ({profile?.role_name})
              </span>
              {profile?.role_name === 'admin' && (
                <Link 
                  to="/admin/users"
                  className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                >
                  👥 Usuarios
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
          
          <div className="flex flex-col items-center text-center gap-4">
            {/* Branding y título */}
            <div className="flex flex-col items-center gap-4">
              <div className="flex-shrink-0">
                <div className="w-20 h-20 bg-white rounded-xl flex items-center justify-center shadow-lg border-2 border-primary-200">
                  <img 
                    src="/senpa-logo.png" 
                    alt="SENPA Logo" 
                    className="w-16 h-16 object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const nextSibling = e.currentTarget.nextElementSibling as HTMLElement;
                      if (nextSibling) {
                        nextSibling.style.display = 'block';
                      }
                    }}
                  />
                  <div className="hidden text-green-600 font-bold text-xs text-center">
                    SENPA<br/>LOGO
                  </div>
                </div>
              </div>
              <div className="text-center">
                <h1 className="dashboard-title text-balance">
                  Dashboard Ambiental SENPA
                </h1>
                <p className="dashboard-subtitle mt-1">
                  Sistema de Monitoreo de Operaciones Ambientales
                </p>
                <div className="flex items-center justify-center gap-4 mt-3">
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
                      {environmentalCases.filter(c => c.fecha && c.fecha.trim()).length} casos válidos
                      {environmentalCases.length !== environmentalCases.filter(c => c.fecha && c.fecha.trim()).length && (
                        <span className="text-neutral-500 ml-1">
                          ({environmentalCases.length - environmentalCases.filter(c => c.fecha && c.fecha.trim()).length} sin fecha)
                        </span>
                      )}
                      {loading && (
                        <span className="text-neutral-500 ml-1">(actualizando...)</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Controles de acción */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              {/* Info de última actualización */}
              <div className="hidden lg:block text-center">
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
                
                {permissions.canViewRecords && (
                  <Link to="/detainees-map" className="btn-sm btn-secondary min-w-0" title="Ver Mapa de Calor de Detenidos">
                    <span className="text-base">👥</span>
                    <span className="hidden lg:inline ml-2">Detenidos</span>
                  </Link>
                )}

                {permissions.canViewRecords && (
                  <Link to="/vehicles-map" className="btn-sm btn-secondary min-w-0" title="Ver Mapa de Vehículos Detenidos">
                    <span className="text-base">🚗</span>
                    <span className="hidden lg:inline ml-2">Vehículos</span>
                  </Link>
                )}

                {permissions.canViewRecords && (
                  <Link to="/chart-builder" className="btn-sm btn-primary min-w-0" title="Constructor de Gráficos">
                    <span className="text-base">📊</span>
                    <span className="hidden lg:inline ml-2">Gráficos</span>
                  </Link>
                )}
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
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-up">
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
                  <MemoizedEnvironmentalTable 
                    cases={filteredCases} 
                    filters={filters} 
                    onUpdateCase={updateCase}
                    onDeleteCase={deleteCase}
                    isEditable={true}
                  />
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
