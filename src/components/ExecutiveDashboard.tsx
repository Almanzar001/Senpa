import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, Typography, Box, Button, Chip, IconButton, Tooltip } from '@mui/material';
import { 
  Dashboard as DashboardIcon,
  ArrowBack as BackIcon,
  Assignment as OperativosIcon,
  DirectionsCar as PatrullasIcon,
  Security as DetenidosIcon,
  LocalShipping as VehiculosIcon,
  AccountBalance as ProcuraduriaIcon,
  Notifications as NotificadosIcon,
  Today as TodayIcon,
  History as YesterdayIcon,
  CalendarMonth as CalendarIcon,
  Map as MapIcon,
  Person as PersonIcon,
  CarRental as CarIcon,
  ManageAccounts as ManageAccountsIcon
} from '@mui/icons-material';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { simpleAuth } from '../services/simpleAuth';
import EnvironmentalCharts from './EnvironmentalCharts';
import SecondaryIndicators from './SecondaryIndicators';

type DateFilter = 'today' | 'yesterday' | 'thisMonth' | 'all';

const ExecutiveDashboard: React.FC = () => {
  const { cases, filteredCases, loading, error, filters, setFilters } = useData();
  const { user } = useAuth();
  const [selectedDateFilter, setSelectedDateFilter] = useState<DateFilter>('all');

  // Function to get date ranges
  const getDateRange = (filter: DateFilter): { dateFrom: string; dateTo: string } => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    switch (filter) {
      case 'today':
        return {
          dateFrom: today.toISOString().split('T')[0],
          dateTo: today.toISOString().split('T')[0]
        };
      case 'yesterday':
        return {
          dateFrom: yesterday.toISOString().split('T')[0],
          dateTo: yesterday.toISOString().split('T')[0]
        };
      case 'thisMonth':
        return {
          dateFrom: startOfMonth.toISOString().split('T')[0],
          dateTo: endOfMonth.toISOString().split('T')[0]
        };
      default:
        return { dateFrom: '', dateTo: '' };
    }
  };

  // Handle date filter change
  const handleDateFilterChange = (filter: DateFilter) => {
    setSelectedDateFilter(filter);
    
    // Update global filters in context
    const dateRange = getDateRange(filter);
    setFilters({
      ...filters,
      dateFrom: dateRange.dateFrom,
      dateTo: dateRange.dateTo,
      activeDateFilter: filter,
      isExecutiveView: true
    });
    
    console.log('🟦 Executive Dashboard - Filtros actualizados:', {
      filter,
      dateRange,
      globalFilters: {
        ...filters,
        dateFrom: dateRange.dateFrom,
        dateTo: dateRange.dateTo
      }
    });
  };

  // Initialize filters when component mounts
  useEffect(() => {
    // Set initial filter state to match context
    if (filters.activeDateFilter) {
      setSelectedDateFilter(filters.activeDateFilter as DateFilter);
    } else {
      // Initialize with 'all' filter if no active filter
      handleDateFilterChange('all');
    }
  }, []); // Only run once on mount

  // Use filtered cases from context (no local filtering needed)
  // The filtering is now handled by the global context

  // Calculate main metrics
  const metrics = React.useMemo(() => {
    if (!filteredCases || filteredCases.length === 0) {
      return {
        operativos: 0,
        patrullas: 0,
        detenidos: 0,
        vehiculos: 0,
        procuraduria: 0,
        notificados: 0
      };
    }

    let operativos = 0;
    let patrullas = 0;
    let detenidos = 0;
    let vehiculos = 0;
    let procuraduria = 0;
    let notificados = 0;

    filteredCases.forEach(caso => {
      // Contar operativos
      if (caso.tipoActividad && caso.tipoActividad.toLowerCase().includes('operativo')) {
        operativos++;
      }
      
      // Contar patrullas
      if (caso.tipoActividad && caso.tipoActividad.toLowerCase().includes('patrulla')) {
        patrullas++;
      }
      
      // Contar detenidos
      if (caso.detenidos && caso.detenidos > 0) {
        detenidos += caso.detenidos;
      }
      
      // Contar vehículos
      if (caso.vehiculosDetenidos && caso.vehiculosDetenidos > 0) {
        vehiculos += caso.vehiculosDetenidos;
      }
      
      // Contar casos con procuraduría
      if (caso.procuraduria) {
        procuraduria++;
      }
      
      // Contar notificados (total de personas notificadas)
      if (caso.notificadosCount && caso.notificadosCount > 0) {
        notificados += caso.notificadosCount;
      } else if (caso.notificados && String(caso.notificados).trim() !== '') {
        // Fallback: contar por separadores si no hay notificadosCount
        const notificadosStr = String(caso.notificados).trim();
        const names = notificadosStr.split(/[,;|\n\r]+/)
          .map(name => name.trim())
          .filter(name => name.length > 0 && name.toLowerCase() !== 'n/a' && name.toLowerCase() !== 'na');
        notificados += names.length;
      }
    });

    return {
      operativos,
      patrullas,
      detenidos,
      vehiculos,
      procuraduria,
      notificados
    };
  }, [filteredCases]);

  const metricCards = [
    {
      title: 'Operativos Realizados',
      value: metrics.operativos,
      icon: OperativosIcon,
      colorClass: 'bg-primary-600',
      iconBg: 'bg-primary-100',
      iconColor: 'text-primary-600',
      description: 'Total de actividades tipo "operativo"'
    },
    {
      title: 'Patrullas',
      value: metrics.patrullas,
      icon: PatrullasIcon,
      colorClass: 'bg-verde-seco-600',
      iconBg: 'bg-verde-seco-100',
      iconColor: 'text-verde-seco-600',
      description: 'Total de actividades tipo "patrulla"'
    },
    {
      title: 'Detenidos',
      value: metrics.detenidos,
      icon: DetenidosIcon,
      colorClass: 'bg-error-600',
      iconBg: 'bg-error-100',
      iconColor: 'text-error-600',
      description: 'Total de personas detenidas'
    },
    {
      title: 'Vehículos Detenidos',
      value: metrics.vehiculos,
      icon: VehiculosIcon,
      colorClass: 'bg-warning-600',
      iconBg: 'bg-warning-100',
      iconColor: 'text-warning-700',
      description: 'Vehículos reportados como detenidos'
    },
    {
      title: 'Procuraduría',
      value: metrics.procuraduria,
      icon: ProcuraduriaIcon,
      colorClass: 'bg-purple-600',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      description: 'Casos enviados a Procuraduría'
    },
    {
      title: 'Notificados',
      value: metrics.notificados,
      icon: NotificadosIcon,
      colorClass: 'bg-info-600',
      iconBg: 'bg-info-100',
      iconColor: 'text-info-600',
      description: 'Casos con notificaciones registradas'
    }
  ];

  // Debug logs
  console.log('ExecutiveDashboard - Loading:', loading);
  console.log('ExecutiveDashboard - Cases:', cases?.length || 0);
  console.log('ExecutiveDashboard - Filtered:', filteredCases?.length || 0);
  console.log('ExecutiveDashboard - Metrics:', metrics);
  console.log('ExecutiveDashboard - Error:', error);
  
  // Debug específico para notificados
  if (filteredCases?.length > 0) {
    console.log('Sample cases with notificados:');
    filteredCases.slice(0, 3).forEach((caso, i) => {
      console.log(`Caso ${i}:`, {
        numeroCaso: caso.numeroCaso,
        notificados: caso.notificados,
        notificadosCount: caso.notificadosCount
      });
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">Cargando dashboard ejecutivo...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-red-600">
          <p>Error al cargar los datos: {error}</p>
          <Link to="/dashboard" className="text-blue-600 hover:underline mt-2 inline-block">
            Volver al Dashboard Principal
          </Link>
        </div>
      </div>
    );
  }

  // If no cases are available, show a message
  if (!cases || cases.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              {/* Logo SENPA */}
              <div className="flex-shrink-0 mr-4">
                <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center shadow-lg border-2 border-slate-200">
                  <img 
                    src="/senpa-logo.png" 
                    alt="SENPA Logo" 
                    className="w-12 h-12 object-contain"
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
              <div>
                <h1 className="text-3xl font-bold text-slate-800 mb-2">
                  Dashboard Ejecutivo SENPA
                </h1>
                <p className="text-slate-600 text-lg">No hay datos disponibles</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Map Buttons */}
              <Tooltip title="Mapa de Detenidos">
                <Link to="/detainees-map?from=executive">
                  <IconButton
                    size="small"
                    sx={{
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      color: 'rgb(239, 68, 68)',
                      '&:hover': {
                        backgroundColor: 'rgba(239, 68, 68, 0.2)',
                      }
                    }}
                  >
                    <PersonIcon fontSize="small" />
                  </IconButton>
                </Link>
              </Tooltip>

              <Tooltip title="Mapa de Vehículos">
                <Link to="/vehicles-map?from=executive">
                  <IconButton
                    size="small"
                    sx={{
                      backgroundColor: 'rgba(249, 115, 22, 0.1)',
                      color: 'rgb(249, 115, 22)',
                      '&:hover': {
                        backgroundColor: 'rgba(249, 115, 22, 0.2)',
                      }
                    }}
                  >
                    <CarIcon fontSize="small" />
                  </IconButton>
                </Link>
              </Tooltip>

              <Link to="/dashboard">
                <Button
                  variant="outlined"
                  startIcon={<BackIcon />}
                  sx={{ 
                    borderColor: 'rgb(71 85 105)',
                    color: 'rgb(71 85 105)',
                  }}
                >
                  Dashboard Principal
                </Button>
              </Link>
            </div>
          </div>
          
          <Card className="shadow-xl">
            <CardContent className="p-8 text-center">
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No hay casos para mostrar
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Los datos aparecerán cuando estén disponibles en el sistema.
              </Typography>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
        {/* Header - Mobile Optimized */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-4 sm:mb-8 gap-4">
          <div className="flex flex-col sm:flex-row items-center w-full sm:w-auto">
            {/* Logo SENPA */}
            <div className="flex-shrink-0 mb-2 sm:mb-0 sm:mr-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white rounded-xl flex items-center justify-center shadow-lg border-2 border-slate-200">
                <img 
                  src="/senpa-logo.png" 
                  alt="SENPA Logo" 
                  className="w-8 h-8 sm:w-12 sm:h-12 object-contain"
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
            <div className="text-center sm:text-left">
              <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-slate-800 mb-1 sm:mb-2">
                <span className="block sm:inline">Dashboard Ejecutivo</span> <span className="block sm:inline text-primary-600">SENPA</span>
              </h1>
              <p className="text-sm sm:text-base lg:text-lg text-slate-600">
                <span className="hidden sm:inline">Resumen ejecutivo - </span>
                <span className="hidden lg:inline">
                  {new Date().toLocaleDateString('es-ES', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </span>
                <span className="lg:hidden">
                  {new Date().toLocaleDateString('es-ES', { 
                    day: '2-digit', 
                    month: '2-digit', 
                    year: '2-digit'
                  })}
                </span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-3 flex-wrap justify-center">
            {/* Map Buttons */}
            <Tooltip title="Mapa de Detenidos">
              <Link to="/detainees-map?from=executive">
                <IconButton
                  size="small"
                  sx={{
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    color: 'rgb(239, 68, 68)',
                    width: { xs: '32px', sm: '40px' },
                    height: { xs: '32px', sm: '40px' },
                    '&:hover': {
                      backgroundColor: 'rgba(239, 68, 68, 0.2)',
                    }
                  }}
                >
                  <PersonIcon sx={{ fontSize: { xs: '16px', sm: '20px' } }} />
                </IconButton>
              </Link>
            </Tooltip>

            <Tooltip title="Mapa de Vehículos">
              <Link to="/vehicles-map?from=executive">
                <IconButton
                  size="small"
                  sx={{
                    backgroundColor: 'rgba(249, 115, 22, 0.1)',
                    color: 'rgb(249, 115, 22)',
                    width: { xs: '32px', sm: '40px' },
                    height: { xs: '32px', sm: '40px' },
                    '&:hover': {
                      backgroundColor: 'rgba(249, 115, 22, 0.2)',
                    }
                  }}
                >
                  <CarIcon sx={{ fontSize: { xs: '16px', sm: '20px' } }} />
                </IconButton>
              </Link>
            </Tooltip>


            <Link to="/dashboard">
              <Button
                variant="outlined"
                startIcon={<BackIcon />}
                size="small"
                sx={{ 
                  borderColor: 'rgb(71 85 105)',
                  color: 'rgb(71 85 105)',
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  padding: { xs: '4px 8px', sm: '6px 16px' },
                  '&:hover': {
                    borderColor: 'rgb(51 65 85)',
                    color: 'rgb(51 65 85)',
                    backgroundColor: 'rgba(71, 85, 105, 0.04)'
                  }
                }}
              >
                <span className="hidden sm:inline">Dashboard Principal</span>
                <span className="sm:hidden">Principal</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Date Filter Buttons */}
        <Card className="shadow-lg mb-6">
          <CardContent className="p-2 sm:p-4">
            <div className="flex flex-col items-start justify-between gap-2 sm:gap-4">
              <div className="w-full text-center sm:text-left">
                <Typography variant="h6" className="font-bold text-slate-800 mb-1 text-sm sm:text-base">
                  Filtro de Fecha
                </Typography>
                <Typography variant="body2" color="text.secondary" className="text-xs sm:text-sm hidden sm:block">
                  Selecciona el período de tiempo para analizar
                </Typography>
              </div>
              
              <div className="flex flex-wrap gap-1 sm:gap-2 justify-center sm:justify-start w-full">
                <Button
                  variant={selectedDateFilter === 'all' ? 'contained' : 'outlined'}
                  startIcon={<CalendarIcon />}
                  onClick={() => handleDateFilterChange('all')}
                  size="small"
                  sx={{
                    textTransform: 'none',
                    backgroundColor: selectedDateFilter === 'all' ? 'rgb(71 85 105)' : 'transparent',
                    borderColor: 'rgb(71 85 105)',
                    color: selectedDateFilter === 'all' ? 'white' : 'rgb(71 85 105)',
                    fontSize: { xs: '0.7rem', sm: '0.875rem' },
                    padding: { xs: '2px 6px', sm: '6px 16px' },
                    minWidth: { xs: '50px', sm: '64px' },
                    '&:hover': {
                      backgroundColor: selectedDateFilter === 'all' ? 'rgb(51 65 85)' : 'rgba(71, 85, 105, 0.04)',
                    }
                  }}
                >
                  <span className="hidden sm:inline">Todos</span>
                  <span className="sm:hidden">Todo</span>
                </Button>
                
                <Button
                  variant={selectedDateFilter === 'today' ? 'contained' : 'outlined'}
                  startIcon={<TodayIcon />}
                  onClick={() => handleDateFilterChange('today')}
                  size="small"
                  sx={{
                    textTransform: 'none',
                    backgroundColor: selectedDateFilter === 'today' ? 'rgb(34 197 94)' : 'transparent',
                    borderColor: 'rgb(34 197 94)',
                    color: selectedDateFilter === 'today' ? 'white' : 'rgb(34 197 94)',
                    fontSize: { xs: '0.7rem', sm: '0.875rem' },
                    padding: { xs: '2px 6px', sm: '6px 16px' },
                    minWidth: { xs: '40px', sm: '64px' },
                    '&:hover': {
                      backgroundColor: selectedDateFilter === 'today' ? 'rgb(21 128 61)' : 'rgba(34, 197, 94, 0.04)',
                    }
                  }}
                >
                  Hoy
                </Button>

                <Button
                  variant={selectedDateFilter === 'yesterday' ? 'contained' : 'outlined'}
                  startIcon={<YesterdayIcon />}
                  onClick={() => handleDateFilterChange('yesterday')}
                  size="small"
                  sx={{
                    textTransform: 'none',
                    backgroundColor: selectedDateFilter === 'yesterday' ? 'rgb(249 115 22)' : 'transparent',
                    borderColor: 'rgb(249 115 22)',
                    color: selectedDateFilter === 'yesterday' ? 'white' : 'rgb(249 115 22)',
                    fontSize: { xs: '0.7rem', sm: '0.875rem' },
                    padding: { xs: '2px 6px', sm: '6px 16px' },
                    minWidth: { xs: '40px', sm: '64px' },
                    '&:hover': {
                      backgroundColor: selectedDateFilter === 'yesterday' ? 'rgb(194 65 12)' : 'rgba(249, 115, 22, 0.04)',
                    }
                  }}
                >
                  Ayer
                </Button>

                <Button
                  variant={selectedDateFilter === 'thisMonth' ? 'contained' : 'outlined'}
                  startIcon={<CalendarIcon />}
                  onClick={() => handleDateFilterChange('thisMonth')}
                  size="small"
                  sx={{
                    textTransform: 'none',
                    backgroundColor: selectedDateFilter === 'thisMonth' ? 'rgb(99 102 241)' : 'transparent',
                    borderColor: 'rgb(99 102 241)',
                    color: selectedDateFilter === 'thisMonth' ? 'white' : 'rgb(99 102 241)',
                    fontSize: { xs: '0.7rem', sm: '0.875rem' },
                    padding: { xs: '2px 6px', sm: '6px 16px' },
                    minWidth: { xs: '50px', sm: '80px' },
                    '&:hover': {
                      backgroundColor: selectedDateFilter === 'thisMonth' ? 'rgb(79 70 229)' : 'rgba(99, 102, 241, 0.04)',
                    }
                  }}
                >
                  <span className="hidden sm:inline">Este Mes</span>
                  <span className="sm:hidden">Mes</span>
                </Button>
              </div>
            </div>
            
            {/* Active Filter Indicator */}
            {selectedDateFilter !== 'all' && (
              <Box className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-100 text-center sm:text-left">
                <Chip 
                  label={`${
                    selectedDateFilter === 'today' ? 'Hoy' :
                    selectedDateFilter === 'yesterday' ? 'Ayer' :
                    selectedDateFilter === 'thisMonth' ? 'Este Mes' : ''
                  } • ${filteredCases.length} registros`}
                  color="primary"
                  variant="outlined"
                  size="small"
                  sx={{
                    fontSize: { xs: '0.65rem', sm: '0.75rem' },
                    height: { xs: '20px', sm: '24px' }
                  }}
                />
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Main Metrics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-6 mb-4 sm:mb-8">
          {metricCards.map((metric, index) => {
            const IconComponent = metric.icon;
            return (
              <div 
                key={index} 
                className="metric-card cursor-pointer hover:transform hover:scale-105 hover:shadow-lg transition-all duration-200"
              >
                <div className="flex flex-col items-center justify-center text-center h-full space-y-2 sm:space-y-4 p-2 sm:p-4">
                  <div className={`w-10 h-10 sm:w-16 sm:h-16 ${metric.iconBg} rounded-xl flex items-center justify-center group-hover:shadow-md`}>
                    <IconComponent className={`${metric.iconColor} text-lg sm:text-2xl`} />
                  </div>
                  
                  <div className="space-y-1 sm:space-y-2">
                    <div className="text-xs sm:text-sm font-semibold text-neutral-700 leading-tight">
                      {metric.title}
                    </div>
                    <div className="text-lg sm:text-2xl font-bold text-neutral-900">
                      {metric.value.toLocaleString()}
                    </div>
                    <p className="text-xs text-neutral-600 leading-relaxed hidden sm:block">
                      {metric.description}
                    </p>
                    <p className="text-xs text-neutral-600 leading-tight sm:hidden">
                      {metric.description.split(' ').slice(0, 3).join(' ')}...
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Charts Section */}
        <Card className="shadow-xl mb-4 sm:mb-8">
          <CardContent className="p-3 sm:p-6">
            <Typography variant="h5" className="font-bold text-slate-800 mb-3 sm:mb-6 text-lg sm:text-xl text-center sm:text-left">
              Análisis Detallado
            </Typography>
            <EnvironmentalCharts 
              cases={filteredCases}
              filters={{ 
                dateFrom: filters.dateFrom,
                dateTo: filters.dateTo,
                provincia: '',
                division: '',
                tipoActividad: '',
                areaTemática: '',
                activeDateFilter: filters.activeDateFilter,
                isExecutiveView: true 
              }}
            />
          </CardContent>
        </Card>

        {/* Secondary Indicators */}
        <Card className="shadow-xl">
          <CardContent className="p-3 sm:p-6">
            <Typography variant="h5" className="font-bold text-slate-800 mb-3 sm:mb-6 text-lg sm:text-xl text-center sm:text-left">
              Indicadores Secundarios
            </Typography>
            <SecondaryIndicators 
              cases={filteredCases}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ExecutiveDashboard;