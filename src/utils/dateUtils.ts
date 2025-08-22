/**
 * Utilidades centralizadas para manejo de fechas en el dashboard SENPA
 * Estandariza el parsing y formato de fechas para evitar inconsistencias
 */

export type DateFormat = 'ISO' | 'DMY' | 'MDY' | 'AUTO';

/**
 * Convierte una fecha a formato ISO (YYYY-MM-DD) de manera segura
 */
export const toISODate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Parsea una fecha desde string a Date object con múltiples formatos soportados
 * Prioriza formato dominicano (DD/MM/YYYY) según los datos de SENPA
 */
export const parseDate = (dateString: string, format: DateFormat = 'AUTO'): Date | null => {
  if (!dateString || typeof dateString !== 'string') {
    return null;
  }

  const dateStr = dateString.trim();
  if (!dateStr) {
    return null;
  }

  try {
    // Formato 1: ISO (YYYY-MM-DD) - más confiable
    if (format === 'ISO' || (format === 'AUTO' && dateStr.match(/^\d{4}-\d{1,2}-\d{1,2}/))) {
      const dateOnly = dateStr.substring(0, 10);
      const parts = dateOnly.split('-');
      
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        const day = parseInt(parts[2], 10);
        
        if (!isNaN(year) && !isNaN(month) && !isNaN(day) && 
            year >= 1900 && year <= 2100 && 
            month >= 1 && month <= 12 && 
            day >= 1 && day <= 31) {
          return new Date(year, month - 1, day);
        }
      }
    }

    // Formato 2: DD/MM/YYYY o DD-MM-YYYY (formato dominicano/europeo)
    if (format === 'DMY' || (format === 'AUTO' && dateStr.match(/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/))) {
      const parts = dateStr.split(/[\/\-]/);
      
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        const year = parseInt(parts[2], 10);
        
        if (!isNaN(day) && !isNaN(month) && !isNaN(year) && 
            year >= 1900 && year <= 2100 && 
            month >= 1 && month <= 12 && 
            day >= 1 && day <= 31) {
          return new Date(year, month - 1, day);
        }
      }
    }

    // Formato 3: MM/DD/YYYY o MM-DD-YYYY (formato americano) - solo si es necesario
    if (format === 'MDY' || (format === 'AUTO' && dateStr.match(/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/))) {
      const parts = dateStr.split(/[\/\-]/);
      
      if (parts.length === 3) {
        const month = parseInt(parts[0], 10);
        const day = parseInt(parts[1], 10);
        const year = parseInt(parts[2], 10);
        
        // Solo usar este formato si el día sería inválido en formato DD/MM/YYYY
        if (!isNaN(day) && !isNaN(month) && !isNaN(year) && 
            year >= 1900 && year <= 2100 && 
            month >= 1 && month <= 12 && 
            day >= 1 && day <= 31 &&
            parts[0].length <= 2 && parseInt(parts[0]) > 12) { // Solo si el primer número > 12
          return new Date(year, month - 1, day);
        }
      }
    }

    // Formato 4: Fallback - parsing directo con ajuste de zona horaria
    if (format === 'AUTO') {
      // Para fechas ISO, forzar interpretación local
      const localDateStr = dateStr.match(/^\d{4}-\d{1,2}-\d{1,2}$/)
        ? dateStr.replace(/-/g, '/')
        : dateStr;
      
      const testDate = new Date(localDateStr);
      if (!isNaN(testDate.getTime())) {
        // Normalizar a medianoche local para evitar problemas de zona horaria
        return new Date(testDate.getFullYear(), testDate.getMonth(), testDate.getDate());
      }
    }

  } catch (error) {
    console.warn('Error parsing date:', dateString, error);
  }

  return null;
};

/**
 * Valida si una fecha está dentro de un rango
 */
export const isDateInRange = (date: Date, fromDate?: string, toDate?: string): boolean => {
  if (!date || isNaN(date.getTime())) {
    return false;
  }

  // Normalizar fecha a medianoche para comparaciones consistentes
  const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (fromDate) {
    const from = new Date(`${fromDate}T00:00:00`);
    if (normalizedDate < from) {
      return false;
    }
  }

  if (toDate) {
    const to = new Date(`${toDate}T23:59:59.999`);
    if (normalizedDate > to) {
      return false;
    }
  }

  return true;
};

/**
 * Obtiene rangos de fecha para filtros rápidos
 */
export const getQuickDateRanges = () => {
  const today = new Date();
  const todayISO = toISODate(today);

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayISO = toISODate(yesterday);

  const weekAgo = new Date(today);
  weekAgo.setDate(today.getDate() - 7);
  const weekAgoISO = toISODate(weekAgo);

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthStartISO = toISODate(monthStart);

  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const monthEndISO = toISODate(monthEnd);

  return {
    today: { dateFrom: todayISO, dateTo: todayISO },
    yesterday: { dateFrom: yesterdayISO, dateTo: yesterdayISO },
    thisWeek: { dateFrom: weekAgoISO, dateTo: todayISO },
    thisMonth: { dateFrom: monthStartISO, dateTo: monthEndISO }
  };
};

/**
 * Formatea una fecha para display en la interfaz
 */
export const formatDateForDisplay = (date: Date | string, locale: string = 'es-ES'): string => {
  try {
    const dateObj = typeof date === 'string' ? parseDate(date) : date;
    
    if (!dateObj || isNaN(dateObj.getTime())) {
      return 'Fecha inválida';
    }

    return dateObj.toLocaleDateString(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    console.warn('Error formatting date for display:', date, error);
    return 'Fecha inválida';
  }
};

/**
 * Valida si un string de fecha es válido
 */
export const isValidDateString = (dateString: string): boolean => {
  const parsed = parseDate(dateString);
  return parsed !== null && !isNaN(parsed.getTime());
};

/**
 * Debug helper - analiza un string de fecha y devuelve info
 */
export const debugDateParsing = (dateString: string) => {
  console.group(`🗓️ Debug Date Parsing: "${dateString}"`);
  
  const formats: DateFormat[] = ['ISO', 'DMY', 'MDY', 'AUTO'];
  const results: any = {};
  
  formats.forEach(format => {
    const parsed = parseDate(dateString, format);
    results[format] = {
      success: parsed !== null,
      date: parsed,
      iso: parsed ? toISODate(parsed) : null,
      display: parsed ? formatDateForDisplay(parsed) : null
    };
    
    console.log(`${format}:`, results[format]);
  });
  
  console.groupEnd();
  return results;
};