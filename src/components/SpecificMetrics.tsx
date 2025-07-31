import React, { useMemo } from 'react';
import { Card, CardContent, Typography } from '@mui/material';
import { 
  Security as SecurityIcon,
  Today as TodayIcon,
  People as PeopleIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { type SheetData } from '../services/googleSheets';
import { type FilterOptions } from './AdvancedFilters';

interface SpecificMetricsProps {
  sheetsData: SheetData[];
  filters?: FilterOptions;
}

const SpecificMetrics: React.FC<SpecificMetricsProps> = ({ sheetsData, filters }) => {
  const metrics = useMemo(() => {
    if (!sheetsData || sheetsData.length === 0) {
      return {
        detenidosHoy: 0,
        totalDetenidos: 0,
        incidentesActivos: 0,
        casosResueltos: 0,
        promedioMensual: 0
      };
    }

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
    const todayAlt = today.toLocaleDateString('es-ES'); // DD/MM/YYYY
    
    let detenidosHoy = 0;
    let totalDetenidos = 0;
    let incidentesActivos = 0;
    let casosResueltos = 0;

    sheetsData.forEach(sheet => {
      if (sheet.data.length <= 1) return; // No data beyond headers
      
      const headers = sheet.data[0] as string[];
      const rows = sheet.data.slice(1);
      
      // Find relevant columns (case insensitive)
      const fechaCol = headers.findIndex(h => 
        h.toLowerCase().includes('fecha') || 
        h.toLowerCase().includes('date')
      );
      
      const estadoCol = headers.findIndex(h => 
        h.toLowerCase().includes('estado') || 
        h.toLowerCase().includes('status') ||
        h.toLowerCase().includes('situacion')
      );
      
      const tipoCol = headers.findIndex(h => 
        h.toLowerCase().includes('tipo') || 
        h.toLowerCase().includes('categoria') ||
        h.toLowerCase().includes('tipo_incidente')
      );

      rows.forEach(row => {
        const fecha = fechaCol >= 0 ? String(row[fechaCol] || '') : '';
        const estado = estadoCol >= 0 ? String(row[estadoCol] || '').toLowerCase() : '';
        const tipo = tipoCol >= 0 ? String(row[tipoCol] || '').toLowerCase() : '';
        const ubicacion = headers.findIndex(h => 
          h.toLowerCase().includes('ubicacion') || 
          h.toLowerCase().includes('zona') ||
          h.toLowerCase().includes('lugar')
        );
        const ubicacionValue = ubicacion >= 0 ? String(row[ubicacion] || '') : '';
        
        // Apply filters
        if (filters) {
          // Date filter
          if (filters.dateFrom || filters.dateTo) {
            const rowDate = fecha ? new Date(fecha.split('/').reverse().join('-') || fecha) : null;
            if (rowDate) {
              if (filters.dateFrom && rowDate < new Date(filters.dateFrom)) return;
              if (filters.dateTo && rowDate > new Date(filters.dateTo)) return;
            }
          }
          
          // State filter
          if (filters.states.length > 0) {
            const matchesState = filters.states.some(filterState => 
              estado.includes(filterState.toLowerCase()) || 
              String(row[estadoCol] || '').toLowerCase().includes(filterState.toLowerCase())
            );
            if (!matchesState) return;
          }
          
          // Location filter
          if (filters.locations.length > 0) {
            const matchesLocation = filters.locations.some(filterLocation =>
              ubicacionValue.toLowerCase().includes(filterLocation.toLowerCase())
            );
            if (!matchesLocation) return;
          }
          
          // Type filter
          if (filters.types.length > 0) {
            const matchesType = filters.types.some(filterType =>
              tipo.includes(filterType.toLowerCase()) ||
              String(row[tipoCol] || '').toLowerCase().includes(filterType.toLowerCase())
            );
            if (!matchesType) return;
          }
          
          // Search text filter
          if (filters.searchText) {
            const searchLower = filters.searchText.toLowerCase();
            const matchesSearch = Object.values(row).some(cellValue =>
              String(cellValue || '').toLowerCase().includes(searchLower)
            );
            if (!matchesSearch) return;
          }
        }
        
        // Count today's detentions (if no date filter is applied, use today)
        const countTodayDetentions = !filters?.dateFrom && !filters?.dateTo;
        if (countTodayDetentions && (fecha.includes(todayStr) || fecha.includes(todayAlt))) {
          if (tipo.includes('detenido') || tipo.includes('arresto') || tipo.includes('captura')) {
            detenidosHoy++;
          }
        } else if (filters?.dateFrom || filters?.dateTo) {
          // If date filters are applied, count detentions in that range
          if (tipo.includes('detenido') || tipo.includes('arresto') || tipo.includes('captura')) {
            detenidosHoy++;
          }
        }
        
        // Count total detentions
        if (tipo.includes('detenido') || tipo.includes('arresto') || tipo.includes('captura') || 
            estado.includes('detenido') || estado.includes('arrestado')) {
          totalDetenidos++;
        }
        
        // Count active incidents
        if (estado.includes('activo') || estado.includes('pendiente') || estado.includes('abierto')) {
          incidentesActivos++;
        }
        
        // Count resolved cases
        if (estado.includes('resuelto') || estado.includes('cerrado') || estado.includes('completado')) {
          casosResueltos++;
        }
      });
    });

    const promedioMensual = Math.round(totalDetenidos / 30 * 100) / 100;

    return {
      detenidosHoy,
      totalDetenidos,
      incidentesActivos,
      casosResueltos,
      promedioMensual
    };
  }, [sheetsData, filters]);

  const metricCards = [
    {
      title: 'Detenidos Hoy',
      value: metrics.detenidosHoy,
      icon: SecurityIcon,
      color: 'from-red-500 to-red-600',
      textColor: 'text-red-100',
      bgColor: 'bg-red-500'
    },
    {
      title: 'Total Detenidos',
      value: metrics.totalDetenidos,
      icon: PeopleIcon,
      color: 'from-orange-500 to-orange-600',
      textColor: 'text-orange-100',
      bgColor: 'bg-orange-500'
    },
    {
      title: 'Incidentes Activos',
      value: metrics.incidentesActivos,
      icon: WarningIcon,
      color: 'from-yellow-500 to-yellow-600',
      textColor: 'text-yellow-100',
      bgColor: 'bg-yellow-500'
    },
    {
      title: 'Casos Resueltos',
      value: metrics.casosResueltos,
      icon: CheckCircleIcon,
      color: 'from-green-500 to-green-600',
      textColor: 'text-green-100',
      bgColor: 'bg-green-500'
    },
    {
      title: 'Promedio Mensual',
      value: metrics.promedioMensual,
      icon: TrendingUpIcon,
      color: 'from-blue-500 to-blue-600',
      textColor: 'text-blue-100',
      bgColor: 'bg-blue-500'
    },
    {
      title: 'Día Actual',
      value: new Date().toLocaleDateString('es-ES'),
      icon: TodayIcon,
      color: 'from-purple-500 to-purple-600',
      textColor: 'text-purple-100',
      bgColor: 'bg-purple-500',
      isDate: true
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {metricCards.map((metric, index) => {
        const IconComponent = metric.icon;
        return (
          <Card 
            key={index} 
            className={`bg-gradient-to-r ${metric.color} text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105`}
            style={{
              background: `linear-gradient(to right, ${metric.bgColor === 'bg-red-500' ? '#ef4444, #dc2626' : 
                          metric.bgColor === 'bg-orange-500' ? '#f97316, #ea580c' :
                          metric.bgColor === 'bg-yellow-500' ? '#eab308, #ca8a04' :
                          metric.bgColor === 'bg-green-500' ? '#22c55e, #16a34a' :
                          metric.bgColor === 'bg-blue-500' ? '#3b82f6, #2563eb' :
                          '#8b5cf6, #7c3aed'})`
            }}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <Typography variant="h6" className={`${metric.textColor} mb-2 font-semibold`}>
                    {metric.title}
                  </Typography>
                  <Typography variant="h3" className="font-bold text-white">
                    {metric.isDate ? metric.value : metric.value.toLocaleString()}
                  </Typography>
                  {metric.title === 'Detenidos Hoy' && metrics.detenidosHoy > 0 && (
                    <Typography variant="body2" className={metric.textColor}>
                      ⚠️ Atención requerida
                    </Typography>
                  )}
                </div>
                <IconComponent style={{ fontSize: 48, opacity: 0.8 }} className="text-white" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default SpecificMetrics;