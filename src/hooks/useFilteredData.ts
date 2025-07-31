import { useMemo } from 'react';
import { type SheetData } from '../services/googleSheets';
import { type FilterOptions } from '../components/AdvancedFilters';

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
      const fechaCol = headers.findIndex(h => 
        h.toLowerCase().includes('fecha') || 
        h.toLowerCase().includes('date')
      );
      
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

      // Filter rows
      const filteredRows = rows.filter(row => {
        const fecha = fechaCol >= 0 ? String(row[fechaCol] || '') : '';
        const estado = estadoCol >= 0 ? String(row[estadoCol] || '') : '';
        const ubicacion = ubicacionCol >= 0 ? String(row[ubicacionCol] || '') : '';
        const tipo = tipoCol >= 0 ? String(row[tipoCol] || '') : '';
        
        // Date filter
        if (filters.dateFrom || filters.dateTo) {
          const rowDate = fecha ? new Date(fecha.split('/').reverse().join('-') || fecha) : null;
          if (rowDate) {
            if (filters.dateFrom && rowDate < new Date(filters.dateFrom)) return false;
            if (filters.dateTo && rowDate > new Date(filters.dateTo)) return false;
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
  }, [sheetsData, filters]);
};

export default useFilteredData;