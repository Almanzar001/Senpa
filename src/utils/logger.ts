/**
 * Sistema de logging centralizado para el dashboard SENPA
 * Permite controlar el nivel de logging y habilitar/deshabilitar categorías específicas
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4
}

export enum LogCategory {
  ANALYTICS = 'ANALYTICS',
  FILTERS = 'FILTERS',
  DATA_PARSING = 'DATA_PARSING',
  METRICS = 'METRICS',
  VALIDATION = 'VALIDATION',
  DASHBOARD = 'DASHBOARD',
  API = 'API'
}

class Logger {
  private currentLevel: LogLevel;
  private enabledCategories: Set<LogCategory>;
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.currentLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.WARN;
    this.enabledCategories = new Set([
      LogCategory.ERROR,
      LogCategory.VALIDATION,
      LogCategory.METRICS
    ]);

    // En desarrollo, habilitar más categorías
    if (this.isDevelopment) {
      this.enabledCategories.add(LogCategory.ANALYTICS);
      this.enabledCategories.add(LogCategory.FILTERS);
      this.enabledCategories.add(LogCategory.DATA_PARSING);
    }
  }

  setLevel(level: LogLevel) {
    this.currentLevel = level;
  }

  enableCategory(category: LogCategory) {
    this.enabledCategories.add(category);
  }

  disableCategory(category: LogCategory) {
    this.enabledCategories.delete(category);
  }

  private shouldLog(level: LogLevel, category: LogCategory): boolean {
    return (
      level >= this.currentLevel && 
      this.enabledCategories.has(category)
    );
  }

  private formatMessage(category: LogCategory, message: string): string {
    const timestamp = new Date().toLocaleTimeString();
    return `[${timestamp}] [${category}] ${message}`;
  }

  debug(category: LogCategory, message: string, ...args: any[]) {
    if (this.shouldLog(LogLevel.DEBUG, category)) {
      console.log(`🔍 ${this.formatMessage(category, message)}`, ...args);
    }
  }

  info(category: LogCategory, message: string, ...args: any[]) {
    if (this.shouldLog(LogLevel.INFO, category)) {
      console.info(`ℹ️ ${this.formatMessage(category, message)}`, ...args);
    }
  }

  warn(category: LogCategory, message: string, ...args: any[]) {
    if (this.shouldLog(LogLevel.WARN, category)) {
      console.warn(`⚠️ ${this.formatMessage(category, message)}`, ...args);
    }
  }

  error(category: LogCategory, message: string, ...args: any[]) {
    if (this.shouldLog(LogLevel.ERROR, category)) {
      console.error(`❌ ${this.formatMessage(category, message)}`, ...args);
    }
  }

  // Métodos especializados para casos comunes
  filterDebug(message: string, ...args: any[]) {
    this.debug(LogCategory.FILTERS, message, ...args);
  }

  analyticsInfo(message: string, ...args: any[]) {
    this.info(LogCategory.ANALYTICS, message, ...args);
  }

  metricsWarn(message: string, ...args: any[]) {
    this.warn(LogCategory.METRICS, message, ...args);
  }

  validationError(message: string, ...args: any[]) {
    this.error(LogCategory.VALIDATION, message, ...args);
  }

  // Método para crear grupos de logging colapsables
  group(category: LogCategory, title: string, level: LogLevel = LogLevel.DEBUG) {
    if (this.shouldLog(level, category)) {
      console.group(`📂 ${this.formatMessage(category, title)}`);
    }
  }

  groupEnd(category: LogCategory, level: LogLevel = LogLevel.DEBUG) {
    if (this.shouldLog(level, category)) {
      console.groupEnd();
    }
  }

  // Performance timing
  time(category: LogCategory, label: string) {
    if (this.shouldLog(LogLevel.DEBUG, category)) {
      console.time(`⏱️ ${category}: ${label}`);
    }
  }

  timeEnd(category: LogCategory, label: string) {
    if (this.shouldLog(LogLevel.DEBUG, category)) {
      console.timeEnd(`⏱️ ${category}: ${label}`);
    }
  }

  // Debug de objetos complejos
  debugObject(category: LogCategory, title: string, obj: any) {
    if (this.shouldLog(LogLevel.DEBUG, category)) {
      this.group(category, title);
      console.log(obj);
      this.groupEnd(category);
    }
  }

  // Método para logging condicional basado en datos específicos
  conditionalLog(
    condition: boolean,
    level: LogLevel,
    category: LogCategory,
    message: string,
    ...args: any[]
  ) {
    if (condition) {
      switch (level) {
        case LogLevel.DEBUG:
          this.debug(category, message, ...args);
          break;
        case LogLevel.INFO:
          this.info(category, message, ...args);
          break;
        case LogLevel.WARN:
          this.warn(category, message, ...args);
          break;
        case LogLevel.ERROR:
          this.error(category, message, ...args);
          break;
      }
    }
  }
}

// Instancia singleton del logger
export const logger = new Logger();

// Helpers para casos específicos de SENPA
export const logFilterOperation = (operation: string, details: any) => {
  logger.filterDebug(`${operation}:`, details);
};

export const logCaseProcessing = (caseNumber: string, operation: string, details?: any) => {
  logger.analyticsInfo(`Caso ${caseNumber} - ${operation}`, details);
};

export const logMetricsCalculation = (metricsType: string, result: any) => {
  logger.info(LogCategory.METRICS, `Calculando ${metricsType}:`, result);
};

export const logDateParsing = (originalDate: string, parsedDate: Date | null) => {
  logger.debug(LogCategory.DATA_PARSING, `Parseando fecha "${originalDate}":`, parsedDate);
};

export const logDataValidation = (validationType: string, errors: string[], warnings: string[]) => {
  if (errors.length > 0) {
    logger.validationError(`${validationType} - Errores:`, errors);
  }
  if (warnings.length > 0) {
    logger.warn(LogCategory.VALIDATION, `${validationType} - Advertencias:`, warnings);
  }
};

// Helper para debugging específico de casos de Sánchez Ramírez / Región 07
export const logSpecificCaseDebug = (caseData: any, operation: string) => {
  const isTargetCase = (
    caseData.provincia && caseData.provincia.toLowerCase().includes('sanchez')
  ) || (
    caseData.region && caseData.region.includes('07')
  );
  
  if (isTargetCase) {
    logger.debug(LogCategory.ANALYTICS, `🎯 ${operation} - Caso específico:`, caseData);
  }
};