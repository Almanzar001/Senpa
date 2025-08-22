// Interfaces for the 4 separate tables

export interface NotaInformativa {
  id: string;
  numeroCaso: string;
  fecha: string;
  hora: string;
  provinciamunicipio: string; // Campo ENUM real en la base de datos
  localidad: string; // Existe en la base de datos
  region: string; // Existe en la base de datos
  tipoActividad: string;
  areaTemática: string;
  notificados: string; // Nombres de las personas notificadas
  procuraduria: string; // Campo string que contiene 'SI' o 'NO'
  resultado?: string;
  observaciones?: string;
  nota?: string; // Campo que existe en la base de datos
  coordenadas?: {
    lat: number;
    lng: number;
  };
}

export interface Detenido {
  id: string;
  numeroCaso: string;
  fecha: string;
  hora?: string;
  provinciamunicipio?: string; // Puede o no existir en detenidos
  localidad?: string; // Puede o no existir en detenidos
  region?: string; // Puede o no existir en detenidos
  nombre: string;
  motivoDetencion: string;
  estadoProceso: string;
  observaciones?: string;
  nota?: string;
}

export interface Vehiculo {
  id: string;
  numeroCaso: string;
  // Campos reales de la tabla vehiculos
  tipo: string;
  marca: string;
  color: string;
  detalle: string;
  provinciamunicipio: string; // Campo correcto en minúsculas
  fecha: string;
  // Campos que pueden existir
  hora?: string;
  localidad?: string;
  region?: string;
  observaciones?: string;
  nota?: string;
}

export interface Incautacion {
  id: string;
  numeroCaso: string;
  fecha: string;
  hora?: string;
  provinciamunicipio?: string; // Puede o no existir en incautaciones
  localidad?: string; // Puede o no existir en incautaciones
  region?: string; // Puede o no existir en incautaciones
  tipoIncautacion: string;
  descripcion: string;
  cantidad: number;
  unidadMedida: string;
  valorEstimado?: number;
  estado: string;
  custodio: string;
  observaciones?: string;
  nota?: string;
}

export type TableType = 'notas_informativas' | 'detenidos' | 'vehiculos' | 'incautaciones';

export interface TableMetaData {
  tableName: string;
  displayName: string;
  primaryKey: string;
  editableFields: string[];
  requiredFields: string[];
}

export const TABLE_METADATA: Record<TableType, TableMetaData> = {
  notas_informativas: {
    tableName: 'notas_informativas',
    displayName: 'Notas Informativas',
    primaryKey: 'id',
    editableFields: ['fecha', 'hora', 'provinciamunicipio', 'localidad', 'region', 'tipoActividad', 'areaTemática', 'notificados', 'procuraduria', 'resultado', 'observaciones', 'nota'],
    requiredFields: ['numeroCaso', 'fecha', 'tipoActividad']
  },
  detenidos: {
    tableName: 'detenidos',
    displayName: 'Detenidos',
    primaryKey: 'id',
    editableFields: ['fecha', 'hora', 'provinciamunicipio', 'nombre', 'motivoDetencion', 'estadoProceso', 'observaciones', 'nota'],
    requiredFields: ['numeroCaso', 'fecha', 'nombre']
  },
  vehiculos: {
    tableName: 'vehiculos',
    displayName: 'Vehículos',
    primaryKey: 'id',
    editableFields: ['tipo', 'marca', 'color', 'detalle', 'provinciamunicipio', 'fecha', 'observaciones', 'nota'],
    requiredFields: ['numeroCaso', 'tipo', 'fecha']
  },
  incautaciones: {
    tableName: 'incautaciones',
    displayName: 'Incautaciones',
    primaryKey: 'id',
    editableFields: ['fecha', 'hora', 'provinciamunicipio', 'tipoIncautacion', 'descripcion', 'cantidad', 'unidadMedida', 'valorEstimado', 'estado', 'custodio', 'observaciones', 'nota'],
    requiredFields: ['numeroCaso', 'fecha', 'tipoIncautacion', 'descripcion', 'cantidad']
  }
};