import React, { useState, useMemo, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  TextField,
  InputAdornment,
  Chip,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Card,
  CardContent,
  Select,
  FormControl,
  MenuItem as SelectMenuItem,
  Tooltip,
  Snackbar,
  Alert
} from '@mui/material';
import { 
  Search as SearchIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  TableChart as TableIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { type EnvironmentalCase, type EnvironmentalFilters } from '../services/environmentalAnalytics';

interface EnvironmentalTableProps {
  cases: EnvironmentalCase[];
  filters?: EnvironmentalFilters;
  onUpdateCase?: (updatedCase: EnvironmentalCase) => void;
  onDeleteCase?: (caseId: string) => void;
  isEditable?: boolean;
  focusedField?: keyof EnvironmentalCase; // Campo específico a editar
  metricType?: string; // Tipo de métrica para personalizar la edición
}

const EnvironmentalTable: React.FC<EnvironmentalTableProps> = ({ 
  cases, 
  onUpdateCase,
  onDeleteCase,
  isEditable = false,
  focusedField,
  metricType
}) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCase, setSelectedCase] = useState<EnvironmentalCase | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);
  const [editingCase, setEditingCase] = useState<string | null>(null);
  const [editedData, setEditedData] = useState<Partial<EnvironmentalCase>>({});
  const [snackbar, setSnackbar] = useState<{open: boolean, message: string, severity: 'success' | 'error'}>(
    {open: false, message: '', severity: 'success'}
  );

  const filteredCases = useMemo(() => {
    let filtered = cases;
    
    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(envCase =>
        Object.values(envCase).some(value => {
          if (Array.isArray(value)) {
            return value.some(item => String(item).toLowerCase().includes(searchLower));
          }
          return String(value || '').toLowerCase().includes(searchLower);
        })
      );
    }
    
    // Reverse order to show most recent cases first (last ingresado primero)
    return [...filtered].reverse();
  }, [cases, searchTerm]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewCase = (envCase: EnvironmentalCase) => {
    setSelectedCase(envCase);
    setDetailDialogOpen(true);
  };

  const handleExportMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setExportMenuAnchor(event.currentTarget);
  };

  const handleExportMenuClose = () => {
    setExportMenuAnchor(null);
  };

  const exportToCSV = () => {
    const headers = [
      'Número de Caso', 'Fecha', 'Hora', 'Provincia', 'Localidad', 
      'Tipo Actividad', 'Área Temática', 'Detenidos', 'Vehículos', 'Incautaciones'
    ];
    
    const csvContent = [
      headers.join(','),
      ...filteredCases.map(envCase => [
        envCase.numeroCaso,
        envCase.fecha,
        envCase.hora,
        envCase.provincia,
        envCase.localidad,
        envCase.tipoActividad,
        envCase.areaTemática,
        envCase.detenidos,
        envCase.vehiculosDetenidos,
        `"${envCase.incautaciones.join('; ')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `operaciones_ambientales_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    handleExportMenuClose();
  };

  const exportToExcel = () => {
    // Simple HTML table export that Excel can read
    const tableHTML = `
      <table border="1">
        <thead>
          <tr>
            <th>Número de Caso</th>
            <th>Fecha</th>
            <th>Hora</th>
            <th>Provincia</th>
            <th>Localidad</th>
            <th>Tipo Actividad</th>
            <th>Área Temática</th>
            <th>Detenidos</th>
            <th>Vehículos</th>
            <th>Incautaciones</th>
          </tr>
        </thead>
        <tbody>
          ${filteredCases.map(envCase => `
            <tr>
              <td>${envCase.numeroCaso}</td>
              <td>${envCase.fecha}</td>
              <td>${envCase.hora}</td>
              <td>${envCase.provincia}</td>
              <td>${envCase.localidad}</td>
              <td>${envCase.tipoActividad}</td>
              <td>${envCase.areaTemática}</td>
              <td>${envCase.detenidos}</td>
              <td>${envCase.vehiculosDetenidos}</td>
              <td>${envCase.incautaciones.join('; ')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    const blob = new Blob([tableHTML], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `operaciones_ambientales_${new Date().toISOString().split('T')[0]}.xls`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    handleExportMenuClose();
  };

  // Editing functions
  const handleStartEdit = useCallback((envCase: EnvironmentalCase) => {
    setEditingCase(envCase.numeroCaso);
    setEditedData({ ...envCase });
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingCase(null);
    setEditedData({});
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!editingCase || !editedData.numeroCaso) return;
    
    try {
      const updatedCase = { ...editedData } as EnvironmentalCase;
      
      // Call parent update function if provided
      if (onUpdateCase) {
        await onUpdateCase(updatedCase);
      }
      
      setSnackbar({
        open: true,
        message: 'Caso actualizado exitosamente',
        severity: 'success'
      });
      
      setEditingCase(null);
      setEditedData({});
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Error al actualizar el caso',
        severity: 'error'
      });
    }
  }, [editingCase, editedData, onUpdateCase]);

  const handleDeleteCase = useCallback(async (caseId: string) => {
    if (!onDeleteCase) return;
    
    if (window.confirm('¿Estás seguro de que quieres eliminar este caso?')) {
      try {
        await onDeleteCase(caseId);
        setSnackbar({
          open: true,
          message: 'Caso eliminado exitosamente',
          severity: 'success'
        });
      } catch (error) {
        setSnackbar({
          open: true,
          message: 'Error al eliminar el caso',
          severity: 'error'
        });
      }
    }
  }, [onDeleteCase]);

  const handleFieldChange = useCallback((field: keyof EnvironmentalCase, value: any) => {
    setEditedData(prev => ({ ...prev, [field]: value }));
  }, []);

  const renderEditableCell = useCallback((envCase: EnvironmentalCase, field: keyof EnvironmentalCase, isNumber = false) => {
    const isEditing = editingCase === envCase.numeroCaso;
    const value = isEditing ? (editedData[field] ?? envCase[field]) : envCase[field];

    // Si hay un campo enfocado y este no es el campo enfocado, mostrar solo lectura
    const isFieldEditable = !focusedField || field === focusedField;

    if (!isEditing || !isFieldEditable) {
      return <span>{String(value)}</span>;
    }

    if (field === 'tipoActividad') {
      return (
        <FormControl size="small" fullWidth>
          <Select
            value={value || ''}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            displayEmpty
          >
            <SelectMenuItem value="">Seleccionar</SelectMenuItem>
            <SelectMenuItem value="Operativo">Operativo</SelectMenuItem>
            <SelectMenuItem value="Patrulla">Patrulla</SelectMenuItem>
            <SelectMenuItem value="Inspección">Inspección</SelectMenuItem>
            <SelectMenuItem value="Seguimiento">Seguimiento</SelectMenuItem>
          </Select>
        </FormControl>
      );
    }

    if (field === 'areaTemática') {
      return (
        <FormControl size="small" fullWidth>
          <Select
            value={value || ''}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            displayEmpty
          >
            <SelectMenuItem value="">Seleccionar</SelectMenuItem>
            <SelectMenuItem value="Suelos y Aguas">Suelos y Aguas</SelectMenuItem>
            <SelectMenuItem value="Recursos Forestales">Recursos Forestales</SelectMenuItem>
            <SelectMenuItem value="Areas Protegidas">Areas Protegidas</SelectMenuItem>
            <SelectMenuItem value="Gestión Ambiental">Gestión Ambiental</SelectMenuItem>
            <SelectMenuItem value="Costeros y Marinos">Costeros y Marinos</SelectMenuItem>
          </Select>
        </FormControl>
      );
    }

    return (
      <TextField
        size="small"
        fullWidth
        type={isNumber ? 'number' : 'text'}
        value={value || ''}
        onChange={(e) => handleFieldChange(field, isNumber ? Number(e.target.value) : e.target.value)}
        sx={{ minWidth: '120px' }}
      />
    );
  }, [editingCase, editedData, handleFieldChange, focusedField]);

  // Función para obtener nombre legible del campo
  const getFieldDisplayName = useCallback((field: keyof EnvironmentalCase) => {
    const fieldNames: Record<string, string> = {
      detenidos: 'Detenidos',
      vehiculosDetenidos: 'Vehículos Detenidos',
      notificados: 'Notificados',
      procuraduria: 'Procuraduría',
      tipoActividad: 'Tipo de Actividad',
      incautaciones: 'Incautaciones',
      fecha: 'Fecha',
      hora: 'Hora',
      provincia: 'Provincia',
      localidad: 'Localidad',
      areaTemática: 'Área Temática'
    };
    return fieldNames[field as string] || String(field);
  }, []);

  // Función para determinar si una celda debe estar resaltada
  const getCellStyle = useCallback((field: keyof EnvironmentalCase) => {
    if (focusedField === field) {
      return {
        backgroundColor: '#fff3cd',
        border: '2px solid #ffc107',
        borderRadius: '4px'
      };
    }
    return {};
  }, [focusedField]);

  const getActivityChip = (activity: string) => {
    const isOperativo = activity.toLowerCase().includes('operativo');
    return (
      <Chip
        label={activity}
        size="small"
        color={isOperativo ? "error" : "primary"}
        variant="filled"
      />
    );
  };

  const getAreaChip = (area: string) => {
    const colors: { [key: string]: any } = {
      'suelos': 'primary',
      'forestales': 'success',
      'protegida': 'warning',
      'ambiental': 'secondary',
      'costeros': 'info'
    };
    
    const colorKey = Object.keys(colors).find(key => area.toLowerCase().includes(key)) || 'default';
    
    return (
      <Chip
        label={area}
        size="small"
        color={colors[colorKey]}
        variant="outlined"
      />
    );
  };

  if (filteredCases.length === 0) {
    return (
      <Card className="shadow-lg">
        <CardContent className="p-8 text-center">
          <TableIcon style={{ fontSize: 64, opacity: 0.3 }} className="text-gray-400 mb-4" />
          <Typography variant="h6" className="text-gray-500 mb-2">
            No hay datos disponibles
          </Typography>
          <Typography variant="body2" className="text-gray-400">
            Ajusta los filtros para ver los datos de operaciones ambientales
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Search and Export */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Typography variant="h6" className="font-bold text-gray-800">
            Tabla Detallada de Operaciones
          </Typography>
          <Chip 
            label={`${filteredCases.length} casos`}
            color="primary"
            variant="outlined"
          />
          {focusedField && metricType && (
            <Chip 
              label={`Editando: ${getFieldDisplayName(focusedField)}`}
              color="warning"
              variant="filled"
              size="small"
            />
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <TextField
            placeholder="Buscar por caso, localidad, incautación..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon className="text-gray-400" />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
              },
              minWidth: '300px',
            }}
          />
          
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExportMenuOpen}
            sx={{ borderRadius: '12px' }}
          >
            Exportar
          </Button>
        </div>
      </div>

      {/* Table */}
      <Paper className="rounded-xl shadow-lg overflow-hidden">
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                {[
                  'Caso', 'Fecha', 'Hora', 'Provincia', 'Localidad', 
                  'Actividad', 'Área Temática', 'Detenidos', 'Vehículos', 'Incautaciones', 'Acciones'
                ].map((header, index) => (
                  <TableCell
                    key={index}
                    sx={{
                      backgroundColor: '#f8fafc',
                      fontWeight: 600,
                      color: '#475569',
                      borderBottom: '2px solid #e2e8f0',
                      fontSize: '0.875rem',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {header}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCases
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((envCase) => (
                  <TableRow
                    key={envCase.numeroCaso}
                    hover
                    sx={{
                      '&:nth-of-type(odd)': {
                        backgroundColor: '#f8fafc',
                      },
                      '&:hover': {
                        backgroundColor: '#e2e8f0',
                      },
                    }}
                  >
                    <TableCell className="font-mono text-sm font-semibold">
                      {envCase.numeroCaso}
                    </TableCell>
                    <TableCell>{renderEditableCell(envCase, 'fecha')}</TableCell>
                    <TableCell>{renderEditableCell(envCase, 'hora')}</TableCell>
                    <TableCell>{renderEditableCell(envCase, 'provincia')}</TableCell>
                    <TableCell>{renderEditableCell(envCase, 'localidad')}</TableCell>
                    <TableCell>
                      {editingCase === envCase.numeroCaso ? 
                        renderEditableCell(envCase, 'tipoActividad') :
                        getActivityChip(envCase.tipoActividad)
                      }
                    </TableCell>
                    <TableCell>
                      {editingCase === envCase.numeroCaso ?
                        renderEditableCell(envCase, 'areaTemática') :
                        getAreaChip(envCase.areaTemática)
                      }
                    </TableCell>
                    <TableCell className="text-center" sx={getCellStyle('detenidos')}>
                      {editingCase === envCase.numeroCaso ? 
                        renderEditableCell(envCase, 'detenidos', true) :
                        <Chip 
                          label={envCase.detenidos} 
                          size="small" 
                          color={envCase.detenidos > 0 ? "error" : "default"}
                          variant="filled"
                        />
                      }
                    </TableCell>
                    <TableCell className="text-center" sx={getCellStyle('vehiculosDetenidos')}>
                      {editingCase === envCase.numeroCaso ?
                        renderEditableCell(envCase, 'vehiculosDetenidos', true) :
                        <Chip 
                          label={envCase.vehiculosDetenidos} 
                          size="small" 
                          color={envCase.vehiculosDetenidos > 0 ? "warning" : "default"}
                          variant="filled"
                        />
                      }
                    </TableCell>
                    <TableCell>
                      <div className="max-w-32">
                        {envCase.incautaciones.length > 0 ? (
                          <Chip 
                            label={`${envCase.incautaciones.length} items`}
                            size="small"
                            color="success"
                            variant="outlined"
                          />
                        ) : (
                          <span className="text-gray-400 text-sm">Sin incautaciones</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        {editingCase === envCase.numeroCaso ? (
                          <>
                            <Tooltip title="Guardar cambios">
                              <IconButton
                                size="small"
                                onClick={handleSaveEdit}
                                className="text-green-600 hover:bg-green-50"
                              >
                                <SaveIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Cancelar edición">
                              <IconButton
                                size="small"
                                onClick={handleCancelEdit}
                                className="text-gray-600 hover:bg-gray-50"
                              >
                                <CancelIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        ) : (
                          <>
                            <Tooltip title="Ver detalles">
                              <IconButton
                                size="small"
                                onClick={() => handleViewCase(envCase)}
                                className="text-blue-600 hover:bg-blue-50"
                              >
                                <ViewIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            {isEditable && (
                              <>
                                <Tooltip title="Editar caso">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleStartEdit(envCase)}
                                    className="text-orange-600 hover:bg-orange-50"
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                {onDeleteCase && (
                                  <Tooltip title="Eliminar caso">
                                    <IconButton
                                      size="small"
                                      onClick={() => handleDeleteCase(envCase.numeroCaso)}
                                      className="text-red-600 hover:bg-red-50"
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                )}
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredCases.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{
            backgroundColor: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
          }}
        />
      </Paper>

      {/* Export Menu */}
      <Menu
        anchorEl={exportMenuAnchor}
        open={Boolean(exportMenuAnchor)}
        onClose={handleExportMenuClose}
      >
        <MenuItem onClick={exportToExcel}>
          <TableIcon className="mr-2 text-green-600" />
          Exportar a Excel
        </MenuItem>
        <MenuItem onClick={exportToCSV}>
          <DownloadIcon className="mr-2 text-blue-600" />
          Exportar a CSV
        </MenuItem>
      </Menu>

      {/* Detail Dialog */}
      <Dialog 
        open={detailDialogOpen} 
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          Detalles del Caso: {selectedCase?.numeroCaso}
        </DialogTitle>
        <DialogContent className="p-6">
          {selectedCase && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Typography variant="subtitle2" className="font-semibold text-gray-600">
                    Fecha y Hora
                  </Typography>
                  <Typography variant="body1">
                    {selectedCase.fecha} {selectedCase.hora}
                  </Typography>
                </div>
                <div>
                  <Typography variant="subtitle2" className="font-semibold text-gray-600">
                    Ubicación
                  </Typography>
                  <Typography variant="body1">
                    {selectedCase.localidad}, {selectedCase.provincia}
                  </Typography>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Typography variant="subtitle2" className="font-semibold text-gray-600">
                    Tipo de Actividad
                  </Typography>
                  {getActivityChip(selectedCase.tipoActividad)}
                </div>
                <div>
                  <Typography variant="subtitle2" className="font-semibold text-gray-600">
                    Área Temática
                  </Typography>
                  {getAreaChip(selectedCase.areaTemática)}
                </div>
              </div>

              {selectedCase.detenidosInfo && selectedCase.detenidosInfo.length > 0 && (
                <div>
                  <Typography variant="subtitle2" className="font-semibold text-gray-600 mb-2">
                    Detenidos ({selectedCase.detenidos})
                  </Typography>
                  <div className="space-y-1">
                    {selectedCase.detenidosInfo.map((detenido: any, index: number) => (
                      <div key={index} className="flex justify-between bg-red-50 p-2 rounded">
                        <span>{detenido.nombre}</span>
                        <Chip label={detenido.nacionalidad} size="small" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedCase.vehiculosInfo && selectedCase.vehiculosInfo.length > 0 && (
                <div>
                  <Typography variant="subtitle2" className="font-semibold text-gray-600 mb-2">
                    Vehículos ({selectedCase.vehiculosDetenidos})
                  </Typography>
                  <div className="space-y-1">
                    {selectedCase.vehiculosInfo.map((vehiculo: any, index: number) => (
                      <div key={index} className="flex justify-between bg-orange-50 p-2 rounded">
                        <span>{vehiculo.tipo}</span>
                        <span className="text-gray-600">{vehiculo.placa}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedCase.incautaciones.length > 0 && (
                <div>
                  <Typography variant="subtitle2" className="font-semibold text-gray-600 mb-2">
                    Incautaciones ({selectedCase.incautaciones.length})
                  </Typography>
                  <div className="flex flex-wrap gap-1">
                    {selectedCase.incautaciones.map((incautacion, index) => (
                      <Chip
                        key={index}
                        label={incautacion}
                        size="small"
                        color="success"
                        variant="outlined"
                      />
                    ))}
                  </div>
                </div>
              )}

              {selectedCase.resultado && (
                <div>
                  <Typography variant="subtitle2" className="font-semibold text-gray-600 mb-2">
                    Resultado
                  </Typography>
                  <Typography variant="body1" className="bg-blue-50 p-3 rounded-lg">
                    {selectedCase.resultado}
                  </Typography>
                </div>
              )}
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)} color="primary">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default EnvironmentalTable;