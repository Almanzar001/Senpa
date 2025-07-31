import React from 'react';
import { Card, CardContent, Typography, Chip } from '@mui/material';
import { 
  Security as SecurityIcon,
  Today as TodayIcon,
  People as PeopleIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  LocationOn as LocationIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';

const DemoData: React.FC = () => {
  const demoMetrics = [
    {
      title: 'Detenidos Hoy',
      value: 3,
      icon: SecurityIcon,
      color: 'from-red-500 to-red-600',
      bgColor: '#ef4444'
    },
    {
      title: 'Total Detenidos',
      value: 47,
      icon: PeopleIcon,
      color: 'from-orange-500 to-orange-600',
      bgColor: '#f97316'
    },
    {
      title: 'Incidentes Activos',
      value: 12,
      icon: WarningIcon,
      color: 'from-yellow-500 to-yellow-600',
      bgColor: '#eab308'
    },
    {
      title: 'Casos Resueltos',
      value: 35,
      icon: CheckCircleIcon,
      color: 'from-green-500 to-green-600',
      bgColor: '#22c55e'
    },
    {
      title: 'Promedio Mensual',
      value: 1.6,
      icon: TrendingUpIcon,
      color: 'from-blue-500 to-blue-600',
      bgColor: '#3b82f6'
    },
    {
      title: 'Día Actual',
      value: new Date().toLocaleDateString('es-ES'),
      icon: TodayIcon,
      color: 'from-purple-500 to-purple-600',
      bgColor: '#8b5cf6',
      isDate: true
    }
  ];

  const demoEventos = [
    {
      hora: '14:30',
      tipo: 'Detención',
      ubicacion: 'Av. Principal 123',
      descripcion: 'Sospechoso de robo identificado y detenido',
      estado: 'resuelto'
    },
    {
      hora: '13:15',
      tipo: 'Patrullaje',
      ubicacion: 'Centro Comercial',
      descripcion: 'Patrullaje de rutina en zona comercial',
      estado: 'activo'
    },
    {
      hora: '12:45',
      tipo: 'Emergencia',
      ubicacion: 'Calle 5ta',
      descripcion: 'Accidente de tránsito reportado',
      estado: 'pendiente'
    },
    {
      hora: '11:20',
      tipo: 'Arresto',
      ubicacion: 'Plaza Central',
      descripcion: 'Persona alterando orden público',
      estado: 'resuelto'
    }
  ];

  const zonasActivas = [
    { zona: 'centro comercial', eventos: 8 },
    { zona: 'av. principal', eventos: 5 },
    { zona: 'plaza central', eventos: 3 }
  ];

  const getEstadoColor = (estado: string) => {
    if (estado.includes('resuelto')) return 'success';
    if (estado.includes('pendiente')) return 'warning';
    if (estado.includes('activo')) return 'error';
    return 'default';
  };

  const getEstadoIcon = (tipo: string) => {
    if (tipo.toLowerCase().includes('detencion') || tipo.toLowerCase().includes('arresto')) return '👮';
    if (tipo.toLowerCase().includes('accidente')) return '🚗';
    if (tipo.toLowerCase().includes('emergencia')) return '🚨';
    if (tipo.toLowerCase().includes('patrullaje')) return '🚓';
    return '📋';
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(to bottom right, #f8fafc, #eff6ff, #eef2ff)',
      padding: '2rem'
    }} className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <SecurityIcon className="text-blue-600 mr-3" style={{ fontSize: 40 }} />
            <h1 className="text-4xl font-bold text-gray-800">Dashboard Operativo SENPA</h1>
            <div className="ml-4 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
              DEMO - Datos de Ejemplo
            </div>
          </div>
          <p className="text-gray-600 text-lg">
            Sistema de monitoreo en tiempo real - {new Date().toLocaleDateString('es-ES', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>

        {/* Demo Notice */}
        <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">📊 Vista Previa del Dashboard</h3>
          <p className="text-blue-700">
            Esta es una demostración de cómo se verá tu dashboard una vez que configures la API Key. 
            Los datos mostrados son ejemplos que representan las métricas reales que se calcularán 
            automáticamente desde tu Google Sheet.
          </p>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {demoMetrics.map((metric, index) => {
            const IconComponent = metric.icon;
            return (
              <Card 
                key={index} 
                className="text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                style={{
                  background: `linear-gradient(to right, ${metric.bgColor}, ${metric.bgColor}dd)`
                }}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Typography variant="h6" className="text-white/80 mb-2 font-semibold">
                        {metric.title}
                      </Typography>
                      <Typography variant="h3" className="font-bold text-white">
                        {metric.isDate ? metric.value : metric.value.toLocaleString()}
                      </Typography>
                      {metric.title === 'Detenidos Hoy' && Number(metric.value) > 0 && (
                        <Typography variant="body2" className="text-white/80">
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

        {/* Operational Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Eventos de Hoy */}
          <Card className="shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <TimelineIcon className="text-blue-600 mr-2" />
                <Typography variant="h6" className="font-semibold text-gray-800">
                  Eventos de Hoy
                </Typography>
              </div>
              
              <div className="space-y-3">
                {demoEventos.map((evento, index) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-4 py-2 bg-gray-50 rounded-r-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-800 flex items-center">
                        {getEstadoIcon(evento.tipo)} {evento.tipo}
                      </span>
                      <span className="text-xs text-gray-500">{evento.hora}</span>
                    </div>
                    <div className="text-sm text-gray-600 mb-1">
                      <LocationIcon style={{ fontSize: 14 }} className="mr-1" />
                      {evento.ubicacion}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">{evento.descripcion.substring(0, 50)}...</span>
                      <Chip 
                        label={evento.estado} 
                        size="small" 
                        color={getEstadoColor(evento.estado)}
                        variant="outlined"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Resumen Operativo */}
          <Card className="shadow-lg">
            <CardContent className="p-6">
              <Typography variant="h6" className="font-semibold text-gray-800 mb-4">
                Resumen Operativo
              </Typography>
              
              {/* Zonas Activas */}
              <div className="mb-6">
                <div className="flex items-center mb-3">
                  <LocationIcon className="text-green-600 mr-2" />
                  <Typography variant="subtitle1" className="font-medium">
                    Zonas más Activas
                  </Typography>
                </div>
                <div className="space-y-2">
                  {zonasActivas.map((zona, index) => (
                    <div key={index} className="flex items-center justify-between bg-green-50 p-2 rounded">
                      <span className="capitalize text-sm font-medium">{zona.zona}</span>
                      <Chip 
                        label={`${zona.eventos} eventos`} 
                        size="small" 
                        color="primary"
                        variant="filled"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Estadísticas Rápidas */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-3 rounded-lg text-center">
                  <PeopleIcon className="text-blue-600 mb-1" />
                  <div className="text-lg font-bold text-blue-800">15</div>
                  <div className="text-xs text-blue-600">Personal Activo</div>
                </div>
                
                <div className="bg-orange-50 p-3 rounded-lg text-center">
                  <WarningIcon className="text-orange-600 mb-1" />
                  <div className="text-lg font-bold text-orange-800">8</div>
                  <div className="text-xs text-orange-600">Pendientes</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card className="shadow-lg border-l-4 border-blue-500">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">🔧 Para activar con datos reales:</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-600">
              <li>Genera una nueva API Key en Google Cloud Console</li>
              <li>Edita el archivo <code className="bg-gray-100 px-1 rounded">src/config.ts</code></li>
              <li>Reemplaza la API Key en la línea 7</li>
              <li>El dashboard se conectará automáticamente a tu Google Sheet</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DemoData;