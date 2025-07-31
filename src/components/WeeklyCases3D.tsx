import React, { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { type EnvironmentalCase, type EnvironmentalFilters } from '../services/environmentalAnalytics';

interface WeeklyCases3DProps {
  cases: EnvironmentalCase[];
  filters?: EnvironmentalFilters;
}

const AREA_THEMES = {
  'Suelos y Aguas': {
    color: '#0ea5e9', // Sky blue - representa agua limpia
    gradient: 'from-sky-400 to-sky-600',
    icon: '💧',
    shadow: 'rgba(14, 165, 233, 0.3)'
  },
  'Recursos Forestales': {
    color: '#16a34a', // Forest green - bosques y naturaleza
    gradient: 'from-green-500 to-green-700',
    icon: '🌲',
    shadow: 'rgba(22, 163, 74, 0.3)'
  },
  'Área Protegida': {
    color: '#65a30d', // Lime green - conservación y protección
    gradient: 'from-lime-500 to-lime-700',
    icon: '🛡️',
    shadow: 'rgba(101, 163, 13, 0.3)'
  },
  'Gestión Ambiental': {
    color: '#059669', // Emerald - sostenibilidad y gestión
    gradient: 'from-emerald-500 to-emerald-700',
    icon: '♻️',
    shadow: 'rgba(5, 150, 105, 0.3)'
  },
  'Costeros y Marinos': {
    color: '#0284c7', // Ocean blue - costas y océanos
    gradient: 'from-blue-500 to-blue-700',
    icon: '🌊',
    shadow: 'rgba(2, 132, 199, 0.3)'
  },
};

const WeeklyCases3D: React.FC<WeeklyCases3DProps> = ({ cases }) => {
  const [hoveredArea, setHoveredArea] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'stacked' | 'individual'>('stacked');

  const weeklyData = useMemo(() => {
    const weeklyMap = new Map<string, any>();
    
    console.log('🔍 WeeklyCases3D - Analizando casos:', cases.length);
    let casosProcessed = 0;
    let casosSinFecha = 0;
    let casosConFechaInvalida = 0;
    let casosSinAreaTematica = 0;
    
    cases.forEach((envCase, index) => {
      console.log(`📝 Procesando caso ${index + 1}/${cases.length}: ${envCase.numeroCaso}`);
      console.log(`   📅 Fecha original: "${envCase.fecha}"`);
      console.log(`   🌿 Área temática: "${envCase.areaTemática}"`);
      
      if (!envCase.fecha) {
        casosSinFecha++;
        console.log(`   ❌ EXCLUIDO: Sin fecha`);
        return;
      }
      
      let date: Date;
      if (envCase.fecha.includes('/')) {
        const parts = envCase.fecha.split('/');
        if (parts.length === 3) {
          const day = parseInt(parts[0]);
          const month = parseInt(parts[1]) - 1;
          const year = parseInt(parts[2]);
          date = new Date(year, month, day);
        } else {
          date = new Date(envCase.fecha);
        }
      } else {
        date = new Date(envCase.fecha);
      }
      
      if (isNaN(date.getTime())) {
        casosConFechaInvalida++;
        console.log(`   ❌ EXCLUIDO: Fecha inválida parseada`);
        return;
      }
      
      console.log(`   ✅ Fecha parseada correctamente: ${date.toLocaleDateString()}`);;
      
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      
      if (isNaN(weekStart.getTime())) return;
      
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weeklyMap.has(weekKey)) {
        weeklyMap.set(weekKey, {
          semana: weekStart.toLocaleDateString('es-ES', { 
            month: 'short', 
            day: 'numeric' 
          }),
          fechaCompleta: weekStart.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long', 
            day: 'numeric'
          }),
          fechaOrden: weekStart.getTime(),
          total: 0,
          'Suelos y Aguas': 0,
          'Recursos Forestales': 0,
          'Área Protegida': 0,
          'Gestión Ambiental': 0,
          'Costeros y Marinos': 0
        });
      }
      
      const weekData = weeklyMap.get(weekKey)!;
      weekData.total++;
      
      const area = envCase.areaTemática;
      if (area && weekData.hasOwnProperty(area)) {
        weekData[area]++;
        console.log(`   ✅ Agregado a área: ${area}`);
        casosProcessed++;
      } else {
        if (!area) {
          casosSinAreaTematica++;
          console.log(`   ❌ EXCLUIDO: Sin área temática`);
        } else {
          console.log(`   ⚠️ Área temática no reconocida: "${area}"`);
        }
      }
    });

    console.log(`📊 RESUMEN WeeklyCases3D:`);
    console.log(`   📋 Total casos recibidos: ${cases.length}`);
    console.log(`   ✅ Casos procesados: ${casosProcessed}`);
    console.log(`   ❌ Sin fecha: ${casosSinFecha}`);
    console.log(`   ❌ Fecha inválida: ${casosConFechaInvalida}`);
    console.log(`   ❌ Sin área temática: ${casosSinAreaTematica}`);

    const result = Array.from(weeklyMap.values())
      .sort((a, b) => a.fechaOrden - b.fechaOrden)
      .slice(-12); // Últimas 12 semanas
    
    console.log(`📈 Semanas generadas: ${result.length}`);
    result.forEach(week => {
      console.log(`   📅 ${week.semana}: ${week.total} casos`);
    });
    
    return result;
  }, [cases]);

  const totalCases = useMemo(() => {
    return weeklyData.reduce((sum, week) => sum + week.total, 0);
  }, [weeklyData]);

  const areaStats = useMemo(() => {
    const stats = Object.keys(AREA_THEMES).map(area => {
      const total = weeklyData.reduce((sum, week) => sum + (week[area] || 0), 0);
      const percentage = totalCases > 0 ? ((total / totalCases) * 100).toFixed(1) : '0';
      return {
        area,
        total,
        percentage: parseFloat(percentage),
        ...AREA_THEMES[area as keyof typeof AREA_THEMES]
      };
    }).filter(stat => stat.total > 0)
    .sort((a, b) => b.total - a.total);
    
    return stats;
  }, [weeklyData, totalCases]);

  const Custom3DTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const total = payload.reduce((sum: number, entry: any) => sum + entry.value, 0);
      
      return (
        <div className="bg-primary-50/95 backdrop-blur-md p-4 rounded-xl shadow-2xl border border-neutral-200">
          <div className="mb-3">
            <h4 className="font-bold text-neutral-800 text-lg">{label}</h4>
            <p className="text-sm text-neutral-600">Total: {total} casos</p>
          </div>
          <div className="space-y-2">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center gap-3">
                <div 
                  className="w-4 h-4 rounded-full shadow-lg"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-sm font-medium text-neutral-700">
                  {AREA_THEMES[entry.dataKey as keyof typeof AREA_THEMES]?.icon} {entry.dataKey}
                </span>
                <span className="text-sm font-bold text-neutral-800 ml-auto">
                  {entry.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  // Componente removido - no se usa

  return (
    <div className="space-y-8">
      {/* Header 3D */}
      <div className="card-environmental p-8 relative overflow-hidden">
        {/* Background Pattern */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, #22c55e 2px, transparent 2px),
                             radial-gradient(circle at 80% 20%, #3b82f6 2px, transparent 2px),
                             radial-gradient(circle at 40% 80%, #f59e0b 2px, transparent 2px)`,
            backgroundSize: '60px 60px, 80px 80px, 100px 100px'
          }}
        />
        
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center shadow-xl transform rotate-3 hover:rotate-0 transition-transform duration-300">
                <span className="text-white text-2xl">📊</span>
              </div>
              <div>
                <h2 className="text-3xl font-bold text-neutral-800 mb-2">
                  Casos por Semana
                </h2>
                <p className="text-neutral-600 text-lg">
                  Distribución temporal por área temática
                </p>
                <div className="flex items-center gap-4 mt-3">
                  <div className="status-success">
                    {totalCases} casos totales
                  </div>
                  <div className="status-info">
                    {weeklyData.length} {weeklyData.length === 1 ? 'semana analizada' : 'semanas analizadas'}
                    {weeklyData.length > 0 && (
                      <span className="ml-2 text-xs text-neutral-500">
                        ({weeklyData[0]?.semana} - {weeklyData[weeklyData.length - 1]?.semana})
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* View Mode Toggle */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setViewMode('stacked')}
                className={`btn-sm flex items-center gap-2 ${
                  viewMode === 'stacked' ? 'btn-primary' : 'btn-outline'
                }`}
              >
                <span>📈</span>
                <span className="hidden sm:inline">Apilado</span>
              </button>
              <button
                onClick={() => setViewMode('individual')}
                className={`btn-sm flex items-center gap-2 ${
                  viewMode === 'individual' ? 'btn-primary' : 'btn-outline'
                }`}
              >
                <span>👁️</span>
                <span className="hidden sm:inline">Individual</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards 3D */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {areaStats.map((stat, index) => (
          <div
            key={stat.area}
            className={`relative group cursor-pointer transform transition-all duration-300 hover:scale-105 hover:-rotate-1 ${
              hoveredArea === stat.area ? 'z-10' : ''
            }`}
            onMouseEnter={() => setHoveredArea(stat.area)}
            onMouseLeave={() => setHoveredArea(null)}
            style={{
              transform: `perspective(1000px) rotateX(5deg) rotateY(${index % 2 === 0 ? '5deg' : '-5deg'})`,
            }}
          >
            <div 
              className={`card p-4 h-full bg-gradient-to-br ${stat.gradient} text-white relative overflow-hidden`}
              style={{
                boxShadow: `
                  0 10px 25px -5px ${stat.shadow},
                  0 4px 10px -2px rgba(0, 0, 0, 0.1),
                  inset 0 1px 0 rgba(255, 255, 255, 0.2)
                `
              }}
            >
              {/* Shine effect */}
              <div 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"
                style={{ transform: 'skewX(-25deg)' }}
              />
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-3xl opacity-80">{stat.icon}</span>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{stat.total}</div>
                    <div className="text-xs opacity-80">{stat.percentage}%</div>
                  </div>
                </div>
                <h3 className="text-sm font-semibold leading-tight opacity-90">
                  {stat.area}
                </h3>
              </div>
              
              {/* Bottom highlight */}
              <div 
                className="absolute bottom-0 left-0 right-0 h-1 bg-white/30"
                style={{
                  boxShadow: `0 0 10px ${stat.shadow}`
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Chart 3D */}
      <div className="card-environmental p-6 relative overflow-hidden">
        {/* 3D Background Grid */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(rgba(79, 138, 79, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(79, 138, 79, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px',
            transform: 'perspective(500px) rotateX(20deg)'
          }}
        />
        
        <div className="relative z-10">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-neutral-800 mb-2 flex items-center gap-3">
              <span className="text-primary-600 text-2xl">🌿</span>
              Tendencia Semanal por Área Temática
            </h3>
            <p className="text-neutral-600">
              {viewMode === 'stacked' 
                ? 'Vista apilada: todas las áreas en una sola barra'
                : 'Vista individual: cada área por separado'
              }
            </p>
          </div>
          
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={weeklyData} 
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <defs>
                  {Object.entries(AREA_THEMES).map(([area, theme]) => (
                    <linearGradient key={area} id={`gradient-${area}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={theme.color} stopOpacity={1} />
                      <stop offset="50%" stopColor={theme.color} stopOpacity={0.8} />
                      <stop offset="100%" stopColor={theme.color} stopOpacity={0.6} />
                    </linearGradient>
                  ))}
                  {/* Gradientes sólidos para mejor diferenciación */}
                  {Object.entries(AREA_THEMES).map(([area, theme]) => (
                    <linearGradient key={`solid-${area}`} id={`solid-gradient-${area}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={theme.color} stopOpacity={0.95} />
                      <stop offset="100%" stopColor={theme.color} stopOpacity={0.85} />
                    </linearGradient>
                  ))}
                </defs>
                
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="#e5e7eb" 
                  strokeOpacity={0.5}
                />
                <XAxis 
                  dataKey="semana" 
                  stroke="#6b7280"
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  stroke="#6b7280" 
                  fontSize={12}
                />
                <Tooltip content={<Custom3DTooltip />} />
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="circle"
                  formatter={(value: string) => (
                    <span style={{ 
                      color: AREA_THEMES[value as keyof typeof AREA_THEMES]?.color || '#374151',
                      fontWeight: '500'
                    }}>
                      {AREA_THEMES[value as keyof typeof AREA_THEMES]?.icon} {value}
                    </span>
                  )}
                />
                
                {Object.entries(AREA_THEMES).map(([area, theme]) => (
                  <Bar
                    key={area}
                    dataKey={area}
                    stackId={viewMode === 'stacked' ? 'areas' : area}
                    fill={theme.color}
                    radius={viewMode === 'stacked' ? [0, 0, 0, 0] : [4, 4, 0, 0]}
                    stroke="#ffffff"
                    strokeWidth={1}
                    // Removemos labels por ahora para el build
                    // label={viewMode === 'individual' ? (...) : (...)}
                    style={{
                      filter: hoveredArea === area 
                        ? `drop-shadow(0 8px 16px ${theme.shadow})` 
                        : `drop-shadow(0 2px 4px ${theme.shadow})`,
                      transform: hoveredArea === area ? 'scaleY(1.05)' : 'scaleY(1)',
                      transformOrigin: 'bottom'
                    }}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeeklyCases3D;