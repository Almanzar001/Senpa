import React, { useMemo } from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer
} from 'recharts';
// Removemos los iconos de Material-UI para evitar errores
import EnvironmentalAnalyticsService, { type EnvironmentalCase, type EnvironmentalFilters } from '../services/environmentalAnalytics';
import WeeklyCases3D from './WeeklyCases3D';

interface EnvironmentalChartsProps {
  cases: EnvironmentalCase[];
  filters?: EnvironmentalFilters;
}

const COLORS = [
  '#22c55e', '#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6', 
  '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#6366f1'
];

// Removido AREA_COLORS - no se usa

const EnvironmentalCharts: React.FC<EnvironmentalChartsProps> = ({ cases, filters }) => {
  const analyticsService = useMemo(() => new EnvironmentalAnalyticsService(), []);
  const filteredCases = cases;

  // A. Gráfico de barras removido - se usa WeeklyCases3D en su lugar

  // B. Gráfico de barras horizontales: Tipos de incautaciones más frecuentes
  const incautacionesByType = useMemo(() => {
    const rawData = analyticsService.getIncautacionesByType(filteredCases);
    
    // Solo limpiar las etiquetas finales para mostrar, sin afectar la agrupación
    const cleanedData = rawData.map(item => ({
      ...item,
      tipo: item.tipo
        .replace(/^Caso-\d{8}-\d{6}-\w+\s+/i, '') // Quitar códigos como "Caso-20250731-010839-9vu "
        .replace(/^\d+\s*/, '') // Quitar números al inicio si quedaron
        .trim()
    })).filter(item => item.tipo && item.tipo.length > 0 && item.cantidad > 0);
    
    return cleanedData;
  }, [filteredCases, analyticsService]);

  // C. Gráfico de barras apiladas: Detenidos por nacionalidad
  const detenidosByNationality = useMemo(() => {
    return analyticsService.getDetenidosByNationality(filteredCases);
  }, [filteredCases, analyticsService]);

  // D. Gráfico circular: Tipos de vehículos detenidos
  const vehiclesByType = useMemo(() => {
    return analyticsService.getVehiclesByType(filteredCases);
  }, [filteredCases, analyticsService]);

  // E. Datos combinados por región
  const combinedDataByRegion = useMemo(() => {
    const regionData = new Map<string, {
      operativos: number;
      patrullas: number;
      detenidos: number;
      vehiculos: number;
    }>();

    filteredCases.forEach(envCase => {
      if (envCase.region) {
        const region = envCase.region;
        const current = regionData.get(region) || {
          operativos: 0,
          patrullas: 0,
          detenidos: 0,
          vehiculos: 0
        };

        // Contar operativos
        if (envCase.tipoActividad && envCase.tipoActividad.toLowerCase().includes('operativo')) {
          current.operativos++;
        }

        // Contar patrullas
        if (envCase.tipoActividad && envCase.tipoActividad.toLowerCase().includes('patrulla')) {
          current.patrullas++;
        }

        // Contar detenidos (si hay información de detenidos > 0)
        if (envCase.detenidos && envCase.detenidos > 0) {
          current.detenidos += envCase.detenidos;
        }

        // Contar vehículos (si hay información de vehículos > 0)
        if (envCase.vehiculosDetenidos && envCase.vehiculosDetenidos > 0) {
          current.vehiculos += envCase.vehiculosDetenidos;
        }

        regionData.set(region, current);
      }
    });

    return Array.from(regionData.entries())
      .map(([region, data]) => ({
        region,
        operativos: data.operativos,
        patrullas: data.patrullas,
        detenidos: data.detenidos,
        vehiculos: data.vehiculos
      }))
      .sort((a, b) => (b.operativos + b.patrullas + b.detenidos + b.vehiculos) - (a.operativos + a.patrullas + a.detenidos + a.vehiculos));
  }, [filteredCases]);

  // F. Análisis de ubicaciones
  const locationAnalysis = useMemo(() => {
    const locationCount = new Map<string, number>();
    
    filteredCases.forEach(envCase => {
      if (envCase.localidad) {
        const location = envCase.localidad;
        locationCount.set(location, (locationCount.get(location) || 0) + 1);
      }
    });

    return Array.from(locationCount.entries())
      .map(([location, count]) => ({ location, operativos: count }))
      .sort((a, b) => b.operativos - a.operativos)
      .slice(0, 10);
  }, [filteredCases]);

  // G. Análisis de regiones
  const regionAnalysis = useMemo(() => {
    const regionCount = new Map<string, number>();
    
    filteredCases.forEach(envCase => {
      if (envCase.region) {
        const region = envCase.region;
        regionCount.set(region, (regionCount.get(region) || 0) + 1);
      }
    });

    return Array.from(regionCount.entries())
      .map(([region, count]) => ({ region: `Región ${region}`, operativos: count }))
      .sort((a, b) => b.operativos - a.operativos)
      .slice(0, 10);
  }, [filteredCases]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-primary-50 p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-800 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {`${entry.dataKey}: ${entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      {/* A. Componente 3D de Casos por Semana - Solo mostrar si no es vista ejecutiva */}
      {!filters?.isExecutiveView && (
        <WeeklyCases3D cases={filteredCases} filters={filters} />
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* B. Incautaciones por Tipo */}
        <div className="card-environmental p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">📦</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-neutral-800">
                Tipos de Incautaciones
              </h3>
              <p className="text-neutral-600">Más frecuentes por cantidad</p>
            </div>
          </div>
          
          <div className="h-80">
            {incautacionesByType && incautacionesByType.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={incautacionesByType}>
                  <defs>
                    <linearGradient id="violetGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#a855f7" stopOpacity={0.8} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />
                  <XAxis 
                    dataKey="tipo" 
                    stroke="#6b7280"
                    fontSize={12}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip />
                  <Bar 
                    dataKey="cantidad" 
                    fill="url(#violetGradient)"
                    radius={[8, 8, 0, 0]}
                    label={({ value, x, y, width }) => (
                      <text 
                        x={x + width / 2} 
                        y={y - 5} 
                        textAnchor="middle" 
                        fontSize={14} 
                        fontWeight="bold" 
                        fill="#374151"
                      >
                        {value}
                      </text>
                    )}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-neutral-500">
                  <span className="text-4xl mb-4 block">📦</span>
                  <p className="text-lg font-medium">No hay datos de incautaciones</p>
                  <p className="text-sm">Los datos se mostrarán cuando estén disponibles</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* C. Detenidos por Nacionalidad */}
        <div className="card-environmental p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-neutral-800">
                Detenidos por Nacionalidad
              </h3>
              <p className="text-neutral-600">Distribución demográfica</p>
            </div>
          </div>
          
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={detenidosByNationality}>
                <defs>
                  <linearGradient id="redGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f87171" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0.7} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />
                <XAxis 
                  dataKey="nacionalidad" 
                  stroke="#6b7280"
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="cantidad" 
                  fill="url(#redGradient)"
                  radius={[8, 8, 0, 0]}
                  label={({ value, x, y, width }) => (
                    <text 
                      x={x + width / 2} 
                      y={y - 5} 
                      textAnchor="middle" 
                      fontSize={14} 
                      fontWeight="bold" 
                      fill="#374151"
                    >
                      {value}
                    </text>
                  )}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* D. Tipos de Vehículos */}
        <div className="card-environmental p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🚛</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-neutral-800">
                Tipos de Vehículos
              </h3>
              <p className="text-neutral-600">Detenidos por tipo</p>
            </div>
          </div>
          
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <defs>
                  {COLORS.map((color, index) => (
                    <linearGradient key={index} id={`pieGradient${index}`} x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor={color} stopOpacity={0.9} />
                      <stop offset="100%" stopColor={color} stopOpacity={0.6} />
                    </linearGradient>
                  ))}
                </defs>
                <Pie
                  data={vehiclesByType}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ tipo, porcentaje }) => `${tipo} (${porcentaje}%)`}
                  outerRadius={100}
                  dataKey="cantidad"
                  stroke="#ffffff"
                  strokeWidth={2}
                >
                  {vehiclesByType.map((_, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={`url(#pieGradient${index % COLORS.length})`}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* E. Ubicaciones Más Activas */}
        <div className="card-environmental p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">📍</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-neutral-800">
                Ubicaciones Más Activas
              </h3>
              <p className="text-neutral-600">Por número de operativos</p>
            </div>
          </div>
          
          <div className="h-80">
            {locationAnalysis && locationAnalysis.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={locationAnalysis}>
                  <defs>
                    <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#22c55e" stopOpacity={0.9} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />
                  <XAxis 
                    dataKey="location" 
                    stroke="#6b7280"
                    fontSize={12}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip />
                  <Bar 
                    dataKey="operativos" 
                    fill="url(#greenGradient)"
                    radius={[8, 8, 0, 0]}
                    label={({ value, x, y, width }) => (
                      <text 
                        x={x + width / 2} 
                        y={y - 5} 
                        textAnchor="middle" 
                        fontSize={14} 
                        fontWeight="bold" 
                        fill="#374151"
                      >
                        {value}
                      </text>
                    )}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-neutral-500">
                  <span className="text-4xl mb-4 block">📍</span>
                  <p className="text-lg font-medium">No hay datos de ubicaciones</p>
                  <p className="text-sm">Los datos se mostrarán cuando estén disponibles</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Nueva sección: Regiones Más Activas */}
      <div className="grid grid-cols-1 xl:grid-cols-1 gap-8">
        <div className="card-environmental p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🗺️</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-neutral-800">
                Regiones Más Activas
              </h3>
              <p className="text-neutral-600">Por número de operativos</p>
            </div>
          </div>
          
          <div className="h-80">
            {regionAnalysis && regionAnalysis.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={regionAnalysis}>
                  <defs>
                    <linearGradient id="tealGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#20b2aa" stopOpacity={0.9} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />
                  <XAxis 
                    dataKey="region" 
                    stroke="#6b7280"
                    fontSize={12}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip />
                  <Bar 
                    dataKey="operativos" 
                    fill="url(#tealGradient)"
                    radius={[8, 8, 0, 0]}
                    label={({ value, x, y, width }) => (
                      <text 
                        x={x + width / 2} 
                        y={y - 5} 
                        textAnchor="middle" 
                        fontSize={14} 
                        fontWeight="bold" 
                        fill="#374151"
                      >
                        {value}
                      </text>
                    )}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-neutral-500">
                  <span className="text-4xl mb-4 block">🗺️</span>
                  <p className="text-lg font-medium">No hay datos de regiones</p>
                  <p className="text-sm">Los datos se mostrarán cuando estén disponibles</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnvironmentalCharts;