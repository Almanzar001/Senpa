import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import SupabaseService, { type SheetData, supabase } from '../services/supabase';
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
  updateCase: (updatedCase: EnvironmentalCase) => Promise<void>;
  deleteCase: (caseId: string) => Promise<void>;
  addCase: (newCase: EnvironmentalCase) => Promise<void>;
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
    
    // If analyticsService has cases, use them (they include updates)
    // Otherwise, analyze sheets data (initial load)
    const existingCases = Array.from(analyticsService.cases.values());
    if (existingCases.length > 0) {
      return existingCases;
    } else {
      return analyticsService.analyzeSheetsData(sheets);
    }
  }, [sheets, analyticsService]);

  const filteredCases = useMemo(() => {
    return analyticsService.applyFilters(cases, filters);
  }, [cases, filters, analyticsService]);

  // Helper function to update case in database
  const updateCaseInDatabase = useCallback(async (updatedCase: EnvironmentalCase) => {
    try {
      const supabaseService = new SupabaseService();
      
      // Map the EnvironmentalCase back to the original database record format
      // We need to determine which table this case belongs to and update accordingly
      const caseData = {
        numerocaso: updatedCase.numeroCaso,
        fecha: updatedCase.fecha,
        hora: updatedCase.hora,
        provinciamunicipio: updatedCase.provincia,
        localidad: updatedCase.localidad,
        region: updatedCase.region,
        tipoactividad: updatedCase.tipoActividad,
        areatematica: updatedCase.areaTemática,
        notificados: String(updatedCase.notificados || ''),
        procuraduria: updatedCase.procuraduria ? 'SI' : 'NO',
        resultado: updatedCase.resultado
      };

      // Update in the notas_informativas table (main table for cases)
      // We use numero_caso as the identifier since that's the primary key
      const { data: existing } = await supabase
        .from('notas_informativas')
        .select('id')
        .eq('numerocaso', updatedCase.numeroCaso)
        .single();

      if (existing?.id) {
        await supabaseService.updateData('notas_informativas', existing.id, caseData);
        console.log('✅ Case updated in database:', updatedCase.numeroCaso);
      } else {
        console.warn('⚠️ Case not found in database for update:', updatedCase.numeroCaso);
      }
      
    } catch (error: any) {
      console.error('❌ Error updating case in database:', error);
      throw new Error(`Error al actualizar en base de datos: ${error.message}`);
    }
  }, []);

  // Helper function to delete case from database
  const deleteCaseFromDatabase = useCallback(async (caseId: string) => {
    try {
      const supabaseService = new SupabaseService();
      
      // Find the case in the notas_informativas table
      const { data: existing } = await supabase
        .from('notas_informativas')
        .select('id')
        .eq('numerocaso', caseId)
        .single();

      if (existing?.id) {
        await supabaseService.deleteData('notas_informativas', existing.id);
        console.log('✅ Case deleted from database:', caseId);
      } else {
        console.warn('⚠️ Case not found in database for deletion:', caseId);
      }
      
    } catch (error: any) {
      console.error('❌ Error deleting case from database:', error);
      throw new Error(`Error al eliminar de base de datos: ${error.message}`);
    }
  }, []);

  // Helper function to add case to database
  const addCaseToDatabase = useCallback(async (newCase: EnvironmentalCase) => {
    try {
      const supabaseService = new SupabaseService();
      
      // Map the EnvironmentalCase to database record format
      const caseData = {
        numerocaso: newCase.numeroCaso,
        fecha: newCase.fecha,
        hora: newCase.hora,
        provinciamunicipio: newCase.provincia,
        localidad: newCase.localidad,
        region: newCase.region,
        tipoactividad: newCase.tipoActividad,
        areatematica: newCase.areaTemática,
        notificados: String(newCase.notificados || ''),
        procuraduria: newCase.procuraduria ? 'SI' : 'NO',
        resultado: newCase.resultado
      };

      await supabaseService.insertData('notas_informativas', caseData);
      console.log('✅ Case added to database:', newCase.numeroCaso);
      
    } catch (error: any) {
      console.error('❌ Error adding case to database:', error);
      throw new Error(`Error al agregar a base de datos: ${error.message}`);
    }
  }, []);

  // CRUD operations
  const updateCase = useCallback(async (updatedCase: EnvironmentalCase) => {
    try {
      const validationErrors = analyticsService.validateCase(updatedCase);
      if (validationErrors.length > 0) {
        throw new Error(`Errores de validación: ${validationErrors.join(', ')}`);
      }

      // Update in analytics service (in-memory)
      analyticsService.updateCase(updatedCase);
      
      // Also update in the database (persistent storage)
      await updateCaseInDatabase(updatedCase);
      
      // Force re-render by updating the sheets state with a timestamp
      // This ensures React detects the change and re-calculates computed values
      setSheets(prevSheets => prevSheets.map(sheet => ({
        ...sheet,
        lastUpdated: Date.now()
      })));
      
    } catch (err: any) {
      console.error('Error updating case:', err);
      throw err;
    }
  }, [analyticsService, updateCaseInDatabase]);

  const deleteCase = useCallback(async (caseId: string) => {
    try {
      // Delete from analytics service (in-memory)
      const deleted = analyticsService.deleteCase(caseId);
      if (!deleted) {
        throw new Error('Caso no encontrado');
      }
      
      // Also delete from database
      await deleteCaseFromDatabase(caseId);
      
      // Force re-render by updating the sheets state with a timestamp
      // This ensures React detects the change and re-calculates computed values
      setSheets(prevSheets => prevSheets.map(sheet => ({
        ...sheet,
        lastUpdated: Date.now()
      })));
      
    } catch (err: any) {
      console.error('Error deleting case:', err);
      throw err;
    }
  }, [analyticsService, deleteCaseFromDatabase]);

  const addCase = useCallback(async (newCase: EnvironmentalCase) => {
    try {
      const validationErrors = analyticsService.validateCase(newCase);
      if (validationErrors.length > 0) {
        throw new Error(`Errores de validación: ${validationErrors.join(', ')}`);
      }

      // Add to analytics service (in-memory)
      analyticsService.addCase(newCase);
      
      // Also add to database
      await addCaseToDatabase(newCase);
      
      // Force re-render by updating the sheets state with a timestamp
      // This ensures React detects the change and re-calculates computed values
      setSheets(prevSheets => prevSheets.map(sheet => ({
        ...sheet,
        lastUpdated: Date.now()
      })));
      
    } catch (err: any) {
      console.error('Error adding case:', err);
      throw err;
    }
  }, [analyticsService, addCaseToDatabase]);

  const value = {
    cases,
    filteredCases,
    loading,
    error,
    filters,
    setFilters,
    fetchData,
    sheetsCount: sheets.length,
    rawCases: cases, // Pasamos los casos crudos
    updateCase,
    deleteCase,
    addCase
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