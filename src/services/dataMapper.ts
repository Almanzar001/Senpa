import type { EnvironmentalCase } from './environmentalAnalytics';
import type { NotaInformativa, Detenido, Vehiculo, Incautacion } from '../types/tableTypes';

export class DataMapperService {
  // Helper method to count related records by numeroCaso
  static countRelatedRecords(cases: EnvironmentalCase[], numeroCaso: string, recordType: 'detenidos' | 'vehiculos' | 'incautaciones'): number {
    // This will be implemented when we have access to the actual table data
    // For now, we'll use the existing logic but this is where we'd query the related tables
    const relatedCase = cases.find(c => c.numeroCaso === numeroCaso);
    if (!relatedCase) return 0;
    
    switch (recordType) {
      case 'detenidos':
        return relatedCase.detenidos || 0;
      case 'vehiculos': 
        return relatedCase.vehiculosDetenidos || 0;
      case 'incautaciones':
        return relatedCase.incautaciones?.length || 0;
      default:
        return 0;
    }
  }
  
  // Mapear EnvironmentalCase a NotaInformativa con filtro opcional
  static mapToNotaInformativa(cases: EnvironmentalCase[], filterType?: string): NotaInformativa[] {
    let filteredCases = cases;
    
    // Aplicar filtros específicos según el tipo de métrica
    if (filterType) {
      switch (filterType) {
        case 'operativos':
          filteredCases = cases.filter(c => 
            c.tipoActividad && c.tipoActividad.toLowerCase().includes('operativo')
          );
          break;
        case 'patrullas':
          filteredCases = cases.filter(c => 
            c.tipoActividad && c.tipoActividad.toLowerCase().includes('patrulla')
          );
          break;
        case 'notificados':
          filteredCases = cases.filter(c => {
            const notificadosInfo = c.notificadosInfo;
            return notificadosInfo && 
                   typeof notificadosInfo === 'string' && 
                   notificadosInfo.trim() !== '';
          });
          break;
        case 'procuraduria':
          filteredCases = cases.filter(c => 
            c.procuraduria === true
          );
          break;
      }
    }
    
    return filteredCases.map(envCase => ({
      id: `nota_${envCase.numeroCaso}`,
      numeroCaso: envCase.numeroCaso,
      fecha: envCase.fecha,
      hora: envCase.hora,
      provincia: envCase.provincia,
      localidad: envCase.localidad,
      region: envCase.region,
      tipoActividad: envCase.tipoActividad,
      areaTemática: envCase.areaTemática,
      notificados: envCase.notificadosInfo || '',
      procuraduria: envCase.procuraduria,
      resultado: envCase.resultado || '',
      observaciones: '',
      coordenadas: envCase.coordenadas,
      nota: (envCase as any).nota || '',
      // Add counts for related tables
      detenidos: DataMapperService.countRelatedRecords(filteredCases, envCase.numeroCaso, 'detenidos'),
      vehiculosDetenidos: DataMapperService.countRelatedRecords(filteredCases, envCase.numeroCaso, 'vehiculos'),
      incautacionesCount: DataMapperService.countRelatedRecords(filteredCases, envCase.numeroCaso, 'incautaciones')
    }));
  }

  // Mapear EnvironmentalCase a Detenidos (expandir la info de detenidos)
  static mapToDetenidos(cases: EnvironmentalCase[]): Detenido[] {
    const detenidos: Detenido[] = [];
    
    cases.forEach(envCase => {
      if (envCase.detenidos > 0) {
        // Si hay información detallada de detenidos, usarla
        if (envCase.detenidosInfo && envCase.detenidosInfo.length > 0) {
          envCase.detenidosInfo.forEach((detenidoInfo: any, index: number) => {
            detenidos.push({
              id: `detenido_${envCase.numeroCaso}_${index}`,
              numeroCaso: envCase.numeroCaso,
              fecha: envCase.fecha,
              hora: envCase.hora,
              provincia: envCase.provincia,
              localidad: envCase.localidad,
              region: envCase.region,
              nombre: detenidoInfo.nombre || 'No especificado',
              motivoDetencion: 'Delito ambiental',
              estadoProceso: 'En proceso',
              observaciones: ''
            });
          });
        } else {
          // Si no hay info detallada, crear registros genéricos basados en el conteo
          for (let i = 0; i < envCase.detenidos; i++) {
            detenidos.push({
              id: `detenido_${envCase.numeroCaso}_${i}`,
              numeroCaso: envCase.numeroCaso,
              fecha: envCase.fecha,
              hora: envCase.hora,
              provincia: envCase.provincia,
              localidad: envCase.localidad,
              region: envCase.region,
              nombre: `Detenido ${i + 1}`,
              motivoDetencion: 'Delito ambiental',
              estadoProceso: 'En proceso',
              observaciones: `Caso: ${envCase.numeroCaso}`
            });
          }
        }
      }
    });

    return detenidos;
  }

  // Mapear EnvironmentalCase a Vehículos
  static mapToVehiculos(cases: EnvironmentalCase[]): Vehiculo[] {
    const vehiculos: Vehiculo[] = [];
    
    cases.forEach(envCase => {
      if (envCase.vehiculosDetenidos > 0) {
        // Si hay información detallada de vehículos, usarla
        if (envCase.vehiculosInfo && envCase.vehiculosInfo.length > 0) {
          envCase.vehiculosInfo.forEach((vehiculoInfo: any, index: number) => {
            vehiculos.push({
              id: `vehiculo_${envCase.numeroCaso}_${index}`,
              numeroCaso: envCase.numeroCaso,
              fecha: envCase.fecha,
              tipo: vehiculoInfo.tipo || 'No especificado',
              marca: vehiculoInfo.marca || 'No especificada',
              color: vehiculoInfo.color || 'No especificado',
              detalle: `Región: ${envCase.region}, Localidad: ${envCase.localidad}`,
              provinciaMunicipio: `${envCase.provincia} - ${envCase.localidad}`
            });
          });
        } else {
          // Si no hay info detallada, crear registros genéricos basados en el conteo
          for (let i = 0; i < envCase.vehiculosDetenidos; i++) {
            vehiculos.push({
              id: `vehiculo_${envCase.numeroCaso}_${i}`,
              numeroCaso: envCase.numeroCaso,
              fecha: envCase.fecha,
              tipo: 'Vehículo',
              marca: 'No especificada',
              color: 'No especificado',
              detalle: `Caso: ${envCase.numeroCaso}, Región: ${envCase.region}`,
              provinciaMunicipio: `${envCase.provincia} - ${envCase.localidad}`
            });
          }
        }
      }
    });

    return vehiculos;
  }

  // Mapear EnvironmentalCase a Incautaciones
  static mapToIncautaciones(cases: EnvironmentalCase[]): Incautacion[] {
    const incautaciones: Incautacion[] = [];
    
    cases.forEach(envCase => {
      if (envCase.incautaciones && envCase.incautaciones.length > 0) {
        // Si hay información detallada de incautaciones, usarla
        if (envCase.incautacionesInfo && envCase.incautacionesInfo.length > 0) {
          envCase.incautacionesInfo.forEach((incautacionInfo: any, index: number) => {
            incautaciones.push({
              id: `incautacion_${envCase.numeroCaso}_${index}`,
              numeroCaso: envCase.numeroCaso,
              fecha: envCase.fecha,
              hora: envCase.hora,
              provincia: envCase.provincia,
              localidad: envCase.localidad,
              region: envCase.region,
              tipoIncautacion: incautacionInfo.tipo || 'No especificado',
              descripcion: incautacionInfo.descripcion || incautacionInfo.tipo || 'No especificada',
              cantidad: parseInt(incautacionInfo.cantidad) || 1,
              unidadMedida: 'unidad',
              valorEstimado: incautacionInfo.valorEstimado || 0,
              estado: 'Incautado',
              custodio: 'SENPA',
              observaciones: ''
            });
          });
        } else {
          // Usar la lista de incautaciones como strings
          envCase.incautaciones.forEach((incautacion, index) => {
            // Extraer cantidad del string si está presente
            const cantidadMatch = incautacion.match(/^(\d+)\s*/);
            const cantidad = cantidadMatch ? parseInt(cantidadMatch[1]) : 1;
            
            // Limpiar descripción
            let descripcion = incautacion
              .replace(/^CASO-\d{8}-\d{6}-\w+\s+/i, '')
              .replace(/^\d+\s*/, '')
              .replace(/\s+CASO\d+.*$/i, '')
              .trim();

            if (!descripcion) {
              descripcion = incautacion;
            }

            incautaciones.push({
              id: `incautacion_${envCase.numeroCaso}_${index}`,
              numeroCaso: envCase.numeroCaso,
              fecha: envCase.fecha,
              hora: envCase.hora,
              provincia: envCase.provincia,
              localidad: envCase.localidad,
              region: envCase.region,
              tipoIncautacion: descripcion,
              descripcion: descripcion,
              cantidad: cantidad,
              unidadMedida: 'unidad',
              valorEstimado: 0,
              estado: 'Incautado',
              custodio: 'SENPA',
              observaciones: `Caso: ${envCase.numeroCaso}`
            });
          });
        }
      }
    });

    return incautaciones;
  }

  // Método para mapear de vuelta a EnvironmentalCase (para actualizaciones)
  static updateEnvironmentalCaseFromTables(
    originalCase: EnvironmentalCase,
    notas: NotaInformativa[],
    detenidos: Detenido[],
    vehiculos: Vehiculo[],
    incautaciones: Incautacion[]
  ): EnvironmentalCase {
    // Buscar la nota informativa correspondiente
    const nota = notas.find(n => n.numeroCaso === originalCase.numeroCaso);
    
    // Contar registros relacionados con este caso
    const caseDetenidos = detenidos.filter(d => d.numeroCaso === originalCase.numeroCaso);
    const caseVehiculos = vehiculos.filter(v => v.numeroCaso === originalCase.numeroCaso);
    const caseIncautaciones = incautaciones.filter(i => i.numeroCaso === originalCase.numeroCaso);

    return {
      ...originalCase,
      // Actualizar desde nota informativa si existe
      ...(nota && {
        fecha: nota.fecha,
        hora: nota.hora,
        provincia: nota.provincia,
        localidad: nota.localidad,
        region: nota.region,
        tipoActividad: nota.tipoActividad,
        areaTemática: nota.areaTemática,
        notificados: String(nota.notificados || ''),
        procuraduria: nota.procuraduria,
        resultado: nota.resultado
      }),
      // Actualizar conteos
      detenidos: caseDetenidos.length,
      vehiculosDetenidos: caseVehiculos.length,
      incautaciones: caseIncautaciones.map(i => `${i.cantidad} ${i.descripcion}`)
    };
  }
}