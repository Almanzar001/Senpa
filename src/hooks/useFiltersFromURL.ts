/**
 * Hook personalizado para manejar filtros en URL
 */
import { useSearchParams } from 'react-router-dom';
import { useMemo } from 'react';
import { urlParamsToFilters, createEnvironmentalFilters } from '../utils/filterPersistence';

export const useFiltersFromURL = () => {
  const [searchParams] = useSearchParams();
  
  const filtersFromURL = useMemo(() => {
    return urlParamsToFilters(searchParams);
  }, [searchParams]);
  
  const hasPersistedFilters = useMemo(() => {
    return Object.keys(filtersFromURL).length > 0;
  }, [filtersFromURL]);
  
  // Detectar origen de la navegación
  const source = useMemo(() => {
    return searchParams.get('source') || searchParams.get('isExecutiveView');
  }, [searchParams]);
  
  const isFromExecutive = useMemo(() => {
    // Si source es explícitamente 'main', entonces NO es del dashboard ejecutivo
    if (source === 'main') {
      return false;
    }
    // Si source es 'executive' o isExecutiveView es true, entonces SÍ es del dashboard ejecutivo
    return source === 'executive' || source === 'true' || filtersFromURL.isExecutiveView === true;
  }, [source, filtersFromURL]);
  
  return {
    filtersFromURL,
    hasPersistedFilters,
    environmentalFilters: createEnvironmentalFilters(filtersFromURL),
    source,
    isFromExecutive
  };
};