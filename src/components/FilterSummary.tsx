import React from 'react';
import { Card, CardContent, Typography, Chip } from '@mui/material';
import { 
  DateRange as DateRangeIcon,
  FilterList as FilterIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { type FilterOptions } from './AdvancedFilters';

interface FilterSummaryProps {
  filters: FilterOptions;
  totalRecords: number;
  filteredRecords: number;
}

const FilterSummary: React.FC<FilterSummaryProps> = ({ 
  filters, 
  totalRecords, 
  filteredRecords 
}) => {
  const hasActiveFilters = 
    filters.dateFrom || 
    filters.dateTo || 
    filters.states.length > 0 || 
    filters.locations.length > 0 || 
    filters.types.length > 0 || 
    filters.searchText;

  if (!hasActiveFilters) return null;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('es-ES');
  };

  return (
    <Card className="mb-4 border-l-4 border-blue-500">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <FilterIcon className="text-blue-600 mr-2" />
            <Typography variant="h6" className="font-semibold text-gray-800">
              Filtros Aplicados
            </Typography>
          </div>
          
          <div className="text-sm text-gray-600">
            <span className="font-medium text-blue-600">{filteredRecords.toLocaleString()}</span> de{' '}
            <span className="font-medium">{totalRecords.toLocaleString()}</span> registros
            {filteredRecords !== totalRecords && (
              <span className="text-orange-600 ml-2">
                ({Math.round((filteredRecords / totalRecords) * 100)}% mostrado)
              </span>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {/* Date Range */}
          {(filters.dateFrom || filters.dateTo) && (
            <div className="flex items-center space-x-2">
              <DateRangeIcon className="text-gray-500" fontSize="small" />
              <Typography variant="body2" className="text-gray-700">
                <strong>Fechas:</strong>{' '}
                {filters.dateFrom && formatDate(filters.dateFrom)}
                {filters.dateFrom && filters.dateTo && ' - '}
                {filters.dateTo && formatDate(filters.dateTo)}
                {filters.dateFrom && !filters.dateTo && ' en adelante'}
                {!filters.dateFrom && filters.dateTo && `hasta ${formatDate(filters.dateTo)}`}
              </Typography>
            </div>
          )}

          {/* Search Text */}
          {filters.searchText && (
            <div className="flex items-center space-x-2">
              <SearchIcon className="text-gray-500" fontSize="small" />
              <Typography variant="body2" className="text-gray-700">
                <strong>Búsqueda:</strong> "{filters.searchText}"
              </Typography>
            </div>
          )}

          {/* Filter Chips */}
          <div className="space-y-2">
            {filters.states.length > 0 && (
              <div>
                <Typography variant="body2" className="text-gray-600 mb-1">
                  <strong>Estados:</strong>
                </Typography>
                <div className="flex flex-wrap gap-1">
                  {filters.states.map((state, index) => (
                    <Chip
                      key={index}
                      label={state}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </div>
              </div>
            )}

            {filters.locations.length > 0 && (
              <div>
                <Typography variant="body2" className="text-gray-600 mb-1">
                  <strong>Ubicaciones:</strong>
                </Typography>
                <div className="flex flex-wrap gap-1">
                  {filters.locations.map((location, index) => (
                    <Chip
                      key={index}
                      label={location}
                      size="small"
                      color="secondary"
                      variant="outlined"
                    />
                  ))}
                </div>
              </div>
            )}

            {filters.types.length > 0 && (
              <div>
                <Typography variant="body2" className="text-gray-600 mb-1">
                  <strong>Tipos:</strong>
                </Typography>
                <div className="flex flex-wrap gap-1">
                  {filters.types.map((type, index) => (
                    <Chip
                      key={index}
                      label={type}
                      size="small"
                      color="success"
                      variant="outlined"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FilterSummary;