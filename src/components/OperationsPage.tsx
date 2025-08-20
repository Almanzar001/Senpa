import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useLocation } from 'react-router-dom';
import {
  Typography,
  Card,
  CardContent,
  Breadcrumbs,
  Alert,
  Box
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
import { usePermissions } from '../hooks/usePermissions';
import { DataMapperService } from '../services/dataMapper';
import { enumOptionsService } from '../services/enumOptions';

const OperationsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { filteredCases, loading: dataLoading, error: dataError, updateCase, filters } = useData();
  const permissions = usePermissions();
  const [error, setError] = useState<string | null>(null);

  // Función para obtener vehículos directamente de la base de datos
  const fetchVehiculosFromDB = async (): Promise<Vehiculo[]> => {
    try {
      const { supabase } = await import('../services/supabase');
      console.log('🟦 Consultando tabla vehiculos directamente...');
      console.log('🟦 Filtros de fecha aplicados:', { 
        dateFrom: filters.dateFrom, 
        dateTo: filters.dateTo 
      });
      
      // Construir la consulta base
      let query = supabase
        .from('vehiculos')
        .select('*');
      
      // Aplicar filtros de fecha si existen
      if (filters.dateFrom) {
        query = query.gte('fecha', filters.dateFrom);
        console.log('🟦 Aplicando filtro fecha desde:', filters.dateFrom);
      }
      
      if (filters.dateTo) {
        query = query.lte('fecha', filters.dateTo);
        console.log('🟦 Aplicando filtro fecha hasta:', filters.dateTo);
      }
      
      // Ordenar por fecha
      query = query.order('fecha', { ascending: false });
      
      const { data, error } = await query;
      
      if (error) {
        console.error('❌ Error consultando tabla vehiculos:', error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        console.log('⚠️ No se encontraron vehículos en la BD para los filtros aplicados');
        return [];
      }
      
      console.log('✅ Vehículos obtenidos de BD (con filtros):', data.length);
      console.log('🟦 Muestra de datos filtrados:', data.slice(0, 2));
      
      // Mapear los datos de la BD al formato esperado por la interfaz
      const vehiculos: Vehiculo[] = data.map(row => ({
        id: row.id || `vehiculo_${row.numerocaso || Date.now()}`,
        numeroCaso: row.numerocaso || '',
        tipo: row.tipo || '',
        marca: row.marca || '',
        color: row.color || '',
        detalle: row.detalle || '',
        provinciaMunicipio: row.provinciamunicipio || '',
        fecha: row.fecha || ''
      }));
      
      console.log('✅ Vehículos mapeados con filtros:', vehiculos.length);
      return vehiculos;
      
    } catch (error) {
      console.error('❌ Error en fetchVehiculosFromDB:', error);
      return [];
    }
  };
  
  // Data state for each table type
  const [notasData, setNotasData] = useState<NotaInformativa[]>([]);
  const [detenidosData, setDetenidosData] = useState<Detenido[]>([]);
  const [vehiculosData, setVehiculosData] = useState<Vehiculo[]>([]);
  const [incautacionesData, setIncautacionesData] = useState<Incautacion[]>([]);

  // Get filter from URL params or path
  const filterType = searchParams.get('filter');
  const pathSegments = location.pathname.split('/');
  const urlType = pathSegments[pathSegments.length - 1];
  
  
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
  
  // Determine current table type based on URL or filter
  const getCurrentTableType = (): TableType => {
    if (urlType === 'detenidos') return 'detenidos';
    if (urlType === 'vehiculos') return 'vehiculos';
    if (urlType === 'incautaciones') return 'incautaciones';
    
    // Handle filter from search params
    if (filterType) {
      const tableFromFilter = getTableTypeFromFilter(filterType);
      if (tableFromFilter) return tableFromFilter;
    }
    
    return 'notas_informativas';
  };

  const currentTableType = getCurrentTableType();

  // Load and map data from existing EnvironmentalCases
  useEffect(() => {
    const loadData = async () => {
      if (filteredCases && filteredCases.length > 0) {
        try {
          // Update enum options with current data
          await enumOptionsService.updateOptions(filteredCases);
          
          // Map EnvironmentalCase data to specific table formats
          const mappedNotas = DataMapperService.mapToNotaInformativa(filteredCases, filterType || undefined);
          const mappedDetenidos = DataMapperService.mapToDetenidos(filteredCases);
          // Para vehículos, consultar directamente la tabla de BD en lugar de mapear desde EnvironmentalCase
          const mappedVehiculos = currentTableType === 'vehiculos' ? 
            await fetchVehiculosFromDB() : 
            DataMapperService.mapToVehiculos(filteredCases);
          const mappedIncautaciones = DataMapperService.mapToIncautaciones(filteredCases);

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
    };
    
    loadData();
  }, [filteredCases, filterType, currentTableType, filters.dateFrom, filters.dateTo]);

  const getFilterDisplayName = (type: string) => {
    const names: Record<string, string> = {
      operativos: 'Operativos Realizados',
      patrullas: 'Patrullas',
      detenidos: 'Detenidos',
      vehiculos: 'Vehículos Detenidos',
      incautaciones: 'Incautaciones',
      notificados: 'Notificados',
      procuraduria: 'Casos con Procuraduría (Sí)'
    };
    return names[type] || type;
  };

  const getFilterDescription = (type: string) => {
    const descriptions: Record<string, string> = {
      operativos: 'Casos donde el tipo de actividad incluye "operativo"',
      patrullas: 'Casos donde el tipo de actividad incluye "patrulla"',
      detenidos: 'Casos que registran personas detenidas',
      vehiculos: 'Casos que registran vehículos detenidos',
      incautaciones: 'Casos que registran incautaciones',
      notificados: 'Casos con personas notificadas',
      procuraduria: 'Casos donde el campo procuraduría es igual a Sí'
    };
    return descriptions[type] || '';
  };

  // Generic CRUD handlers
  const handleUpdate = async (item: any) => {
    try {
      // First update the local service data
      switch (currentTableType) {
        case 'notas_informativas':
          notasInformativasService.update(item as NotaInformativa);
          setNotasData(notasInformativasService.getAll());
          
          // Update the original EnvironmentalCase for notas_informativas
          const nota = item as NotaInformativa;
          const originalCase = filteredCases.find(c => c.numeroCaso === nota.numeroCaso);
          
          if (originalCase) {
            const updatedCase = {
              ...originalCase,
              fecha: nota.fecha,
              hora: nota.hora,
              provincia: nota.provincia,
              localidad: nota.localidad,
              region: nota.region,
              tipoActividad: nota.tipoActividad,
              areaTemática: nota.areaTemática,
              notificados: nota.notificados && String(nota.notificados).trim() !== '' ? 1 : 0,
              notificadosInfo: String(nota.notificados || ''),
              procuraduria: nota.procuraduria,
              resultado: nota.resultado
            };
            
            await updateCase(updatedCase);
            
            // Force immediate re-mapping with updated cases
            const updatedCases = filteredCases.map(c => 
              c.numeroCaso === updatedCase.numeroCaso ? updatedCase : c
            );
            const remappedNotas = DataMapperService.mapToNotaInformativa(updatedCases, filterType || undefined);
            setNotasData(remappedNotas);
          }
          break;
        case 'detenidos':
          detenidosService.update(item as Detenido);
          setDetenidosData(detenidosService.getAll());
          break;
        case 'vehiculos':
          console.log('🟦 Actualizando vehículo en BD:', item);
          const vehiculo = item as Vehiculo;
          
          try {
            const { supabase } = await import('../services/supabase');
            
            const { data, error } = await supabase
              .from('vehiculos')
              .update({
                numerocaso: vehiculo.numeroCaso,
                tipo: vehiculo.tipo,
                marca: vehiculo.marca,
                color: vehiculo.color,
                detalle: vehiculo.detalle,
                provinciamunicipio: vehiculo.provinciaMunicipio,
                fecha: vehiculo.fecha
              })
              .eq('id', vehiculo.id);
            
            if (error) {
              console.error('❌ Error actualizando vehículo en BD:', error);
              throw error;
            }
            
            console.log('✅ Vehículo actualizado en BD exitosamente');
            
            // Recargar datos de vehículos desde BD
            const updatedVehiculos = await fetchVehiculosFromDB();
            setVehiculosData(updatedVehiculos);
            
          } catch (error) {
            console.error('❌ Error en actualización de vehículo:', error);
            setError('Error al actualizar el vehículo');
          }
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

  const handleDelete = async (id: string) => {
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
          try {
            const { supabase } = await import('../services/supabase');
            
            const { error } = await supabase
              .from('vehiculos')
              .delete()
              .eq('id', id);
            
            if (error) {
              console.error('❌ Error eliminando vehículo de BD:', error);
              throw error;
            }
            
            console.log('✅ Vehículo eliminado de BD exitosamente');
            
            // Recargar datos de vehículos desde BD
            const updatedVehiculos = await fetchVehiculosFromDB();
            setVehiculosData(updatedVehiculos);
            
          } catch (error) {
            console.error('❌ Error en eliminación de vehículo:', error);
            setError('Error al eliminar el vehículo');
          }
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
                <Box>
                  <Typography color="text.secondary">
                    Mostrando tabla específica para: {getFilterDisplayName(filterType)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {getFilterDescription(filterType)}
                  </Typography>
                  {(filters.dateFrom || filters.dateTo) && (
                    <Typography variant="caption" color="primary.main" sx={{ display: 'block', mt: 0.5 }}>
                      📅 Filtrado por fechas: {filters.dateFrom || 'Sin inicio'} - {filters.dateTo || 'Sin fin'}
                    </Typography>
                  )}
                </Box>
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
          <>
            <GenericTable
              tableType="notas_informativas"
              data={notasData}
              onUpdate={permissions.canEditRecords ? handleUpdate : () => {}}
              onDelete={permissions.canDeleteRecords ? handleDelete : () => {}}
              onCreate={() => {}} // Disabled - data comes from n8n automation
              loading={loading}
              title={getFilterDisplayName(filterType!)}
              allowCreate={false} // Disabled - data comes from n8n automation
            />
          </>
        )}

        {currentTableType === 'detenidos' && (
          <GenericTable
            tableType="detenidos"
            data={detenidosData}
            onUpdate={permissions.canEditRecords ? handleUpdate : () => {}}
            onDelete={permissions.canDeleteRecords ? handleDelete : () => {}}
            onCreate={() => {}} // Disabled - data comes from n8n automation
            loading={loading}
            title={urlType === 'detenidos' ? 'Detenidos' : getFilterDisplayName(filterType || 'detenidos')}
            allowCreate={false} // Disabled - data comes from n8n automation
          />
        )}

        {currentTableType === 'vehiculos' && (
          <GenericTable
            tableType="vehiculos"
            data={vehiculosData}
            onUpdate={permissions.canEditRecords ? handleUpdate : () => {}}
            onDelete={permissions.canDeleteRecords ? handleDelete : () => {}}
            onCreate={() => {}} // Disabled - data comes from n8n automation
            loading={loading}
            title={urlType === 'vehiculos' ? 'Vehículos' : getFilterDisplayName(filterType || 'vehiculos')}
            allowCreate={false} // Disabled - data comes from n8n automation
          />
        )}

        {currentTableType === 'incautaciones' && (
          <GenericTable
            tableType="incautaciones"
            data={incautacionesData}
            onUpdate={permissions.canEditRecords ? handleUpdate : () => {}}
            onDelete={permissions.canDeleteRecords ? handleDelete : () => {}}
            onCreate={() => {}} // Disabled - data comes from n8n automation
            loading={loading}
            title={urlType === 'incautaciones' ? 'Incautaciones' : getFilterDisplayName(filterType || 'incautaciones')}
            allowCreate={false} // Disabled - data comes from n8n automation
          />
        )}

      </div>
    </div>
  );
};

export default OperationsPage;