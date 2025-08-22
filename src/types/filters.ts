// Interfaz unificada de filtros para todos los dashboards
export interface UnifiedFilters {
  // Filtros de fecha
  dateFrom: string;
  dateTo: string;
  activeDateFilter?: string; // 'today' | 'yesterday' | 'thisMonth' | 'all'
  
  // Filtros geográficos
  provincia: string[];
  region: string[];
  localidad: string[];
  
  // Filtros de actividad
  tipoActividad: string[];
  areaTemática: string[];
  
  // Filtros de búsqueda
  searchText: string;
  
  // Filtros específicos para compatibilidad con sistema anterior
  states: string[]; // Estados (para compatibilidad)
  locations: string[]; // Ubicaciones (para compatibilidad) 
  types: string[]; // Tipos (para compatibilidad)
  provinces: string[]; // Provincias (para compatibilidad)
  
  // Flags especiales
  isExecutiveView?: boolean;
}

// Función para convertir filtros del dashboard ejecutivo a unificados
export const environmentalToUnified = (envFilters: any): UnifiedFilters => {
  return {
    dateFrom: envFilters.dateFrom || '',
    dateTo: envFilters.dateTo || '',
    activeDateFilter: envFilters.activeDateFilter,
    provincia: envFilters.provincia || [],
    region: envFilters.region || [],
    localidad: envFilters.division || [], // Mapeo de division a localidad
    tipoActividad: envFilters.tipoActividad || [],
    areaTemática: envFilters.areaTemática || [],
    searchText: envFilters.searchText || '',
    
    // Compatibilidad con sistema anterior
    states: [],
    locations: envFilters.division || [],
    types: envFilters.tipoActividad || [],
    provinces: envFilters.provincia || [],
    
    isExecutiveView: envFilters.isExecutiveView || false
  };
};

// Función para convertir filtros del dashboard principal a unificados
export const advancedToUnified = (advFilters: any): UnifiedFilters => {
  return {
    dateFrom: advFilters.dateFrom || '',
    dateTo: advFilters.dateTo || '',
    activeDateFilter: undefined,
    provincia: advFilters.provinces || [],
    region: [], // Dashboard principal no maneja regiones directamente
    localidad: advFilters.locations || [],
    tipoActividad: advFilters.types || [],
    areaTemática: [], // Dashboard principal no maneja áreas temáticas
    searchText: advFilters.searchText || '',
    
    // Compatibilidad con sistema anterior
    states: advFilters.states || [],
    locations: advFilters.locations || [],
    types: advFilters.types || [],
    provinces: advFilters.provinces || [],
    
    isExecutiveView: false
  };
};

// Función para convertir filtros unificados a formato del analytics service
export const unifiedToEnvironmental = (unifiedFilters: UnifiedFilters) => {
  return {
    dateFrom: unifiedFilters.dateFrom,
    dateTo: unifiedFilters.dateTo,
    provincia: unifiedFilters.provincia,
    division: unifiedFilters.localidad, // Mapeo de localidad a division
    region: unifiedFilters.region,
    tipoActividad: unifiedFilters.tipoActividad,
    areaTemática: unifiedFilters.areaTemática,
    searchText: unifiedFilters.searchText,
    activeDateFilter: unifiedFilters.activeDateFilter,
    isExecutiveView: unifiedFilters.isExecutiveView
  };
};

// Función para convertir filtros unificados a formato del dashboard principal
export const unifiedToAdvanced = (unifiedFilters: UnifiedFilters) => {
  return {
    dateFrom: unifiedFilters.dateFrom,
    dateTo: unifiedFilters.dateTo,
    states: unifiedFilters.states,
    locations: unifiedFilters.locations,
    types: unifiedFilters.types,
    provinces: unifiedFilters.provinces,
    searchText: unifiedFilters.searchText
  };
};

// Helper para determinar si hay filtros activos
export const hasActiveFilters = (filters: UnifiedFilters): boolean => {
  return !!(
    filters.dateFrom || 
    filters.dateTo ||
    filters.provincia.length > 0 ||
    filters.region.length > 0 ||
    filters.localidad.length > 0 ||
    filters.tipoActividad.length > 0 ||
    filters.areaTemática.length > 0 ||
    filters.searchText.trim() ||
    filters.states.length > 0 ||
    filters.locations.length > 0 ||
    filters.types.length > 0 ||
    filters.provinces.length > 0
  );
};

// Helper para contar filtros activos
export const countActiveFilters = (filters: UnifiedFilters): number => {
  let count = 0;
  
  if (filters.dateFrom) count++;
  if (filters.dateTo) count++;
  count += filters.provincia.length;
  count += filters.region.length;
  count += filters.localidad.length;
  count += filters.tipoActividad.length;
  count += filters.areaTemática.length;
  if (filters.searchText.trim()) count++;
  
  // Evitar contar duplicados de compatibilidad
  count += filters.states.length;
  count += Math.max(0, filters.locations.length - filters.localidad.length);
  count += Math.max(0, filters.types.length - filters.tipoActividad.length);
  count += Math.max(0, filters.provinces.length - filters.provincia.length);
  
  return count;
};