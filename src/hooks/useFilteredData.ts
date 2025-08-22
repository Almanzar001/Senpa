import { useMemo } from 'react';
import { type SheetData } from '../services/supabase';
import { type FilterOptions } from '../components/AdvancedFilters';
import { parseDate, isDateInRange } from '../utils/dateUtils';

export const useFilteredData = (sheetsData: SheetData[], filters: FilterOptions) => {
  return useMemo(() => {
    if (!sheetsData || sheetsData.length === 0) {
      return sheetsData;
    }

    // If no filters are active, return original data
    const hasActiveFilters = 
      filters.dateFrom || 
      filters.dateTo || 
      filters.states.length > 0 || 
      filters.locations.length > 0 || 
      filters.types.length > 0 || 
      filters.provinces.length > 0 || 
      filters.searchText;

    if (!hasActiveFilters) {
      return sheetsData;
    }

    // Apply filters to each sheet
    return sheetsData.map(sheet => {
      if (sheet.data.length <= 1) return sheet; // No data beyond headers
      
      const headers = sheet.data[0] as string[];
      const rows = sheet.data.slice(1);
      
      // Find relevant columns
      const fechaCol = headers.findIndex(h => {
        const headerLower = h.toLowerCase();
        return headerLower.includes('fecha') || 
               headerLower.includes('date') ||
               headerLower.includes('creado') ||
               headerLower.includes('created') ||
               headerLower.includes('timestamp') ||
               headerLower.includes('dia') ||
               headerLower.includes('day');
      });
      
      const estadoCol = headers.findIndex(h => 
        h.toLowerCase().includes('estado') || 
        h.toLowerCase().includes('status') ||
        h.toLowerCase().includes('situacion')
      );
      
      const ubicacionCol = headers.findIndex(h => 
        h.toLowerCase().includes('ubicacion') || 
        h.toLowerCase().includes('zona') ||
        h.toLowerCase().includes('lugar') ||
        h.toLowerCase().includes('direccion')
      );
      
      const tipoCol = headers.findIndex(h => 
        h.toLowerCase().includes('tipo') || 
        h.toLowerCase().includes('categoria') ||
        h.toLowerCase().includes('clase')
      );
      
      const provinciaCol = headers.findIndex(h => 
        h.toLowerCase().includes('provincia') || 
        h.toLowerCase().includes('province') ||
        h.toLowerCase().includes('region')
      );

      // Filter rows
      const filteredRows = rows.filter(row => {
        const fecha = fechaCol >= 0 ? String(row[fechaCol] || '') : '';
        const estado = estadoCol >= 0 ? String(row[estadoCol] || '') : '';
        const ubicacion = ubicacionCol >= 0 ? String(row[ubicacionCol] || '') : '';
        const tipo = tipoCol >= 0 ? String(row[tipoCol] || '') : '';
        const provincia = provinciaCol >= 0 ? String(row[provinciaCol] || '') : '';
        
        // Date filter - using centralized utilities
        if (filters.dateFrom || filters.dateTo) {
          const rowDate = parseDate(fecha);
          
          if (rowDate && !isNaN(rowDate.getTime())) {
            if (!isDateInRange(rowDate, filters.dateFrom, filters.dateTo)) {
              return false;
            }
          } else if (filters.dateFrom || filters.dateTo) {
            return false; // Exclude rows without valid dates when date filter is active
          }
        }
        
        // State filter
        if (filters.states.length > 0) {
          const matchesState = filters.states.some(filterState => 
            estado.toLowerCase().includes(filterState.toLowerCase())
          );
          if (!matchesState) return false;
        }
        
        // Location filter
        if (filters.locations.length > 0) {
          const matchesLocation = filters.locations.some(filterLocation =>
            ubicacion.toLowerCase().includes(filterLocation.toLowerCase())
          );
          if (!matchesLocation) return false;
        }
        
        // Type filter
        if (filters.types.length > 0) {
          const matchesType = filters.types.some(filterType =>
            tipo.toLowerCase().includes(filterType.toLowerCase())
          );
          if (!matchesType) return false;
        }
        
        // Province filter
        if (filters.provinces.length > 0) {
          const matchesProvince = filters.provinces.some(filterProvince =>
            provincia.toLowerCase().includes(filterProvince.toLowerCase())
          );
          if (!matchesProvince) return false;
        }
        
        // Search text filter
        if (filters.searchText) {
          const searchLower = filters.searchText.toLowerCase();
          const matchesSearch = Object.values(row).some(cellValue =>
            String(cellValue || '').toLowerCase().includes(searchLower)
          );
          if (!matchesSearch) return false;
        }
        
        return true;
      });

      return {
        ...sheet,
        data: [headers, ...filteredRows]
      };
    });
  }, [sheetsData, filters.dateFrom, filters.dateTo, filters.states, filters.locations, filters.types, filters.provinces, filters.searchText]);
};

export default useFilteredData;