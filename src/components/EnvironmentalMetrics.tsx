import React, { useMemo } from 'react';
import { 
  Assignment as OperativosIcon,
  Security as DetenidosIcon,
  LocalShipping as VehiculosIcon,
  Inventory as IncautacionesIcon,
  LocationOn as AreasIcon,
  DirectionsCar as PatrullasIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import EnvironmentalAnalyticsService, { type EnvironmentalCase, type EnvironmentalFilters } from '../services/environmentalAnalytics';

interface EnvironmentalMetricsProps {
  cases: EnvironmentalCase[];
  filters?: EnvironmentalFilters;
  layout?: 'horizontal' | 'vertical';
}

const EnvironmentalMetrics: React.FC<EnvironmentalMetricsProps> = ({ 
  cases, 
  filters
}) => {
  const analyticsService = useMemo(() => new EnvironmentalAnalyticsService(), []);
  
  const metrics = useMemo(() => {
    return analyticsService.calculateMetrics(cases, filters);
  }, [cases, filters, analyticsService]);

  const previousPeriodMetrics = useMemo(() => {
    // Calcular métricas del período anterior para comparación
    if (!filters?.dateFrom) return null;
    
    const startDate = new Date(`${filters.dateFrom}T00:00:00`);
    const endDate = filters.dateTo ? new Date(`${filters.dateTo}T23:59:59.999`) : new Date();
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const previousStartDate = new Date(startDate);
    previousStartDate.setDate(previousStartDate.getDate() - daysDiff);

    const previousEndDate = new Date(startDate);
    previousEndDate.setDate(previousEndDate.getDate() - 1);

    const previousFilters = {
      ...filters,
      dateFrom: previousStartDate.toISOString().split('T')[0],
      dateTo: previousEndDate.toISOString().split('T')[0]
    };
    
    return analyticsService.calculateMetrics(cases, previousFilters);
  }, [cases, filters, analyticsService]);

  const calculateTrend = (current: number, previous: number | null): { value: number; isPositive: boolean } => {
    if (previous === null || previous === 0) return { value: 0, isPositive: true };
    const change = ((current - previous) / previous) * 100;
    return { value: Math.abs(change), isPositive: change >= 0 };
  };

  const metricCards = [
    {
      title: 'Operativos Realizados',
      value: metrics.operativosRealizados,
      icon: OperativosIcon,
      colorClass: 'bg-primary-600',
      iconBg: 'bg-primary-100',
      iconColor: 'text-primary-600',
      description: 'Total de actividades tipo "operativo"',
      trend: previousPeriodMetrics ? calculateTrend(metrics.operativosRealizados, previousPeriodMetrics.operativosRealizados) : null
    },
    {
      title: 'Patrullas',
      value: metrics.patrullas,
      icon: PatrullasIcon,
      colorClass: 'bg-verde-seco-600',
      iconBg: 'bg-verde-seco-100',
      iconColor: 'text-verde-seco-600',
      description: 'Total de actividades tipo "patrulla"',
      trend: previousPeriodMetrics ? calculateTrend(metrics.patrullas, previousPeriodMetrics.patrullas) : null
    },
    {
      title: 'Detenidos',
      value: metrics.detenidos,
      icon: DetenidosIcon,
      colorClass: 'bg-error-600',
      iconBg: 'bg-error-100',
      iconColor: 'text-error-600',
      description: 'Total de personas detenidas',
      trend: previousPeriodMetrics ? calculateTrend(metrics.detenidos, previousPeriodMetrics.detenidos) : null
    },
    {
      title: 'Vehículos Detenidos',
      value: metrics.vehiculosDetenidos,
      icon: VehiculosIcon,
      colorClass: 'bg-warning-600',
      iconBg: 'bg-warning-100',
      iconColor: 'text-warning-700',
      description: 'Vehículos reportados como detenidos',
      trend: previousPeriodMetrics ? calculateTrend(metrics.vehiculosDetenidos, previousPeriodMetrics.vehiculosDetenidos) : null
    },
    {
      title: 'Incautaciones',
      value: metrics.incautaciones,
      icon: IncautacionesIcon,
      colorClass: 'bg-neutral-700',
      iconBg: 'bg-neutral-100',
      iconColor: 'text-neutral-700',
      description: 'Objetos incautados (machetes, carbón, etc.)',
      trend: previousPeriodMetrics ? calculateTrend(metrics.incautaciones, previousPeriodMetrics.incautaciones) : null
    },
    {
      title: 'Áreas Intervenidas',
      value: metrics.areasIntervenidas,
      icon: AreasIcon,
      colorClass: 'bg-success-600',
      iconBg: 'bg-success-100',
      iconColor: 'text-success-600',
      description: 'Localidades únicas con operativos',
      trend: previousPeriodMetrics ? calculateTrend(metrics.areasIntervenidas, previousPeriodMetrics.areasIntervenidas) : null
    }
  ];

  return (
    <>
      {metricCards.map((metric, index) => {
        const IconComponent = metric.icon;
        return (
          <div key={index} className="metric-card">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${metric.iconBg} rounded-xl flex items-center justify-center`}>
                <IconComponent className={`${metric.iconColor}`} style={{ fontSize: 24 }} />
              </div>
              {metric.trend && (
                <div className={`flex items-center gap-1 text-xs font-medium ${
                  metric.trend.isPositive ? 'text-success-600' : 'text-error-600'
                }`}>
                  <TrendingUpIcon
                    style={{
                      fontSize: 14,
                      transform: metric.trend.isPositive ? 'none' : 'rotate(180deg)'
                    }}
                  />
                  {metric.trend.value.toFixed(1)}%
                </div>
              )}
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
        );
      })}
    </>
  );
};

export default EnvironmentalMetrics;