import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import GoogleSheetsService, { type SheetData } from '../services/googleSheets';
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

  const fetchData = async () => {
    if (!CONFIG.SPREADSHEET_ID || !CONFIG.API_KEY || CONFIG.API_KEY === 'TU_NUEVA_API_KEY_AQUI') {
      setError("API Key o Spreadsheet ID no configurados.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const sheetsService = new GoogleSheetsService(CONFIG.API_KEY);
      const allSheets = await sheetsService.getAllSheets(CONFIG.SPREADSHEET_ID);
      const sheetsData = await sheetsService.getMultipleSheets(CONFIG.SPREADSHEET_ID, allSheets);
      setSheets(sheetsData);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const cases = useMemo(() => {
    if (!sheets || sheets.length === 0) return [];
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