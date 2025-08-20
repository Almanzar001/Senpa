import { createClient } from '@supabase/supabase-js';

// Configuración del Dashboard SENPA
export const CONFIG = {
  // Supabase Configuration - Autoalojado
  SUPABASE_URL: 'http://154.38.164.2:8003',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE',
  
  // Lista de tablas de Supabase
  SUPABASE_TABLES: ['notas_informativas', 'detenidos', 'incautaciones', 'vehiculos'],
  
  // Google Maps API Key (solo para mapas)
  GOOGLE_MAPS_API_KEY: 'AIzaSyBHGUl0z_04j-2oRM8jqSchBnY6x9ld39c',
  
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
  return CONFIG.SUPABASE_URL.length > 0 && 
         CONFIG.SUPABASE_ANON_KEY.length > 0;
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

// Cliente de Supabase para instalación auto-alojada
export const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'implicit'
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'X-Client-Info': 'dashboard-senpa'
    }
  },
  realtime: {
    params: {
      eventsPerSecond: 2
    }
  }
});