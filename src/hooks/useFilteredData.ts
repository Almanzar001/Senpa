import { useMemo } from 'react';
import { type SheetData } from '../services/supabase';
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
        
        // Date filter
        if (filters.dateFrom || filters.dateTo) {
          let rowDate: Date | null = null;
          
          if (fecha) {
            // Try different date formats
            const dateStr = fecha.trim();
            
            // Try to parse the date in multiple formats
            // Format 1: YYYY-MM-DD (ISO format)
            if (dateStr.match(/^\d{4}-\d{1,2}-\d{1,2}/)) {
              // Handle YYYY-MM-DD format, ensuring it's parsed as local time
              // by constructing date from parts. This avoids timezone issues.
              const dateOnly = dateStr.substring(0, 10);
              const parts = dateOnly.split('-');
              if (parts.length === 3) {
                const year = parseInt(parts[0], 10);
                const month = parseInt(parts[1], 10);
                const day = parseInt(parts[2], 10);
                if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
                  rowDate = new Date(year, month - 1, day);
                }
              }
            }
            // Format 2: DD/MM/YYYY, DD-MM-YYYY, MM/DD/YYYY, MM-DD-YYYY
            else if (dateStr.match(/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/)) {
              const parts = dateStr.split(/[\/\-]/);
              if (parts[0] && parts[1] && parts[2]) {
                const part1 = parseInt(parts[0]);
                const part2 = parseInt(parts[1]);
                const year = parseInt(parts[2]);
                
                // Try DD/MM/YYYY first (more common internationally)
                if (part1 <= 31 && part2 <= 12 && year > 1900) {
                  rowDate = new Date(year, part2 - 1, part1);
                }
                // If that doesn't make sense, try MM/DD/YYYY
                else if (part1 <= 12 && part2 <= 31 && year > 1900) {
                  rowDate = new Date(year, part1 - 1, part2);
                }
              }
            }
            // Format 3: Try direct parsing as fallback
            if (!rowDate || isNaN(rowDate.getTime())) {
              // Fallback: For 'YYYY-MM-DD', replace '-' with '/' to encourage local time parsing
              const localDateStr = dateStr.match(/^\d{4}-\d{1,2}-\d{1,2}$/)
                ? dateStr.replace(/-/g, '/')
                : dateStr;
              const testDate = new Date(localDateStr);
              if (!isNaN(testDate.getTime())) {
                rowDate = testDate;
              }
            }
          }
          
          if (rowDate && !isNaN(rowDate.getTime())) {
            const filterFromDate = filters.dateFrom ? new Date(`${filters.dateFrom}T00:00:00`) : null;
            const filterToDate = filters.dateTo ? new Date(`${filters.dateTo}T23:59:59.999`) : null;

            if (filterFromDate && rowDate < filterFromDate) return false;
            if (filterToDate && rowDate > filterToDate) return false;
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