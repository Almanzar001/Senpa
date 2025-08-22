import { type SheetData } from './googleSheets';
import { parseDate, isDateInRange, toISODate } from '../utils/dateUtils';
import type { UnifiedFilters } from '../types/filters';

export interface EnvironmentalCase {
  numeroCaso: string;
  fecha: string;
  hora: string;
  provincia: string;
  localidad: string;
  region: string;
  tipoActividad: string;
  areaTemática: string;
  detenidos: number;
  vehiculosDetenidos: number;
  incautaciones: string[];
  notificados: string; // Text field with names
  notificadosCount?: number; // Count for metrics
  procuraduria: string; // Campo string que contiene 'SI' o 'NO'
  resultado?: string;
  nota?: string; // Campo nota de la base de datos
  coordenadas?: {
    lat: number;
    lng: number;
  };
  [key: string]: any;
}

export interface EnvironmentalMetrics {
  operativosRealizados: number;
  patrullas: number;
  detenidos: number;
  vehiculosDetenidos: number;
  incautaciones: number;
  areasIntervenidas: number;
  notificados: number;
  procuraduria: number;
  regiones: number;
}

export interface EnvironmentalFilters extends UnifiedFilters {
  // Mantener retrocompatibilidad mientras migramos
  division: string[]; // Mapea a localidad en UnifiedFilters
}

class EnvironmentalAnalyticsService {
  public cases: Map<string, EnvironmentalCase> = new Map();

  constructor() {
    this.cases = new Map();
  }

  // Helper method to count notificados from a string of names
  private countNotificados(notificadosString: any): number {
    if (!notificadosString) return 0;
    
    const str = String(notificadosString).trim();
    if (!str) return 0;
    
    // Split by common separators and count non-empty names
    const names = str.split(/[,;|\n\r]+/)
      .map(name => name.trim())
      .filter(name => name.length > 0);
    
    return names.length;
  }

  // Analizar y combinar datos de todas las hojas usando numeroCaso
  analyzeSheetsData(sheetsData: SheetData[]): EnvironmentalCase[] {
    this.cases.clear();
    if (sheetsData.length === 0) {
      return [];
    }

    sheetsData.forEach((sheet) => {
      if (sheet.data.length <= 1) return;
      
      const headers = sheet.data[0] as string[];
      const rows = sheet.data.slice(1);
      
      // Log optimizado para debugging controlado
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔍 Analytics: Procesando hoja "${sheet.name}"`);
        console.log('🔍 Analytics: Headers disponibles:', headers);
      }
      
      // Encontrar columnas importantes
      const numeroCasoCol = headers.findIndex(h => 
        h.toLowerCase().includes('numerocaso') || 
        h.toLowerCase().includes('numero_caso') ||
        h.toLowerCase().includes('caso')
      );
      
      if (numeroCasoCol === -1) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`🔍 Analytics: Saltando hoja "${sheet.name}" - no tiene columna numeroCaso`);
        }
        return; // Skip sheets without numeroCaso
      }
      
      const fechaCol = headers.findIndex(h => h.toLowerCase().includes('fecha'));
      const horaCol = headers.findIndex(h => h.toLowerCase().includes('hora'));
      const provinciaCol = headers.findIndex(h => 
        h.toLowerCase().includes('provincia')
      );
      const regionCol = headers.findIndex(h => 
        h.toLowerCase().includes('region')
      );
      const localidadCol = headers.findIndex(h => 
        h.toLowerCase().includes('localidad') || 
        h.toLowerCase().includes('municipio') ||
        h.toLowerCase().includes('ubicacion')
      );
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔍 Analytics: Columnas encontradas en "${sheet.name}":`, {
          numeroCaso: numeroCasoCol,
          fecha: fechaCol,
          provincia: provinciaCol,
          region: regionCol,
          localidad: localidadCol
        });
      }
      const tipoActividadCol = headers.findIndex(h => {
        const hLower = h.toLowerCase();
        return hLower.includes('tipo') && (hLower.includes('actividad') || hLower.includes('operacion'));
      });
      const areaTemáticaCol = headers.findIndex(h => 
        h.toLowerCase().includes('area') && h.toLowerCase().includes('tematica')
      );
      const notificadosCol = headers.findIndex(h => {
        const hLower = h.toLowerCase().trim();
        return hLower === 'notificados' || 
               hLower.includes('notificad') ||
               hLower === 'notificado' ||
               hLower.includes('num_notificados') ||
               hLower.includes('numero_notificados');
      });
      

      const procuraduriaCol = headers.findIndex(h => {
        const hLower = h.toLowerCase().trim();
        return hLower === 'procuraduria' ||
               hLower === 'procuraduría' ||
               hLower.includes('procuradur') ||
               hLower === 'procuraduria_general' ||
               hLower.includes('procur');
      });

      const resultadoCol = headers.findIndex(h => h.toLowerCase().includes('resultado'));
      
      const notaCol = headers.findIndex(h => {
        const hLower = h.toLowerCase().trim();
        return hLower === 'nota' || 
               hLower.includes('nota') ||
               hLower === 'notas' ||
               hLower.includes('observacion');
      });

      let casosEncontradosEnEstaHoja = 0;
      let casosSinNumero = 0;
      
      rows.forEach(row => {
        const numeroCaso = String(row[numeroCasoCol] || '').trim();
        if (!numeroCaso) {
          casosSinNumero++;
          return;
        }

        // Obtener o crear el caso
        let envCase = this.cases.get(numeroCaso);
        if (!envCase) {
          envCase = {
            numeroCaso,
            fecha: fechaCol >= 0 ? String(row[fechaCol] || '') : '',
            hora: horaCol >= 0 ? String(row[horaCol] || '') : '',
            provincia: provinciaCol >= 0 ? String(row[provinciaCol] || '') : '',
            region: regionCol >= 0 ? String(row[regionCol] || '') : '',
            localidad: localidadCol >= 0 ? String(row[localidadCol] || '') : '',
            tipoActividad: tipoActividadCol >= 0 ? String(row[tipoActividadCol] || '') : '',
            areaTemática: areaTemáticaCol >= 0 ? String(row[areaTemáticaCol] || '') : '',
            resultado: resultadoCol >= 0 ? String(row[resultadoCol] || '') : '',
            detenidos: 0,
            vehiculosDetenidos: 0,
            incautaciones: [],
            notificados: notificadosCol >= 0 ? String(row[notificadosCol] || '').trim() : '', // Keep as text
            notificadosCount: this.countNotificados(notificadosCol >= 0 ? row[notificadosCol] : ''), // Count for metrics
            procuraduria: procuraduriaCol >= 0 ? String(row[procuraduriaCol] || '').toUpperCase() === 'SI' ? 'SI' : 'NO' : 'NO',
            nota: notaCol >= 0 ? String(row[notaCol] || '').trim() : '' // Add nota field from database
          };
          
          // Log de caso creado para debugging
          if (casosEncontradosEnEstaHoja < 3) {
            console.log(`🔍 Analytics: Caso creado en "${sheet.name}":`, {
              numeroCaso: envCase.numeroCaso,
              provincia: envCase.provincia,
              region: envCase.region,
              localidad: envCase.localidad,
              tipoActividad: envCase.tipoActividad,
              areaTemática: envCase.areaTemática,
              fecha: envCase.fecha
            });
          }
          
          // Log específico para Sánchez Ramírez y región 07
          if ((envCase.provincia && envCase.provincia.toLowerCase().includes('sanchez')) || 
              (envCase.region && envCase.region.includes('07')) ||
              (envCase.fecha && (envCase.fecha.includes('2025-08-09') || envCase.fecha.includes('9/8/2025')))) {
            console.log(`🎯 CASO ESPECÍFICO ENCONTRADO:`, {
              numeroCaso: envCase.numeroCaso,
              fecha: envCase.fecha,
              provincia: envCase.provincia,
              region: envCase.region,
              localidad: envCase.localidad,
              tipoActividad: envCase.tipoActividad,
              areaTemática: envCase.areaTemática,
              hoja: sheet.name
            });
          }
          
          this.cases.set(numeroCaso, envCase);
          casosEncontradosEnEstaHoja++;
          
        } else {
          // Actualizar campos si encontramos nuevos datos
          if (notificadosCol >= 0 && row[notificadosCol] && String(row[notificadosCol]).trim()) {
            // Update the text field and count
            const notificadosString = String(row[notificadosCol]).trim();
            envCase.notificados = notificadosString; // Keep as text
            envCase.notificadosCount = Math.max(envCase.notificadosCount || 0, this.countNotificados(row[notificadosCol]));
          }
          
          if (procuraduriaCol >= 0 && row[procuraduriaCol]) {
            const procuraduriaValue = String(row[procuraduriaCol] || '').toLowerCase() === 'si';
            if (procuraduriaValue) {
              envCase.procuraduria = 'SI';
            }
          }
        }

        // Analizar datos específicos por tipo de hoja
        this.analyzeSheetSpecificData(sheet.name, headers, row, envCase);
      });
      
    });

    const finalCases = Array.from(this.cases.values());
    
    // Log específico para casos de hoy
    const casosHoy = finalCases.filter(c => c.fecha && c.fecha.includes('9/8/2025'));
    const casosSanchezHoy = finalCases.filter(c => 
      c.provincia && c.provincia.toLowerCase().includes('sanchez') && 
      c.fecha && c.fecha.includes('9/8/2025')
    );
    
    console.log('🔍 Analytics: Casos específicos de hoy (9/8/2025):', {
      totalCasosHoy: casosHoy.length,
      casosSanchezRamirezHoy: casosSanchezHoy.length,
      numerosDeCSsosSanchezHoy: casosSanchezHoy.map(c => c.numeroCaso),
      detallesCasosSanchezHoy: casosSanchezHoy.map(c => ({
        numero: c.numeroCaso,
        fecha: c.fecha,
        provincia: c.provincia,
        region: c.region,
        tipoActividad: c.tipoActividad
      }))
    });
    
    console.log('🔍 Analytics: Resumen final:', {
      totalCases: finalCases.length,
      casesWithRegion: finalCases.filter(c => c.region && c.region.trim()).length,
      uniqueRegions: [...new Set(finalCases.map(c => c.region).filter(r => r && r.trim()))],
      casesWithProvincia: finalCases.filter(c => c.provincia && c.provincia.trim()).length,
      uniqueProvincias: [...new Set(finalCases.map(c => c.provincia).filter(p => p && p.trim()))]
    });
    
    return finalCases;
  }

  private analyzeSheetSpecificData(sheetName: string, headers: string[], row: any[], envCase: EnvironmentalCase) {
    const sheetNameLower = sheetName.toLowerCase();

    // Análisis de notificados
    if (sheetNameLower.includes('notificad')) {
      const cantidadCol = headers.findIndex(h => {
        const hLower = h.toLowerCase();
        return hLower.includes('cantidad') || 
               hLower.includes('numero') || 
               hLower.includes('total') ||
               hLower.includes('notificados');
      });
      
      if (cantidadCol >= 0 && row[cantidadCol] && String(row[cantidadCol]).trim()) {
        // Update the text field and count
        const notificadosString = String(row[cantidadCol]).trim();
        envCase.notificados = notificadosString; // Keep as text
        envCase.notificadosCount = Math.max(envCase.notificadosCount || 0, this.countNotificados(row[cantidadCol]));
      }
    }

    // Análisis de detenidos
    if (sheetNameLower.includes('detenido') || sheetNameLower.includes('persona')) {
      const nombreCol = headers.findIndex(h => h.toLowerCase().includes('nombre'));
      const nacionalidadCol = headers.findIndex(h => h.toLowerCase().includes('nacionalidad'));
      
      if (nombreCol >= 0 && row[nombreCol]) {
        envCase.detenidos++;
        if (!envCase.detenidosInfo) envCase.detenidosInfo = [];
        envCase.detenidosInfo.push({
          nombre: String(row[nombreCol] || ''),
          nacionalidad: nacionalidadCol >= 0 ? String(row[nacionalidadCol] || '') : ''
        });
      }
    }

    // Análisis de vehículos
    if (sheetNameLower.includes('vehiculo') || sheetNameLower.includes('transporte')) {
      const tipoCol = headers.findIndex(h => 
        h.toLowerCase().trim() === 'tipo' ||
        h.toLowerCase().includes('tipo')
      );
      const marcaCol = headers.findIndex(h => 
        h.toLowerCase().trim() === 'marca' ||
        h.toLowerCase().includes('marca')
      );
      const colorCol = headers.findIndex(h => 
        h.toLowerCase().trim() === 'color' ||
        h.toLowerCase().includes('color')
      );
      const provinciaMunicipioCol = headers.findIndex(h => 
        h.toLowerCase().includes('provinciamunicip') ||
        h.toLowerCase().includes('provincia_municip') ||
        h.toLowerCase().includes('provinciamunicipio')
      );
      
      if (tipoCol >= 0 && row[tipoCol]) {
        envCase.vehiculosDetenidos++;
        if (!envCase.vehiculosInfo) envCase.vehiculosInfo = [];
        envCase.vehiculosInfo.push({
          tipo: String(row[tipoCol] || ''),
          marca: marcaCol >= 0 ? String(row[marcaCol] || '') : 'No especificada',
          color: colorCol >= 0 ? String(row[colorCol] || '') : 'No especificado',
          provinciaMunicipio: provinciaMunicipioCol >= 0 ? String(row[provinciaMunicipioCol] || '') : ''
        });
      }
    }

    // Análisis de incautaciones - expandir detección de nombres de hojas
    if (sheetNameLower.includes('incautacion') || 
        sheetNameLower.includes('incautaciones') ||
        sheetNameLower.includes('decomiso') ||
        sheetNameLower.includes('confiscacion') ||
        sheetNameLower.includes('requisas') ||
        sheetNameLower.includes('objetos') ||
        sheetNameLower === 'incautaciones') {
      
      
      // Buscar columnas con mayor flexibilidad
      const tipoIncautacionCol = headers.findIndex(h => {
        const hLower = h.toLowerCase();
        return hLower.includes('tipo') || 
               hLower.includes('objeto') ||
               hLower.includes('articulo') ||
               hLower.includes('item') ||
               hLower.includes('material') ||
               hLower.includes('producto') ||
               hLower.includes('bien') ||
               hLower.includes('incautado') ||  // ← Agregar para tu estructura
               hLower === 'incautado';          // ← Exacto para tu caso
      });
      
      const cantidadCol = headers.findIndex(h => {
        const hLower = h.toLowerCase();
        // Ser más específico - no buscar "numero" ya que "numeroCaso" lo contiene
        return hLower === 'cantidad' ||
               hLower === 'qty' ||
               hLower === 'count' ||
               hLower.includes('unidades') ||
               hLower.includes('peso') ||
               hLower.includes('volumen');
      });
      
      
      if (tipoIncautacionCol >= 0 && row[tipoIncautacionCol]) {
        const tipoIncautacion = String(row[tipoIncautacionCol] || '').trim();
        const cantidad = cantidadCol >= 0 ? String(row[cantidadCol] || '1').trim() : '1';
        
        if (tipoIncautacion) {  // Solo agregar si hay un tipo válido
          envCase.incautaciones.push(`${cantidad} ${tipoIncautacion}`);
          if (!envCase.incautacionesInfo) envCase.incautacionesInfo = [];
          envCase.incautacionesInfo.push({
            tipo: tipoIncautacion,
            cantidad: cantidad
          });
        }
      }
    }

    // NUEVA LÓGICA: Buscar una sola columna de coordenadas
    const coordCol = headers.findIndex(h => h.toLowerCase().includes('coordenada'));

    if (coordCol >= 0 && row[coordCol] && !envCase.coordenadas) {
      const coordStr = String(row[coordCol]);
      const parts = coordStr.split(',');

      if (parts.length === 2) {
        const lat = parseFloat(parts[0].trim());
        const lng = parseFloat(parts[1].trim());

        if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
          envCase.coordenadas = { lat, lng };
        }
      }
    } else {
      // LÓGICA ANTERIOR (FALLBACK): Buscar columnas separadas si no se encuentra la columna única
      const latCol = headers.findIndex(h => {
        const hLower = h.toLowerCase();
        return hLower.startsWith('lat') || hLower === 'latitud';
      });
      const lngCol = headers.findIndex(h => {
        const hLower = h.toLowerCase();
        return hLower.startsWith('lon') || hLower.startsWith('lng') || hLower === 'longitud';
      });
      
      if (latCol >= 0 && lngCol >= 0 && row[latCol] && row[lngCol] && !envCase.coordenadas) {
        const latStr = String(row[latCol]).replace(',', '.').trim();
        const lngStr = String(row[lngCol]).replace(',', '.').trim();
        
        const lat = parseFloat(latStr);
        const lng = parseFloat(lngStr);

        if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
          envCase.coordenadas = { lat, lng };
        }
      }
    }
  }

  // Calcular métricas principales
  calculateMetrics(cases: EnvironmentalCase[], filters?: EnvironmentalFilters): EnvironmentalMetrics {
    const filteredCases = this.applyFilters(cases, filters);

    const operativosRealizados = filteredCases.filter(c => 
      c.tipoActividad.toLowerCase().includes('operativo')
    ).length;

    const patrullas = filteredCases.filter(c => 
      c.tipoActividad.toLowerCase().includes('patrulla')
    ).length;

    const detenidos = filteredCases.reduce((total, c) => total + c.detenidos, 0);
    const vehiculosDetenidos = filteredCases.reduce((total, c) => total + c.vehiculosDetenidos, 0);
    const incautaciones = filteredCases.reduce((total, c) => total + c.incautaciones.length, 0);
    
    const areasIntervenidas = new Set(
      filteredCases
        .map(c => c.localidad.toLowerCase().trim())
        .filter(loc => loc.length > 0)
    ).size;

    const notificados = filteredCases.reduce((total, c) => total + (c.notificadosCount || 0), 0);
    
    const procuraduria = filteredCases.filter(c => 
      c.procuraduria === 'SI'
    ).length;
    
    
    const regiones = new Set(
      filteredCases
        .map(c => c.region.toLowerCase().trim())
        .filter(region => region.length > 0)
    ).size;

    return {
      operativosRealizados,
      patrullas,
      detenidos,
      vehiculosDetenidos,
      incautaciones,
      areasIntervenidas,
      notificados,
      procuraduria,
      regiones
    };
  }

  // Calcular métricas para dashboard ejecutivo (formato simplificado)
  calculateExecutiveMetrics(cases: EnvironmentalCase[], filters?: EnvironmentalFilters) {
    const filteredCases = this.applyFilters(cases, filters);

    let operativos = 0;
    let patrullas = 0;
    let detenidos = 0;
    let vehiculos = 0;
    let procuraduria = 0;
    let notificados = 0;

    filteredCases.forEach((caso) => {
      // Contar operativos
      if (caso.tipoActividad && caso.tipoActividad.toLowerCase().includes('operativo')) {
        operativos++;
      }
      
      // Contar patrullas
      if (caso.tipoActividad && caso.tipoActividad.toLowerCase().includes('patrulla')) {
        patrullas++;
      }
      
      // Contar detenidos
      if (caso.detenidos && caso.detenidos > 0) {
        detenidos += caso.detenidos;
      }
      
      // Contar vehículos
      if (caso.vehiculosDetenidos && caso.vehiculosDetenidos > 0) {
        vehiculos += caso.vehiculosDetenidos;
      }
      
      // Contar casos con procuraduría
      if (caso.procuraduria === 'SI') {
        procuraduria++;
      }
      
      // Contar notificados
      if (caso.notificadosCount && caso.notificadosCount > 0) {
        notificados += caso.notificadosCount;
      } else if (caso.notificados && String(caso.notificados).trim() !== '') {
        // Fallback: contar por separadores si no hay notificadosCount
        const notificadosStr = String(caso.notificados).trim();
        const names = notificadosStr.split(/[,;|\n\r]+/)
          .map(name => name.trim())
          .filter(name => name.length > 0 && name.toLowerCase() !== 'n/a' && name.toLowerCase() !== 'na');
        notificados += names.length;
      }
    });

    return {
      operativos,
      patrullas,
      detenidos,
      vehiculos,
      procuraduria,
      notificados
    };
  }

  // Aplicar filtros a los casos
  applyFilters(cases: EnvironmentalCase[], filters?: EnvironmentalFilters): EnvironmentalCase[] {
    if (!filters) {
      return cases;
    }

    // Verificar si no hay filtros activos (caso 'all')
    const hasActiveFilters = !!(
      filters.dateFrom || 
      filters.dateTo ||
      (filters.provincia && filters.provincia.length > 0) ||
      (filters.region && filters.region.length > 0) ||
      (filters.tipoActividad && filters.tipoActividad.length > 0) ||
      (filters.areaTemática && filters.areaTemática.length > 0) ||
      (filters.searchText && filters.searchText.trim())
    );

    if (!hasActiveFilters) {
      console.log('🔍 ApplyFilters: No hay filtros activos, devolviendo todos los casos');
      return cases;
    }

    console.log('🔍 ApplyFilters: Iniciando filtrado con:', {
      totalCases: cases.length,
      filters: filters,
      casesWithRegion07: cases.filter(c => c.region && c.region.includes('07')).length,
      casesWithSanchezRamirez: cases.filter(c => c.provincia && c.provincia.toLowerCase().includes('sanchez')).length,
      casesWithDate20250809: cases.filter(c => c.fecha && c.fecha.includes('2025-08-09')).length,
      casesWithDate982025: cases.filter(c => c.fecha && c.fecha.includes('9/8/2025')).length,
      casosSanchezConFecha9Aug: cases.filter(c => 
        c.provincia && c.provincia.toLowerCase().includes('sanchez') && 
        c.fecha && c.fecha.includes('9/8/2025')
      ).length
    });

    const filteredCases = cases.filter(envCase => {
          // Log específico para casos de Sánchez Ramírez / Región 07 / Fecha 09-08-2025
          const isTargetCase = (envCase.provincia && envCase.provincia.toLowerCase().includes('sanchez')) ||
                              (envCase.region && envCase.region.includes('07')) ||
                              (envCase.fecha && (envCase.fecha.includes('2025-08-09') || envCase.fecha.includes('09/08/2025') || envCase.fecha.includes('9/8/2025')));
                          
          if (isTargetCase) {
            console.log(`🎯 EVALUANDO CASO ESPECÍFICO:`, {
              numeroCaso: envCase.numeroCaso,
              fecha: envCase.fecha,
              provincia: envCase.provincia,
              region: envCase.region,
              tipoActividad: envCase.tipoActividad,
              filtros: {
                dateFrom: filters.dateFrom,
                dateTo: filters.dateTo,
                region: filters.region,
                provincia: filters.provincia,
                tipoActividad: filters.tipoActividad
              }
            });
          }
          
          // Log específico para casos de Sánchez Ramírez con fecha 9/8/2025 - mostrar todas las regiones
          if (envCase.provincia && envCase.provincia.toLowerCase().includes('sanchez') && 
              envCase.fecha && envCase.fecha.includes('9/8/2025')) {
            console.log(`🏛️ SÁNCHEZ RAMÍREZ CASO 9/8/2025:`, {
              numeroCaso: envCase.numeroCaso,
              provincia: envCase.provincia,
              region: envCase.region,
              tipoActividad: envCase.tipoActividad,
              localidad: envCase.localidad
            });
          }      // Filtro de fecha - usando utilidades centralizadas
      if (filters.dateFrom || filters.dateTo) {
        const caseDate = parseDate(envCase.fecha);
        
        if (caseDate && !isNaN(caseDate.getTime())) {
          // Log específico para debugging de parsing de fechas
          if (envCase.region === '07' || envCase.provincia.includes('Sánchez')) {
            console.log(`🗓️ FECHA PARSEADA:`, {
              fechaOriginal: envCase.fecha,
              fechaParseada: caseDate.toLocaleDateString('es-ES'),
              fechaISO: toISODate(caseDate),
              provincia: envCase.provincia,
              region: envCase.region
            });
          }
          
          // Validar si está en el rango usando utilidad centralizada
          if (!isDateInRange(caseDate, filters.dateFrom, filters.dateTo)) {
            if (envCase.region === '07' || envCase.provincia.includes('Sánchez')) {
              console.log(`🗓️ REJECT DATE RANGE: Case ${envCase.fecha} is outside range ${filters.dateFrom} - ${filters.dateTo}:`, envCase);
            }
            return false;
          }
        } else if (filters.dateFrom || filters.dateTo) {
          if (envCase.region === '07' || envCase.provincia.includes('Sánchez')) {
            console.log(`🗓️ REJECT INVALID DATE: Case has invalid date when date filter is active:`, envCase);
          }
          return false; // Exclude cases without valid dates when date filter is active
        }
      }

      // Filtro de provincia
      if (filters.provincia && filters.provincia.length > 0) {
        const matchesProvincia = filters.provincia.some(p =>
          envCase.provincia.toLowerCase().includes(p.toLowerCase())
        );
        if (!matchesProvincia) {
          if (envCase.region === '07' || envCase.provincia.includes('Sánchez')) {
            console.log(`🏛️ REJECT PROVINCIA: Case provincia "${envCase.provincia}" doesn't match filter:`, filters.provincia, envCase);
          }
          return false;
        }
      }

      // Filtro de región
      if (filters.region && filters.region.length > 0) {
        const matchesRegion = filters.region.some(r =>
          envCase.region && envCase.region.toLowerCase().includes(r.toLowerCase())
        );
        
        if (!matchesRegion) {
          if (envCase.region === '07' || envCase.provincia.includes('Sánchez')) {
            console.log(`🗺️ REJECT REGION: Case region "${envCase.region}" doesn't match filter:`, filters.region, envCase);
          }
          return false;
        }
      }

      // Filtro de tipo de actividad
      if (filters.tipoActividad && filters.tipoActividad.length > 0) {
        const matchesTipo = filters.tipoActividad.some(t =>
          envCase.tipoActividad.toLowerCase().includes(t.toLowerCase())
        );
        if (!matchesTipo) {
          if (envCase.region === '07' || envCase.provincia.includes('Sánchez')) {
            console.log(`🎯 REJECT TIPO ACTIVIDAD: Case tipo "${envCase.tipoActividad}" doesn't match filter:`, filters.tipoActividad, envCase);
          }
          return false;
        }
      }

      // Filtro de área temática
      if (filters.areaTemática && filters.areaTemática.length > 0) {
        const matchesArea = filters.areaTemática.some(a =>
          envCase.areaTemática.toLowerCase().includes(a.toLowerCase())
        );
        if (!matchesArea) {
          if (envCase.region === '07' || envCase.provincia.includes('Sánchez')) {
            console.log(`📋 REJECT AREA TEMATICA: Case area "${envCase.areaTemática}" doesn't match filter:`, filters.areaTemática, envCase);
          }
          return false;
        }
      }

      // Filtro de búsqueda de texto
      if (filters.searchText) {
        const searchLower = filters.searchText.toLowerCase();
        const searchableText = [
          envCase.localidad,
          envCase.provincia,
          envCase.areaTemática,
          envCase.tipoActividad,
          ...envCase.incautaciones
        ].join(' ').toLowerCase();
        
        if (!searchableText.includes(searchLower)) {
          if (envCase.region === '07' || envCase.provincia.includes('Sánchez')) {
            console.log(`🔍 REJECT SEARCH TEXT: Case doesn't match search "${filters.searchText}":`, envCase);
          }
          return false;
        }
      }

      // Si llegamos aquí, el caso pasó todos los filtros
      if (envCase.region === '07' || envCase.provincia.includes('Sánchez')) {
        console.log(`✅ CASE PASSED ALL FILTERS:`, envCase);
      }

      return true;
    });
    
    console.log('🔍 ApplyFilters: Resultado del filtrado:', {
      casosOriginales: cases.length,
      casosFiltrados: filteredCases.length,
      casosDescartados: cases.length - filteredCases.length,
      casosConRegion07Filtrados: filteredCases.filter(c => c.region && c.region.includes('07')).length,
      casosConSanchezRamirezFiltrados: filteredCases.filter(c => c.provincia && c.provincia.toLowerCase().includes('sanchez')).length,
      casosConFecha20250809Filtrados: filteredCases.filter(c => c.fecha && c.fecha.includes('2025-08-09')).length,
      casosConFecha982025Filtrados: filteredCases.filter(c => c.fecha && c.fecha.includes('9/8/2025')).length,
      casosSanchezConFecha9AugFiltrados: filteredCases.filter(c => 
        c.provincia && c.provincia.toLowerCase().includes('sanchez') && 
        c.fecha && c.fecha.includes('9/8/2025')
      ).length,
      operativosFiltrados: filteredCases.filter(c => c.tipoActividad && c.tipoActividad.toLowerCase().includes('operativo')).length,
      patrullasFiltradas: filteredCases.filter(c => c.tipoActividad && c.tipoActividad.toLowerCase().includes('patrulla')).length
    });
    
    return filteredCases;
  }

  // Obtener opciones únicas para filtros
  getFilterOptions(cases: EnvironmentalCase[]) {
    const provincias = [...new Set(cases.map(c => c.provincia).filter(p => p))].sort();
    const tiposActividad = [...new Set(cases.map(c => c.tipoActividad).filter(t => t))].sort();
    
    // Obtener todas las áreas temáticas directamente de los datos (valores exactos de la columna)
    const areasTemáticas = [...new Set(cases.map(c => c.areaTemática).filter(a => a && a.trim() !== ''))].sort();
    
    const localidades = [...new Set(cases.map(c => c.localidad).filter(l => l))].sort();

    return {
      provincias,
      tiposActividad,
      areasTemáticas,
      localidades
    };
  }

  // Análisis para gráficos específicos
  getOperativesByWeek(cases: EnvironmentalCase[]): any[] {
    const weeklyData = new Map<string, number>();
    
    cases.forEach(envCase => {
      if (!envCase.fecha) return;
      
      const date = new Date(envCase.fecha);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      
      weeklyData.set(weekKey, (weeklyData.get(weekKey) || 0) + 1);
    });

    return Array.from(weeklyData.entries())
      .map(([week, count]) => ({
        week: new Date(week).toLocaleDateString('es-ES'),
        operativos: count
      }))
      .sort((a, b) => new Date(a.week).getTime() - new Date(b.week).getTime());
  }

  getIncautacionesByType(cases: EnvironmentalCase[]): any[] {
    const incautacionCount = new Map<string, number>();
    
    cases.forEach(envCase => {
      // Usar incautacionesInfo si está disponible (más preciso)
      if (envCase.incautacionesInfo && envCase.incautacionesInfo.length > 0) {
        envCase.incautacionesInfo.forEach((info: any) => {
          const cantidad = parseInt(info.cantidad) || 1;
          let tipo = info.tipo.trim().toLowerCase();
          
          // Capitalizar primera letra
          tipo = tipo.charAt(0).toUpperCase() + tipo.slice(1);
          
          if (tipo && tipo.length > 0) {
            const cantidadAnterior = incautacionCount.get(tipo) || 0;
            const nuevaCantidad = cantidadAnterior + cantidad;
            incautacionCount.set(tipo, nuevaCantidad);
          }
        });
      } else {
        // Fallback: parsear las strings de incautaciones
        envCase.incautaciones.forEach(incautacion => {
          // Extraer cantidad (números al inicio)
          const cantidadMatch = incautacion.match(/^(\d+)\s*/);
          const cantidad = cantidadMatch ? parseInt(cantidadMatch[1]) : 1;
          
          // Limpiar el formato de incautación
          let tipo = incautacion
            .replace(/^CASO-\d{8}-\d{6}-\w+\s+/i, '')
            .replace(/^\d+\s*/, '')
            .replace(/\s+CASO\d+.*$/i, '')
            .replace(/\s+caso\s+\d+.*$/i, '')
            .trim()
            .toLowerCase();
          
          // Capitalizar primera letra
          tipo = tipo.charAt(0).toUpperCase() + tipo.slice(1);
          
          if (tipo && tipo.length > 0) {
            const cantidadAnterior = incautacionCount.get(tipo) || 0;
            const nuevaCantidad = cantidadAnterior + cantidad;
            incautacionCount.set(tipo, nuevaCantidad);
          }
        });
      }
    });


    return Array.from(incautacionCount.entries())
      .map(([tipo, cantidad]) => ({ tipo, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 10); // Top 10
  }

  getDetenidosByNationality(cases: EnvironmentalCase[]): any[] {
    const nationalityCount = new Map<string, number>();
    
    cases.forEach(envCase => {
      if (envCase.detenidosInfo) {
        envCase.detenidosInfo.forEach((detenido: any) => {
          const nacionalidad = detenido.nacionalidad || 'No especificada';
          nationalityCount.set(nacionalidad, (nationalityCount.get(nacionalidad) || 0) + 1);
        });
      }
    });

    return Array.from(nationalityCount.entries())
      .map(([nacionalidad, cantidad]) => ({ nacionalidad, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad);
  }
  
  generateTablaResumenAreasTematicas(cases: EnvironmentalCase[]): any[] {
    // Definir códigos de color para cada categoría de fila
    const coloresPorCategoria: Record<string, {backgroundColor: string, borderColor: string, textColor: string}> = {
      'Patrullas': {
        backgroundColor: '#E3F2FD',  // Azul claro
        borderColor: '#1976D2',     // Azul
        textColor: '#0D47A1'        // Azul oscuro
      },
      'Operativos': {
        backgroundColor: '#E8F5E8',  // Verde claro
        borderColor: '#388E3C',     // Verde
        textColor: '#1B5E20'        // Verde oscuro
      },
      'Detenidos': {
        backgroundColor: '#FFF3E0',  // Naranja claro
        borderColor: '#F57C00',     // Naranja
        textColor: '#E65100'        // Naranja oscuro
      },
      'Vehículos Retenidos': {
        backgroundColor: '#FCE4EC',  // Rosa claro
        borderColor: '#C2185B',     // Rosa
        textColor: '#880E4F'        // Rosa oscuro
      }
    };
    
    // Definir mapeo flexible de áreas temáticas
    const areasMapping = {
      'Suelos y Aguas': ['suelos', 'aguas', 'agua', 'suelo', 'hidrico', 'hidrica', 'recurso hidrico', 'recursos hidricos', 'contaminacion', 'contaminación'],
      'Recursos Forestales': ['forestales', 'forestal', 'bosque', 'arboles', 'madera', 'flora', 'deforestacion', 'deforestación'],
      'Areas Protegida': ['protegida', 'protegidas', 'area protegida', 'areas protegidas', 'parque', 'reserva', 'patrimonio'],
      'Gestion Ambiental': ['gestion', 'gestión', 'ambiental', 'gestion ambiental', 'gestión ambiental', 'impacto ambiental'],
      'Costeros y Marinos': ['costeros', 'marinos', 'marino', 'costero', 'costa', 'mar', 'playa', 'litoral', 'oceanico', 'oceánico']
    };
    
    // Función para verificar si un área coincide con alguna categoría
    const findMatchingCategory = (areaTexto: string) => {
      if (!areaTexto) return null;
      const areaLower = areaTexto.toLowerCase().trim();
      
      for (const [categoria, keywords] of Object.entries(areasMapping)) {
        if (keywords.some(keyword => areaLower.includes(keyword))) {
          return categoria;
        }
      }
      return null;
    };
    
    // Obtener todas las regiones únicas, excluyendo "Areas Protegida" que no es una región válida
    const regionesRaw = [...new Set(cases.map(c => c.region).filter(r => 
      r && r.trim() !== '' && r.toLowerCase() !== 'areas protegida'
    ))];
    
    // Ordenar las regiones numéricamente
    const regiones = regionesRaw.sort((a, b) => {
      // Extraer números de las regiones para ordenamiento correcto
      const getNumeroRegion = (region: string) => {
        const match = region.match(/(\d+)/);
        return match ? parseInt(match[1], 10) : 999;
      };
      
      const numA = getNumeroRegion(a);
      const numB = getNumeroRegion(b);
      
      // Si ambos tienen números, ordenar por número
      if (numA !== 999 && numB !== 999) {
        return numA - numB;
      }
      
      // Si solo uno tiene número, el que tiene número va primero
      if (numA !== 999) return -1;
      if (numB !== 999) return 1;
      
      // Si ninguno tiene número, ordenar alfabéticamente
      return a.localeCompare(b);
    });
    
    // Crear estructura de datos para la tabla
    const categorias = ['Patrullas', 'Operativos', 'Detenidos', 'Vehículos Retenidos'];
    const areasObjetivo = ['Suelos y Aguas', 'Recursos Forestales', 'Areas Protegida', 'Gestion Ambiental', 'Costeros y Marinos'];
    const tablaData: any[] = [];
    
    // Para cada categoría y cada área temática objetivo, crear una fila
    categorias.forEach(categoria => {
      areasObjetivo.forEach(areaObjetivo => {
        const filaData: any = {
          categoria: categoria,
          areaTematica: areaObjetivo,
          regiones: {},
          // Añadir información de colores para esta categoría
          colores: coloresPorCategoria[categoria] || {
            backgroundColor: '#F5F5F5',
            borderColor: '#BDBDBD',
            textColor: '#424242'
          }
        };
        
        // Calcular datos para cada región
        let totalFila = 0;
        regiones.forEach(region => {
          let totalRegion = 0;
          
          switch (categoria) {
            case 'Patrullas':
              // Filtrar casos que sean patrullas AND del área temática AND de la región
              const patrullasCasos = cases.filter(c => {
                const esPatrulla = c.tipoActividad && c.tipoActividad.toLowerCase().includes('patrulla');
                const categoriaDelCaso = findMatchingCategory(c.areaTemática);
                const esAreaCorrecta = categoriaDelCaso === areaObjetivo;
                const esRegionCorrecta = c.region === region;
                
                return esPatrulla && esAreaCorrecta && esRegionCorrecta;
              });
              totalRegion = patrullasCasos.length;
              break;
              
            case 'Operativos':
              // Filtrar casos que sean operativos AND del área temática AND de la región
              const operativosCasos = cases.filter(c => {
                const esOperativo = c.tipoActividad && c.tipoActividad.toLowerCase().includes('operativo');
                const categoriaDelCaso = findMatchingCategory(c.areaTemática);
                const esAreaCorrecta = categoriaDelCaso === areaObjetivo;
                const esRegionCorrecta = c.region === region;
                
                return esOperativo && esAreaCorrecta && esRegionCorrecta;
              });
              totalRegion = operativosCasos.length;
              break;
              
            case 'Detenidos':
              // Para detenidos, primero filtrar por área temática y región, luego contar detenidos
              const casosAreaRegion = cases.filter(c => {
                const categoriaDelCaso = findMatchingCategory(c.areaTemática);
                const esAreaCorrecta = categoriaDelCaso === areaObjetivo;
                const esRegionCorrecta = c.region === region;
                
                return esAreaCorrecta && esRegionCorrecta;
              });
              totalRegion = casosAreaRegion.reduce((sum, c) => sum + (c.detenidos || 0), 0);
              break;
              
            case 'Vehículos Retenidos':
              // Para vehículos, primero filtrar por área temática y región, luego contar vehículos
              const casosAreaRegionVehiculos = cases.filter(c => {
                const categoriaDelCaso = findMatchingCategory(c.areaTemática);
                const esAreaCorrecta = categoriaDelCaso === areaObjetivo;
                const esRegionCorrecta = c.region === region;
                
                return esAreaCorrecta && esRegionCorrecta;
              });
              totalRegion = casosAreaRegionVehiculos.reduce((sum, c) => sum + (c.vehiculosDetenidos || 0), 0);
              break;
          }
          
          filaData.regiones[region] = totalRegion;
          totalFila += totalRegion;
        });
        
        filaData.total = totalFila;
        
        // Agregar TODAS las filas, incluso si no tienen datos (mostrar 0s)
        tablaData.push(filaData);
      });
    });
    
    return tablaData;
  }

  getVehiclesByType(cases: EnvironmentalCase[]): any[] {
    const vehicleCount = new Map<string, number>();
    
    cases.forEach(envCase => {
      if (envCase.vehiculosInfo) {
        envCase.vehiculosInfo.forEach((vehiculo: any) => {
          const tipo = vehiculo.tipo || 'No especificado';
          vehicleCount.set(tipo, (vehicleCount.get(tipo) || 0) + 1);
        });
      }
    });

    const total = Array.from(vehicleCount.values()).reduce((sum, count) => sum + count, 0);
    
    return Array.from(vehicleCount.entries())
      .map(([tipo, cantidad]) => ({ 
        tipo, 
        cantidad, 
        porcentaje: Math.round((cantidad / total) * 100) 
      }))
      .sort((a, b) => b.cantidad - a.cantidad);
  }

  // CRUD operations for cases
  updateCase(updatedCase: EnvironmentalCase): void {
    console.log('🔄 Analytics: Updating case in memory:', updatedCase.numeroCaso);
    this.cases.set(updatedCase.numeroCaso, updatedCase);
  }

  deleteCase(caseId: string): boolean {
    console.log('🗑️ Analytics: Deleting case from memory:', caseId);
    return this.cases.delete(caseId);
  }

  addCase(newCase: EnvironmentalCase): void {
    console.log('➕ Analytics: Adding case to memory:', newCase.numeroCaso);
    this.cases.set(newCase.numeroCaso, newCase);
  }

  validateCase(envCase: EnvironmentalCase): string[] {
    const errors: string[] = [];
    
    // Validaciones básicas
    if (!envCase.numeroCaso || envCase.numeroCaso.trim() === '') {
      errors.push('Número de caso es requerido');
    } else {
      // Validar formato de numeroCaso
      const numeroPattern = /^[A-Z0-9\-]+$/i;
      if (!numeroPattern.test(envCase.numeroCaso.trim())) {
        errors.push('Número de caso tiene formato inválido');
      }
    }
    
    if (!envCase.fecha || envCase.fecha.trim() === '') {
      errors.push('Fecha es requerida');
    } else {
      // Validar que la fecha sea parseable
      const parsedDate = parseDate(envCase.fecha);
      if (!parsedDate) {
        errors.push(`Fecha inválida: ${envCase.fecha}`);
      }
    }
    
    // Validaciones de tipos de datos
    if (typeof envCase.detenidos !== 'number' || envCase.detenidos < 0) {
      errors.push('Detenidos debe ser un número válido mayor o igual a 0');
    }
    
    if (typeof envCase.vehiculosDetenidos !== 'number' || envCase.vehiculosDetenidos < 0) {
      errors.push('Vehículos detenidos debe ser un número válido mayor o igual a 0');
    }
    
    if (typeof envCase.notificados !== 'string') {
      errors.push('Notificados debe ser texto válido');
    }
    
    if (typeof envCase.procuraduria !== 'string') {
      errors.push('Procuraduría debe ser un valor válido (SI/NO)');
    } else if (envCase.procuraduria !== 'SI' && envCase.procuraduria !== 'NO') {
      errors.push('Procuraduría debe ser "SI" o "NO"');
    }
    
    // Validaciones de consistencia
    if (envCase.incautaciones && Array.isArray(envCase.incautaciones)) {
      if (envCase.incautaciones.length > 0 && envCase.detenidos === 0 && envCase.vehiculosDetenidos === 0) {
        console.warn(`⚠️ Caso ${envCase.numeroCaso}: Tiene incautaciones pero no detenidos ni vehículos`);
      }
    }
    
    return errors;
  }

  // Función para validar integridad de datos entre tablas relacionadas
  validateDataIntegrity(sheetsData: SheetData[]): { 
    errors: string[], 
    warnings: string[], 
    stats: any 
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const stats = {
      totalCases: 0,
      casesWithIssues: 0,
      duplicatedCaseNumbers: [] as string[],
      orphanedRecords: [] as string[],
      missingDates: 0,
      invalidDates: 0,
      tablesAnalyzed: sheetsData.length
    };

    if (!sheetsData || sheetsData.length === 0) {
      errors.push('No hay datos para validar');
      return { errors, warnings, stats };
    }

    // Mapas para rastrear casos y registros relacionados
    const caseNumbers = new Set<string>();
    const caseCountPerTable: { [tableName: string]: number } = {};
    const duplicates = new Map<string, number>();

    sheetsData.forEach((sheet) => {
      if (sheet.data.length <= 1) {
        warnings.push(`Tabla "${sheet.name}" está vacía o solo tiene headers`);
        return;
      }
      
      const headers = sheet.data[0] as string[];
      const rows = sheet.data.slice(1);
      
      caseCountPerTable[sheet.name] = rows.length;
      
      // Encontrar columna numerocaso
      const numeroCasoCol = headers.findIndex(h => 
        h.toLowerCase().includes('numerocaso') || 
        h.toLowerCase().includes('numero_caso') ||
        h.toLowerCase().includes('caso')
      );
      
      const fechaCol = headers.findIndex(h => h.toLowerCase().includes('fecha'));
      
      if (numeroCasoCol === -1) {
        warnings.push(`Tabla "${sheet.name}" no tiene columna numeroCaso`);
        return;
      }
      
      rows.forEach((row, rowIndex) => {
        const numeroCaso = String(row[numeroCasoCol] || '').trim();
        const fecha = fechaCol >= 0 ? String(row[fechaCol] || '').trim() : '';
        
        if (!numeroCaso) {
          warnings.push(`Tabla "${sheet.name}", fila ${rowIndex + 2}: numeroCaso vacío`);
          return;
        }
        
        // Contar casos totales
        stats.totalCases++;
        
        // Verificar duplicados
        if (duplicates.has(numeroCaso)) {
          duplicates.set(numeroCaso, duplicates.get(numeroCaso)! + 1);
        } else {
          duplicates.set(numeroCaso, 1);
        }
        
        caseNumbers.add(numeroCaso);
        
        // Validar fechas
        if (!fecha) {
          stats.missingDates++;
        } else {
          const parsedDate = parseDate(fecha);
          if (!parsedDate) {
            stats.invalidDates++;
            warnings.push(`Tabla "${sheet.name}", fila ${rowIndex + 2}: Fecha inválida "${fecha}"`);
          }
        }
      });
    });

    // Identificar duplicados
    duplicates.forEach((count, numeroCaso) => {
      if (count > 1) {
        stats.duplicatedCaseNumbers.push(numeroCaso);
        warnings.push(`Número de caso duplicado: ${numeroCaso} (${count} veces)`);
      }
    });

    // Estadísticas finales
    stats.casesWithIssues = stats.duplicatedCaseNumbers.length + stats.missingDates + stats.invalidDates;
    
    // Log de resumen
    console.log('🔍 Validación de integridad de datos:', {
      tablas: Object.keys(caseCountPerTable),
      registrosPorTabla: caseCountPerTable,
      casosUnicos: caseNumbers.size,
      duplicados: stats.duplicatedCaseNumbers.length,
      fechasInvalidas: stats.invalidDates,
      fechasFaltantes: stats.missingDates
    });

    return { errors, warnings, stats };
  }

  // Debug helper para analizar un caso específico
  debugCase(numeroCaso: string): any {
    const caseData = this.cases.get(numeroCaso);
    
    if (!caseData) {
      console.warn(`🔍 Debug: Caso ${numeroCaso} no encontrado`);
      return null;
    }

    console.group(`🔍 Debug Caso: ${numeroCaso}`);
    console.log('Datos completos:', caseData);
    console.log('Validaciones:', this.validateCase(caseData));
    console.log('Fecha parseada:', parseDate(caseData.fecha));
    console.log('Coordenadas:', caseData.coordenadas);
    console.log('Detenidos info:', caseData.detenidosInfo);
    console.log('Vehículos info:', caseData.vehiculosInfo);
    console.log('Incautaciones info:', caseData.incautacionesInfo);
    console.groupEnd();
    
    return caseData;
  }
}

export default EnvironmentalAnalyticsService;