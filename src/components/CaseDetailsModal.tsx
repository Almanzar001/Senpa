import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  IconButton,
  Divider
} from '@mui/material';
import {
  Close as CloseIcon,
  Note as NoteIcon
} from '@mui/icons-material';
import type { TableType, NotaInformativa, Detenido, Vehiculo, Incautacion } from '../types/tableTypes';
import NotaModal from './NotaModal';

type CaseItem = NotaInformativa | Detenido | Vehiculo | Incautacion;

interface CaseDetailsModalProps {
  open: boolean;
  onClose: () => void;
  item: CaseItem | null;
  tableType: TableType;
}

const CaseDetailsModal: React.FC<CaseDetailsModalProps> = ({
  open,
  onClose,
  item,
  tableType
}) => {
  const [notaModalOpen, setNotaModalOpen] = useState(false);
  
  if (!item) return null;

  const renderDetailRow = (label: string, value: any, color?: string) => {
    if (value === undefined || value === null || value === '') return null;
    
    return (
      <Box sx={{ 
        display: 'flex', 
        mb: 1, 
        alignItems: 'flex-start',
        minHeight: '24px'
      }}>
        <Box sx={{ 
          minWidth: '140px', 
          width: '35%',
          pr: 2
        }}>
          <Typography 
            variant="body2" 
            sx={{ 
              fontWeight: 'bold',
              color: 'text.primary',
              lineHeight: 1.2
            }}
          >
            {label}:
          </Typography>
        </Box>
        <Box sx={{ flex: 1 }}>
          {color ? (
            <Chip 
              label={String(value)} 
              color={color as any} 
              size="small"
              sx={{ borderRadius: 1 }}
            />
          ) : (
            <Typography variant="body2" sx={{ 
              color: 'text.secondary',
              lineHeight: 1.2,
              wordBreak: 'break-word'
            }}>
              {String(value)}
            </Typography>
          )}
        </Box>
      </Box>
    );
  };

  const renderMetricCard = (label: string, value: number) => (
    <Box textAlign="center">
      <Typography variant="h4" sx={{ color: 'text.primary', fontWeight: 'normal', mb: 0.5 }}>
        {value}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
    </Box>
  );

  const getLocationText = () => {
    const parts = [item.localidad, item.provincia].filter(Boolean);
    return parts.join(', ');
  };

  const getDateTime = () => {
    const date = item.fecha || '';
    const time = item.hora || '';
    return `${date} ${time}`.trim();
  };

  const getCoordinates = () => {
    const coordinates = (item as any).coordenadas;
    if (coordinates && coordinates.lat && coordinates.lng) {
      return `Lat: ${coordinates.lat}, Lng: ${coordinates.lng}`;
    }
    return null;
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: 'hidden'
        }
      }}
    >
      {/* Header azul */}
      <DialogTitle sx={{ 
        backgroundColor: 'primary.main', 
        color: 'white',
        position: 'relative',
        py: 3
      }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', pr: 6 }}>
          Detalles del Caso: {item.numeroCaso}
        </Typography>
        <IconButton 
          onClick={onClose} 
          sx={{ 
            position: 'absolute',
            right: 16,
            top: 16,
            color: 'white'
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {/* Información básica */}
        <Box sx={{ mb: 3 }}>
          {renderDetailRow('Número de Caso', item.numeroCaso)}
          {renderDetailRow('Fecha y Hora', getDateTime())}
          {renderDetailRow('Ubicación', getLocationText())}
          {renderDetailRow('Provincia/Municipio', (item as any).provinciamunicipio)}
          {renderDetailRow('Tipo de Actividad', (item as any).tipoActividad, 'default')}
          {(item as NotaInformativa).areaTemática && 
            renderDetailRow('Área Temática', (item as NotaInformativa).areaTemática, 'info')
          }
          {(item as NotaInformativa).procuraduria && 
            renderDetailRow('Procuraduría', (item as NotaInformativa).procuraduria, 'success')
          }
          {(item as NotaInformativa).notificados && 
            renderDetailRow('Notificados', (item as NotaInformativa).notificados)
          }
        </Box>

        {/* Resultado para notas informativas */}
        {tableType === 'notas_informativas' && (item as NotaInformativa).resultado && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
              Resultado:
            </Typography>
            <Typography variant="body2" sx={{ 
              color: 'text.secondary',
              backgroundColor: 'success.50', 
              p: 2, 
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'success.200',
              lineHeight: 1.4
            }}>
              {(item as NotaInformativa).resultado}
            </Typography>
          </Box>
        )}

        {/* Campos específicos por tipo */}
        {tableType === 'detenidos' && (
          <Box sx={{ mb: 3 }}>
            {renderDetailRow('Nombre', (item as Detenido).nombre)}
          </Box>
        )}

        {tableType === 'vehiculos' && (
          <Box sx={{ mb: 3 }}>
            {renderDetailRow('Tipo de Vehículo', (item as Vehiculo).tipo)}
            {renderDetailRow('Marca', (item as Vehiculo).marca)}
            {renderDetailRow('Color', (item as Vehiculo).color)}
            {renderDetailRow('Detalle', (item as Vehiculo).detalle)}
            {renderDetailRow('Provincia/Municipio', (item as Vehiculo).provinciamunicipio)}
          </Box>
        )}

        {tableType === 'incautaciones' && (
          <Box sx={{ mb: 3 }}>
            {renderDetailRow('Tipo de Incautación', (item as Incautacion).tipoIncautacion)}
            {renderDetailRow('Cantidad', (item as Incautacion).cantidad)}
            {renderDetailRow('Estado', (item as Incautacion).estado, 'error')}
          </Box>
        )}

        {/* Coordenadas */}
        {getCoordinates() && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
              Coordenadas:
            </Typography>
            <Typography variant="body2" sx={{ 
              color: 'text.secondary',
              fontFamily: 'monospace',
              lineHeight: 1.2
            }}>
              {getCoordinates()}
            </Typography>
          </Box>
        )}

        {/* Observaciones */}
        {item.observaciones && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
              Observaciones:
            </Typography>
            <Typography variant="body2" sx={{ 
              color: 'text.secondary',
              lineHeight: 1.4
            }}>
              {item.observaciones}
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1, justifyContent: 'space-between' }}>
        <Button
          onClick={() => setNotaModalOpen(true)}
          variant="outlined"
          startIcon={<NoteIcon />}
          size="large"
          sx={{ 
            minWidth: 140,
            textTransform: 'uppercase',
            fontWeight: 'bold'
          }}
        >
          Ver Nota
        </Button>
        
        <Button
          onClick={onClose}
          variant="contained"
          size="large"
          sx={{ 
            minWidth: 120,
            textTransform: 'uppercase',
            fontWeight: 'bold'
          }}
        >
          Cerrar
        </Button>
      </DialogActions>
      
      {/* Modal de Nota */}
      <NotaModal
        open={notaModalOpen}
        onClose={() => setNotaModalOpen(false)}
        numeroCaso={item.numeroCaso}
      />
    </Dialog>
  );
};

export default CaseDetailsModal;