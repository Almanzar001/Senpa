/**
 * Utilidades para persistir filtros entre navegaciones
 * Permite mantener los filtros del dashboard al navegar a tablas específicas
 */

import type { UnifiedFilters } from '../types/filters';

/**
 * Convierte filtros a parámetros de URL
 */
export const filtersToURLParams = (filters: UnifiedFilters): URLSearchParams => {
  const params = new URLSearchParams();
  
  // Filtros de fecha
  if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
  if (filters.dateTo) params.set('dateTo', filters.dateTo);
  if (filters.activeDateFilter) params.set('activeDateFilter', filters.activeDateFilter);
  
  // Filtros geográficos
  if (filters.provincia.length > 0) params.set('provincia', filters.provincia.join(','));
  if (filters.region.length > 0) params.set('region', filters.region.join(','));
  if (filters.localidad.length > 0) params.set('localidad', filters.localidad.join(','));
  
  // Filtros de actividad
  if (filters.tipoActividad.length > 0) params.set('tipoActividad', filters.tipoActividad.join(','));
  if (filters.areaTemática.length > 0) params.set('areaTemática', filters.areaTemática.join(','));
  
  // Búsqueda
  if (filters.searchText) params.set('searchText', filters.searchText);
  
  // Flags
  if (filters.isExecutiveView) params.set('isExecutiveView', 'true');
  
  return params;
};

/**
 * Convierte parámetros de URL a filtros
 */
export const urlParamsToFilters = (searchParams: URLSearchParams): Partial<UnifiedFilters> => {
  const filters: Partial<UnifiedFilters> = {};
  
  // Filtros de fecha
  const dateFrom = searchParams.get('dateFrom');
  const dateTo = searchParams.get('dateTo');
  const activeDateFilter = searchParams.get('activeDateFilter');
  
  if (dateFrom) filters.dateFrom = dateFrom;
  if (dateTo) filters.dateTo = dateTo;
  if (activeDateFilter) filters.activeDateFilter = activeDateFilter;
  
  // Filtros geográficos
  const provincia = searchParams.get('provincia');
  const region = searchParams.get('region');
  const localidad = searchParams.get('localidad');
  
  if (provincia) filters.provincia = provincia.split(',').filter(p => p.length > 0);
  if (region) filters.region = region.split(',').filter(r => r.length > 0);
  if (localidad) filters.localidad = localidad.split(',').filter(l => l.length > 0);
  
  // Filtros de actividad
  const tipoActividad = searchParams.get('tipoActividad');
  const areaTemática = searchParams.get('areaTemática');
  
  if (tipoActividad) filters.tipoActividad = tipoActividad.split(',').filter(t => t.length > 0);
  if (areaTemática) filters.areaTemática = areaTemática.split(',').filter(a => a.length > 0);
  
  // Búsqueda
  const searchText = searchParams.get('searchText');
  if (searchText) filters.searchText = searchText;
  
  // Flags
  const isExecutiveView = searchParams.get('isExecutiveView');
  if (isExecutiveView === 'true') filters.isExecutiveView = true;
  
  return filters;
};

/**
 * Crea una URL de navegación con filtros persistidos
 */
export const createNavigationURL = (
  basePath: string, 
  currentFilters: UnifiedFilters, 
  additionalParams: Record<string, string> = {}
): string => {
  const params = filtersToURLParams(currentFilters);
  
  // Agregar parámetros adicionales
  Object.entries(additionalParams).forEach(([key, value]) => {
    params.set(key, value);
  });
  
  // Agregar información de origen para navegación de regreso
  if (currentFilters.isExecutiveView) {
    params.set('source', 'executive');
  } else {
    params.set('source', 'main');
  }
  
  const paramString = params.toString();
  return paramString ? `${basePath}?${paramString}` : basePath;
};

/**
 * Crea filtros EnvironmentalFilters desde UnifiedFilters para el analytics service
 */
export const createEnvironmentalFilters = (unifiedFilters: Partial<UnifiedFilters>) => {
  return {
    dateFrom: unifiedFilters.dateFrom || '',
    dateTo: unifiedFilters.dateTo || '',
    provincia: unifiedFilters.provincia || [],
    division: unifiedFilters.localidad || [], // Mapeo de localidad a division
    region: unifiedFilters.region || [],
    tipoActividad: unifiedFilters.tipoActividad || [],
    areaTemática: unifiedFilters.areaTemática || [],
    searchText: unifiedFilters.searchText || '',
    activeDateFilter: unifiedFilters.activeDateFilter,
    isExecutiveView: unifiedFilters.isExecutiveView || false
  };
};

// Hook personalizado se movió a hooks/useFiltersFromURL.ts para evitar problemas de importación

/**
 * Logging helper para debugging de filtros
 */
export const logFilterPersistence = (action: string, filters: any, url?: string) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔗 Filter Persistence - ${action}:`, {
      filters,
      url,
      timestamp: new Date().toISOString()
    });
  }
};