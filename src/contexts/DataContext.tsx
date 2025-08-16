import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import SupabaseService, { type SheetData } from '../services/supabase';
import EnvironmentalAnalyticsService, { type EnvironmentalCase, type EnvironmentalFilters } from '../services/environmentalAnalytics';
import { CONFIG } from '../config';

interface DataContextState {
  cases: EnvironmentalCase[];
  filteredCases: EnvironmentalCase[];
  loading: boolean;
  error: string | null;
  filters: EnvironmentalFilters;
  setFilters: (filters: EnvironmentalFilters) => void;
  fetchData: () => Promise<void>;
  sheetsCount: number;
  rawCases: EnvironmentalCase[]; // Exponemos los casos sin procesar
}

const DataContext = createContext<DataContextState | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sheets, setSheets] = useState<SheetData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<EnvironmentalFilters>({
    dateFrom: '',
    dateTo: '',
    provincia: [],
    division: [],
    region: [],
    tipoActividad: [],
    areaTemática: [],
    searchText: '',
    activeDateFilter: undefined
  });

  const analyticsService = useMemo(() => new EnvironmentalAnalyticsService(), []);

  const fetchData = useCallback(async () => {
    if (!CONFIG.SUPABASE_URL || !CONFIG.SUPABASE_ANON_KEY) {
      setError("Configuración de Supabase no válida.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const supabaseService = new SupabaseService();
      
      // Si hay tablas específicas configuradas, usarlas
      if (CONFIG.SUPABASE_TABLES && CONFIG.SUPABASE_TABLES.length > 0) {
        const tablesData = await supabaseService.getMultipleTables(CONFIG.SUPABASE_TABLES);
        setSheets(tablesData);
      } else {
        // Intentar obtener todas las tablas disponibles
        const allTables = await supabaseService.getAllTables();
        if (allTables.length > 0) {
          const tablesData = await supabaseService.getMultipleTables(allTables);
          setSheets(tablesData);
        } else {
          setError("No se encontraron tablas en Supabase. Configura SUPABASE_TABLES en config.ts");
          setLoading(false);
          return;
        }
      }
      
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const cases = useMemo(() => {
    if (!sheets || sheets.length === 0) {
      return [];
    }
    return analyticsService.analyzeSheetsData(sheets);
  }, [sheets, analyticsService]);

  const filteredCases = useMemo(() => {
    return analyticsService.applyFilters(cases, filters);
  }, [cases, filters, analyticsService]);

  const value = {
    cases,
    filteredCases,
    loading,
    error,
    filters,
    setFilters,
    fetchData,
    sheetsCount: sheets.length,
    rawCases: cases // Pasamos los casos crudos
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};