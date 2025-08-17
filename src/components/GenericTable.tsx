import React, { useState, useMemo } from 'react';
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
  Add as AddIcon
} from '@mui/icons-material';
import type { TableType, NotaInformativa, Detenido, Vehiculo, Incautacion } from '../types/tableTypes';
import { TABLE_METADATA } from '../types/tableTypes';
import SimpleEditModal from './SimpleEditModal';

type TableItem = NotaInformativa | Detenido | Vehiculo | Incautacion;

interface GenericTableProps {
  tableType: TableType;
  data: TableItem[];
  onUpdate: (item: TableItem) => void;
  onDelete: (id: string) => void;
  onCreate: (item: TableItem) => void;
  loading?: boolean;
  title?: string;
}

const GenericTable: React.FC<GenericTableProps> = ({
  tableType,
  data,
  onUpdate,
  onDelete,
  onCreate,
  loading = false,
  title
}) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<TableItem | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('edit');

  const metadata = TABLE_METADATA[tableType];

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

  const getSearchableFields = (item: TableItem): any[] => {
    const commonFields = [item.numeroCaso, item.fecha, item.provincia, item.localidad, item.region];
    
    switch (tableType) {
      case 'notas_informativas':
        const nota = item as NotaInformativa;
        return [...commonFields, nota.tipoActividad, nota.areaTemática];
      case 'detenidos':
        const detenido = item as Detenido;
        return [...commonFields, detenido.nombre, detenido.apellido, detenido.cedula, detenido.nacionalidad];
      case 'vehiculos':
        const vehiculo = item as Vehiculo;
        return [...commonFields, vehiculo.tipoVehiculo, vehiculo.marca, vehiculo.modelo, vehiculo.placa];
      case 'incautaciones':
        const incautacion = item as Incautacion;
        return [...commonFields, incautacion.tipoIncautacion, incautacion.descripcion];
      default:
        return commonFields;
    }
  };

  const getVisibleColumns = (): string[] => {
    const baseColumns = ['numeroCaso', 'fecha', 'provincia', 'localidad'];
    
    switch (tableType) {
      case 'notas_informativas':
        return [...baseColumns, 'tipoActividad', 'notificados', 'procuraduria'];
      case 'detenidos':
        return [...baseColumns, 'nombre', 'apellido', 'nacionalidad', 'estadoProceso'];
      case 'vehiculos':
        return [...baseColumns, 'tipoVehiculo', 'marca', 'placa', 'estado'];
      case 'incautaciones':
        return [...baseColumns, 'tipoIncautacion', 'cantidad', 'estado'];
      default:
        return baseColumns;
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
      apellido: 'Apellido',
      nacionalidad: 'Nacionalidad',
      estadoProceso: 'Estado del Proceso',
      tipoVehiculo: 'Tipo de Vehículo',
      marca: 'Marca',
      placa: 'Placa',
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
        if (activity.toLowerCase().includes('patrulla')) return 'info';
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

  const handleEdit = (item: TableItem) => {
    setSelectedItem(item);
    setModalMode('edit');
    setEditModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedItem(null);
    setModalMode('create');
    setEditModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('¿Está seguro de que desea eliminar este registro?')) {
      onDelete(id);
    }
  };

  const handleModalSave = (item: TableItem) => {
    if (modalMode === 'create') {
      onCreate(item);
    } else {
      onUpdate(item);
    }
    setEditModalOpen(false);
  };

  const paginatedData = filteredData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const visibleColumns = getVisibleColumns();

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            {title || metadata.displayName}
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreate}
          >
            Agregar {metadata.displayName.slice(0, -1)}
          </Button>
        </Box>

        {/* Search */}
        <TextField
          fullWidth
          variant="outlined"
          placeholder={`Buscar en ${metadata.displayName.toLowerCase()}...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          size="small"
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
          <TableContainer sx={{ maxHeight: 600 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  {visibleColumns.map((column) => (
                    <TableCell key={column} sx={{ fontWeight: 'bold' }}>
                      {getColumnLabel(column)}
                    </TableCell>
                  ))}
                  <TableCell sx={{ fontWeight: 'bold', width: 120 }}>
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
                        <Tooltip title="Editar">
                          <IconButton
                            size="small"
                            onClick={() => handleEdit(item)}
                            color="primary"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar">
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(item.id)}
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={filteredData.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            onRowsPerPageChange={(event) => {
              setRowsPerPage(parseInt(event.target.value, 10));
              setPage(0);
            }}
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
    </Paper>
  );
};

export default GenericTable;