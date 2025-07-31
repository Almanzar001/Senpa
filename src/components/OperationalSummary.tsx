import React, { useMemo } from 'react';
import { Card, CardContent, Typography, Chip } from '@mui/material';
import { 
  Timeline as TimelineIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  Report as ReportIcon
} from '@mui/icons-material';
import { type SheetData } from '../services/googleSheets';
import { type FilterOptions } from './AdvancedFilters';

interface OperationalSummaryProps {
  sheetsData: SheetData[];
  filters?: FilterOptions;
}

const OperationalSummary: React.FC<OperationalSummaryProps> = ({ sheetsData, filters }) => {
  const summary = useMemo(() => {
    if (!sheetsData || sheetsData.length === 0) {
      return {
        ultimosEventos: [],
        zonasActivas: [],
        personalEnServicio: 0,
        reportesPendientes: 0
      };
    }

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const ultimosEventos: any[] = [];
    const zonasMap = new Map<string, number>();
    let personalEnServicio = 0;
    let reportesPendientes = 0;

    sheetsData.forEach(sheet => {
      if (sheet.data.length <= 1) return;
      
      const headers = sheet.data[0] as string[];
      const rows = sheet.data.slice(1);
      
      // Find relevant columns
      const fechaCol = headers.findIndex(h => h.toLowerCase().includes('fecha'));
      const horaCol = headers.findIndex(h => h.toLowerCase().includes('hora'));
      const ubicacionCol = headers.findIndex(h => 
        h.toLowerCase().includes('ubicacion') || 
        h.toLowerCase().includes('zona') ||
        h.toLowerCase().includes('lugar')
      );
      const descripcionCol = headers.findIndex(h => 
        h.toLowerCase().includes('descripcion') || 
        h.toLowerCase().includes('detalle') ||
        h.toLowerCase().includes('observacion')
      );
      const estadoCol = headers.findIndex(h => h.toLowerCase().includes('estado'));
      const tipoCol = headers.findIndex(h => h.toLowerCase().includes('tipo'));

      rows.forEach((row, index) => {
        const fecha = fechaCol >= 0 ? String(row[fechaCol] || '') : '';
        const hora = horaCol >= 0 ? String(row[horaCol] || '') : '';
        const ubicacion = ubicacionCol >= 0 ? String(row[ubicacionCol] || '') : '';
        const descripcion = descripcionCol >= 0 ? String(row[descripcionCol] || '') : '';
        const estado = estadoCol >= 0 ? String(row[estadoCol] || '').toLowerCase() : '';
        const tipo = tipoCol >= 0 ? String(row[tipoCol] || '') : '';

        // Últimos eventos de hoy
        if (fecha.includes(todayStr) && ultimosEventos.length < 5) {
          ultimosEventos.push({
            id: index,
            hora: hora || 'N/A',
            tipo: tipo || 'Evento',
            ubicacion: ubicacion || 'No especificada',
            descripcion: descripcion || 'Sin detalles',
            estado: estado || 'sin estado'
          });
        }

        // Contar zonas activas
        if (ubicacion && fecha.includes(todayStr)) {
          const zona = ubicacion.toLowerCase().trim();
          zonasMap.set(zona, (zonasMap.get(zona) || 0) + 1);
        }

        // Personal en servicio (ejemplo de lógica)
        if (estado.includes('activo') || estado.includes('servicio')) {
          personalEnServicio++;
        }

        // Reportes pendientes
        if (estado.includes('pendiente') || estado.includes('proceso')) {
          reportesPendientes++;
        }
      });
    });

    // Top 3 zonas más activas
    const zonasActivas = Array.from(zonasMap.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([zona, count]) => ({ zona, eventos: count }));

    return {
      ultimosEventos: ultimosEventos.slice(0, 5),
      zonasActivas,
      personalEnServicio,
      reportesPendientes
    };
  }, [sheetsData, filters]);

  const getEstadoColor = (estado: string) => {
    if (estado.includes('resuelto') || estado.includes('completado')) return 'success';
    if (estado.includes('pendiente') || estado.includes('proceso')) return 'warning';
    if (estado.includes('activo') || estado.includes('abierto')) return 'error';
    return 'default';
  };

  const getEstadoIcon = (tipo: string) => {
    if (tipo.toLowerCase().includes('detenido') || tipo.toLowerCase().includes('arresto')) return '👮';
    if (tipo.toLowerCase().includes('accidente')) return '🚗';
    if (tipo.toLowerCase().includes('emergencia')) return '🚨';
    if (tipo.toLowerCase().includes('patrullaje')) return '🚓';
    return '📋';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Últimos Eventos */}
      <Card className="shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center mb-4">
            <TimelineIcon className="text-blue-600 mr-2" />
            <Typography variant="h6" className="font-semibold text-gray-800">
              Eventos de Hoy
            </Typography>
          </div>
          
          {summary.ultimosEventos.length > 0 ? (
            <div className="space-y-3">
              {summary.ultimosEventos.map((evento) => (
                <div key={evento.id} className="border-l-4 border-blue-500 pl-4 py-2 bg-gray-50 rounded-r-lg">
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
          ) : (
            <div className="text-center py-4 text-gray-500">
              <ReportIcon style={{ fontSize: 48, opacity: 0.5 }} />
              <p>No hay eventos registrados para hoy</p>
            </div>
          )}
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
            {summary.zonasActivas.length > 0 ? (
              <div className="space-y-2">
                {summary.zonasActivas.map((zona, index) => (
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
            ) : (
              <p className="text-gray-500 text-sm">No hay actividad registrada</p>
            )}
          </div>

          {/* Estadísticas Rápidas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-3 rounded-lg text-center">
              <PersonIcon className="text-blue-600 mb-1" />
              <div className="text-lg font-bold text-blue-800">{summary.personalEnServicio}</div>
              <div className="text-xs text-blue-600">Personal Activo</div>
            </div>
            
            <div className="bg-orange-50 p-3 rounded-lg text-center">
              <ReportIcon className="text-orange-600 mb-1" />
              <div className="text-lg font-bold text-orange-800">{summary.reportesPendientes}</div>
              <div className="text-xs text-orange-600">Pendientes</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OperationalSummary;