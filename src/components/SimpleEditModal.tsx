import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControlLabel,
  Checkbox,
  Alert,
  Typography,
  Box,
  Stack,
  IconButton
} from '@mui/material';
import {
  Close as CloseIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import type { TableType, NotaInformativa, Detenido, Vehiculo, Incautacion } from '../types/tableTypes';
import { TABLE_METADATA } from '../types/tableTypes';

type EditableItem = NotaInformativa | Detenido | Vehiculo | Incautacion;

interface SimpleEditModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (item: EditableItem) => void;
  item: EditableItem | null;
  tableType: TableType;
  mode: 'create' | 'edit';
}

const SimpleEditModal: React.FC<SimpleEditModalProps> = ({
  open,
  onClose,
  onSave,
  item,
  tableType,
  mode
}) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const metadata = TABLE_METADATA[tableType];

  useEffect(() => {
    if (open) {
      if (mode === 'create') {
        const defaultValues = getDefaultValues(tableType);
        setFormData(defaultValues);
      } else if (item) {
        setFormData({ ...item });
      }
      setErrors([]);
    }
  }, [open, item, mode, tableType]);

  const getDefaultValues = (type: TableType): Record<string, any> => {
    const baseValues = {
      fecha: new Date().toISOString().split('T')[0],
      hora: new Date().toTimeString().split(' ')[0].substring(0, 5),
      provincia: '',
      localidad: '',
      region: ''
    };

    switch (type) {
      case 'notas_informativas':
        return {
          ...baseValues,
          numeroCaso: '',
          tipoActividad: '',
          areaTemática: '',
          notificados: 0,
          procuraduria: false,
          resultado: '',
          observaciones: ''
        };
      case 'detenidos':
        return {
          ...baseValues,
          numeroCaso: '',
          nombre: '',
          apellido: '',
          cedula: '',
          edad: 0,
          nacionalidad: '',
          motivoDetencion: '',
          estadoProceso: 'En proceso',
          observaciones: ''
        };
      case 'vehiculos':
        return {
          ...baseValues,
          numeroCaso: '',
          tipoVehiculo: '',
          marca: '',
          modelo: '',
          año: new Date().getFullYear(),
          placa: '',
          color: '',
          propietario: '',
          estado: 'Retenido',
          observaciones: ''
        };
      case 'incautaciones':
        return {
          ...baseValues,
          numeroCaso: '',
          tipoIncautacion: '',
          descripcion: '',
          cantidad: 1,
          unidadMedida: 'unidad',
          valorEstimado: 0,
          estado: 'Incautado',
          custodio: '',
          observaciones: ''
        };
      default:
        return baseValues;
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = (): string[] => {
    const validationErrors: string[] = [];

    metadata.requiredFields.forEach(field => {
      const value = formData[field];
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        validationErrors.push(`${getFieldLabel(field)} es requerido`);
      }
    });

    return validationErrors;
  };

  const handleSave = async () => {
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      if (mode === 'create') {
        formData.id = `${tableType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }

      onSave(formData as EditableItem);
      onClose();
    } catch (error) {
      setErrors([error instanceof Error ? error.message : 'Error al guardar']);
    } finally {
      setLoading(false);
    }
  };

  const getFieldLabel = (field: string): string => {
    const labels: Record<string, string> = {
      id: 'ID',
      numeroCaso: 'Número de Caso',
      fecha: 'Fecha',
      hora: 'Hora',
      provincia: 'Provincia',
      localidad: 'Localidad',
      region: 'Región',
      tipoActividad: 'Tipo de Actividad',
      areaTemática: 'Área Temática',
      notificados: 'Notificados',
      procuraduria: 'Procuraduría',
      resultado: 'Resultado',
      observaciones: 'Observaciones',
      nombre: 'Nombre',
      apellido: 'Apellido',
      cedula: 'Cédula',
      edad: 'Edad',
      nacionalidad: 'Nacionalidad',
      motivoDetencion: 'Motivo de Detención',
      estadoProceso: 'Estado del Proceso',
      tipoVehiculo: 'Tipo de Vehículo',
      marca: 'Marca',
      modelo: 'Modelo',
      año: 'Año',
      placa: 'Placa',
      color: 'Color',
      propietario: 'Propietario',
      estado: 'Estado',
      tipoIncautacion: 'Tipo de Incautación',
      descripcion: 'Descripción',
      cantidad: 'Cantidad',
      unidadMedida: 'Unidad de Medida',
      valorEstimado: 'Valor Estimado',
      custodio: 'Custodio'
    };
    return labels[field] || field;
  };

  const getFormFields = (): string[] => {
    const baseFields = ['numeroCaso', 'fecha', 'hora', 'provincia', 'localidad', 'region'];
    
    switch (tableType) {
      case 'notas_informativas':
        return [...baseFields, 'tipoActividad', 'areaTemática', 'notificados', 'procuraduria', 'resultado', 'observaciones'];
      case 'detenidos':
        return [...baseFields, 'nombre', 'apellido', 'cedula', 'edad', 'nacionalidad', 'motivoDetencion', 'estadoProceso', 'observaciones'];
      case 'vehiculos':
        return [...baseFields, 'tipoVehiculo', 'marca', 'modelo', 'año', 'placa', 'color', 'propietario', 'estado', 'observaciones'];
      case 'incautaciones':
        return [...baseFields, 'tipoIncautacion', 'descripcion', 'cantidad', 'unidadMedida', 'valorEstimado', 'estado', 'custodio', 'observaciones'];
      default:
        return baseFields;
    }
  };

  const renderField = (field: string) => {
    const value = formData[field];
    const isRequired = metadata.requiredFields.includes(field);

    if (field === 'procuraduria') {
      return (
        <FormControlLabel
          key={field}
          control={
            <Checkbox
              checked={Boolean(value)}
              onChange={(e) => handleInputChange(field, e.target.checked)}
            />
          }
          label={getFieldLabel(field)}
        />
      );
    }

    if (['edad', 'año', 'cantidad', 'valorEstimado', 'notificados'].includes(field)) {
      return (
        <TextField
          key={field}
          fullWidth
          type="number"
          label={getFieldLabel(field)}
          value={value || ''}
          onChange={(e) => handleInputChange(field, parseInt(e.target.value) || 0)}
          required={isRequired}
          variant="outlined"
          margin="normal"
        />
      );
    }

    if (field === 'fecha') {
      return (
        <TextField
          key={field}
          fullWidth
          type="date"
          label={getFieldLabel(field)}
          value={value || ''}
          onChange={(e) => handleInputChange(field, e.target.value)}
          required={isRequired}
          variant="outlined"
          margin="normal"
          InputLabelProps={{ shrink: true }}
        />
      );
    }

    if (field === 'hora') {
      return (
        <TextField
          key={field}
          fullWidth
          type="time"
          label={getFieldLabel(field)}
          value={value || ''}
          onChange={(e) => handleInputChange(field, e.target.value)}
          variant="outlined"
          margin="normal"
          InputLabelProps={{ shrink: true }}
        />
      );
    }

    if (['observaciones', 'descripcion', 'resultado'].includes(field)) {
      return (
        <TextField
          key={field}
          fullWidth
          multiline
          rows={3}
          label={getFieldLabel(field)}
          value={value || ''}
          onChange={(e) => handleInputChange(field, e.target.value)}
          required={isRequired}
          variant="outlined"
          margin="normal"
        />
      );
    }

    return (
      <TextField
        key={field}
        fullWidth
        label={getFieldLabel(field)}
        value={value || ''}
        onChange={(e) => handleInputChange(field, e.target.value)}
        required={isRequired}
        variant="outlined"
        margin="normal"
        disabled={field === 'id' || (field === 'numeroCaso' && mode === 'edit')}
      />
    );
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            {mode === 'create' ? 'Crear' : 'Editar'} - {metadata.displayName}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {errors.length > 0 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </Alert>
        )}

        <Stack spacing={2} sx={{ mt: 1 }}>
          {getFormFields().map(field => renderField(field))}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button
          onClick={onClose}
          startIcon={<CancelIcon />}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          startIcon={<SaveIcon />}
          disabled={loading}
        >
          {loading ? 'Guardando...' : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SimpleEditModal;