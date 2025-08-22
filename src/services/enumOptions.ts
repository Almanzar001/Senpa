import type { EnvironmentalCase } from './environmentalAnalytics';

export interface EnumOptions {
  tiposActividad: string[];
  provincias: string[];
  localidades: string[];
  regiones: string[];
  areasTemáticas: string[];
  procuraduria: { value: string; label: string }[];
  estadosProceso: string[];
  estadosGenerales: string[];
  tiposVehiculo: string[];
  marcasVehiculo: string[];
  tiposIncautacion: string[];
  unidadesMedida: string[];
  nacionalidades: string[];
  provinciaMunicipio: string[];
}

export class EnumOptionsService {
  private static instance: EnumOptionsService;
  private options: EnumOptions | null = null;

  private constructor() {}

  static getInstance(): EnumOptionsService {
    if (!EnumOptionsService.instance) {
      EnumOptionsService.instance = new EnumOptionsService();
    }
    return EnumOptionsService.instance;
  }

  // Extraer opciones desde los datos reales
  async extractOptionsFromData(cases: EnvironmentalCase[]): Promise<EnumOptions> {
    // Tipos de actividad únicos
    const tiposActividad = [...new Set(cases.map(c => c.tipoActividad).filter(t => t && t.trim() !== ''))].sort();
    
    // Provincias únicas
    const provincias = [...new Set(cases.map(c => c.provincia).filter(p => p && p.trim() !== ''))].sort();
    
    // Localidades únicas
    const localidades = [...new Set(cases.map(c => c.localidad).filter(l => l && l.trim() !== ''))].sort();
    
    // Regiones únicas
    const regiones = [...new Set(cases.map(c => c.region).filter(r => r && r.trim() !== ''))].sort();
    
    // Áreas temáticas únicas
    const areasTemáticas = [...new Set(cases.map(c => c.areaTemática).filter(a => a && a.trim() !== ''))].sort();

    // Extraer nacionalidades de detenidos si existe la información
    const nacionalidades = new Set<string>();
    cases.forEach(c => {
      if (c.detenidosInfo) {
        c.detenidosInfo.forEach((detenido: any) => {
          if (detenido.nacionalidad && detenido.nacionalidad.trim() !== '') {
            nacionalidades.add(detenido.nacionalidad);
          }
        });
      }
    });

    // Extraer tipos y marcas de vehículos si existe la información
    const tiposVehiculo = new Set<string>();
    const marcasVehiculo = new Set<string>();
    cases.forEach(c => {
      if (c.vehiculosInfo) {
        c.vehiculosInfo.forEach((vehiculo: any) => {
          if (vehiculo.tipo && vehiculo.tipo.trim() !== '') {
            tiposVehiculo.add(vehiculo.tipo);
          }
          if (vehiculo.marca && vehiculo.marca.trim() !== '') {
            marcasVehiculo.add(vehiculo.marca);
          }
        });
      }
    });

    // Extraer tipos de incautación si existe la información
    const tiposIncautacion = new Set<string>();
    cases.forEach(c => {
      if (c.incautacionesInfo) {
        c.incautacionesInfo.forEach((incautacion: any) => {
          if (incautacion.tipo && incautacion.tipo.trim() !== '') {
            tiposIncautacion.add(incautacion.tipo);
          }
        });
      }
      // También desde el array de strings de incautaciones
      if (c.incautaciones) {
        c.incautaciones.forEach(inc => {
          const cleanType = inc.replace(/^CASO-\d{8}-\d{6}-\w+\s+/i, '')
                              .replace(/^\d+\s*/, '')
                              .replace(/\s+CASO\d+.*$/i, '')
                              .trim();
          if (cleanType) {
            tiposIncautacion.add(cleanType);
          }
        });
      }
    });

    // Obtener tipos y provincias/municipios únicos desde la tabla vehiculos
    let tiposVehiculosDB: string[] = [];
    let provinciaMunicipiosDB: string[] = [];
    
    try {
      const { supabase } = await import('./supabase');
      console.log('🟦 Conectando a Supabase para obtener opciones de vehículos...');
      
      // Primero verificar si la tabla vehiculos existe y tiene datos
      const { data: allVehiculos, error: allError } = await supabase
        .from('vehiculos')
        .select('*')
        .limit(5);
      
      console.log('🟦 Primeros 5 registros de vehiculos:', allVehiculos);
      console.log('🟦 Error al consultar vehiculos:', allError);
      
      if (allError) {
        console.error('❌ Error accediendo a tabla vehiculos:', allError);
      } else if (!allVehiculos || allVehiculos.length === 0) {
        console.log('⚠️ La tabla vehiculos está vacía');
      } else {
        console.log('✅ Tabla vehiculos encontrada con', allVehiculos.length, 'registros (muestra)');
        console.log('🟦 Estructura de primer registro:', Object.keys(allVehiculos[0] || {}));
        
        // Obtener tipos únicos de vehículos desde la base de datos
        const { data: tiposData, error: tiposError } = await supabase
          .from('vehiculos')
          .select('tipo');
        
        console.log('🟦 Datos de tipos obtenidos:', tiposData);
        console.log('🟦 Error de tipos:', tiposError);
        
        if (!tiposError && tiposData) {
          tiposVehiculosDB = [...new Set(tiposData
            .map(item => item.tipo)
            .filter(tipo => 
              tipo && 
              tipo !== null && 
              tipo !== undefined && 
              typeof tipo === 'string' &&
              tipo.trim() !== '' && 
              tipo.trim().toLowerCase() !== 'null'
            )
            .map(tipo => tipo.trim())
          )].sort();
          console.log('✅ Tipos de vehículos obtenidos de BD:', tiposVehiculosDB);
          console.log('🟦 Total de tipos únicos encontrados:', tiposVehiculosDB.length);
        } else {
          console.error('❌ Error obteniendo tipos de vehículos:', tiposError);
        }
        
        // Obtener provinciaMunicipio únicos desde la base de datos
        const { data: provinciasData, error: provinciasError } = await supabase
          .from('vehiculos')
          .select('provinciamunicipio');
        
        console.log('🟦 Datos de provincias obtenidos:', provinciasData);
        console.log('🟦 Error de provincias:', provinciasError);
        
        if (!provinciasError && provinciasData) {
          provinciaMunicipiosDB = [...new Set(provinciasData
            .map(item => item.provinciamunicipio)
            .filter(provincia => 
              provincia && 
              provincia !== null && 
              provincia !== undefined && 
              typeof provincia === 'string' &&
              provincia.trim() !== '' && 
              provincia.trim().toLowerCase() !== 'null'
            )
            .map(provincia => provincia.trim())
          )].sort();
          console.log('✅ Provincias/Municipios obtenidos de BD:', provinciaMunicipiosDB);
          console.log('🟦 Total de provincias únicas encontradas:', provinciaMunicipiosDB.length);
        } else {
          console.error('❌ Error obteniendo provincias/municipios:', provinciasError);
        }
      }
      
    } catch (error) {
      console.error('❌ Error conectando con la base de datos para obtener opciones:', error);
    }

    this.options = {
      tiposActividad,
      provincias,
      localidades,
      regiones,
      areasTemáticas,
      procuraduria: [
        { value: 'SI', label: 'Sí' },
        { value: 'NO', label: 'No' }
      ],
      estadosProceso: [
        'En proceso',
        'Completado',
        'Archivado',
        'Pendiente',
        'En investigación',
        'Cerrado'
      ],
      estadosGenerales: [
        'Activo',
        'Retenido',
        'Incautado',
        'Liberado',
        'En custodia',
        'Devuelto'
      ],
      tiposVehiculo: tiposVehiculosDB.length > 0 ? 
        tiposVehiculosDB : 
        ['Automóvil', 'Motocicleta', 'Camión', 'Camioneta', 'Autobús', 'Otros'],
      marcasVehiculo: Array.from(marcasVehiculo).length > 0 ? 
        Array.from(marcasVehiculo).sort() : 
        ['Toyota', 'Honda', 'Ford', 'Chevrolet', 'Nissan', 'Hyundai', 'Otros'],
      tiposIncautacion: Array.from(tiposIncautacion).length > 0 ? 
        Array.from(tiposIncautacion).sort() : 
        ['Drogas', 'Armas', 'Dinero', 'Documentos', 'Materiales', 'Otros'],
      unidadesMedida: [
        'unidad',
        'gramos',
        'kilogramos',
        'litros',
        'metros',
        'piezas',
        'cajas',
        'bolsas'
      ],
      nacionalidades: Array.from(nacionalidades).length > 0 ? 
        Array.from(nacionalidades).sort() : 
        ['Dominicana', 'Haitiana', 'Estadounidense', 'Venezolana', 'Colombiana', 'Otras'],
      provinciaMunicipio: provinciaMunicipiosDB.length > 0 ? 
        provinciaMunicipiosDB : 
        [
          'Azua',
          'Bahoruco',
          'Barahona',
          'Dajabón',
          'Distrito Nacional',
          'Duarte',
          'Elías Piña',
          'El Seibo',
          'Espaillat',
          'Hato Mayor',
          'Hermanas Mirabal',
          'Independencia',
          'La Altagracia',
          'La Romana',
          'La Vega',
          'María Trinidad Sánchez',
          'Monseñor Nouel',
          'Monte Cristi',
          'Monte Plata',
          'Pedernales',
          'Peravia',
          'Puerto Plata',
          'Samaná',
          'San Cristóbal',
          'San José de Ocoa',
          'San Juan',
          'San Pedro de Macorís',
          'Sánchez Ramírez',
          'Santiago',
          'Santiago Rodríguez',
          'Santo Domingo',
          'Valverde'
        ]
    };

    return this.options;
  }

  // Obtener opciones (usar caché si está disponible)
  getOptions(): EnumOptions {
    if (!this.options) {
      // Opciones por defecto si no se han cargado datos
      return {
        tiposActividad: ['Operativo', 'Patrulla', 'Inspección', 'Investigación'],
        provincias: ['Santo Domingo', 'Santiago', 'La Vega', 'San Cristóbal', 'Otras'],
        localidades: [],
        regiones: ['Región I', 'Región II', 'Región III', 'Región IV', 'Región V'],
        areasTemáticas: ['Suelos y Aguas', 'Recursos Forestales', 'Areas Protegida', 'Gestión Ambiental', 'Costeros y Marinos'],
        procuraduria: [
          { value: 'SI', label: 'Sí' },
          { value: 'NO', label: 'No' }
        ],
        estadosProceso: ['En proceso', 'Completado', 'Archivado', 'Pendiente'],
        estadosGenerales: ['Activo', 'Retenido', 'Incautado', 'Liberado'],
        tiposVehiculo: ['Automóvil', 'Motocicleta', 'Camión', 'Camioneta'],
        marcasVehiculo: ['Toyota', 'Honda', 'Ford', 'Chevrolet', 'Nissan'],
        tiposIncautacion: ['Drogas', 'Armas', 'Dinero', 'Documentos', 'Materiales'],
        unidadesMedida: ['unidad', 'gramos', 'kilogramos', 'litros', 'piezas'],
        nacionalidades: ['Dominicana', 'Haitiana', 'Estadounidense', 'Venezolana'],
        provinciaMunicipio: [
          'Azua',
          'Bahoruco', 
          'Barahona',
          'Dajabón',
          'Distrito Nacional',
          'Duarte',
          'Elías Piña',
          'El Seibo',
          'Espaillat',
          'Hato Mayor',
          'Hermanas Mirabal',
          'Independencia',
          'La Altagracia',
          'La Romana',
          'La Vega',
          'María Trinidad Sánchez',
          'Monseñor Nouel',
          'Monte Cristi',
          'Monte Plata',
          'Pedernales',
          'Peravia',
          'Puerto Plata',
          'Samaná',
          'San Cristóbal',
          'San José de Ocoa',
          'San Juan',
          'San Pedro de Macorís',
          'Sánchez Ramírez',
          'Santiago',
          'Santiago Rodríguez',
          'Santo Domingo',
          'Valverde'
        ]
      };
    }
    return this.options;
  }

  // Actualizar opciones con nuevos datos
  async updateOptions(cases: EnvironmentalCase[]): Promise<void> {
    await this.extractOptionsFromData(cases);
  }

  // Obtener opciones para un campo específico
  getFieldOptions(fieldName: string): string[] | { value: any; label: string }[] {
    const options = this.getOptions();
    
    switch (fieldName) {
      case 'tipoActividad':
        return options.tiposActividad;
      case 'provincia':
        return options.provincias;
      case 'localidad':
        return options.localidades;
      case 'region':
        return options.regiones;
      case 'areaTemática':
        return options.areasTemáticas;
      case 'procuraduria':
        return options.procuraduria;
      case 'estadoProceso':
        return options.estadosProceso;
      case 'estado':
        return options.estadosGenerales;
      case 'tipoVehiculo':
        return options.tiposVehiculo;
      case 'marca':
        return options.marcasVehiculo;
      case 'tipoIncautacion':
        return options.tiposIncautacion;
      case 'unidadMedida':
        return options.unidadesMedida;
      case 'nacionalidad':
        return options.nacionalidades;
      case 'provinciaMunicipio':
        return options.provinciaMunicipio;
      default:
        return [];
    }
  }

  // Verificar si un campo debe ser dropdown
  isDropdownField(fieldName: string): boolean {
    const dropdownFields = [
      'tipoActividad',
      'provincia', 
      'localidad',
      'region',
      'areaTemática',
      'procuraduria',
      'estadoProceso',
      'estado',
      'marca',
      'tipoIncautacion',
      'unidadMedida',
      'nacionalidad',
      'provinciaMunicipio'
    ];
    return dropdownFields.includes(fieldName);
  }
}

// Exportar instancia singleton
export const enumOptionsService = EnumOptionsService.getInstance();