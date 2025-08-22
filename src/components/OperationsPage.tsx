import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams, useLocation } from 'react-router-dom';
import {
  Typography,
  Card,
  CardContent,
  Breadcrumbs,
  Alert,
  Box,
  Chip
} from '@mui/material';
import { 
  ArrowBack as BackIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import type { TableType, NotaInformativa, Detenido, Vehiculo, Incautacion } from '../types/tableTypes';
import { supabaseCrudService } from '../services/supabaseCrud';
import GenericTable from './GenericTable';
import { useData } from '../contexts/DataContext';
import { usePermissions } from '../hooks/usePermissions';
import { DataMapperService } from '../services/dataMapper';
import { enumOptionsService } from '../services/enumOptions';
import { logFilterPersistence } from '../utils/filterPersistence';
import { useFiltersFromURL } from '../hooks/useFiltersFromURL';
import EnvironmentalAnalyticsService from '../services/environmentalAnalytics';

const OperationsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { cases, loading: dataLoading, error: dataError, updateCase } = useData();
  const permissions = usePermissions();
  const [error, setError] = useState<string | null>(null);
  
  // Obtener filtros persistidos desde la URL
  const { filtersFromURL, hasPersistedFilters, environmentalFilters, source, isFromExecutive } = useFiltersFromURL();
  const analyticsService = React.useMemo(() => new EnvironmentalAnalyticsService(), []);
  
  // Data state for each table type
  const [notasData, setNotasData] = useState<NotaInformativa[]>([]);
  const [detenidosData, setDetenidosData] = useState<Detenido[]>([]);
  const [vehiculosData, setVehiculosData] = useState<Vehiculo[]>([]);
  const [incautacionesData, setIncautacionesData] = useState<Incautacion[]>([]);

  // Get filter from URL params or path
  const filterType = searchParams.get('filter');
  const pathSegments = location.pathname.split('/');
  const urlType = pathSegments[pathSegments.length - 1];
  
  // URL de regreso determinada por el origen
  // Fallback: si no hay información de origen y no hay filtros persistidos,
  // asumir que viene del dashboard principal (/dashboard)
  const backToDashboardUrl = isFromExecutive ? '/' : '/dashboard';

  
  // Determine current table type based on URL or filter
  const getCurrentTableType = (): TableType => {
    if (urlType === 'detenidos') return 'detenidos';
    if (urlType === 'vehiculos') return 'vehiculos';
    if (urlType === 'incautaciones') return 'incautaciones';
    if (filterType === 'detenidos') return 'detenidos';
    if (filterType === 'vehiculos') return 'vehiculos';
    if (filterType === 'incautaciones') return 'incautaciones';
    return 'notas_informativas';
  };

  // Helper function to get filtered case numbers
  const getFilteredCaseNumbers = async (): Promise<Set<string> | null> => {
    if (!hasPersistedFilters || !environmentalFilters) {
      return null;
    }
    
    const notasData = await supabaseCrudService.getAll('notas_informativas', { limit: 1000 });
    const environmentalCases = (notasData as NotaInformativa[]).map(nota => ({
      numeroCaso: nota.numeroCaso,
      fecha: nota.fecha,
      hora: nota.hora || '',
      provincia: nota.provinciamunicipio || '',
      localidad: nota.localidad || '',
      region: nota.region || '',
      tipoActividad: nota.tipoActividad,
      areaTemática: nota.areaTemática || '',
      detenidos: 0, 
      vehiculosDetenidos: 0, 
      incautaciones: [],
      notificados: nota.notificados || '',
      notificadosCount: 0,
      procuraduria: nota.procuraduria || 'NO',
      resultado: nota.resultado || ''
    }));
    
    const filteredCases = analyticsService.applyFilters(environmentalCases, environmentalFilters);
    return new Set(filteredCases.map(c => c.numeroCaso));
  };

  // Optimized data loading with lazy loading and specific queries
  useEffect(() => {
    const initializeData = async () => {
      try {
        // Solo cargar los datos necesarios según el tipo de tabla actual
        const currentTableType = getCurrentTableType();
        
        // Cargar solo la tabla específica que se va a mostrar
        switch (currentTableType) {
          case 'notas_informativas':
            // Para filtros específicos, usar consultas optimizadas
            if (filterType === 'procuraduria') {
              const { supabase } = await import('../services/supabase');
              const { data: procuraduriaData, error } = await supabase
                .from('notas_informativas')
                .select('id, numerocaso, fecha, provinciamunicipio, tipoactividad, procuraduria')
                .eq('procuraduria', 'SI')
                .order('fecha', { ascending: false })
                .limit(1000); // Limitar resultados para mejor performance
              
              if (error) {
                setError(`Error cargando datos: ${error.message}`);
                return;
              }
              
              const mappedData: NotaInformativa[] = (procuraduriaData || []).map(item => ({
                id: item.id,
                numeroCaso: item.numerocaso,
                fecha: item.fecha,
                hora: '',
                provinciamunicipio: item.provinciamunicipio || '',
                localidad: '',
                region: '',
                tipoActividad: item.tipoactividad,
                areaTemática: '',
                notificados: '',
                procuraduria: item.procuraduria,
                resultado: ''
              }));
              
              setNotasData(mappedData);
            } else {
              // Para otros filtros en notas_informativas, cargar con límite para mejor performance
              const notasDataRaw = await supabaseCrudService.getAll('notas_informativas', {
                limit: 1000, // Limitar resultados iniciales
                fields: ['id', 'numerocaso', 'fecha', 'hora', 'provinciamunicipio', 'localidad', 'region', 'tipoactividad', 'areatematica', 'notificados', 'procuraduria', 'resultado']
              });
              let filteredNotasData = notasDataRaw as NotaInformativa[];
              
              // Aplicar filtro específico
              if (filterType) {
                switch (filterType) {
                  case 'operativos':
                    filteredNotasData = filteredNotasData.filter(nota => 
                      nota.tipoActividad?.toLowerCase().includes('operativo')
                    );
                    break;
                  case 'patrullas':
                    filteredNotasData = filteredNotasData.filter(nota => 
                      nota.tipoActividad?.toLowerCase().includes('patrulla')
                    );
                    break;
                  case 'notificados':
                    filteredNotasData = filteredNotasData.filter(nota => 
                      nota.notificados && nota.notificados.toString().trim() !== ''
                    );
                    break;
                }
              }
              
              // Aplicar filtros persistidos del dashboard si existen
              if (hasPersistedFilters && environmentalFilters) {
                console.log('🟦 OperationsPage - Aplicando filtros persistidos del dashboard');
                
                // Convertir NotaInformativa[] a EnvironmentalCase[] para usar analytics service
                const environmentalCases = filteredNotasData.map(nota => ({
                  numeroCaso: nota.numeroCaso,
                  fecha: nota.fecha,
                  hora: nota.hora,
                  provincia: nota.provinciamunicipio || '',
                  localidad: nota.localidad || '',
                  region: nota.region || '',
                  tipoActividad: nota.tipoActividad,
                  areaTemática: nota.areaTemática || '',
                  detenidos: 0, 
                  vehiculosDetenidos: 0, 
                  incautaciones: [],
                  notificados: nota.notificados || '',
                  notificadosCount: 0,
                  procuraduria: nota.procuraduria || 'NO',
                  resultado: nota.resultado || ''
                }));
                
                // Aplicar filtros usando analytics service
                const filteredEnvironmentalCases = analyticsService.applyFilters(
                  environmentalCases, 
                  environmentalFilters
                );
                
                // Convertir de vuelta a NotaInformativa[]
                filteredNotasData = filteredEnvironmentalCases.map(envCase => ({
                  id: envCase.numeroCaso,
                  numeroCaso: envCase.numeroCaso,
                  fecha: envCase.fecha,
                  hora: envCase.hora,
                  provinciamunicipio: envCase.provincia,
                  localidad: envCase.localidad,
                  region: envCase.region,
                  tipoActividad: envCase.tipoActividad,
                  areaTemática: envCase.areaTemática,
                  notificados: envCase.notificados,
                  procuraduria: envCase.procuraduria,
                  resultado: envCase.resultado
                }));
                
                console.log('🟦 OperationsPage - Casos después filtros persistidos:', filteredNotasData.length);
              }
              
              setNotasData(filteredNotasData);
            }
            break;
            
          case 'detenidos':
            const detenidosDataRaw = await supabaseCrudService.getAll('detenidos', {
              limit: 500,
              fields: ['id', 'numerocaso', 'fecha', 'provinciamunicipio', 'nombre']
            });
            
            // Debug: Ver la estructura real de la tabla detenidos
            if (detenidosDataRaw && detenidosDataRaw.length > 0) {
              console.log('🔍 DEBUG - Campos disponibles en tabla detenidos:', Object.keys(detenidosDataRaw[0]));
              console.log('🔍 DEBUG - Primer registro detenidos:', detenidosDataRaw[0]);
              console.log('🔍 DEBUG - Valor de provinciamunicipio:', detenidosDataRaw[0].provinciamunicipio);
            }
            
            let filteredDetenidosData = detenidosDataRaw as Detenido[];
            
            // Aplicar filtros persistidos si existen
            const allowedCaseNumbers = await getFilteredCaseNumbers();
            if (allowedCaseNumbers) {
              filteredDetenidosData = filteredDetenidosData.filter(detenido => 
                allowedCaseNumbers.has(detenido.numeroCaso)
              );
              console.log('🟦 OperationsPage - Detenidos después filtros persistidos:', filteredDetenidosData.length);
            }
            
            setDetenidosData(filteredDetenidosData);
            break;
            
          case 'vehiculos':
            const vehiculosDataRaw = await supabaseCrudService.getAll('vehiculos', {
              limit: 500,
              fields: ['id', 'numerocaso', 'tipo', 'marca', 'color', 'detalle', 'provinciamunicipio', 'fecha']
            });
            let filteredVehiculosData = vehiculosDataRaw as Vehiculo[];
            
            // Aplicar filtros persistidos si existen
            const allowedCaseNumbersVeh = await getFilteredCaseNumbers();
            if (allowedCaseNumbersVeh) {
              filteredVehiculosData = filteredVehiculosData.filter(vehiculo => 
                allowedCaseNumbersVeh.has(vehiculo.numeroCaso)
              );
              console.log('🟦 OperationsPage - Vehículos después filtros persistidos:', filteredVehiculosData.length);
            }
            
            setVehiculosData(filteredVehiculosData);
            break;
            
          case 'incautaciones':
            const incautacionesDataRaw = await supabaseCrudService.getAll('incautaciones', {
              limit: 500,
              fields: ['id', 'numerocaso', 'fecha', 'hora', 'provinciamunicipio', 'tipoincautacion', 'descripcion', 'cantidad']
            });
            let filteredIncautacionesData = incautacionesDataRaw as Incautacion[];
            
            // Aplicar filtros persistidos si existen
            const allowedCaseNumbersInc = await getFilteredCaseNumbers();
            if (allowedCaseNumbersInc) {
              filteredIncautacionesData = filteredIncautacionesData.filter(incautacion => 
                allowedCaseNumbersInc.has(incautacion.numeroCaso)
              );
              console.log('🟦 OperationsPage - Incautaciones después filtros persistidos:', filteredIncautacionesData.length);
            }
            
            setIncautacionesData(filteredIncautacionesData);
            break;
        }

        setError(null);
      } catch (err) {
        console.error('❌ OperationsPage - Error inicializando datos:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar datos');
      }
    };

    // Inicializar datos - carga optimizada basada en la tabla específica
    initializeData();
  }, [filterType, urlType]); // Eliminamos dependencia de cases para mejor performance

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

  const currentTableType = getCurrentTableType();

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
      console.log(`🟦 OperationsPage - Actualizando ${currentTableType}:`, item);
      
      // Actualizar en Supabase usando el nuevo servicio
      const updatedItem = await supabaseCrudService.update(currentTableType, item.id, item);
      
      // Actualizar el estado local de manera optimizada sin recargar todos los datos
      switch (currentTableType) {
        case 'notas_informativas':
          // Actualizar solo el item específico en el estado local
          setNotasData(prev => prev.map(nota => 
            nota.id === item.id ? updatedItem as NotaInformativa : nota
          ));
          break;
          
        case 'detenidos':
          setDetenidosData(prev => prev.map(detenido => 
            detenido.id === item.id ? updatedItem as Detenido : detenido
          ));
          break;
          
        case 'vehiculos':
          setVehiculosData(prev => prev.map(vehiculo => 
            vehiculo.id === item.id ? updatedItem as Vehiculo : vehiculo
          ));
          break;
          
        case 'incautaciones':
          setIncautacionesData(prev => prev.map(incautacion => 
            incautacion.id === item.id ? updatedItem as Incautacion : incautacion
          ));
          break;
      }
      
      console.log(`✅ OperationsPage - ${currentTableType} actualizado exitosamente`);
    } catch (err) {
      console.error(`❌ OperationsPage - Error actualizando ${currentTableType}:`, err);
      setError(err instanceof Error ? err.message : 'Error al actualizar');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      console.log(`🟦 OperationsPage - Eliminando ${currentTableType} ID:`, id);
      
      // Eliminar de Supabase usando el nuevo servicio
      await supabaseCrudService.delete(currentTableType, id);
      
      // Actualizar el estado local removiendo el item específico
      switch (currentTableType) {
        case 'notas_informativas':
          setNotasData(prev => prev.filter(nota => nota.id !== id));
          break;
        case 'detenidos':
          setDetenidosData(prev => prev.filter(detenido => detenido.id !== id));
          break;
        case 'vehiculos':
          setVehiculosData(prev => prev.filter(vehiculo => vehiculo.id !== id));
          break;
        case 'incautaciones':
          setIncautacionesData(prev => prev.filter(incautacion => incautacion.id !== id));
          break;
      }
      
      console.log(`✅ OperationsPage - ${currentTableType} eliminado exitosamente`);
    } catch (err) {
      console.error(`❌ OperationsPage - Error eliminando ${currentTableType}:`, err);
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
          <Link to={backToDashboardUrl} className="text-blue-600 hover:underline mt-2 inline-block">
            {isFromExecutive ? 'Volver al Dashboard Ejecutivo' : 'Volver al Dashboard Principal'}
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
            <Link to={backToDashboardUrl} className="text-blue-600 hover:underline">
              {isFromExecutive ? 'Dashboard Ejecutivo' : 'Dashboard Principal'}
            </Link>
            <Typography color="text.primary">Operaciones Detalladas</Typography>
          </Breadcrumbs>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-neutral-800 mb-2">
                {filterType ? getFilterDisplayName(filterType) : 'Operaciones Detalladas'}
              </h1>
              {filterType && (
                <Box className="mb-2">
                  <Typography color="text.secondary">
                    Mostrando tabla específica para: {getFilterDisplayName(filterType)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {getFilterDescription(filterType)}
                  </Typography>
                </Box>
              )}
              
              {/* Mostrar filtros persistidos si existen */}
              {hasPersistedFilters && (
                <Box className="mt-3">
                  <div className="flex items-center gap-2 mb-2">
                    <FilterIcon fontSize="small" color="primary" />
                    <Typography variant="subtitle2" color="primary">
                      Filtros aplicados desde el dashboard:
                    </Typography>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {filtersFromURL.dateFrom && (
                      <Chip 
                        label={`Desde: ${filtersFromURL.dateFrom}`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    )}
                    {filtersFromURL.dateTo && (
                      <Chip 
                        label={`Hasta: ${filtersFromURL.dateTo}`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    )}
                    {filtersFromURL.activeDateFilter && filtersFromURL.activeDateFilter !== 'all' && (
                      <Chip 
                        label={`Periodo: ${filtersFromURL.activeDateFilter}`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    )}
                    {filtersFromURL.provincia && filtersFromURL.provincia.length > 0 && (
                      <Chip 
                        label={`Provincias: ${filtersFromURL.provincia.join(', ')}`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    )}
                    {filtersFromURL.region && filtersFromURL.region.length > 0 && (
                      <Chip 
                        label={`Regiones: ${filtersFromURL.region.join(', ')}`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    )}
                    {filtersFromURL.searchText && (
                      <Chip 
                        label={`Búsqueda: "${filtersFromURL.searchText}"`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    )}
                  </div>
                </Box>
              )}
            </div>
            <Link
              to={backToDashboardUrl}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
            >
              <BackIcon />
              {isFromExecutive ? 'Volver al Dashboard Ejecutivo' : 'Volver al Dashboard Principal'}
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
            onUpdate={permissions.canEditRecords ? handleUpdate : () => {}}
            onDelete={permissions.canDeleteRecords ? handleDelete : () => {}}
            loading={loading}
            title={getFilterDisplayName(filterType!)}
          />
        )}

        {currentTableType === 'detenidos' && (
          <GenericTable
            tableType="detenidos"
            data={detenidosData}
            onUpdate={permissions.canEditRecords ? handleUpdate : () => {}}
            onDelete={permissions.canDeleteRecords ? handleDelete : () => {}}
            loading={loading}
            title={urlType === 'detenidos' ? 'Detenidos' : getFilterDisplayName(filterType || 'detenidos')}
          />
        )}

        {currentTableType === 'vehiculos' && (
          <GenericTable
            tableType="vehiculos"
            data={vehiculosData}
            onUpdate={permissions.canEditRecords ? handleUpdate : () => {}}
            onDelete={permissions.canDeleteRecords ? handleDelete : () => {}}
            loading={loading}
            title={urlType === 'vehiculos' ? 'Vehículos' : getFilterDisplayName(filterType || 'vehiculos')}
          />
        )}

        {currentTableType === 'incautaciones' && (
          <GenericTable
            tableType="incautaciones"
            data={incautacionesData}
            onUpdate={permissions.canEditRecords ? handleUpdate : () => {}}
            onDelete={permissions.canDeleteRecords ? handleDelete : () => {}}
            loading={loading}
            title={urlType === 'incautaciones' ? 'Incautaciones' : getFilterDisplayName(filterType || 'incautaciones')}
          />
        )}

      </div>
    </div>
  );
};

export default OperationsPage;