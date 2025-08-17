import { type SheetData } from './supabase';

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
  notificados: number;
  procuraduria: boolean;
  resultado?: string;
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

export interface EnvironmentalFilters {
  dateFrom: string;
  dateTo: string;
  provincia: string[];
  division: string[];
  region: string[];
  tipoActividad: string[];
  areaTemática: string[];
  searchText: string;
  activeDateFilter?: string; // ID del filtro de fecha activo
}

class EnvironmentalAnalyticsService {
  private cases: Map<string, EnvironmentalCase> = new Map();

  constructor() {
    this.cases = new Map();
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
      
      // Encontrar columnas importantes
      const numeroCasoCol = headers.findIndex(h => 
        h.toLowerCase().includes('numerocaso') || 
        h.toLowerCase().includes('numero_caso') ||
        h.toLowerCase().includes('caso')
      );
      
      if (numeroCasoCol === -1) return; // Skip sheets without numeroCaso
      
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
            notificados: notificadosCol >= 0 && row[notificadosCol] && String(row[notificadosCol]).trim() ? 1 : 0,
            procuraduria: procuraduriaCol >= 0 ? String(row[procuraduriaCol] || '').toLowerCase() === 'si' : false
          };
          this.cases.set(numeroCaso, envCase);
          casosEncontradosEnEstaHoja++;
          
        } else {
          // Actualizar campos si encontramos nuevos datos
          if (notificadosCol >= 0 && row[notificadosCol] && String(row[notificadosCol]).trim()) {
            // Si ya tenía notificados, mantener 1, si no tenía, ahora tiene 1
            envCase.notificados = 1;
          }
          
          if (procuraduriaCol >= 0 && row[procuraduriaCol]) {
            const procuraduriaValue = String(row[procuraduriaCol] || '').toLowerCase() === 'si';
            if (procuraduriaValue) {
              envCase.procuraduria = true;
            }
          }
        }

        // Analizar datos específicos por tipo de hoja
        this.analyzeSheetSpecificData(sheet.name, headers, row, envCase);
      });
      
    });

    const finalCases = Array.from(this.cases.values());
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
        // Solo marcar que este caso tiene notificados (1 o 0)
        envCase.notificados = 1;
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
      const tipoVehiculoCol = headers.findIndex(h => 
        h.toLowerCase().includes('tipo') || 
        h.toLowerCase().includes('vehiculo') ||
        h.toLowerCase().includes('modelo')
      );
      const placaCol = headers.findIndex(h => h.toLowerCase().includes('placa'));
      
      if (tipoVehiculoCol >= 0 && row[tipoVehiculoCol]) {
        envCase.vehiculosDetenidos++;
        if (!envCase.vehiculosInfo) envCase.vehiculosInfo = [];
        envCase.vehiculosInfo.push({
          tipo: String(row[tipoVehiculoCol] || ''),
          placa: placaCol >= 0 ? String(row[placaCol] || '') : ''
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

    const notificados = filteredCases.reduce((total, c) => total + c.notificados, 0);
    
    const procuraduria = filteredCases.filter(c => c.procuraduria).length;
    
    
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

  // Aplicar filtros a los casos
  applyFilters(cases: EnvironmentalCase[], filters?: EnvironmentalFilters): EnvironmentalCase[] {
    if (!filters) {
      return cases;
    }

    const filteredCases = cases.filter(envCase => {
      // Filtro de fecha
      if (filters.dateFrom || filters.dateTo) {
        let caseDate: Date | null = null;
        
        if (envCase.fecha) {
          const dateStr = envCase.fecha.trim();
          
          // Try to parse the date in multiple formats
          // Format 1: YYYY-MM-DD (ISO format)
          if (dateStr.match(/^\d{4}-\d{1,2}-\d{1,2}/)) {
            // Handle YYYY-MM-DD format, ensuring it's parsed as local time
            // by constructing date from parts. This avoids timezone issues.
            const dateOnly = dateStr.substring(0, 10);
            const parts = dateOnly.split('-');
            if (parts.length === 3) {
              const year = parseInt(parts[0], 10);
              const month = parseInt(parts[1], 10);
              const day = parseInt(parts[2], 10);
              if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
                caseDate = new Date(year, month - 1, day);
              }
            }
          }
          // Format 2: DD/MM/YYYY, DD/M/YYYY, D/MM/YYYY, D/M/YYYY, DD-MM-YYYY, etc.
          else if (dateStr.match(/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/)) {
            const parts = dateStr.split(/[\/\-]/);
            if (parts.length === 3) {
              const day = parseInt(parts[0], 10);
              const month = parseInt(parts[1], 10);
              const year = parseInt(parts[2], 10);
              if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
                // Constructing date from parts ensures it's in local timezone
                caseDate = new Date(year, month - 1, day);
              }
            }
          }
          // Format 3: Try direct parsing as fallback
          if (!caseDate || isNaN(caseDate.getTime())) {
            // Fallback: For 'YYYY-MM-DD', replace '-' with '/' to encourage local time parsing
            const localDateStr = dateStr.match(/^\d{4}-\d{1,2}-\d{1,2}$/)
              ? dateStr.replace(/-/g, '/')
              : dateStr;
            const testDate = new Date(localDateStr);
            if (!isNaN(testDate.getTime())) {
              caseDate = testDate;
            }
          }
        }
        
        if (caseDate && !isNaN(caseDate.getTime())) {
          // Ensure filter dates are parsed in local timezone correctly
          const filterFromDate = filters.dateFrom ? new Date(`${filters.dateFrom}T00:00:00`) : null;
          const filterToDate = filters.dateTo ? new Date(`${filters.dateTo}T23:59:59.999`) : null;

          // Normalize caseDate to the start of its day for consistent comparison
          caseDate.setHours(0, 0, 0, 0);

          if (filterFromDate && caseDate < filterFromDate) {
            return false;
          }
          if (filterToDate && caseDate > filterToDate) {
            return false;
          }
        } else if (filters.dateFrom || filters.dateTo) {
          return false; // Exclude cases without valid dates when date filter is active
        }
      }

      // Filtro de provincia
      if (filters.provincia && filters.provincia.length > 0) {
        const matchesProvincia = filters.provincia.some(p =>
          envCase.provincia.toLowerCase().includes(p.toLowerCase())
        );
        if (!matchesProvincia) return false;
      }

      // Filtro de región
      if (filters.region && filters.region.length > 0) {
        const matchesRegion = filters.region.some(r =>
          envCase.region && envCase.region.toLowerCase().includes(r.toLowerCase())
        );
        
        if (!matchesRegion) {
          return false;
        }
      }

      // Filtro de tipo de actividad
      if (filters.tipoActividad && filters.tipoActividad.length > 0) {
        const matchesTipo = filters.tipoActividad.some(t =>
          envCase.tipoActividad.toLowerCase().includes(t.toLowerCase())
        );
        if (!matchesTipo) return false;
      }

      // Filtro de área temática
      if (filters.areaTemática && filters.areaTemática.length > 0) {
        const matchesArea = filters.areaTemática.some(a =>
          envCase.areaTemática.toLowerCase().includes(a.toLowerCase())
        );
        if (!matchesArea) return false;
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
          return false;
        }
      }

      return true;
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

  // CRUD Operations for cases
  updateCase(updatedCase: EnvironmentalCase): EnvironmentalCase {
    // Validate required fields
    if (!updatedCase.numeroCaso) {
      throw new Error('Número de caso es requerido');
    }

    // Update the case in the internal map
    this.cases.set(updatedCase.numeroCaso, updatedCase);
    
    return updatedCase;
  }

  deleteCase(caseId: string): boolean {
    if (!caseId) {
      throw new Error('ID de caso es requerido');
    }

    return this.cases.delete(caseId);
  }

  addCase(newCase: EnvironmentalCase): EnvironmentalCase {
    // Validate required fields
    if (!newCase.numeroCaso) {
      throw new Error('Número de caso es requerido');
    }

    if (this.cases.has(newCase.numeroCaso)) {
      throw new Error('Ya existe un caso con este número');
    }

    // Set default values for missing fields
    const caseWithDefaults: EnvironmentalCase = {
      ...newCase,
      numeroCaso: newCase.numeroCaso,
      fecha: newCase.fecha || '',
      hora: newCase.hora || '',
      provincia: newCase.provincia || '',
      localidad: newCase.localidad || '',
      region: newCase.region || '',
      tipoActividad: newCase.tipoActividad || '',
      areaTemática: newCase.areaTemática || '',
      detenidos: newCase.detenidos || 0,
      vehiculosDetenidos: newCase.vehiculosDetenidos || 0,
      incautaciones: newCase.incautaciones || [],
      notificados: newCase.notificados || 0,
      procuraduria: newCase.procuraduria || false
    };

    this.cases.set(newCase.numeroCaso, caseWithDefaults);
    return caseWithDefaults;
  }

  // Validation helpers
  validateCase(envCase: Partial<EnvironmentalCase>): string[] {
    const errors: string[] = [];

    if (!envCase.numeroCaso || envCase.numeroCaso.trim() === '') {
      errors.push('Número de caso es requerido');
    }

    if (envCase.fecha && !this.isValidDate(envCase.fecha)) {
      errors.push('Formato de fecha inválido');
    }

    if (envCase.detenidos !== undefined && envCase.detenidos < 0) {
      errors.push('Número de detenidos no puede ser negativo');
    }

    if (envCase.vehiculosDetenidos !== undefined && envCase.vehiculosDetenidos < 0) {
      errors.push('Número de vehículos no puede ser negativo');
    }

    if (envCase.notificados !== undefined && envCase.notificados < 0) {
      errors.push('Número de notificados no puede ser negativo');
    }

    return errors;
  }

  private isValidDate(dateString: string): boolean {
    // Check for common date formats
    const dateFormats = [
      /^\d{4}-\d{1,2}-\d{1,2}$/,  // YYYY-MM-DD
      /^\d{1,2}\/\d{1,2}\/\d{4}$/,  // DD/MM/YYYY or MM/DD/YYYY
      /^\d{1,2}-\d{1,2}-\d{4}$/,   // DD-MM-YYYY
    ];

    if (!dateFormats.some(format => format.test(dateString))) {
      return false;
    }

    const date = new Date(dateString);
    return !isNaN(date.getTime());
  }

  // Get all cases as array (useful for external access)
  getAllCases(): EnvironmentalCase[] {
    return Array.from(this.cases.values());
  }

  // Get case by ID
  getCaseById(caseId: string): EnvironmentalCase | undefined {
    return this.cases.get(caseId);
  }
}

export default EnvironmentalAnalyticsService;