// Configuración del Dashboard SENPA
export const CONFIG = {
  // Google Sheets Configuration
  SPREADSHEET_ID: '1BvGRbTzzVGYX-xx54NbFQq_CZ1TgxtNRf1od682OzLM',
  
  // ⚠️ IMPORTANTE: Reemplaza con tu nueva API Key de Google Cloud Console
  API_KEY: 'AIzaSyBHGUl0z_04j-2oRM8jqSchBnY6x9ld39c',
  
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
  return CONFIG.API_KEY !== 'TU_NUEVA_API_KEY_AQUI' && 
         CONFIG.API_KEY.length > 20 && 
         CONFIG.SPREADSHEET_ID.length > 0;
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