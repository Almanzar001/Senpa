// Interfaces for the 4 separate tables

export interface NotaInformativa {
  id: string;
  numeroCaso: string;
  fecha: string;
  hora: string;
  provincia: string;
  localidad: string;
  region: string;
  tipoActividad: string;
  areaTemática: string;
  notificados: string; // Nombres de las personas notificadas
  procuraduria: boolean;
  resultado?: string;
  observaciones?: string;
  coordenadas?: {
    lat: number;
    lng: number;
  };
}

export interface Detenido {
  id: string;
  numeroCaso: string;
  fecha: string;
  hora: string;
  provincia: string;
  localidad: string;
  region: string;
  nombre: string;
  motivoDetencion: string;
  estadoProceso: string;
  observaciones?: string;
}

export interface Vehiculo {
  id: string;
  numeroCaso: string;
  tipo: string;
  marca: string;
  color: string;
  detalle: string;
  provinciaMunicipio: string;
  fecha: string;
}

export interface Incautacion {
  id: string;
  numeroCaso: string;
  fecha: string;
  hora: string;
  provincia: string;
  localidad: string;
  region: string;
  tipoIncautacion: string;
  descripcion: string;
  cantidad: number;
  unidadMedida: string;
  valorEstimado?: number;
  estado: string;
  custodio: string;
  observaciones?: string;
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
    editableFields: ['fecha', 'hora', 'provincia', 'localidad', 'region', 'tipoActividad', 'areaTemática', 'notificados', 'procuraduria', 'resultado', 'observaciones'],
    requiredFields: ['numeroCaso', 'fecha', 'provincia', 'tipoActividad']
  },
  detenidos: {
    tableName: 'detenidos',
    displayName: 'Detenidos',
    primaryKey: 'id',
    editableFields: ['fecha', 'hora', 'provincia', 'localidad', 'region', 'nombre', 'motivoDetencion', 'estadoProceso', 'observaciones'],
    requiredFields: ['numeroCaso', 'fecha', 'nombre']
  },
  vehiculos: {
    tableName: 'vehiculos',
    displayName: 'Vehículos',
    primaryKey: 'id',
    editableFields: ['numeroCaso', 'tipo', 'marca', 'color', 'detalle', 'provinciaMunicipio', 'fecha'],
    requiredFields: ['numeroCaso', 'tipo', 'marca', 'provinciaMunicipio', 'fecha']
  },
  incautaciones: {
    tableName: 'incautaciones',
    displayName: 'Incautaciones',
    primaryKey: 'id',
    editableFields: ['fecha', 'hora', 'provincia', 'localidad', 'region', 'tipoIncautacion', 'descripcion', 'cantidad', 'unidadMedida', 'valorEstimado', 'estado', 'custodio', 'observaciones'],
    requiredFields: ['numeroCaso', 'fecha', 'tipoIncautacion', 'descripcion', 'cantidad']
  }
};