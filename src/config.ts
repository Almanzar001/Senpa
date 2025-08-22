import { createClient } from '@supabase/supabase-js';

// Configuración del Dashboard SENPA
export const CONFIG = {
  // Supabase Configuration - usar directamente la URL de producción en desarrollo también
  SUPABASE_URL: 'https://nnsupabasenn.coman2uniformes.com',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q',
  
  // Lista de tablas de Supabase
  SUPABASE_TABLES: ['notas_informativas', 'detenidos', 'incautaciones', 'vehiculos'],
  
  // Google Maps API Key - usando variable de entorno (SEGURO)
  GOOGLE_MAPS_API_KEY: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  
  // Dashboard Settings
  DASHBOARD_TITLE: 'Dashboard Operativo SENPA',
  REFRESH_INTERVAL: 300000, // 5 minutos en milisegundos
  
  // Métricas específicas que buscará el dashboard
  SEARCH_TERMS: {
    DETENIDOS: ['detenido', 'arresto', 'captura', 'arrestado'],
    ESTADOS_ACTIVOS: ['activo', 'pendiente', 'abierto', 'proceso'],
    ESTADOS_RESUELTOS: ['resuelto', 'cerrado', 'completado', 'finalizado'],
    COLUMNAS_FECHA: ['fecha', 'date', 'timestamp'],
    COLUMNAS_UBICACION: ['ubicacion', 'zona', 'lugar', 'direccion'],
    COLUMNAS_ESTADO: ['estado', 'status', 'situacion']
  }
};

// Función para validar la configuración
export const isConfigValid = (): boolean => {
  const url = CONFIG.SUPABASE_URL;
  const key = CONFIG.SUPABASE_ANON_KEY;
  
  // Validar que no sean valores por defecto o vacíos
  return url.length > 0 && 
         key.length > 0 && 
         key.startsWith('eyJ') && // JWT válido
         (url.startsWith('http://') || url.startsWith('https://'));
};

// Función para crear cliente Supabase de manera segura
export const createSupabaseClient = () => {
  const url = CONFIG.SUPABASE_URL;
  const key = CONFIG.SUPABASE_ANON_KEY;
  
  // Si la configuración no es válida, crear cliente mock
  if (!isConfigValid()) {
    console.warn('⚠️ Configuración de Supabase no válida, usando cliente mock');
    return null;
  }
  
  try {
    return createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      },
      global: {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'apikey': key
        }
      }
    });
  } catch (error) {
    console.error('❌ Error creando cliente Supabase:', error);
    return null;
  }
};

// Función para obtener la fecha actual en formato español
export const getCurrentDateString = (): string => {
  return new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Cliente de Supabase seguro
export const supabase = createSupabaseClient();