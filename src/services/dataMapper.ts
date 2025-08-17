import type { EnvironmentalCase } from './environmentalAnalytics';
import type { NotaInformativa, Detenido, Vehiculo, Incautacion } from '../types/tableTypes';

export class DataMapperService {
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
          filteredCases = cases.filter(c => 
            c.notificados && c.notificados > 0
          );
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
      notificados: envCase.notificados,
      procuraduria: envCase.procuraduria,
      resultado: envCase.resultado || '',
      observaciones: '',
      coordenadas: envCase.coordenadas
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
              apellido: detenidoInfo.apellido || '',
              cedula: detenidoInfo.cedula || 'No especificada',
              edad: detenidoInfo.edad || 0,
              nacionalidad: detenidoInfo.nacionalidad || 'No especificada',
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
              apellido: '',
              cedula: 'No especificada',
              edad: 0,
              nacionalidad: 'No especificada',
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
              hora: envCase.hora,
              provincia: envCase.provincia,
              localidad: envCase.localidad,
              region: envCase.region,
              tipoVehiculo: vehiculoInfo.tipo || 'No especificado',
              marca: vehiculoInfo.marca || 'No especificada',
              modelo: vehiculoInfo.modelo || 'No especificado',
              año: vehiculoInfo.año || new Date().getFullYear(),
              placa: vehiculoInfo.placa || 'No especificada',
              color: vehiculoInfo.color || 'No especificado',
              propietario: vehiculoInfo.propietario || 'No especificado',
              estado: 'Retenido',
              observaciones: ''
            });
          });
        } else {
          // Si no hay info detallada, crear registros genéricos
          for (let i = 0; i < envCase.vehiculosDetenidos; i++) {
            vehiculos.push({
              id: `vehiculo_${envCase.numeroCaso}_${i}`,
              numeroCaso: envCase.numeroCaso,
              fecha: envCase.fecha,
              hora: envCase.hora,
              provincia: envCase.provincia,
              localidad: envCase.localidad,
              region: envCase.region,
              tipoVehiculo: 'Vehículo',
              marca: 'No especificada',
              modelo: 'No especificado',
              año: new Date().getFullYear(),
              placa: 'No especificada',
              color: 'No especificado',
              propietario: 'No especificado',
              estado: 'Retenido',
              observaciones: `Caso: ${envCase.numeroCaso}`
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
        notificados: nota.notificados,
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