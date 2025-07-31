import React, { useMemo } from 'react';
import { Card, CardContent, Typography, Box, LinearProgress, Chip } from '@mui/material';
import { 
  Refresh as RefreshIcon,
  LocationOn as LocationIcon,
  Schedule as ScheduleIcon,
  DateRange as DateIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import { type EnvironmentalCase, type EnvironmentalFilters } from '../services/environmentalAnalytics';

interface SecondaryIndicatorsProps {
  cases: EnvironmentalCase[];
  filters?: EnvironmentalFilters;
}

const SecondaryIndicators: React.FC<SecondaryIndicatorsProps> = ({ cases }) => {
  const insights = useMemo(() => {
    if (!cases || cases.length === 0) {
      return {
        patrollasVsOperativos: { patrullas: 0, operativos: 0, totalActividades: 0 },
        provinciasActivas: [],
        horasFrecuentes: [],
        diasActivos: [],
        eficienciaOperativos: 0,
        promedioDetenidosPorOperativo: 0
      };
    }

    // 1. Porcentaje de patrullas vs operativos
    const patrullas = cases.filter(c => c.tipoActividad.toLowerCase().includes('patrulla')).length;
    const operativos = cases.filter(c => c.tipoActividad.toLowerCase().includes('operativo')).length;
    const totalActividades = patrullas + operativos;

    // 2. Provincias más activas
    const provinciaCount = new Map<string, number>();
    cases.forEach(c => {
      if (c.provincia) {
        provinciaCount.set(c.provincia, (provinciaCount.get(c.provincia) || 0) + 1);
      }
    });
    const provinciasActivas = Array.from(provinciaCount.entries())
      .map(([provincia, count]) => ({ provincia, operaciones: count }))
      .sort((a, b) => b.operaciones - a.operaciones)
      .slice(0, 3);

    // 3. Horas más frecuentes
    const horaCount = new Map<string, number>();
    cases.forEach(c => {
      if (c.hora) {
        const hora = c.hora.split(':')[0]; // Solo la hora, sin minutos
        horaCount.set(hora, (horaCount.get(hora) || 0) + 1);
      }
    });
    const horasFrecuentes = Array.from(horaCount.entries())
      .map(([hora, count]) => ({ hora: `${hora}:00`, operaciones: count }))
      .sort((a, b) => b.operaciones - a.operaciones)
      .slice(0, 3);

    // 4. Días más activos (día de la semana)
    const diaCount = new Map<string, number>();
    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    
    cases.forEach(c => {
      if (c.fecha) {
        let fecha: Date;
        // Parsear fecha en formato DD/MM/YYYY similar a otros componentes
        if (c.fecha.includes('/')) {
          const parts = c.fecha.split('/');
          if (parts.length === 3) {
            const day = parseInt(parts[0]);
            const month = parseInt(parts[1]) - 1; // Los meses en JS van de 0 a 11
            const year = parseInt(parts[2]);
            fecha = new Date(year, month, day);
          } else {
            fecha = new Date(c.fecha);
          }
        } else {
          fecha = new Date(c.fecha);
        }
        
        if (!isNaN(fecha.getTime())) {
          const diaSemana = diasSemana[fecha.getDay()];
          diaCount.set(diaSemana, (diaCount.get(diaSemana) || 0) + 1);
        }
      }
    });
    
    const diasActivos = Array.from(diaCount.entries())
      .map(([dia, count]) => ({ dia, operaciones: count }))
      .sort((a, b) => b.operaciones - a.operaciones)
      .slice(0, 3);

    // 5. Eficiencia de operativos (% de operativos con resultados)
    const operativosConResultados = cases.filter(c => 
      c.tipoActividad.toLowerCase().includes('operativo') && 
      (c.detenidos > 0 || c.vehiculosDetenidos > 0 || c.incautaciones.length > 0)
    ).length;
    const eficienciaOperativos = operativos > 0 ? Math.round((operativosConResultados / operativos) * 100) : 0;

    // 6. Promedio de detenidos por operativo
    const totalDetenidos = cases.reduce((sum, c) => sum + c.detenidos, 0);
    const promedioDetenidosPorOperativo = operativos > 0 ? Math.round((totalDetenidos / operativos) * 10) / 10 : 0;

    return {
      patrollasVsOperativos: { patrullas, operativos, totalActividades },
      provinciasActivas,
      horasFrecuentes,
      diasActivos,
      eficienciaOperativos,
      promedioDetenidosPorOperativo
    };
  }, [cases]);

  const indicatorCards = [
    {
      title: 'Patrullas vs Operativos',
      icon: RefreshIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      content: (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Patrullas</span>
            <span className="font-semibold">
              {insights.patrollasVsOperativos.totalActividades > 0 
                ? Math.round((insights.patrollasVsOperativos.patrullas / insights.patrollasVsOperativos.totalActividades) * 100)
                : 0}%
            </span>
          </div>
          <LinearProgress 
            variant="determinate" 
            value={insights.patrollasVsOperativos.totalActividades > 0 
              ? (insights.patrollasVsOperativos.patrullas / insights.patrollasVsOperativos.totalActividades) * 100
              : 0} 
            className="h-2 rounded-full"
            color="primary"
          />
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Operativos</span>
            <span className="font-semibold">
              {insights.patrollasVsOperativos.totalActividades > 0 
                ? Math.round((insights.patrollasVsOperativos.operativos / insights.patrollasVsOperativos.totalActividades) * 100)
                : 0}%
            </span>
          </div>
          <LinearProgress 
            variant="determinate" 
            value={insights.patrollasVsOperativos.totalActividades > 0 
              ? (insights.patrollasVsOperativos.operativos / insights.patrollasVsOperativos.totalActividades) * 100
              : 0} 
            className="h-2 rounded-full"
            color="error"
          />
        </div>
      )
    },
    {
      title: 'Provincias Más Activas',
      icon: LocationIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      content: (
        <div className="space-y-2">
          {insights.provinciasActivas.map((provincia, index) => (
            <div key={provincia.provincia} className="flex justify-between items-center">
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  index === 0 ? 'bg-green-500' : 
                  index === 1 ? 'bg-green-400' : 'bg-green-300'
                }`} />
                <span className="text-sm">{provincia.provincia}</span>
              </div>
              <Chip 
                label={provincia.operaciones}
                size="small"
                color="success"
                variant="outlined"
              />
            </div>
          ))}
        </div>
      )
    },
    {
      title: 'Horas Más Frecuentes',
      icon: ScheduleIcon,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      content: (
        <div className="space-y-2">
          {insights.horasFrecuentes.map((hora, index) => (
            <div key={hora.hora} className="flex justify-between items-center">
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  index === 0 ? 'bg-orange-500' : 
                  index === 1 ? 'bg-orange-400' : 'bg-orange-300'
                }`} />
                <span className="text-sm font-mono">{hora.hora}</span>
              </div>
              <Chip 
                label={`${hora.operaciones} ops`}
                size="small"
                color="warning"
                variant="outlined"
              />
            </div>
          ))}
          <div className="pt-2 border-t border-orange-200">
            <Typography variant="caption" className="text-orange-700">
              💡 Mayoría de operativos: 8:00 a.m. - 12:00 p.m.
            </Typography>
          </div>
        </div>
      )
    },
    {
      title: 'Días Más Activos',
      icon: DateIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      content: (
        <div className="space-y-2">
          {insights.diasActivos.map((dia, index) => (
            <div key={dia.dia} className="flex justify-between items-center">
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  index === 0 ? 'bg-purple-500' : 
                  index === 1 ? 'bg-purple-400' : 'bg-purple-300'
                }`} />
                <span className="text-sm">{dia.dia}</span>
              </div>
              <Chip 
                label={dia.operaciones}
                size="small"
                color="secondary"
                variant="outlined"
              />
            </div>
          ))}
          <div className="pt-2 border-t border-purple-200">
            <Typography variant="caption" className="text-purple-700">
              📅 Pico de actividad: Martes y Jueves
            </Typography>
          </div>
        </div>
      )
    },
    {
      title: 'Eficiencia Operativa',
      icon: TrendingUpIcon,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      content: (
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-indigo-600 mb-1">
              {insights.eficienciaOperativos}%
            </div>
            <div className="text-sm text-gray-600">
              Operativos con resultados
            </div>
          </div>
          
          <div className="flex justify-between items-center p-2 bg-white rounded">
            <span className="text-xs text-gray-600">Promedio detenidos/operativo</span>
            <span className="font-semibold text-indigo-600">
              {insights.promedioDetenidosPorOperativo}
            </span>
          </div>
          
          <LinearProgress 
            variant="determinate" 
            value={insights.eficienciaOperativos} 
            className="h-2 rounded-full"
            color="secondary"
          />
        </div>
      )
    },
    {
      title: 'Resumen Ejecutivo',
      icon: AssessmentIcon,
      color: 'text-gray-700',
      bgColor: 'bg-gray-50',
      content: (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-white p-2 rounded">
              <div className="font-semibold text-gray-700">Total Casos</div>
              <div className="text-lg font-bold text-blue-600">{cases.length}</div>
            </div>
            <div className="bg-white p-2 rounded">
              <div className="font-semibold text-gray-700">Áreas Cubiertas</div>
              <div className="text-lg font-bold text-green-600">
                {new Set(cases.map(c => c.areaTemática).filter(a => a)).size}
              </div>
            </div>
            <div className="bg-white p-2 rounded">
              <div className="font-semibold text-gray-700">Localidades</div>
              <div className="text-lg font-bold text-orange-600">
                {new Set(cases.map(c => c.localidad).filter(l => l)).size}
              </div>
            </div>
            <div className="bg-white p-2 rounded">
              <div className="font-semibold text-gray-700">Eficacia</div>
              <div className="text-lg font-bold text-purple-600">
                {insights.eficienciaOperativos}%
              </div>
            </div>
          </div>
          
          <div className="pt-2 border-t border-gray-200">
            <Typography variant="caption" className="text-gray-600">
              📊 Dashboard actualizado en tiempo real
            </Typography>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {indicatorCards.map((indicator, index) => {
        const IconComponent = indicator.icon;
        return (
          <Card key={index} className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardContent className="p-6">
              <div className={`flex items-center mb-4 ${indicator.bgColor} p-3 rounded-lg`}>
                <IconComponent className={`${indicator.color} mr-3`} />
                <Typography variant="h6" className="font-semibold text-gray-800">
                  {indicator.title}
                </Typography>
              </div>
              
              <Box className="min-h-32">
                {indicator.content}
              </Box>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default SecondaryIndicators;