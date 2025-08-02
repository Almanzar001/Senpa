import React, { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
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
  Breadcrumbs
} from '@mui/material';
import { 
  Search as SearchIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  ArrowBack as BackIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { useData } from '../contexts/DataContext';
import { type EnvironmentalCase } from '../services/environmentalAnalytics';

const OperationsPage: React.FC = () => {
  const { filteredCases, loading, error } = useData();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCase, setSelectedCase] = useState<EnvironmentalCase | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);

  // Get filter from URL params
  const filterType = searchParams.get('filter');
  const filterValue = searchParams.get('value');

  const filteredAndSearchedCases = useMemo(() => {
    let filtered = filteredCases;
    
    // Apply URL filter if present
    if (filterType && filterValue) {
      switch (filterType) {
        case 'operativos':
          filtered = filtered.filter(c => 
            c.tipoActividad && c.tipoActividad.toLowerCase().includes('operativo')
          );
          break;
        case 'patrullas':
          filtered = filtered.filter(c => 
            c.tipoActividad && c.tipoActividad.toLowerCase().includes('patrulla')
          );
          break;
        case 'detenidos':
          filtered = filtered.filter(c => 
            c.detenidos && c.detenidos > 0
          );
          break;
        case 'vehiculos':
          filtered = filtered.filter(c => 
            c.vehiculosDetenidos && c.vehiculosDetenidos > 0
          );
          break;
        case 'incautaciones':
          filtered = filtered.filter(c => 
            c.incautaciones && c.incautaciones.length > 0
          );
          break;
        case 'notificados':
          filtered = filtered.filter(c => 
            c.notificados && c.notificados > 0
          );
          break;
        case 'procuraduria':
          filtered = filtered.filter(c => 
            c.procuraduria && c.procuraduria > 0
          );
          break;
      }
    }
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(caso => 
        Object.values(caso).some(value => 
          value && value.toString().toLowerCase().includes(term)
        )
      );
    }
    
    return filtered;
  }, [filteredCases, searchTerm, filterType, filterValue]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewCase = (caso: EnvironmentalCase) => {
    setSelectedCase(caso);
    setDetailDialogOpen(true);
  };

  const clearFilter = () => {
    setSearchParams({});
  };

  const getFilterDisplayName = (type: string) => {
    const names: Record<string, string> = {
      operativos: 'Operativos Realizados',
      patrullas: 'Patrullas',
      detenidos: 'Detenidos',
      vehiculos: 'Vehículos Detenidos',
      incautaciones: 'Incautaciones',
      notificados: 'Notificados',
      procuraduria: 'Procuraduría'
    };
    return names[type] || type;
  };

  const exportToCSV = () => {
    const headers = [
      'Número de Caso',
      'Fecha',
      'Hora',
      'Tipo de Actividad',
      'Localidad',
      'Detenidos',
      'Vehículos Detenidos',
      'Incautaciones',
      'Observaciones'
    ];
    
    const csvContent = [
      headers.join(','),
      ...filteredAndSearchedCases
        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
        .map(caso => [
          caso.numeroCaso || '',
          caso.fecha || '',
          caso.hora || '',
          caso.tipoActividad || '',
          caso.localidad || '',
          caso.detenidos || 0,
          caso.vehiculosDetenidos || 0,
          caso.incautaciones?.join('; ') || '',
          (caso.observaciones || '').replace(/,/g, ';')
        ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `operaciones_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setExportMenuAnchor(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">Cargando operaciones...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-red-600">
          <p>Error al cargar los datos: {error}</p>
          <Link to="/" className="text-blue-600 hover:underline mt-2 inline-block">
            Volver al Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Breadcrumbs className="mb-4">
            <Link to="/" className="text-blue-600 hover:underline">
              Dashboard
            </Link>
            <Typography color="text.primary">Operaciones Detalladas</Typography>
          </Breadcrumbs>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-neutral-800 mb-2">
                Operaciones Detalladas
              </h1>
              {filterType && (
                <div className="flex items-center gap-2">
                  <Chip 
                    label={`Filtrado por: ${getFilterDisplayName(filterType)}`}
                    color="primary"
                    onDelete={clearFilter}
                    deleteIcon={<ClearIcon />}
                  />
                </div>
              )}
            </div>
            <Link
              to="/"
              className="flex items-center gap-2 px-4 py-2 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
            >
              <BackIcon />
              Volver al Dashboard
            </Link>
          </div>
        </div>

        {/* Stats Card */}
        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-sm text-neutral-600">Total de Operaciones</p>
                  <p className="text-2xl font-bold text-neutral-800">
                    {filteredAndSearchedCases.length.toLocaleString()}
                  </p>
                </div>
                {filterType && (
                  <div>
                    <p className="text-sm text-neutral-600">Mostrando</p>
                    <p className="text-lg font-semibold text-primary-600">
                      {getFilterDisplayName(filterType)}
                    </p>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <TextField
                  size="small"
                  placeholder="Buscar en operaciones..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                  className="w-64"
                />
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={(e) => setExportMenuAnchor(e.currentTarget)}
                >
                  Exportar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Operations Table */}
        <Paper className="shadow-lg">
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow className="bg-neutral-100">
                  <TableCell className="font-semibold">Número de Caso</TableCell>
                  <TableCell className="font-semibold">Fecha</TableCell>
                  <TableCell className="font-semibold">Hora</TableCell>
                  <TableCell className="font-semibold">Tipo</TableCell>
                  <TableCell className="font-semibold">Localidad</TableCell>
                  <TableCell className="font-semibold text-center">Detenidos</TableCell>
                  <TableCell className="font-semibold text-center">Vehículos</TableCell>
                  <TableCell className="font-semibold text-center">Incautaciones</TableCell>
                  <TableCell className="font-semibold text-center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAndSearchedCases
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((caso, index) => (
                    <TableRow 
                      key={`${caso.numeroCaso}-${index}`} 
                      hover
                      className="hover:bg-neutral-50"
                    >
                      <TableCell className="font-medium">
                        {caso.numeroCaso || `OP-${index + 1}`}
                      </TableCell>
                      <TableCell>{caso.fecha || 'N/A'}</TableCell>
                      <TableCell>{caso.hora || 'N/A'}</TableCell>
                      <TableCell>
                        <Chip 
                          label={caso.tipoActividad || 'Sin especificar'} 
                          size="small"
                          color={caso.tipoActividad?.toLowerCase().includes('operativo') ? 'primary' : 'default'}
                        />
                      </TableCell>
                      <TableCell>{caso.localidad || 'N/A'}</TableCell>
                      <TableCell className="text-center">
                        {caso.detenidos > 0 ? (
                          <Chip label={caso.detenidos} color="error" size="small" />
                        ) : (
                          '0'
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {caso.vehiculosDetenidos > 0 ? (
                          <Chip label={caso.vehiculosDetenidos} color="warning" size="small" />
                        ) : (
                          '0'
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {caso.incautaciones && caso.incautaciones.length > 0 ? (
                          <Chip label={caso.incautaciones.length} color="info" size="small" />
                        ) : (
                          '0'
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <IconButton
                          size="small"
                          onClick={() => handleViewCase(caso)}
                          className="text-blue-600 hover:bg-blue-50"
                        >
                          <ViewIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          <TablePagination
            rowsPerPageOptions={[10, 25, 50, 100]}
            component="div"
            count={filteredAndSearchedCases.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Filas por página:"
            labelDisplayedRows={({ from, to, count }) => 
              `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
            }
          />
        </Paper>

        {/* Export Menu */}
        <Menu
          anchorEl={exportMenuAnchor}
          open={Boolean(exportMenuAnchor)}
          onClose={() => setExportMenuAnchor(null)}
        >
          <MenuItem onClick={exportToCSV}>
            <DownloadIcon className="mr-2" />
            Exportar como CSV
          </MenuItem>
        </Menu>

        {/* Case Detail Dialog */}
        <Dialog 
          open={detailDialogOpen} 
          onClose={() => setDetailDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            Detalles del Caso: {selectedCase?.numeroCaso || 'Sin número'}
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
                      {selectedCase.fecha || 'N/A'} {selectedCase.hora || ''}
                    </Typography>
                  </div>
                  <div>
                    <Typography variant="subtitle2" className="font-semibold text-gray-600">
                      Ubicación
                    </Typography>
                    <Typography variant="body1">
                      {selectedCase.localidad || 'No especificada'}{selectedCase.provincia ? `, ${selectedCase.provincia}` : ''}
                    </Typography>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Typography variant="subtitle2" className="font-semibold text-gray-600">
                      Tipo de Actividad
                    </Typography>
                    <Chip 
                      label={selectedCase.tipoActividad || 'Sin especificar'} 
                      color={selectedCase.tipoActividad?.toLowerCase().includes('operativo') ? 'primary' : 'default'}
                      variant="outlined"
                    />
                  </div>
                  <div>
                    <Typography variant="subtitle2" className="font-semibold text-gray-600">
                      Área Temática
                    </Typography>
                    <Chip 
                      label={selectedCase.areaTemática || 'No especificada'} 
                      color="info"
                      variant="outlined"
                    />
                  </div>
                </div>

                {/* Metrics Section */}
                <div className="grid grid-cols-3 gap-4 bg-neutral-50 p-4 rounded-lg">
                  <div className="text-center">
                    <Typography variant="h6" className="font-bold text-red-600">
                      {selectedCase.detenidos || 0}
                    </Typography>
                    <Typography variant="caption" className="text-gray-600">
                      Detenidos
                    </Typography>
                  </div>
                  <div className="text-center">
                    <Typography variant="h6" className="font-bold text-orange-600">
                      {selectedCase.vehiculosDetenidos || 0}
                    </Typography>
                    <Typography variant="caption" className="text-gray-600">
                      Vehículos
                    </Typography>
                  </div>
                  <div className="text-center">
                    <Typography variant="h6" className="font-bold text-blue-600">
                      {selectedCase.notificados || 0}
                    </Typography>
                    <Typography variant="caption" className="text-gray-600">
                      Notificados
                    </Typography>
                  </div>
                </div>

                {/* Detailed Information */}
                {selectedCase.detenidosInfo && selectedCase.detenidosInfo.length > 0 && (
                  <div>
                    <Typography variant="subtitle2" className="font-semibold text-gray-600 mb-2">
                      Detenidos ({selectedCase.detenidos})
                    </Typography>
                    <div className="space-y-1">
                      {selectedCase.detenidosInfo.map((detenido: any, index: number) => (
                        <div key={index} className="flex justify-between bg-red-50 p-2 rounded">
                          <span>{detenido.nombre || `Detenido ${index + 1}`}</span>
                          <Chip label={detenido.nacionalidad || 'N/A'} size="small" />
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
                          <span>{vehiculo.tipo || 'Vehículo'}</span>
                          <span className="text-gray-600">{vehiculo.placa || 'Sin placa'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedCase.incautaciones && selectedCase.incautaciones.length > 0 && (
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

                {selectedCase.observaciones && (
                  <div>
                    <Typography variant="subtitle2" className="font-semibold text-gray-600 mb-2">
                      Observaciones
                    </Typography>
                    <Typography variant="body1" className="bg-blue-50 p-3 rounded-lg">
                      {selectedCase.observaciones}
                    </Typography>
                  </div>
                )}

                {selectedCase.resultado && (
                  <div>
                    <Typography variant="subtitle2" className="font-semibold text-gray-600 mb-2">
                      Resultado
                    </Typography>
                    <Typography variant="body1" className="bg-green-50 p-3 rounded-lg">
                      {selectedCase.resultado}
                    </Typography>
                  </div>
                )}

                {selectedCase.coordenadas && (
                  <div>
                    <Typography variant="subtitle2" className="font-semibold text-gray-600">
                      Coordenadas
                    </Typography>
                    <Typography variant="body1" className="font-mono text-sm bg-gray-100 p-2 rounded">
                      Lat: {selectedCase.coordenadas.lat}, Lng: {selectedCase.coordenadas.lng}
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
      </div>
    </div>
  );
};

export default OperationsPage;