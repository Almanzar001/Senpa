// Production configuration and optimizations

export const PRODUCTION_CONFIG = {
  // Performance settings
  DEBOUNCE_SEARCH_DELAY: 300,
  MAX_CACHE_SIZE: 100,
  PAGINATION_SIZES: [10, 25, 50, 100],
  
  // UI settings
  MODAL_ANIMATION_DURATION: 200,
  TABLE_ROW_HEIGHT: 52,
  
  // Database settings
  MAX_RETRY_ATTEMPTS: 3,
  CONNECTION_TIMEOUT: 10000,
  
  // Feature flags
  ENABLE_VIRTUAL_SCROLLING: true,
  ENABLE_SEARCH_HIGHLIGHTING: false,
  ENABLE_ANALYTICS: process.env.NODE_ENV === 'production',
  
  // Error handling
  LOG_LEVEL: process.env.NODE_ENV === 'production' ? 'error' : 'debug',
  ENABLE_ERROR_REPORTING: process.env.NODE_ENV === 'production',
} as const;

// Optimized field mappings for better performance
export const FIELD_MAPPINGS = {
  notas_informativas: [
    'numeroCaso', 'fecha', 'provincia', 'localidad', 
    'tipoActividad', 'notificados', 'procuraduria'
  ],
  detenidos: [
    'numeroCaso', 'fecha', 'provincia', 'localidad', 
    'nombre', 'motivoDetencion', 'estadoProceso'
  ],
  vehiculos: [
    'numeroCaso', 'fecha', 'provincia', 'localidad', 
    'tipoVehiculo', 'marca', 'color'
  ],
  incautaciones: [
    'numeroCaso', 'fecha', 'provincia', 'localidad', 
    'tipoIncautacion', 'cantidad', 'estado'
  ]
} as const;

// Pre-compiled regex patterns for better performance
export const SEARCH_PATTERNS = {
  OPERATIVO: /operativo/i,
  PATRULLA: /patrulla/i,
  NUMERO_CASO: /^[A-Z0-9-]+$/i,
  FECHA: /^\d{4}-\d{2}-\d{2}$/,
} as const;

// Memory management
export const cleanupResources = () => {
  // Clear any global caches
  if (typeof window !== 'undefined') {
    // Clear search cache
    window.dispatchEvent(new CustomEvent('clear-cache'));
  }
};

// Error tracking for production
export const trackError = (error: Error, context?: string) => {
  if (PRODUCTION_CONFIG.ENABLE_ERROR_REPORTING) {
    console.error(`[${context || 'Unknown'}]:`, error);
    // Here you would integrate with error reporting service
    // like Sentry, LogRocket, etc.
  }
};

// Performance monitoring
export const measurePerformance = (name: string, fn: () => void) => {
  if (PRODUCTION_CONFIG.ENABLE_ANALYTICS) {
    const start = performance.now();
    fn();
    const end = performance.now();
    console.log(`Performance [${name}]: ${end - start}ms`);
  } else {
    fn();
  }
};