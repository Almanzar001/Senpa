import { useState, useCallback } from 'react';
import { supabase } from '../services/supabase';

interface UseNotaFetchReturn {
  nota: string;
  loading: boolean;
  error: string | null;
  fetchNota: (numeroCaso: string) => Promise<void>;
  clearNota: () => void;
}

export const useNotaFetch = (): UseNotaFetchReturn => {
  const [nota, setNota] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNota = useCallback(async (numeroCaso: string) => {
    if (!numeroCaso?.trim()) {
      setError('Número de caso no válido.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: dbError } = await supabase
        .from('notas_informativas')
        .select('*')
        .eq('numerocaso', numeroCaso)
        .single();

      if (dbError) {
        console.error('Error fetching nota:', dbError);
        if (dbError.code === 'PGRST116') {
          setNota('No se encontró información detallada para este caso.');
        } else {
          setError(`Error en base de datos: ${dbError.message}`);
        }
        setNota('');
      } else {
        console.log('Datos obtenidos:', data); // Debug log
        // Try multiple possible column names for the nota
        const notaContent = data?.nota || data?.notas || data?.observaciones || data?.resultado || data?.descripcion || '';
        setNota(notaContent || 'No hay nota disponible para este caso.');
        setError(null);
      }
    } catch (err) {
      console.error('Error connecting to database:', err);
      setError(`Error de conexión: ${err instanceof Error ? err.message : 'Error desconocido'}`);
      setNota('');
    } finally {
      setLoading(false);
    }
  }, []);

  const clearNota = useCallback(() => {
    setNota('');
    setError(null);
    setLoading(false);
  }, []);

  return {
    nota,
    loading,
    error,
    fetchNota,
    clearNota
  };
};