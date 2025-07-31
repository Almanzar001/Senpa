import { type SheetData } from './googleSheets';

export interface EnvironmentalCase {
  numeroCaso: string;
  fecha: string;
  hora: string;
  provincia: string;
  localidad: string;
  tipoActividad: string;
  areaTemática: string;
  detenidos: number;
  vehiculosDetenidos: number;
  incautaciones: string[];
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
}

export interface EnvironmentalFilters {
  dateFrom: string;
  dateTo: string;
  provincia: string[];
  division: string[];
  tipoActividad: string[];
  areaTemática: string[];
  searchText: string;
}

class EnvironmentalAnalyticsService {
  private cases: Map<string, EnvironmentalCase> = new Map();

  constructor() {
    this.cases = new Map();
  }

  // Analizar y combinar datos de todas las hojas usando numeroCaso
  analyzeSheetsData(sheetsData: SheetData[]): EnvironmentalCase[] {
    this.cases.clear();
    console.log('🔍 Analizando hojas:', sheetsData.map(s => s.name));
    console.log('🔍 Total hojas recibidas:', sheetsData.length);
    sheetsData.forEach((sheet, index) => {
      console.log(`   Hoja ${index + 1}: "${sheet.name}" con ${sheet.data.length} filas`);
    });

    sheetsData.forEach(sheet => {
      if (sheet.data.length <= 1) return;
      
      console.log(`📋 Procesando hoja: ${sheet.name}`);
      console.log(`🔍 Nombre en minúsculas: "${sheet.name.toLowerCase()}"`);
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
        h.toLowerCase().includes('provincia') || 
        h.toLowerCase().includes('region')
      );
      const localidadCol = headers.findIndex(h => 
        h.toLowerCase().includes('localidad') || 
        h.toLowerCase().includes('municipio') ||
        h.toLowerCase().includes('ubicacion')
      );
      const tipoActividadCol = headers.findIndex(h => 
        h.toLowerCase().includes('tipo') && 
        (h.toLowerCase().includes('actividad') || h.toLowerCase().includes('operacion'))
      );
      const areaTemáticaCol = headers.findIndex(h => 
        h.toLowerCase().includes('area') && h.toLowerCase().includes('tematica')
      );

      rows.forEach(row => {
        const numeroCaso = String(row[numeroCasoCol] || '').trim();
        if (!numeroCaso) return;

        // Obtener o crear el caso
        let envCase = this.cases.get(numeroCaso);
        if (!envCase) {
          envCase = {
            numeroCaso,
            fecha: fechaCol >= 0 ? String(row[fechaCol] || '') : '',
            hora: horaCol >= 0 ? String(row[horaCol] || '') : '',
            provincia: provinciaCol >= 0 ? String(row[provinciaCol] || '') : '',
            localidad: localidadCol >= 0 ? String(row[localidadCol] || '') : '',
            tipoActividad: tipoActividadCol >= 0 ? String(row[tipoActividadCol] || '') : '',
            areaTemática: areaTemáticaCol >= 0 ? String(row[areaTemáticaCol] || '') : '',
            detenidos: 0,
            vehiculosDetenidos: 0,
            incautaciones: []
          };
          this.cases.set(numeroCaso, envCase);
        }

        // Analizar datos específicos por tipo de hoja
        this.analyzeSheetSpecificData(sheet.name, headers, row, envCase);
      });
    });

    const finalCases = Array.from(this.cases.values());
    console.log('📋 Casos finales creados:', finalCases.length);
    console.log('🔍 DIAGNÓSTICO DETALLADO DE CASOS:');
    
    // Resumen detallado de casos
    let totalIncautaciones = 0;
    let casosConFecha = 0;
    let casosSinFecha = 0;
    let casosConAreaTematica = 0;
    let casosSinAreaTematica = 0;
    
    finalCases.forEach((c, index) => {
      totalIncautaciones += c.incautaciones.length;
      
      // Contar casos con/sin fecha
      if (c.fecha && c.fecha.trim()) {
        casosConFecha++;
      } else {
        casosSinFecha++;
        console.log(`⚠️ Caso SIN FECHA: ${c.numeroCaso}`);
      }
      
      // Contar casos con/sin área temática
      if (c.areaTemática && c.areaTemática.trim()) {
        casosConAreaTematica++;
      } else {
        casosSinAreaTematica++;
        console.log(`⚠️ Caso SIN ÁREA TEMÁTICA: ${c.numeroCaso}`);
      }
      
      console.log(`📝 Caso ${index + 1}/${finalCases.length}: ${c.numeroCaso}`);
      console.log(`   📅 Fecha: "${c.fecha}"`);
      console.log(`   🌿 Área: "${c.areaTemática}"`);
      console.log(`   📍 Localidad: "${c.localidad}"`);
      console.log(`   👥 Detenidos: ${c.detenidos}, 🚗 Vehículos: ${c.vehiculosDetenidos}, 📦 Incautaciones: ${c.incautaciones.length}`);
      if (c.incautaciones.length > 0) {
        console.log(`   → Incautaciones: ${c.incautaciones.join(', ')}`);
      }
      console.log('   ───────────────────────────');
    });
    
    console.log(`📊 RESUMEN TOTAL:`);
    console.log(`   📋 Total casos: ${finalCases.length}`);
    console.log(`   📅 Con fecha: ${casosConFecha}`);
    console.log(`   ❌ Sin fecha: ${casosSinFecha}`);
    console.log(`   🌿 Con área temática: ${casosConAreaTematica}`);
    console.log(`   ❌ Sin área temática: ${casosSinAreaTematica}`);
    console.log(`   📦 Total incautaciones: ${totalIncautaciones}`);
    
    return finalCases;
  }

  private analyzeSheetSpecificData(sheetName: string, headers: string[], row: any[], envCase: EnvironmentalCase) {
    const sheetNameLower = sheetName.toLowerCase();
    console.log(`🔍 analyzeSheetSpecificData - Hoja: "${sheetName}" (lower: "${sheetNameLower}")`);

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
      
      console.log(`🔍 Analizando incautaciones en hoja: ${sheetName}`);
      console.log(`📝 Headers disponibles: ${headers.join(', ')}`);
      
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
      
      console.log(`📊 Columnas encontradas - Tipo: ${tipoIncautacionCol} (${headers[tipoIncautacionCol]}), Cantidad: ${cantidadCol} (${cantidadCol >= 0 ? headers[cantidadCol] : 'N/A'})`);
      console.log(`📋 Fila de datos: ${row.join(', ')}`);
      
      if (tipoIncautacionCol >= 0 && row[tipoIncautacionCol]) {
        const tipoIncautacion = String(row[tipoIncautacionCol] || '').trim();
        const cantidad = cantidadCol >= 0 ? String(row[cantidadCol] || '1').trim() : '1';
        
        if (tipoIncautacion) {  // Solo agregar si hay un tipo válido
          console.log(`✅ Agregando incautación: ${cantidad} ${tipoIncautacion} al caso ${envCase.numeroCaso}`);
          
          envCase.incautaciones.push(`${cantidad} ${tipoIncautacion}`);
          if (!envCase.incautacionesInfo) envCase.incautacionesInfo = [];
          envCase.incautacionesInfo.push({
            tipo: tipoIncautacion,
            cantidad: cantidad
          });
        } else {
          console.log(`⚠️ Tipo de incautación vacío para caso ${envCase.numeroCaso}`);
        }
      } else {
        console.log(`⚠️ No se encontró columna de tipo de incautación o fila vacía en ${sheetName}`);
      }
    }

    // Análisis de ubicación/coordenadas
    if (sheetNameLower.includes('ubicacion') || sheetNameLower.includes('coordenada')) {
      const latCol = headers.findIndex(h => h.toLowerCase().includes('lat'));
      const lngCol = headers.findIndex(h => h.toLowerCase().includes('lng') || h.toLowerCase().includes('lon'));
      
      if (latCol >= 0 && lngCol >= 0 && row[latCol] && row[lngCol]) {
        envCase.coordenadas = {
          lat: parseFloat(String(row[latCol])) || 0,
          lng: parseFloat(String(row[lngCol])) || 0
        };
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

    return {
      operativosRealizados,
      patrullas,
      detenidos,
      vehiculosDetenidos,
      incautaciones,
      areasIntervenidas
    };
  }

  // Aplicar filtros a los casos
  applyFilters(cases: EnvironmentalCase[], filters?: EnvironmentalFilters): EnvironmentalCase[] {
    if (!filters) return cases;

    return cases.filter(envCase => {
      // Filtro de fecha
      if (filters.dateFrom || filters.dateTo) {
        const caseDate = envCase.fecha ? new Date(envCase.fecha) : null;
        if (caseDate) {
          if (filters.dateFrom && caseDate < new Date(filters.dateFrom)) return false;
          if (filters.dateTo && caseDate > new Date(filters.dateTo)) return false;
        }
      }

      // Filtro de provincia
      if (filters.provincia && filters.provincia.length > 0) {
        const matchesProvincia = filters.provincia.some(p =>
          envCase.provincia.toLowerCase().includes(p.toLowerCase())
        );
        if (!matchesProvincia) return false;
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
        
        if (!searchableText.includes(searchLower)) return false;
      }

      return true;
    });
  }

  // Obtener opciones únicas para filtros
  getFilterOptions(cases: EnvironmentalCase[]) {
    const provincias = [...new Set(cases.map(c => c.provincia).filter(p => p))].sort();
    const tiposActividad = [...new Set(cases.map(c => c.tipoActividad).filter(t => t))].sort();
    const areasTemáticas = [...new Set(cases.map(c => c.areaTemática).filter(a => a))].sort();
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
    
    console.log('🔍 Analizando incautaciones para gráfico (sumando cantidades reales):');
    cases.forEach(envCase => {
      console.log(`📝 Caso ${envCase.numeroCaso}:`);
      console.log(`   📦 Incautaciones string: ${envCase.incautaciones.join(', ')}`);
      console.log(`   📊 IncautacionesInfo: ${JSON.stringify(envCase.incautacionesInfo || [])}`);
      
      // Usar incautacionesInfo si está disponible (más preciso)
      if (envCase.incautacionesInfo && envCase.incautacionesInfo.length > 0) {
        envCase.incautacionesInfo.forEach((info: any) => {
          const cantidad = parseInt(info.cantidad) || 1;
          let tipo = info.tipo.trim().toLowerCase();
          
          // Capitalizar primera letra
          tipo = tipo.charAt(0).toUpperCase() + tipo.slice(1);
          
          console.log(`✅ De incautacionesInfo - Tipo: "${tipo}" - Cantidad: ${cantidad}`);
          
          if (tipo && tipo.length > 0) {
            const cantidadAnterior = incautacionCount.get(tipo) || 0;
            const nuevaCantidad = cantidadAnterior + cantidad;
            incautacionCount.set(tipo, nuevaCantidad);
            console.log(`📊 "${tipo}": ${cantidadAnterior} + ${cantidad} = ${nuevaCantidad}`);
          }
        });
      } else {
        // Fallback: parsear las strings de incautaciones
        envCase.incautaciones.forEach(incautacion => {
          console.log(`📦 Fallback - Incautación original: "${incautacion}"`);
          
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
          
          console.log(`✅ Fallback - Tipo limpio: "${tipo}" - Cantidad: ${cantidad}`);
          
          if (tipo && tipo.length > 0) {
            const cantidadAnterior = incautacionCount.get(tipo) || 0;
            const nuevaCantidad = cantidadAnterior + cantidad;
            incautacionCount.set(tipo, nuevaCantidad);
            console.log(`📊 "${tipo}": ${cantidadAnterior} + ${cantidad} = ${nuevaCantidad}`);
          }
        });
      }
    });

    console.log('📊 Conteo final de incautaciones (cantidades reales sumadas):');
    Array.from(incautacionCount.entries()).forEach(([tipo, cantidad]) => {
      console.log(`   📦 ${tipo}: ${cantidad} unidades totales`);
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
}

export default EnvironmentalAnalyticsService;