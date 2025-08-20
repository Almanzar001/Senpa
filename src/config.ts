import { createClient } from '@supabase/supabase-js';

// Configuración del Dashboard SENPA
export const CONFIG = {
  // Supabase Configuration - usando variables de entorno seguras
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || 'https://nnsupabasenn.coman2uniformes.com',
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlLWRlbW8iLCJpYXQiOjE2NDE3NjkyMDAsImV4cCI6MTc5OTUzNTYwMH0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE',
  
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
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      },
      global: {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
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