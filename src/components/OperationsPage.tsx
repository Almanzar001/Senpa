import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Typography,
  Card,
  CardContent,
  Breadcrumbs,
  Alert
} from '@mui/material';
import { 
  ArrowBack as BackIcon
} from '@mui/icons-material';
import type { TableType, NotaInformativa, Detenido, Vehiculo, Incautacion } from '../types/tableTypes';
import { 
  notasInformativasService,
  detenidosService,
  vehiculosService,
  incautacionesService
} from '../services/tableServices';
import GenericTable from './GenericTable';
import { useData } from '../contexts/DataContext';
import { DataMapperService } from '../services/dataMapper';

const OperationsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { cases, loading: dataLoading, error: dataError } = useData();
  const [error, setError] = useState<string | null>(null);
  
  // Data state for each table type
  const [notasData, setNotasData] = useState<NotaInformativa[]>([]);
  const [detenidosData, setDetenidosData] = useState<Detenido[]>([]);
  const [vehiculosData, setVehiculosData] = useState<Vehiculo[]>([]);
  const [incautacionesData, setIncautacionesData] = useState<Incautacion[]>([]);

  // Get filter from URL params
  const filterType = searchParams.get('filter');

  // Load and map data from existing EnvironmentalCases
  useEffect(() => {
    if (cases && cases.length > 0) {
      try {
        // Map EnvironmentalCase data to specific table formats
        const mappedNotas = DataMapperService.mapToNotaInformativa(cases);
        const mappedDetenidos = DataMapperService.mapToDetenidos(cases);
        const mappedVehiculos = DataMapperService.mapToVehiculos(cases);
        const mappedIncautaciones = DataMapperService.mapToIncautaciones(cases);

        // Clear services and populate with mapped data
        notasInformativasService.items.clear();
        detenidosService.items.clear();
        vehiculosService.items.clear();
        incautacionesService.items.clear();

        mappedNotas.forEach(nota => notasInformativasService.items.set(nota.id, nota));
        mappedDetenidos.forEach(detenido => detenidosService.items.set(detenido.id, detenido));
        mappedVehiculos.forEach(vehiculo => vehiculosService.items.set(vehiculo.id, vehiculo));
        mappedIncautaciones.forEach(incautacion => incautacionesService.items.set(incautacion.id, incautacion));

        // Update state
        setNotasData(mappedNotas);
        setDetenidosData(mappedDetenidos);
        setVehiculosData(mappedVehiculos);
        setIncautacionesData(mappedIncautaciones);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al mapear datos');
      }
    }
  }, [cases]);

  // Determine which table to show based on filter
  const getTableTypeFromFilter = (filter: string): TableType | null => {
    switch (filter) {
      case 'operativos':
      case 'patrullas':
      case 'notificados':
      case 'procuraduria':
        return 'notas_informativas';
      case 'detenidos':
        return 'detenidos';
      case 'vehiculos':
        return 'vehiculos';
      case 'incautaciones':
        return 'incautaciones';
      default:
        return null;
    }
  };

  const currentTableType = filterType ? getTableTypeFromFilter(filterType) : null;

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

  // Generic CRUD handlers
  const handleUpdate = (item: any) => {
    try {
      switch (currentTableType) {
        case 'notas_informativas':
          notasInformativasService.update(item as NotaInformativa);
          setNotasData(notasInformativasService.getAll());
          break;
        case 'detenidos':
          detenidosService.update(item as Detenido);
          setDetenidosData(detenidosService.getAll());
          break;
        case 'vehiculos':
          vehiculosService.update(item as Vehiculo);
          setVehiculosData(vehiculosService.getAll());
          break;
        case 'incautaciones':
          incautacionesService.update(item as Incautacion);
          setIncautacionesData(incautacionesService.getAll());
          break;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar');
    }
  };

  const handleCreate = (item: any) => {
    try {
      switch (currentTableType) {
        case 'notas_informativas':
          notasInformativasService.add(item as NotaInformativa);
          setNotasData(notasInformativasService.getAll());
          break;
        case 'detenidos':
          detenidosService.add(item as Detenido);
          setDetenidosData(detenidosService.getAll());
          break;
        case 'vehiculos':
          vehiculosService.add(item as Vehiculo);
          setVehiculosData(vehiculosService.getAll());
          break;
        case 'incautaciones':
          incautacionesService.add(item as Incautacion);
          setIncautacionesData(incautacionesService.getAll());
          break;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear');
    }
  };

  const handleDelete = (id: string) => {
    try {
      switch (currentTableType) {
        case 'notas_informativas':
          notasInformativasService.delete(id);
          setNotasData(notasInformativasService.getAll());
          break;
        case 'detenidos':
          detenidosService.delete(id);
          setDetenidosData(detenidosService.getAll());
          break;
        case 'vehiculos':
          vehiculosService.delete(id);
          setVehiculosData(vehiculosService.getAll());
          break;
        case 'incautaciones':
          incautacionesService.delete(id);
          setIncautacionesData(incautacionesService.getAll());
          break;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar');
    }
  };


  const loading = dataLoading;

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

  if (dataError || error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-red-600">
          <p>Error al cargar los datos: {dataError || error}</p>
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
                {filterType ? getFilterDisplayName(filterType) : 'Operaciones Detalladas'}
              </h1>
              {filterType && (
                <Typography color="text.secondary">
                  Mostrando tabla específica para: {getFilterDisplayName(filterType)}
                </Typography>
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

        {/* Error Display */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Show appropriate table based on filter */}
        {!filterType && (
          <Card className="mb-6">
            <CardContent className="py-4">
              <Typography variant="h6" gutterBottom>
                Selecciona una métrica desde el Dashboard
              </Typography>
              <Typography color="text.secondary">
                Para ver y editar datos específicos, haz clic en una de las métricas en el dashboard principal.
              </Typography>
            </CardContent>
          </Card>
        )}

        {/* Render specific table based on filter */}
        {currentTableType === 'notas_informativas' && (
          <GenericTable
            tableType="notas_informativas"
            data={notasData}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            onCreate={handleCreate}
            loading={loading}
            title={getFilterDisplayName(filterType!)}
          />
        )}

        {currentTableType === 'detenidos' && (
          <GenericTable
            tableType="detenidos"
            data={detenidosData}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            onCreate={handleCreate}
            loading={loading}
            title={getFilterDisplayName(filterType!)}
          />
        )}

        {currentTableType === 'vehiculos' && (
          <GenericTable
            tableType="vehiculos"
            data={vehiculosData}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            onCreate={handleCreate}
            loading={loading}
            title={getFilterDisplayName(filterType!)}
          />
        )}

        {currentTableType === 'incautaciones' && (
          <GenericTable
            tableType="incautaciones"
            data={incautacionesData}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            onCreate={handleCreate}
            loading={loading}
            title={getFilterDisplayName(filterType!)}
          />
        )}

      </div>
    </div>
  );
};

export default OperationsPage;