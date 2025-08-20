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
  CarRental as CarIcon
} from '@mui/icons-material';
import { useData } from '../contexts/DataContext';
import EnvironmentalCharts from './EnvironmentalCharts';
import SecondaryIndicators from './SecondaryIndicators';

type DateFilter = 'today' | 'yesterday' | 'thisMonth' | 'all';

const ExecutiveDashboard: React.FC = () => {
  const { cases, filteredCases, loading, error, filters, setFilters } = useData();
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
        <div className="max-w-7xl mx-auto px-6 py-8">
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
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
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
              <p className="text-slate-600 text-lg">
                Resumen ejecutivo - {new Date().toLocaleDateString('es-ES', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
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
                  '&:hover': {
                    borderColor: 'rgb(51 65 85)',
                    color: 'rgb(51 65 85)',
                    backgroundColor: 'rgba(71, 85, 105, 0.04)'
                  }
                }}
              >
                Dashboard Principal
              </Button>
            </Link>
          </div>
        </div>

        {/* Date Filter Buttons */}
        <Card className="shadow-lg mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <Typography variant="h6" className="font-bold text-slate-800 mb-1">
                  Filtro de Fecha
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Selecciona el período de tiempo para analizar
                </Typography>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedDateFilter === 'all' ? 'contained' : 'outlined'}
                  startIcon={<CalendarIcon />}
                  onClick={() => handleDateFilterChange('all')}
                  sx={{
                    textTransform: 'none',
                    backgroundColor: selectedDateFilter === 'all' ? 'rgb(71 85 105)' : 'transparent',
                    borderColor: 'rgb(71 85 105)',
                    color: selectedDateFilter === 'all' ? 'white' : 'rgb(71 85 105)',
                    '&:hover': {
                      backgroundColor: selectedDateFilter === 'all' ? 'rgb(51 65 85)' : 'rgba(71, 85, 105, 0.04)',
                    }
                  }}
                >
                  Todos
                </Button>
                
                <Button
                  variant={selectedDateFilter === 'today' ? 'contained' : 'outlined'}
                  startIcon={<TodayIcon />}
                  onClick={() => handleDateFilterChange('today')}
                  sx={{
                    textTransform: 'none',
                    backgroundColor: selectedDateFilter === 'today' ? 'rgb(34 197 94)' : 'transparent',
                    borderColor: 'rgb(34 197 94)',
                    color: selectedDateFilter === 'today' ? 'white' : 'rgb(34 197 94)',
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
                  sx={{
                    textTransform: 'none',
                    backgroundColor: selectedDateFilter === 'yesterday' ? 'rgb(249 115 22)' : 'transparent',
                    borderColor: 'rgb(249 115 22)',
                    color: selectedDateFilter === 'yesterday' ? 'white' : 'rgb(249 115 22)',
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
                  sx={{
                    textTransform: 'none',
                    backgroundColor: selectedDateFilter === 'thisMonth' ? 'rgb(99 102 241)' : 'transparent',
                    borderColor: 'rgb(99 102 241)',
                    color: selectedDateFilter === 'thisMonth' ? 'white' : 'rgb(99 102 241)',
                    '&:hover': {
                      backgroundColor: selectedDateFilter === 'thisMonth' ? 'rgb(79 70 229)' : 'rgba(99, 102, 241, 0.04)',
                    }
                  }}
                >
                  Este Mes
                </Button>
              </div>
            </div>
            
            {/* Active Filter Indicator */}
            {selectedDateFilter !== 'all' && (
              <Box className="mt-3 pt-3 border-t border-gray-100">
                <Chip 
                  label={`Filtro activo: ${
                    selectedDateFilter === 'today' ? 'Hoy' :
                    selectedDateFilter === 'yesterday' ? 'Ayer' :
                    selectedDateFilter === 'thisMonth' ? 'Este Mes' : ''
                  } • ${filteredCases.length} registros`}
                  color="primary"
                  variant="outlined"
                  size="small"
                />
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Main Metrics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6 mb-8">
          {metricCards.map((metric, index) => {
            const IconComponent = metric.icon;
            return (
              <div 
                key={index} 
                className="metric-card cursor-pointer hover:transform hover:scale-105 hover:shadow-lg transition-all duration-200"
              >
                <div className="flex flex-col items-center justify-center text-center h-full space-y-4">
                  <div className={`w-16 h-16 ${metric.iconBg} rounded-xl flex items-center justify-center group-hover:shadow-md`}>
                    <IconComponent className={`${metric.iconColor}`} style={{ fontSize: 28 }} />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="metric-label">
                      {metric.title}
                    </div>
                    <div className="metric-value">
                      {metric.value.toLocaleString()}
                    </div>
                    <p className="text-xs text-neutral-600 leading-relaxed">
                      {metric.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Charts Section */}
        <Card className="shadow-xl mb-8">
          <CardContent className="p-6">
            <Typography variant="h5" className="font-bold text-slate-800 mb-6">
              Análisis Detallado
            </Typography>
            <EnvironmentalCharts 
              cases={filteredCases}
              filters={{ isExecutiveView: true }}
            />
          </CardContent>
        </Card>

        {/* Secondary Indicators */}
        <Card className="shadow-xl">
          <CardContent className="p-6">
            <Typography variant="h5" className="font-bold text-slate-800 mb-6">
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