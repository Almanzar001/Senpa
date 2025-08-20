import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Assignment as OperativosIcon,
  Security as DetenidosIcon,
  LocalShipping as VehiculosIcon,
  Inventory as IncautacionesIcon,
  LocationOn as AreasIcon,
  DirectionsCar as PatrullasIcon,
  Notifications as NotificadosIcon,
  AccountBalance as ProcuraduriaIcon
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
  const navigate = useNavigate();
  const analyticsService = useMemo(() => new EnvironmentalAnalyticsService(), []);
  
  const metrics = useMemo(() => {
    return analyticsService.calculateMetrics(cases, filters);
  }, [cases, filters, analyticsService]);

  const metricCards = [
    {
      title: 'Operativos Realizados',
      value: metrics.operativosRealizados,
      icon: OperativosIcon,
      colorClass: 'bg-primary-600',
      iconBg: 'bg-primary-100',
      iconColor: 'text-primary-600',
      description: 'Total de actividades tipo "operativo"',
      filterKey: 'operativos'
    },
    {
      title: 'Patrullas',
      value: metrics.patrullas,
      icon: PatrullasIcon,
      colorClass: 'bg-verde-seco-600',
      iconBg: 'bg-verde-seco-100',
      iconColor: 'text-verde-seco-600',
      description: 'Total de actividades tipo "patrulla"',
      filterKey: 'patrullas'
    },
    {
      title: 'Detenidos',
      value: metrics.detenidos,
      icon: DetenidosIcon,
      colorClass: 'bg-error-600',
      iconBg: 'bg-error-100',
      iconColor: 'text-error-600',
      description: 'Total de personas detenidas',
      filterKey: 'detenidos'
    },
    {
      title: 'Vehículos Detenidos',
      value: metrics.vehiculosDetenidos,
      icon: VehiculosIcon,
      colorClass: 'bg-warning-600',
      iconBg: 'bg-warning-100',
      iconColor: 'text-warning-700',
      description: 'Vehículos reportados como detenidos',
      filterKey: 'vehiculos'
    },
    {
      title: 'Incautaciones',
      value: metrics.incautaciones,
      icon: IncautacionesIcon,
      colorClass: 'bg-neutral-700',
      iconBg: 'bg-neutral-100',
      iconColor: 'text-neutral-700',
      description: 'Objetos incautados (machetes, carbón, etc.)',
      filterKey: 'incautaciones'
    },
    {
      title: 'Áreas Intervenidas',
      value: metrics.areasIntervenidas,
      icon: AreasIcon,
      colorClass: 'bg-success-600',
      iconBg: 'bg-success-100',
      iconColor: 'text-success-600',
      description: 'Localidades únicas con operativos',
      filterKey: 'areas'
    },
    {
      title: 'Notificados',
      value: metrics.notificados,
      icon: NotificadosIcon,
      colorClass: 'bg-info-600',
      iconBg: 'bg-info-100',
      iconColor: 'text-info-600',
      description: 'Casos con notificaciones registradas',
      filterKey: 'notificados'
    },
    {
      title: 'Procuraduría',
      value: metrics.procuraduria,
      icon: ProcuraduriaIcon,
      colorClass: 'bg-purple-600',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      description: 'Casos enviados a Procuraduría',
      filterKey: 'procuraduria'
    }
  ];

  const handleCardClick = (filterKey: string, value: number) => {
    if (value > 0) {
      // Direct route to specific pages for better organization
      if (filterKey === 'notificados') {
        navigate('/operations/notificados');
      } else {
        navigate(`/operations?filter=${filterKey}&value=${value}`);
      }
    }
  };

  return (
    <>
      {metricCards.map((metric, index) => {
        const IconComponent = metric.icon;
        const isClickable = metric.value > 0;
        return (
          <div 
            key={index} 
            className={`metric-card ${isClickable ? 'cursor-pointer hover:transform hover:scale-105 hover:shadow-lg transition-all duration-200' : 'cursor-default'}`}
            onClick={() => handleCardClick(metric.filterKey, metric.value)}
            title={isClickable ? `Click para ver detalles de ${metric.title.toLowerCase()}` : undefined}
          >
            <div className="flex flex-col items-center justify-center text-center h-full space-y-4">
              <div className={`w-16 h-16 ${metric.iconBg} rounded-xl flex items-center justify-center ${isClickable ? 'group-hover:shadow-md' : ''}`}>
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
                {isClickable && (
                  <p className="text-xs text-blue-600 opacity-0 hover:opacity-100 transition-opacity duration-200">
                    Click para ver detalles →
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
};

export default EnvironmentalMetrics;