import React, { useState, useEffect } from 'react';
import { type EnvironmentalCase } from '../services/environmentalAnalytics';

export interface EnvironmentalFilters {
  dateFrom: string;
  dateTo: string;
  provincia: string[];
  division: string[];
  tipoActividad: string[];
  areaTemática: string[];
  searchText: string;
}

interface EnvironmentalFiltersProps {
  cases: EnvironmentalCase[];
  onFiltersChange: (filters: EnvironmentalFilters) => void;
  activeFilters: EnvironmentalFilters;
}

const AREAS_TEMATICAS = [
  'Suelos y Aguas',
  'Recursos Forestales', 
  'Área Protegida',
  'Gestión Ambiental',
  'Costeros y Marinos'
];

const TIPOS_ACTIVIDAD = [
  'Operativo',
  'Patrulla'
];

const EnvironmentalFilters: React.FC<EnvironmentalFiltersProps> = ({
  cases,
  onFiltersChange,
  activeFilters
}) => {
  const [expanded, setExpanded] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [availableOptions, setAvailableOptions] = useState({
    provincias: [] as string[],
    divisiones: [] as string[],
    tiposActividad: [] as string[],
    areasTemáticas: [] as string[]
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (dropdownOpen && !target.closest('.dropdown-provinces')) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  // Extract unique values from cases
  useEffect(() => {
    if (!cases || cases.length === 0) return;

    const provincias = [...new Set(cases.map(c => c.provincia).filter(p => p))].sort();
    const divisiones = [...new Set(cases.map(c => c.localidad).filter(l => l))].sort();
    const tiposActividad = [...new Set(cases.map(c => c.tipoActividad).filter(t => t))].sort();
    const areasTemáticas = [...new Set(cases.map(c => c.areaTemática).filter(a => a))].sort();

    setAvailableOptions({
      provincias,
      divisiones,
      tiposActividad: tiposActividad.length > 0 ? tiposActividad : TIPOS_ACTIVIDAD,
      areasTemáticas: areasTemáticas.length > 0 ? areasTemáticas : AREAS_TEMATICAS
    });
  }, [cases]);

  const handleFilterChange = (field: keyof EnvironmentalFilters, value: any) => {
    const newFilters = { ...activeFilters, [field]: value };
    onFiltersChange(newFilters);
  };

  const clearAllFilters = () => {
    const emptyFilters: EnvironmentalFilters = {
      dateFrom: '',
      dateTo: '',
      provincia: [],
      division: [],
      tipoActividad: [],
      areaTemática: [],
      searchText: ''
    };
    onFiltersChange(emptyFilters);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    // Treat date range as a single filter
    if (activeFilters.dateFrom || activeFilters.dateTo) {
      count++;
    }
    count += activeFilters.provincia.length;
    count += activeFilters.division.length;
    count += activeFilters.tipoActividad.length;
    count += activeFilters.areaTemática.length;
    if (activeFilters.searchText) {
      count++;
    }
    return count;
  };

  const getLocalDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const today = getLocalDateString(new Date());

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const thisWeekStartStr = getLocalDateString(sevenDaysAgo);

  const thisMonthStartDate = new Date();
  thisMonthStartDate.setDate(1);
  const thisMonthStartStr = getLocalDateString(thisMonthStartDate);

  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 89);
  const lastQuarterStartStr = getLocalDateString(ninetyDaysAgo);

  const quickDateFilters = [
    { label: 'Hoy', from: today, to: today },
    { label: 'Últimos 7 días', from: thisWeekStartStr, to: today },
    { label: 'Este mes', from: thisMonthStartStr, to: today },
    { label: 'Último trimestre', from: lastQuarterStartStr, to: today }
  ];

  return (
    <div className="card-environmental p-6 border-l-4 border-primary-500">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
            <span className="text-primary-600 text-xl">🔍</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-neutral-800">
              Filtros de Operaciones Ambientales
            </h2>
            {getActiveFilterCount() > 0 && (
              <span className="status-success text-xs">
                {getActiveFilterCount()} filtros activos
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {getActiveFilterCount() > 0 && (
            <button
              onClick={clearAllFilters}
              className="btn-ghost btn-sm flex items-center gap-2"
            >
              <span className="text-sm">🗑️</span>
              <span className="hidden sm:inline">Limpiar</span>
            </button>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-10 h-10 bg-neutral-100 hover:bg-neutral-200 rounded-lg flex items-center justify-center transition-colors"
          >
            <span className="text-lg">
              {expanded ? '🔼' : '🔽'}
            </span>
          </button>
        </div>
      </div>

      {/* Search Bar - Always visible */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Buscar por localidad, provincia, tipo de incautación..."
          value={activeFilters.searchText}
          onChange={(e) => handleFilterChange('searchText', e.target.value)}
          className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
        />
      </div>

      {/* Quick Filters Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Quick Date Filters */}
        <div>
          <h3 className="text-sm font-semibold text-neutral-700 mb-3 flex items-center gap-2">
            <span className="text-primary-600">📅</span>
            Filtros Rápidos de Fecha
          </h3>
          <div className="flex flex-wrap gap-2">
            {quickDateFilters.map((filter, index) => (
              <button
                key={index}
                onClick={() => {
                  const isAlreadyActive = activeFilters.dateFrom === filter.from && activeFilters.dateTo === filter.to;
                  onFiltersChange({
                    ...activeFilters,
                    dateFrom: isAlreadyActive ? '' : filter.from,
                    dateTo: isAlreadyActive ? '' : filter.to,
                  });
                }}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border-2 ${
                  activeFilters.dateFrom === filter.from && activeFilters.dateTo === filter.to
                    ? 'bg-primary-600 text-white shadow-md border-primary-700'
                    : 'bg-primary-50 text-primary-700 hover:bg-primary-100 border-primary-600'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Activity Type Filters */}
        <div>
          <h3 className="text-sm font-semibold text-neutral-700 mb-3 flex items-center gap-2">
            <span className="text-verde-seco-600">🌿</span>
            Tipo de Actividad
          </h3>
          <div className="flex flex-wrap gap-2">
            {TIPOS_ACTIVIDAD.map((tipo, index) => (
              <button
                key={index}
                onClick={() => {
                  const newTipos = activeFilters.tipoActividad.includes(tipo)
                    ? activeFilters.tipoActividad.filter(t => t !== tipo)
                    : [...activeFilters.tipoActividad, tipo];
                  handleFilterChange('tipoActividad', newTipos);
                }}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border-2 ${
                  activeFilters.tipoActividad.includes(tipo)
                    ? 'bg-verde-seco-600 text-white shadow-md border-verde-seco-700'
                    : 'bg-verde-seco-50 text-verde-seco-700 hover:bg-verde-seco-100 border-verde-seco-600'
                }`}
              >
                {tipo}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Expanded Filters */}
      <div className={`transition-all duration-300 overflow-hidden ${expanded ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="border-t border-neutral-200 pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Date Range */}
            <div>
              <h3 className="text-sm font-semibold text-neutral-700 mb-3 flex items-center gap-2">
                <span className="text-verde-seco-600">📅</span>
                Rango de Fechas Personalizado
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">Fecha Desde</label>
                  <input
                    type="date"
                    value={activeFilters.dateFrom}
                    onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">Fecha Hasta</label>
                  <input
                    type="date"
                    value={activeFilters.dateTo}
                    onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Multi-select filters preview */}
            <div className="space-y-6">
              {/* Provinces */}
              <div className="relative dropdown-provinces">
                <h3 className="text-sm font-semibold text-neutral-700 mb-3 flex items-center gap-2">
                  <span className="text-verde-seco-600">📍</span>
                  Provincias ({availableOptions.provincias.length} disponibles)
                </h3>
                <div className="space-y-2">
                  {/* Dropdown Toggle */}
                  <button
                    type="button"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm text-left bg-primary-50 hover:bg-primary-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all flex items-center justify-between"
                  >
                    <span className="text-neutral-600">
                      {activeFilters.provincia.length === 0 
                        ? 'Seleccionar provincias...'
                        : `${activeFilters.provincia.length} provincia${activeFilters.provincia.length !== 1 ? 's' : ''} seleccionada${activeFilters.provincia.length !== 1 ? 's' : ''}`
                      }
                    </span>
                    <span className={`transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}>
                      🔽
                    </span>
                  </button>

                  {/* Dropdown Menu */}
                  {dropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-primary-50 border border-neutral-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {availableOptions.provincias.map((provincia, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => {
                            const newProvincias = activeFilters.provincia.includes(provincia)
                              ? activeFilters.provincia.filter(p => p !== provincia)
                              : [...activeFilters.provincia, provincia];
                            handleFilterChange('provincia', newProvincias);
                          }}
                          className={`w-full px-3 py-2 text-left text-sm hover:bg-neutral-50 transition-colors flex items-center justify-between ${
                            activeFilters.provincia.includes(provincia) ? 'bg-verde-seco-50 text-verde-seco-700' : 'text-neutral-700'
                          }`}
                        >
                          <span>{provincia}</span>
                          {activeFilters.provincia.includes(provincia) && (
                            <span className="text-verde-seco-600">✓</span>
                          )}
                        </button>
                      ))}
                      {availableOptions.provincias.length === 0 && (
                        <div className="px-3 py-2 text-sm text-neutral-500 text-center">
                          No hay provincias disponibles
                        </div>
                      )}
                    </div>
                  )}

                  {/* Selected Provinces Chips */}
                  {activeFilters.provincia.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {activeFilters.provincia.map((provincia, index) => (
                        <span key={index} className="status-info text-xs px-2 py-1 flex items-center gap-1">
                          {provincia}
                          <button
                            onClick={() => {
                              const newProvincias = activeFilters.provincia.filter(p => p !== provincia);
                              handleFilterChange('provincia', newProvincias);
                            }}
                            className="text-info-600 hover:text-info-800 font-bold ml-1"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Areas Temáticas */}
              <div>
                <h3 className="text-sm font-semibold text-neutral-700 mb-3 flex items-center gap-2">
                  <span className="text-primary-600">🌲</span>
                  Áreas Temáticas
                </h3>
                <div className="flex flex-wrap gap-2">
                  {AREAS_TEMATICAS.map((area, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        const newAreas = activeFilters.areaTemática.includes(area)
                          ? activeFilters.areaTemática.filter(a => a !== area)
                          : [...activeFilters.areaTemática, area];
                        handleFilterChange('areaTemática', newAreas);
                      }}
                      className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                        activeFilters.areaTemática.includes(area)
                          ? 'bg-success-600 text-white'
                          : 'bg-success-50 text-success-700 hover:bg-success-100'
                      }`}
                    >
                      {area}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnvironmentalFilters;