import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  TextField,
  Chip,
  Button,
  Typography,
  Collapse,
  IconButton,
  Autocomplete,
  Box
} from '@mui/material';
import {
  FilterList as FilterIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Clear as ClearIcon,
  DateRange as DateRangeIcon,
  LocationOn as LocationIcon,
  Category as CategoryIcon,
  Flag as StatusIcon,
  Map as ProvinceIcon
} from '@mui/icons-material';
import { type SheetData } from '../services/googleSheets';

export interface FilterOptions {
  dateFrom: string;
  dateTo: string;
  states: string[];
  locations: string[];
  types: string[];
  provinces: string[];
  searchText: string;
}

interface AdvancedFiltersProps {
  sheetsData: SheetData[];
  onFiltersChange: (filters: FilterOptions) => void;
  activeFilters: FilterOptions;
}

const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  sheetsData,
  onFiltersChange,
  activeFilters
}) => {
  const [expanded, setExpanded] = useState(false);
  const [availableOptions, setAvailableOptions] = useState({
    states: [] as string[],
    locations: [] as string[],
    types: [] as string[],
    provinces: [] as string[]
  });

  // Extract unique values from all sheets
  useEffect(() => {
    if (!sheetsData || sheetsData.length === 0) return;

    const states = new Set<string>();
    const locations = new Set<string>();
    const types = new Set<string>();
    const provinces = new Set<string>();

    sheetsData.forEach(sheet => {
      if (sheet.data.length <= 1) return;
      
      const headers = sheet.data[0] as string[];
      const rows = sheet.data.slice(1);
      
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

      rows.forEach(row => {
        if (estadoCol >= 0 && row[estadoCol]) {
          states.add(String(row[estadoCol]).trim());
        }
        if (ubicacionCol >= 0 && row[ubicacionCol]) {
          locations.add(String(row[ubicacionCol]).trim());
        }
        if (tipoCol >= 0 && row[tipoCol]) {
          types.add(String(row[tipoCol]).trim());
        }
        if (provinciaCol >= 0 && row[provinciaCol]) {
          provinces.add(String(row[provinciaCol]).trim());
        }
      });
    });

    setAvailableOptions({
      states: Array.from(states).filter(s => s.length > 0).sort(),
      locations: Array.from(locations).filter(l => l.length > 0).sort(),
      types: Array.from(types).filter(t => t.length > 0).sort(),
      provinces: Array.from(provinces).filter(p => p.length > 0).sort()
    });
  }, [sheetsData]);

  const handleFilterChange = (field: keyof FilterOptions, value: any) => {
    const newFilters = { ...activeFilters, [field]: value };
    onFiltersChange(newFilters);
  };

  const clearAllFilters = () => {
    const emptyFilters: FilterOptions = {
      dateFrom: '',
      dateTo: '',
      states: [],
      locations: [],
      types: [],
      provinces: [],
      searchText: ''
    };
    onFiltersChange(emptyFilters);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (activeFilters.dateFrom) count++;
    if (activeFilters.dateTo) count++;
    count += activeFilters.states.length;
    count += activeFilters.locations.length;
    count += activeFilters.types.length;
    count += activeFilters.provinces.length;
    if (activeFilters.searchText) count++;
    return count;
  };

  const today = new Date().toISOString().split('T')[0];
  const thisWeekStart = new Date();
  thisWeekStart.setDate(thisWeekStart.getDate() - 7);
  const thisWeekStartStr = thisWeekStart.toISOString().split('T')[0];

  const thisMonthStart = new Date();
  thisMonthStart.setDate(1);
  const thisMonthStartStr = thisMonthStart.toISOString().split('T')[0];

  const quickDateFilters = [
    { label: 'Hoy', from: today, to: today },
    { label: 'Últimos 7 días', from: thisWeekStartStr, to: today },
    { label: 'Este mes', from: thisMonthStartStr, to: today }
  ];

  return (
    <Card className="mb-6 shadow-lg">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <FilterIcon className="text-blue-600 mr-2" />
            <Typography variant="h6" className="font-semibold text-gray-800">
              Filtros Avanzados
            </Typography>
            {getActiveFilterCount() > 0 && (
              <Chip 
                label={`${getActiveFilterCount()} activos`}
                size="small"
                color="primary"
                className="ml-2"
              />
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {getActiveFilterCount() > 0 && (
              <Button
                size="small"
                startIcon={<ClearIcon />}
                onClick={clearAllFilters}
                color="secondary"
              >
                Limpiar
              </Button>
            )}
            <IconButton
              onClick={() => setExpanded(!expanded)}
              size="small"
            >
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </div>
        </div>

        {/* Search Bar - Always visible */}
        <TextField
          fullWidth
          placeholder="Buscar en descripción, ubicación, persona..."
          value={activeFilters.searchText}
          onChange={(e) => handleFilterChange('searchText', e.target.value)}
          size="small"
          className="mb-4"
          InputProps={{
            style: { borderRadius: '12px' }
          }}
        />

        {/* Quick Date Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          {quickDateFilters.map((filter, index) => (
            <Chip
              key={index}
              label={filter.label}
              onClick={() => {
                onFiltersChange({
                  ...activeFilters,
                  dateFrom: filter.from,
                  dateTo: filter.to
                });
              }}
              variant={
                activeFilters.dateFrom === filter.from && activeFilters.dateTo === filter.to
                  ? 'filled'
                  : 'outlined'
              }
              color="primary"
              size="small"
              className="cursor-pointer"
            />
          ))}
        </div>

        <Collapse in={expanded}>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {/* Date Range */}
            <div className="w-full">
              <Box className="space-y-3">
                <div className="flex items-center mb-2">
                  <DateRangeIcon className="text-gray-600 mr-1" fontSize="small" />
                  <Typography variant="subtitle2" className="font-medium">
                    Rango de Fechas
                  </Typography>
                </div>
                
                <TextField
                  label="Fecha Desde"
                  type="date"
                  value={activeFilters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  size="small"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
                
                <TextField
                  label="Fecha Hasta"
                  type="date"
                  value={activeFilters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  size="small"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Box>
            </div>

            {/* States Filter */}
            <div className="w-full">
              <div className="flex items-center mb-2">
                <StatusIcon className="text-gray-600 mr-1" fontSize="small" />
                <Typography variant="subtitle2" className="font-medium">
                  Estados
                </Typography>
              </div>
              
              <Autocomplete
                multiple
                options={availableOptions.states}
                value={activeFilters.states}
                onChange={(_, newValue) => handleFilterChange('states', newValue)}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      variant="outlined"
                      label={option}
                      size="small"
                      {...getTagProps({ index })}
                    />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Seleccionar estados..."
                    size="small"
                  />
                )}
              />
            </div>

            {/* Locations Filter */}
            <div className="w-full">
              <div className="flex items-center mb-2">
                <LocationIcon className="text-gray-600 mr-1" fontSize="small" />
                <Typography variant="subtitle2" className="font-medium">
                  Ubicaciones
                </Typography>
              </div>
              
              <Autocomplete
                multiple
                options={availableOptions.locations}
                value={activeFilters.locations}
                onChange={(_, newValue) => handleFilterChange('locations', newValue)}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      variant="outlined"
                      label={option}
                      size="small"
                      {...getTagProps({ index })}
                    />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Seleccionar ubicaciones..."
                    size="small"
                  />
                )}
              />
            </div>

            {/* Types Filter */}
            <div className="w-full">
              <div className="flex items-center mb-2">
                <CategoryIcon className="text-gray-600 mr-1" fontSize="small" />
                <Typography variant="subtitle2" className="font-medium">
                  Tipos de Evento
                </Typography>
              </div>
              
              <Autocomplete
                multiple
                options={availableOptions.types}
                value={activeFilters.types}
                onChange={(_, newValue) => handleFilterChange('types', newValue)}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      variant="outlined"
                      label={option}
                      size="small"
                      {...getTagProps({ index })}
                    />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Seleccionar tipos..."
                    size="small"
                  />
                )}
              />
            </div>

            {/* Provinces Filter */}
            <div className="w-full">
              <div className="flex items-center mb-2">
                <ProvinceIcon className="text-gray-600 mr-1" fontSize="small" />
                <Typography variant="subtitle2" className="font-medium">
                  Provincias
                </Typography>
              </div>
              
              <Autocomplete
                multiple
                options={availableOptions.provinces}
                value={activeFilters.provinces}
                onChange={(_, newValue) => handleFilterChange('provinces', newValue)}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      variant="outlined"
                      label={option}
                      size="small"
                      {...getTagProps({ index })}
                    />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Seleccionar provincias..."
                    size="small"
                  />
                )}
              />
            </div>
          </div>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default AdvancedFilters;