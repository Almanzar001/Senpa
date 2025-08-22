import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  IconButton,
  Chip,
  Typography,
  Box,
  TextField,
  InputAdornment,
  Button,
  Tooltip,
  Alert
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import type { TableType, NotaInformativa, Detenido, Vehiculo, Incautacion } from '../types/tableTypes';
import { TABLE_METADATA } from '../types/tableTypes';
import SimpleEditModal from './SimpleEditModal';
import CaseDetailsModal from './CaseDetailsModal';
import { usePermissions } from '../hooks/usePermissions';
import { TABLE_CONFIG } from '../constants/styles';

type TableItem = NotaInformativa | Detenido | Vehiculo | Incautacion;

interface GenericTableProps {
  tableType: TableType;
  data: TableItem[];
  onUpdate: (item: TableItem) => void;
  onDelete: (id: string) => void;
  loading?: boolean;
  title?: string;
}

const GenericTable: React.FC<GenericTableProps> = ({
  tableType,
  data,
  onUpdate,
  onDelete,
  loading = false,
  title
}) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25); // Reducir filas por página para mejor performance
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<TableItem | null>(null);

  // Debounce search term para mejorar rendimiento
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setPage(0); // Reset page cuando cambia la búsqueda
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const permissions = usePermissions();
  const metadata = TABLE_METADATA[tableType];

  const getSearchableFields = (item: TableItem): any[] => {
    // Campos comunes - usar los nombres correctos de los campos
    const commonFields = [
      item.numeroCaso, 
      item.fecha, 
      (item as any).provinciamunicipio || (item as any).provincia, // Usar el campo correcto
      (item as any).localidad, 
      (item as any).region
    ];
    
    switch (tableType) {
      case 'notas_informativas':
        const nota = item as NotaInformativa;
        return [
          ...commonFields, 
          nota.tipoActividad, 
          nota.areaTemática, 
          nota.notificados, 
          nota.procuraduria,
          nota.resultado,
          nota.observaciones
        ];
      case 'detenidos':
        const detenido = item as Detenido;
        return [
          ...commonFields, 
          detenido.nombre, 
          detenido.motivoDetencion, 
          detenido.estadoProceso,
          detenido.observaciones
        ];
      case 'vehiculos':
        const vehiculo = item as Vehiculo;
        return [
          ...commonFields, 
          vehiculo.tipo, 
          vehiculo.marca, 
          vehiculo.color, 
          vehiculo.detalle,
          vehiculo.observaciones
        ];
      case 'incautaciones':
        const incautacion = item as Incautacion;
        return [
          ...commonFields, 
          incautacion.tipoIncautacion, 
          incautacion.descripcion,
          incautacion.cantidad,
          incautacion.estado,
          incautacion.custodio,
          incautacion.observaciones
        ];
      default:
        return commonFields;
    }
  };

  // Filter data based on search term - mejorado para manejar valores nulos/undefined
  const filteredData = useMemo(() => {
    if (!debouncedSearchTerm.trim()) return data;

    const searchTermLower = debouncedSearchTerm.toLowerCase().trim();

    return data.filter(item => {
      const searchFields = getSearchableFields(item);
      return searchFields.some(field => {
        // Manejar valores nulos, undefined, y tipos especiales
        if (field === null || field === undefined) return false;
        
        // Convertir a string y limpiar
        const fieldStr = String(field).toLowerCase();
        
        // Buscar coincidencias exactas y parciales
        return fieldStr.includes(searchTermLower) ||
               // Búsqueda por palabras individuales
               searchTermLower.split(/\s+/).every(term => 
                 term.length > 0 && fieldStr.includes(term)
               );
      });
    });
  }, [data, debouncedSearchTerm, tableType]);

  const getVisibleColumns = (): string[] => {
    switch (tableType) {
      case 'notas_informativas':
        // Si estamos filtrando por procuraduría, mostrar solo campos esenciales
        if (title?.includes('Procuraduría')) {
          return ['numeroCaso', 'fecha', 'provinciamunicipio', 'tipoActividad', 'procuraduria'];
        }
        return ['numeroCaso', 'fecha', 'provinciamunicipio', 'localidad', 'tipoActividad', 'notificados', 'procuraduria'];
      case 'detenidos':
        return ['numeroCaso', 'fecha', 'provinciamunicipio', 'nombre', 'motivoDetencion', 'estadoProceso'];
      case 'vehiculos':
        return ['numeroCaso', 'tipo', 'marca', 'color', 'provinciamunicipio', 'fecha'];
      case 'incautaciones':
        return ['numeroCaso', 'fecha', 'provinciamunicipio', 'tipoIncautacion', 'cantidad', 'estado'];
      default:
        return ['numeroCaso', 'fecha', 'provinciamunicipio'];
    }
  };

  const getColumnLabel = (column: string): string => {
    const labels: Record<string, string> = {
      numeroCaso: 'Número de Caso',
      fecha: 'Fecha',
      localidad: 'Localidad',
      region: 'Región',
      tipoActividad: 'Tipo de Actividad',
      notificados: 'Notificados',
      procuraduria: 'Procuraduría',
      nombre: 'Nombre',
      motivoDetencion: 'Motivo de Detención',
      estadoProceso: 'Estado del Proceso',
      tipo: 'Tipo',
      marca: 'Marca',
      color: 'Color',
      detalle: 'Detalle',
      provinciamunicipio: 'Provincia/Municipio',
      estado: 'Estado',
      tipoIncautacion: 'Tipo de Incautación',
      cantidad: 'Cantidad'
    };
    return labels[column] || column;
  };

  const renderCellContent = (item: TableItem, column: string): React.ReactNode => {
    const value = item[column as keyof TableItem];

    // Handle boolean values
    if (typeof value === 'boolean') {
      return (
        <Chip
          label={value ? 'Sí' : 'No'}
          color={value ? 'success' : 'default'}
          size="small"
        />
      );
    }

    // Handle numeric values
    if (typeof value === 'number') {
      return <span>{value}</span>;
    }

    // Handle notificados field specifically
    if (column === 'notificados') {
      if (!value || value.trim() === '') {
        return (
          <Chip
            label="Sin notificar"
            color="default"
            size="small"
          />
        );
      }
      return (
        <Chip
          label={String(value)}
          color="info"
          size="small"
        />
      );
    }

    // Handle status/state fields with chips
    if (column === 'estado' || column === 'estadoProceso') {
      const getStatusColor = (status: string) => {
        const statusLower = status.toLowerCase();
        if (statusLower.includes('activo') || statusLower.includes('proceso')) return 'warning';
        if (statusLower.includes('completado') || statusLower.includes('cerrado')) return 'success';
        if (statusLower.includes('retenido') || statusLower.includes('incautado')) return 'error';
        return 'default';
      };

      return (
        <Chip
          label={String(value)}
          color={getStatusColor(String(value))}
          size="small"
        />
      );
    }

    // Handle activity type with different colors
    if (column === 'tipoActividad') {
      const getActivityColor = (activity: string) => {
        if (activity.toLowerCase().includes('operativo')) return 'primary';
        if (activity.toLowerCase().includes('patrulla')) return 'success';
        return 'default';
      };

      return (
        <Chip
          label={String(value)}
          color={getActivityColor(String(value))}
          size="small"
        />
      );
    }

    // Default string rendering with truncation for long text
    const stringValue = String(value);
    if (stringValue.length > 30) {
      return (
        <Tooltip title={stringValue}>
          <span>{stringValue.substring(0, 30)}...</span>
        </Tooltip>
      );
    }

    return <span>{stringValue}</span>;
  };

  const handleView = useCallback((item: TableItem) => {
    setSelectedItem(item);
    setDetailsModalOpen(true);
  }, []);

  const handleEdit = useCallback((item: TableItem) => {
    setSelectedItem(item);
    setEditModalOpen(true);
  }, []);

  const handleDelete = useCallback((id: string) => {
    if (window.confirm('¿Está seguro de que desea eliminar este registro?')) {
      onDelete(id);
    }
  }, [onDelete]);

  const handleModalSave = useCallback((item: TableItem) => {
    console.log('🟦 GenericTable - handleModalSave iniciado');
    console.log('🟦 Item recibido:', item);
    
    try {
      console.log('🟦 Llamando onUpdate');
      onUpdate(item);
      console.log('🟦 Operación completada, cerrando modal');
      setEditModalOpen(false);
    } catch (error) {
      console.error('🟦 Error en handleModalSave:', error);
    }
  }, [onUpdate]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setPage(0);
  }, []);

  const handlePageChange = useCallback((_: unknown, newPage: number) => {
    setPage(newPage);
  }, []);

  const handleRowsPerPageChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  const paginatedData = useMemo(() => 
    filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filteredData, page, rowsPerPage]
  );

  const visibleColumns = useMemo(() => getVisibleColumns(), [tableType]);

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            {title || metadata.displayName}
          </Typography>
        </Box>

        {/* Search */}
        <TextField
          fullWidth
          variant="outlined"
          placeholder={`Buscar por número de caso, fecha, provincia, nombre... (${metadata.displayName.toLowerCase()})`}
          value={searchTerm}
          onChange={handleSearchChange}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              handleClearSearch();
            }
            e.stopPropagation();
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color={searchTerm ? 'primary' : 'disabled'} />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                {searchTerm && searchTerm !== debouncedSearchTerm ? (
                  <Typography variant="caption" color="text.secondary">
                    Buscando...
                  </Typography>
                ) : searchTerm ? (
                  <Tooltip title="Limpiar búsqueda">
                    <IconButton
                      size="small"
                      onClick={handleClearSearch}
                      edge="end"
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                ) : null}
              </InputAdornment>
            ),
            onClick: (e) => {
              e.stopPropagation();
              e.currentTarget.focus();
            }
          }}
          size="small"
          sx={{
            '& .MuiInputBase-input': {
              cursor: 'text'
            }
          }}
        />

        {/* Stats & Tips */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
          <Box display="flex" gap={2}>
            <Chip
              label={`Total: ${data.length}`}
              color="primary"
              variant="outlined"
            />
            {debouncedSearchTerm && (
              <Chip
                label={`Filtrados: ${filteredData.length}`}
                color="secondary"
                variant="outlined"
              />
            )}
            {searchTerm && searchTerm !== debouncedSearchTerm && (
              <Chip
                label="Buscando..."
                color="warning"
                variant="outlined"
                size="small"
              />
            )}
          </Box>
          
          {!searchTerm && (
            <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
              💡 Tip: Presiona Escape para limpiar la búsqueda
            </Typography>
          )}
        </Box>
      </Box>

      {/* Table */}
      {loading ? (
        <Box p={4} textAlign="center">
          <Typography>Cargando...</Typography>
        </Box>
      ) : filteredData.length === 0 ? (
        <Box p={4} textAlign="center">
          <Alert severity="info">
            {debouncedSearchTerm ? 
              `No se encontraron resultados para "${debouncedSearchTerm}". Intenta con otros términos de búsqueda.` : 
              'No hay datos disponibles.'
            }
          </Alert>
          {debouncedSearchTerm && (
            <Button 
              onClick={handleClearSearch}
              sx={{ mt: 2 }}
              variant="outlined"
              size="small"
            >
              Limpiar búsqueda
            </Button>
          )}
        </Box>
      ) : (
        <>
          <TableContainer sx={{ maxHeight: TABLE_CONFIG.maxHeight }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  {visibleColumns.map((column) => (
                    <TableCell key={column} sx={{ fontWeight: 'bold' }}>
                      {getColumnLabel(column)}
                    </TableCell>
                  ))}
                  <TableCell sx={{ fontWeight: 'bold', width: 160 }}>
                    Acciones
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedData.map((item) => (
                  <TableRow key={item.id} hover>
                    {visibleColumns.map((column) => (
                      <TableCell key={column}>
                        {renderCellContent(item, column)}
                      </TableCell>
                    ))}
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <Tooltip title="Ver detalles">
                          <IconButton
                            size="small"
                            onClick={() => handleView(item)}
                            color="info"
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {permissions.canEditRecords && (
                          <Tooltip title="Editar">
                            <IconButton
                              size="small"
                              onClick={() => handleEdit(item)}
                              color="primary"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {permissions.canDeleteRecords && (
                          <Tooltip title="Eliminar">
                            <IconButton
                              size="small"
                              onClick={() => handleDelete(item.id)}
                              color="error"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          <TablePagination
            rowsPerPageOptions={TABLE_CONFIG.rowsPerPageOptions}
            component="div"
            count={filteredData.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
            labelRowsPerPage="Filas por página:"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
            }
          />
        </>
      )}

      {/* Edit Modal */}
      <SimpleEditModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSave={handleModalSave}
        item={selectedItem}
        tableType={tableType}
      />

      {/* Details Modal */}
      <CaseDetailsModal
        open={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        item={selectedItem}
        tableType={tableType}
      />
    </Paper>
  );
};

export default GenericTable;