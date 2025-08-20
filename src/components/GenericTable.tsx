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
  Add as AddIcon,
  Visibility as ViewIcon
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
  onCreate: (item: TableItem) => void;
  loading?: boolean;
  title?: string;
  allowCreate?: boolean;
}

const GenericTable: React.FC<GenericTableProps> = ({
  tableType,
  data,
  onUpdate,
  onDelete,
  onCreate,
  loading = false,
  title,
  allowCreate = true
}) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(TABLE_CONFIG.defaultRowsPerPage);
  const [searchTerm, setSearchTerm] = useState('');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<TableItem | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('edit');

  const permissions = usePermissions();
  const metadata = TABLE_METADATA[tableType];

  const getSearchableFields = (item: TableItem): any[] => {
    const commonFields = [item.numeroCaso, item.fecha, item.provincia, item.localidad, item.region];
    
    switch (tableType) {
      case 'notas_informativas':
        const nota = item as NotaInformativa;
        return [...commonFields, nota.tipoActividad, nota.areaTemática];
      case 'detenidos':
        const detenido = item as Detenido;
        return [...commonFields, detenido.nombre, detenido.motivoDetencion];
      case 'vehiculos':
        const vehiculo = item as Vehiculo;
        return [...commonFields, vehiculo.tipo, vehiculo.marca, vehiculo.color, vehiculo.detalle];
      case 'incautaciones':
        const incautacion = item as Incautacion;
        return [...commonFields, incautacion.tipoIncautacion, incautacion.descripcion];
      default:
        return commonFields;
    }
  };

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;

    return data.filter(item => {
      const searchFields = getSearchableFields(item);
      return searchFields.some(field => 
        String(field).toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [data, searchTerm]);

  const getVisibleColumns = (): string[] => {
    switch (tableType) {
      case 'notas_informativas':
        return ['numeroCaso', 'fecha', 'provincia', 'localidad', 'tipoActividad', 'notificados', 'procuraduria'];
      case 'detenidos':
        return ['numeroCaso', 'fecha', 'provincia', 'localidad', 'nombre', 'motivoDetencion', 'estadoProceso'];
      case 'vehiculos':
        return ['numeroCaso', 'tipo', 'marca', 'color', 'provinciaMunicipio', 'fecha'];
      case 'incautaciones':
        return ['numeroCaso', 'fecha', 'provincia', 'localidad', 'tipoIncautacion', 'cantidad', 'estado'];
      default:
        return ['numeroCaso', 'fecha', 'provincia', 'localidad'];
    }
  };

  const getColumnLabel = (column: string): string => {
    const labels: Record<string, string> = {
      numeroCaso: 'Número de Caso',
      fecha: 'Fecha',
      provincia: 'Provincia',
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
      provinciaMunicipio: 'Provincia/Municipio',
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
    setModalMode('edit');
    setEditModalOpen(true);
  }, []);

  const handleCreate = useCallback(() => {
    setSelectedItem(null);
    setModalMode('create');
    setEditModalOpen(true);
  }, []);

  const handleDelete = useCallback((id: string) => {
    if (window.confirm('¿Está seguro de que desea eliminar este registro?')) {
      onDelete(id);
    }
  }, [onDelete]);

  const handleModalSave = useCallback((item: TableItem) => {
    console.log('🟦 GenericTable - handleModalSave iniciado');
    console.log('🟦 ModalMode:', modalMode);
    console.log('🟦 Item recibido:', item);
    
    try {
      if (modalMode === 'create') {
        console.log('🟦 Llamando onCreate');
        onCreate(item);
      } else if (modalMode === 'edit') {
        console.log('🟦 Llamando onUpdate');
        onUpdate(item);
      }
      console.log('🟦 Operación completada, cerrando modal');
      setEditModalOpen(false);
    } catch (error) {
      console.error('🟦 Error en handleModalSave:', error);
    }
  }, [modalMode, onCreate, onUpdate]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
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
          {allowCreate && permissions.canCreateRecords && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreate}
            >
              Agregar {metadata.displayName.slice(0, -1)}
            </Button>
          )}
        </Box>

        {/* Search */}
        <TextField
          fullWidth
          variant="outlined"
          placeholder={`Buscar en ${metadata.displayName.toLowerCase()}...`}
          value={searchTerm}
          onChange={handleSearchChange}
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
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

        {/* Stats */}
        <Box display="flex" gap={2} mt={2}>
          <Chip
            label={`Total: ${data.length}`}
            color="primary"
            variant="outlined"
          />
          {searchTerm && (
            <Chip
              label={`Filtrados: ${filteredData.length}`}
              color="secondary"
              variant="outlined"
            />
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
            {searchTerm ? 'No se encontraron resultados para la búsqueda.' : 'No hay datos disponibles.'}
          </Alert>
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
        mode={modalMode}
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