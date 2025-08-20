import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
  Typography,
  Box,
  Stack,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Close as CloseIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import type { TableType, NotaInformativa, Detenido, Vehiculo, Incautacion } from '../types/tableTypes';
import { TABLE_METADATA } from '../types/tableTypes';
import { enumOptionsService } from '../services/enumOptions';
import { usePermissions } from '../hooks/usePermissions';

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
  const permissions = usePermissions();

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
          notificados: '',
          procuraduria: false,
          resultado: '',
          observaciones: '',
          nota: ''
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
          observaciones: '',
          nota: ''
        };
      case 'vehiculos':
        return {
          numeroCaso: '',
          tipo: '',
          marca: '',
          color: '',
          detalle: '',
          provinciaMunicipio: '',
          fecha: new Date().toISOString().split('T')[0]
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
          observaciones: '',
          nota: ''
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

    console.log('🟦 Validando formulario para:', tableType);
    console.log('🟦 Campos requeridos:', metadata.requiredFields);
    console.log('🟦 FormData actual:', formData);

    metadata.requiredFields.forEach(field => {
      const value = formData[field];
      console.log(`🟦 Validando campo ${field}:`, value);
      
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        const errorMsg = `${getFieldLabel(field)} es requerido`;
        validationErrors.push(errorMsg);
        console.log(`🟦 Error de validación: ${errorMsg}`);
      }
    });

    // No additional validation needed for simplified vehicle fields

    console.log('🟦 Errores finales de validación:', validationErrors);
    return validationErrors;
  };

  const handleSave = async () => {
    console.log('🟦 SimpleEditModal - handleSave iniciado');
    console.log('🟦 FormData antes de validar:', formData);
    console.log('🟦 TableType:', tableType);
    console.log('🟦 Mode:', mode);
    
    const validationErrors = validateForm();
    console.log('🟦 Errores de validación:', validationErrors);
    
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setErrors([]); // Clear any previous errors
    
    try {
      if (mode === 'create') {
        formData.id = `${tableType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }

      console.log('🟦 Llamando onSave con:', formData);
      await onSave(formData as EditableItem);
      console.log('🟦 onSave completado exitosamente');
      
      // Close modal on success
      onClose();
    } catch (error) {
      console.error('🟦 Error en handleSave:', error);
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
      nota: 'Nota',
      nombre: 'Nombre',
      motivoDetencion: 'Motivo de Detención',
      estadoProceso: 'Estado del Proceso',
      tipo: 'Tipo',
      marca: 'Marca',
      color: 'Color',
      detalle: 'Detalle',
      provinciaMunicipio: 'Provincia/Municipio',
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
        return [...baseFields, 'tipoActividad', 'areaTemática', 'notificados', 'procuraduria', 'resultado', 'observaciones', 'nota'];
      case 'detenidos':
        return [...baseFields, 'nombre', 'motivoDetencion', 'estadoProceso', 'observaciones', 'nota'];
      case 'vehiculos':
        return ['numeroCaso', 'tipo', 'marca', 'color', 'detalle', 'provinciaMunicipio', 'fecha'];
      case 'incautaciones':
        return [...baseFields, 'tipoIncautacion', 'descripcion', 'cantidad', 'unidadMedida', 'valorEstimado', 'estado', 'custodio', 'observaciones', 'nota'];
      default:
        return baseFields;
    }
  };

  const renderField = (field: string) => {
    const value = formData[field];
    const isRequired = metadata.requiredFields.includes(field);

    // Check if this field should be a dropdown
    if (enumOptionsService.isDropdownField(field)) {
      const options = enumOptionsService.getFieldOptions(field);
      
      // Special handling for procuraduria (boolean field)
      if (field === 'procuraduria') {
        return (
          <FormControl key={field} fullWidth margin="normal" required={isRequired}>
            <InputLabel>{getFieldLabel(field)}</InputLabel>
            <Select
              value={value !== undefined ? String(value) : ''}
              onChange={(e) => handleInputChange(field, e.target.value === 'true')}
              label={getFieldLabel(field)}
              >
              {(options as { value: boolean; label: string }[]).map((option) => (
                <MenuItem key={String(option.value)} value={String(option.value)}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );
      }
      
      // Regular dropdown for string options
      return (
        <FormControl key={field} fullWidth margin="normal" required={isRequired}>
          <InputLabel>{getFieldLabel(field)}</InputLabel>
          <Select
            value={value || ''}
            onChange={(e) => handleInputChange(field, e.target.value)}
            label={getFieldLabel(field)}
          >
            <MenuItem value="">
              <em>Seleccionar...</em>
            </MenuItem>
            {(options as string[]).map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      );
    }

    // Number fields
    if (['año', 'cantidad', 'valorEstimado'].includes(field)) {
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

    // Date fields
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

    // Time fields
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

    // Multiline text fields
    if (['observaciones', 'descripcion', 'resultado', 'nota', 'detalle'].includes(field)) {
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

    // Default text fields
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

  // Verificar permisos
  const hasRequiredPermission = mode === 'create' ? permissions.canCreateRecords : permissions.canEditRecords;

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
        {!hasRequiredPermission ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {permissions.getPermissionDeniedMessage(mode === 'create' ? 'write' : 'write')}
          </Alert>
        ) : (
          <>
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
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button
          onClick={onClose}
          startIcon={<CancelIcon />}
          disabled={loading}
        >
          Cancelar
        </Button>
        {hasRequiredPermission && (
          <Button
            onClick={handleSave}
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={loading}
          >
            {loading ? 'Guardando...' : 'Guardar'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default SimpleEditModal;