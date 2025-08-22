import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Switch,
  FormControlLabel,
  Chip,
  Box
} from '@mui/material';
import { Settings as SettingsIcon, Schedule as ScheduleIcon } from '@mui/icons-material';

interface AutoRefreshSettingsProps {
  open: boolean;
  onClose: () => void;
  autoRefresh: boolean;
  refreshInterval: number;
  onAutoRefreshChange: (enabled: boolean) => void;
  onIntervalChange: (interval: number) => void;
}

const AutoRefreshSettings: React.FC<AutoRefreshSettingsProps> = ({
  open,
  onClose,
  autoRefresh,
  refreshInterval,
  onAutoRefreshChange,
  onIntervalChange
}) => {
  const [tempInterval, setTempInterval] = useState(refreshInterval);
  const [tempAutoRefresh, setTempAutoRefresh] = useState(autoRefresh);

  const intervalOptions = [
    { value: 10, label: '10 segundos', color: 'error' },
    { value: 30, label: '30 segundos', color: 'warning' },
    { value: 60, label: '1 minuto', color: 'primary' },
    { value: 300, label: '5 minutos', color: 'success' },
    { value: 600, label: '10 minutos', color: 'info' },
  ];

  const handleSave = () => {
    onAutoRefreshChange(tempAutoRefresh);
    onIntervalChange(tempInterval);
    onClose();
  };

  const handleCancel = () => {
    setTempInterval(refreshInterval);
    setTempAutoRefresh(autoRefresh);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleCancel} maxWidth="sm" fullWidth>
      <DialogTitle>
        <div className="flex items-center">
          <SettingsIcon className="mr-2 text-green-600" />
          Configuración de Auto-Actualización
        </div>
      </DialogTitle>
      
      <DialogContent className="py-6">
        <div className="space-y-6">
          {/* Estado Actual */}
          <Box sx={{ 
            display: 'flex', 
            mb: 3, 
            alignItems: 'center',
            borderBottom: '1px solid',
            borderColor: 'grey.100',
            pb: 2
          }}>
            <Box sx={{ 
              minWidth: '180px', 
              width: '40%',
              pr: 2
            }}>
              <Typography 
                variant="subtitle2" 
                color="text.secondary" 
                sx={{ 
                  fontWeight: 600,
                  textAlign: 'right'
                }}
              >
                Auto-actualización:
              </Typography>
            </Box>
            <Box sx={{ flex: 1 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={tempAutoRefresh}
                    onChange={(e) => setTempAutoRefresh(e.target.checked)}
                    color="success"
                  />
                }
                label={tempAutoRefresh ? "Activada" : "Desactivada"}
              />
            </Box>
          </Box>

          {/* Interval Selection */}
          {tempAutoRefresh && (
            <>
              <Box sx={{ 
                display: 'flex', 
                mb: 3, 
                alignItems: 'center',
                borderBottom: '1px solid',
                borderColor: 'grey.100',
                pb: 2
              }}>
                <Box sx={{ 
                  minWidth: '180px', 
                  width: '40%',
                  pr: 2
                }}>
                  <Typography 
                    variant="subtitle2" 
                    color="text.secondary" 
                    sx={{ 
                      fontWeight: 600,
                      textAlign: 'right'
                    }}
                  >
                    Intervalo actual:
                  </Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Seleccionar intervalo</InputLabel>
                    <Select
                      value={tempInterval}
                      onChange={(e) => setTempInterval(Number(e.target.value))}
                      label="Seleccionar intervalo"
                    >
                      {intervalOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          <div className="flex items-center justify-between w-full">
                            <span>{option.label}</span>
                            <Chip 
                              size="small" 
                              label={option.value < 60 ? 'Rápido' : option.value < 300 ? 'Normal' : 'Lento'}
                              color={option.color as any}
                              variant="outlined"
                            />
                          </div>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              </Box>

              {/* Quick selection chips */}
              <Box sx={{ 
                display: 'flex', 
                mb: 3, 
                alignItems: 'flex-start',
                borderBottom: '1px solid',
                borderColor: 'grey.100',
                pb: 2
              }}>
                <Box sx={{ 
                  minWidth: '180px', 
                  width: '40%',
                  pr: 2
                }}>
                  <Typography 
                    variant="subtitle2" 
                    color="text.secondary" 
                    sx={{ 
                      fontWeight: 600,
                      textAlign: 'right'
                    }}
                  >
                    Selección rápida:
                  </Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Box className="flex flex-wrap gap-2">
                    {intervalOptions.map((option) => (
                      <Chip
                        key={option.value}
                        label={option.label}
                        onClick={() => setTempInterval(option.value)}
                        variant={tempInterval === option.value ? 'filled' : 'outlined'}
                        color={tempInterval === option.value ? 'success' : 'default'}
                        size="small"
                        className="cursor-pointer"
                      />
                    ))}
                  </Box>
                </Box>
              </Box>
            </>
          )}

          {/* Info */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-start">
              <ScheduleIcon className="text-blue-600 mr-2 mt-0.5" fontSize="small" />
              <div>
                <Typography variant="body2" className="text-blue-800 font-semibold mb-1">
                  💡 Recomendaciones:
                </Typography>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• <strong>10-30 seg:</strong> Para monitoreo en tiempo real</li>
                  <li>• <strong>1-5 min:</strong> Para uso normal diario</li>
                  <li>• <strong>10+ min:</strong> Para conservar recursos</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>

      <DialogActions className="px-6 pb-4">
        <Button onClick={handleCancel} color="inherit">
          Cancelar
        </Button>
        <Button onClick={handleSave} variant="contained" className="bg-green-600 hover:bg-green-700">
          Guardar Configuración
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AutoRefreshSettings;