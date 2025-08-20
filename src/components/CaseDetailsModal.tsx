import React, { useState, useCallback, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import {
  Close as CloseIcon,
  Article as ArticleIcon,
  CalendarToday as CalendarIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  DirectionsCar as CarIcon,
  Inventory as InventoryIcon
} from '@mui/icons-material';
import type { TableType, NotaInformativa, Detenido, Vehiculo, Incautacion } from '../types/tableTypes';
import { MODAL_STYLES, METRIC_CARD_STYLES, INFO_ROW_STYLES } from '../constants/styles';
// import { useNotaFetch } from '../hooks/useNotaFetch';

type CaseItem = NotaInformativa | Detenido | Vehiculo | Incautacion;

interface CaseDetailsModalProps {
  open: boolean;
  onClose: () => void;
  item: CaseItem | null;
  tableType: TableType;
}

// Modal para mostrar nota completa
interface NotaCompletaModalProps {
  open: boolean;
  onClose: () => void;
  nota: string;
  error?: string | null;
  loading?: boolean;
}

const NotaCompletaModal: React.FC<NotaCompletaModalProps> = React.memo(({ open, onClose, nota, error, loading }) => (
  <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
    <DialogTitle sx={{ pb: 1 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
          Nota Completa del Caso
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </Box>
    </DialogTitle>
    <DialogContent>
      {loading && (
        <Typography variant="body1" sx={{ textAlign: 'center', py: 2 }}>
          Cargando nota...
        </Typography>
      )}
      {error && (
        <Typography variant="body1" sx={{ color: 'error.main', py: 2 }}>
          {error}
        </Typography>
      )}
      {!loading && !error && (
        <Typography 
          variant="body1" 
          sx={{ 
            lineHeight: 1.7,
            color: 'text.primary',
            whiteSpace: 'pre-wrap',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}
        >
          {nota || 'No hay nota disponible para este caso.'}
        </Typography>
      )}
    </DialogContent>
    <DialogActions sx={{ px: 3, pb: 3 }}>
      <Button onClick={onClose} variant="contained" sx={{ textTransform: 'none' }}>
        Cerrar
      </Button>
    </DialogActions>
  </Dialog>
));

const CaseDetailsModal: React.FC<CaseDetailsModalProps> = ({
  open,
  onClose,
  item,
  tableType
}) => {
  const [notaModalOpen, setNotaModalOpen] = useState(false);
  const [notaCompleta, setNotaCompleta] = useState('');
  const [loadingNota, setLoadingNota] = useState(false);
  const [notaError, setNotaError] = useState<string | null>(null);

  const renderInfoRow = useCallback((label: string, value: any, icon?: React.ReactNode) => {
    if (value === undefined || value === null || value === '') return null;
    
    return (
      <Box display="flex" sx={INFO_ROW_STYLES.container}>
        <Box sx={INFO_ROW_STYLES.labelContainer}>
          {icon && <Box sx={{ color: 'text.secondary', mr: 1, fontSize: '1.2rem' }}>{icon}</Box>}
          <Typography variant="subtitle1" sx={INFO_ROW_STYLES.label}>
            {label}:
          </Typography>
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="body1" sx={INFO_ROW_STYLES.value}>
            {String(value)}
          </Typography>
        </Box>
      </Box>
    );
  }, []);

  const renderMetricCard = useCallback((label: string, value: number, icon: React.ReactNode) => (
    <Card sx={METRIC_CARD_STYLES.card}>
      <CardContent sx={METRIC_CARD_STYLES.content}>
        <Box sx={{ color: 'text.secondary', mb: 1 }}>{icon}</Box>
        <Typography variant="h4" sx={METRIC_CARD_STYLES.number}>
          {value}
        </Typography>
        <Typography variant="body2" sx={METRIC_CARD_STYLES.label}>
          {label}
        </Typography>
      </CardContent>
    </Card>
  ), []);

  // Memoized computed values for better performance - with null safety
  const locationText = useMemo(() => {
    if (!item) return '';
    const parts = [item.localidad, item.provincia].filter(Boolean);
    return parts.join(', ');
  }, [item?.localidad, item?.provincia]);

  const dateTimeText = useMemo(() => {
    if (!item) return '';
    const date = item.fecha || '';
    const time = item.hora || '';
    return `${date} ${time}`.trim();
  }, [item?.fecha, item?.hora]);

  const coordinatesText = useMemo(() => {
    if (!item) return null;
    const coordinates = (item as any).coordenadas;
    if (coordinates && coordinates.lat && coordinates.lng) {
      return `Lat: ${coordinates.lat}, Lng: ${coordinates.lng}`;
    }
    return null;
  }, [item]);

  // Optimize metric calculations - with null safety
  const metrics = useMemo(() => {
    if (!item) return { detenidos: 0, vehiculos: 0, notificados: 0 };
    
    const detenidos = (item as any).detenidos || 0;
    const vehiculos = (item as any).vehiculosDetenidos || 0;
    const notificados = (item as any).notificadosCount || (() => {
      const notificadosValue = (item as NotaInformativa).notificados;
      return typeof notificadosValue === 'number' 
        ? notificadosValue
        : parseInt(String(notificadosValue || 0)) || 0;
    })();
    
    return { detenidos, vehiculos, notificados };
  }, [item]);

  // Check if should show metrics (only for operativos) - with null safety
  const shouldShowMetrics = useMemo(() => {
    if (!item) return false;
    return tableType === 'notas_informativas' && 
           item.tipoActividad && 
           item.tipoActividad.toLowerCase().includes('operativo');
  }, [tableType, item?.tipoActividad]);

  const handleVerNotaCompleta = useCallback(async () => {
    setNotaModalOpen(true);
    if (item?.numeroCaso) {
      setLoadingNota(true);
      setNotaError(null);
      
      try {
        const { supabase } = await import('../services/supabase');
        
        const { data, error: dbError } = await supabase
          .from('notas_informativas')
          .select('*')
          .eq('numerocaso', item.numeroCaso)
          .single();

        if (dbError) {
          console.error('Error fetching nota:', dbError);
          if (dbError.code === 'PGRST116') {
            setNotaCompleta('No se encontró información detallada para este caso en la base de datos.');
          } else {
            setNotaError(`Error en base de datos: ${dbError.message}`);
          }
        } else {
          console.log('Datos de la nota obtenidos:', data); // Debug log
          
          // Try different possible column names for the detailed note
          const notaContent = data?.nota || 
                             data?.notas || 
                             data?.observaciones || 
                             data?.descripcion ||
                             data?.detalles ||
                             data?.informacion ||
                             '';
          
          if (notaContent && notaContent.trim()) {
            setNotaCompleta(notaContent);
          } else {
            // If no specific note field, create a comprehensive summary from all available fields
            const summaryParts = [];
            
            if (data?.resultado) summaryParts.push(`**RESULTADO:**\n${data.resultado}`);
            if (data?.tipoactividad) summaryParts.push(`**TIPO DE ACTIVIDAD:**\n${data.tipoactividad}`);
            if (data?.areatematica) summaryParts.push(`**ÁREA TEMÁTICA:**\n${data.areatematica}`);
            if (data?.notificados) summaryParts.push(`**NOTIFICADOS:**\n${data.notificados}`);
            
            // Add all other fields that might contain detailed information
            Object.keys(data).forEach(key => {
              const value = data[key];
              if (value && typeof value === 'string' && value.length > 50 && 
                  !['numerocaso', 'fecha', 'hora', 'provinciamunicipio', 'localidad', 'region'].includes(key.toLowerCase())) {
                summaryParts.push(`**${key.toUpperCase()}:**\n${value}`);
              }
            });
            
            if (summaryParts.length > 0) {
              setNotaCompleta(`INFORMACIÓN COMPLETA DEL CASO: ${item.numeroCaso}\n\n${summaryParts.join('\n\n')}`);
            } else {
              setNotaCompleta(`INFORMACIÓN DEL CASO: ${item.numeroCaso}\n\nEste caso contiene la información básica mostrada en las secciones anteriores del modal. No se encontró información adicional detallada en la base de datos.`);
            }
          }
          setNotaError(null);
        }
      } catch (error) {
        console.error('Error al conectar con la base de datos:', error);
        setNotaError(`Error de conexión: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      } finally {
        setLoadingNota(false);
      }
    }
  }, [item?.numeroCaso]);

  // Move the item validation after all hooks to comply with Rules of Hooks
  if (!item) return null;

  return (
    <>
      <Dialog 
        open={open} 
        onClose={onClose} 
        maxWidth="lg" 
        fullWidth
        PaperProps={{ sx: MODAL_STYLES.dialog }}
      >
        <DialogTitle sx={{ ...MODAL_STYLES.header, position: 'relative' }}>
          <Typography variant="h5" sx={{ 
            fontWeight: 700, 
            color: 'text.primary',
            pr: 6,
            ...MODAL_STYLES.typography
          }}>
            Caso: {item.numeroCaso}
          </Typography>
          <IconButton 
            onClick={onClose} 
            sx={{ 
              position: 'absolute',
              right: 16,
              top: 16,
              color: 'text.secondary'
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={MODAL_STYLES.content}>
          {/* Información básica */}
          <Card sx={{ mb: 4, border: '1px solid', borderColor: 'grey.100' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ 
                fontWeight: 600, 
                color: 'text.primary', 
                mb: 3,
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}>
                Información General
              </Typography>
              {renderInfoRow('Fecha y Hora', dateTimeText, <CalendarIcon />)}
              {renderInfoRow('Ubicación', locationText, <LocationIcon />)}
              {item.region && renderInfoRow('Región', item.region)}
              {renderInfoRow('Tipo de Actividad', item.tipoActividad, <ArticleIcon />)}
              {(item as NotaInformativa).areaTemática && 
                renderInfoRow('Área Temática', (item as NotaInformativa).areaTemática)
              }
            </CardContent>
          </Card>

          {/* Métricas específicas solo para operativos */}
          {shouldShowMetrics && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ 
                fontWeight: 600, 
                color: 'text.primary', 
                mb: 3,
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}>
                Métricas del Operativo
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  {renderMetricCard('Detenidos', metrics.detenidos, <PersonIcon />)}
                </Grid>
                <Grid item xs={12} md={4}>
                  {renderMetricCard('Vehículos', metrics.vehiculos, <CarIcon />)}
                </Grid>
                <Grid item xs={12} md={4}>
                  {renderMetricCard('Notificados', metrics.notificados, <PersonIcon />)}
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Resultado */}
          {(item as NotaInformativa).resultado && (
            <Card sx={{ mb: 4, border: '1px solid', borderColor: 'grey.100' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ 
                  fontWeight: 600, 
                  color: 'text.primary', 
                  mb: 2,
                  fontFamily: 'system-ui, -apple-system, sans-serif'
                }}>
                  Resultado del Operativo
                </Typography>
                <Typography variant="body1" sx={{ 
                  lineHeight: 1.6,
                  color: 'text.primary'
                }}>
                  {(item as NotaInformativa).resultado}
                </Typography>
              </CardContent>
            </Card>
          )}

          {/* Campos específicos por tipo */}
          {tableType === 'detenidos' && (
            <Card sx={{ mb: 4, border: '1px solid', borderColor: 'grey.100' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ 
                  fontWeight: 600, 
                  color: 'text.primary', 
                  mb: 3,
                  fontFamily: 'system-ui, -apple-system, sans-serif'
                }}>
                  Información del Detenido
                </Typography>
                {renderInfoRow('Nombre', (item as Detenido).nombre, <PersonIcon />)}
                {renderInfoRow('Motivo de Detención', (item as Detenido).motivoDetencion, <ArticleIcon />)}
                {renderInfoRow('Estado del Proceso', (item as Detenido).estadoProceso, <ArticleIcon />)}
              </CardContent>
            </Card>
          )}

          {tableType === 'vehiculos' && (
            <Card sx={{ mb: 4, border: '1px solid', borderColor: 'grey.100' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ 
                  fontWeight: 600, 
                  color: 'text.primary', 
                  mb: 3,
                  fontFamily: 'system-ui, -apple-system, sans-serif'
                }}>
                  Información del Vehículo
                </Typography>
                {renderInfoRow('Tipo', (item as Vehiculo).tipo, <CarIcon />)}
                {renderInfoRow('Marca', (item as Vehiculo).marca, <CarIcon />)}
                {renderInfoRow('Color', (item as Vehiculo).color, <CarIcon />)}
                {renderInfoRow('Detalle', (item as Vehiculo).detalle, <CarIcon />)}
                {renderInfoRow('Provincia/Municipio', (item as Vehiculo).provinciaMunicipio, <LocationIcon />)}
              </CardContent>
            </Card>
          )}

          {tableType === 'incautaciones' && (
            <Card sx={{ mb: 4, border: '1px solid', borderColor: 'grey.100' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ 
                  fontWeight: 600, 
                  color: 'text.primary', 
                  mb: 3,
                  fontFamily: 'system-ui, -apple-system, sans-serif'
                }}>
                  Información de la Incautación
                </Typography>
                {renderInfoRow('Tipo de Incautación', (item as Incautacion).tipoIncautacion, <InventoryIcon />)}
                {renderInfoRow('Cantidad', (item as Incautacion).cantidad, <InventoryIcon />)}
                {renderInfoRow('Estado', (item as Incautacion).estado, <InventoryIcon />)}
              </CardContent>
            </Card>
          )}

          {/* Coordenadas */}
          {coordinatesText && (
            <Card sx={{ mb: 4, border: '1px solid', borderColor: 'grey.100' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ 
                  fontWeight: 600, 
                  color: 'text.primary', 
                  mb: 3,
                  fontFamily: 'system-ui, -apple-system, sans-serif'
                }}>
                  Coordenadas GPS
                </Typography>
                {renderInfoRow('Coordenadas', coordinatesText, <LocationIcon />)}
              </CardContent>
            </Card>
          )}

          {/* Botón para ver nota completa - disponible en todos los modales */}
          <Card sx={{ mb: 4, border: '1px solid', borderColor: 'grey.100' }}>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="h6" sx={{ 
                    fontWeight: 600, 
                    color: 'text.primary', 
                    mb: 1,
                    fontFamily: 'system-ui, -apple-system, sans-serif'
                  }}>
                    Nota del Caso
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Información detallada y observaciones del caso desde notas informativas
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  startIcon={<ArticleIcon />}
                  onClick={handleVerNotaCompleta}
                  disabled={loadingNota}
                  sx={{ 
                    textTransform: 'none',
                    fontWeight: 500,
                    px: 3
                  }}
                >
                  {loadingNota ? 'Cargando...' : 'Ver Nota Completa'}
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Observaciones */}
          {item.observaciones && (
            <Card sx={{ mb: 4, border: '1px solid', borderColor: 'grey.100' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ 
                  fontWeight: 600, 
                  color: 'text.primary', 
                  mb: 2,
                  fontFamily: 'system-ui, -apple-system, sans-serif'
                }}>
                  Observaciones
                </Typography>
                <Typography variant="body1" sx={{ 
                  lineHeight: 1.6,
                  color: 'text.primary'
                }}>
                  {item.observaciones}
                </Typography>
              </CardContent>
            </Card>
          )}
      </DialogContent>

        <DialogActions sx={{ 
          p: 4, 
          pt: 2, 
          backgroundColor: 'white',
          borderTop: '1px solid',
          borderColor: 'grey.200'
        }}>
          <Button
            onClick={onClose}
            variant="contained"
            size="large"
            sx={{ 
              minWidth: 120,
              textTransform: 'none',
              fontWeight: 600,
              px: 4,
              py: 1.5
            }}
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Modal para nota completa */}
      <NotaCompletaModal
        open={notaModalOpen}
        onClose={() => setNotaModalOpen(false)}
        nota={notaCompleta}
        error={notaError}
        loading={loadingNota}
      />
    </>
  );
};

export default CaseDetailsModal;