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
  notificados: number;
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
  apellido: string;
  cedula: string;
  edad: number;
  nacionalidad: string;
  motivoDetencion: string;
  estadoProceso: string;
  observaciones?: string;
}

export interface Vehiculo {
  id: string;
  numeroCaso: string;
  fecha: string;
  hora: string;
  provincia: string;
  localidad: string;
  region: string;
  tipoVehiculo: string;
  marca: string;
  modelo: string;
  año: number;
  placa: string;
  color: string;
  propietario: string;
  estado: string;
  observaciones?: string;
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
    editableFields: ['fecha', 'hora', 'provincia', 'localidad', 'region', 'nombre', 'apellido', 'cedula', 'edad', 'nacionalidad', 'motivoDetencion', 'estadoProceso', 'observaciones'],
    requiredFields: ['numeroCaso', 'fecha', 'nombre', 'apellido', 'cedula']
  },
  vehiculos: {
    tableName: 'vehiculos',
    displayName: 'Vehículos',
    primaryKey: 'id',
    editableFields: ['fecha', 'hora', 'provincia', 'localidad', 'region', 'tipoVehiculo', 'marca', 'modelo', 'año', 'placa', 'color', 'propietario', 'estado', 'observaciones'],
    requiredFields: ['numeroCaso', 'fecha', 'tipoVehiculo', 'placa']
  },
  incautaciones: {
    tableName: 'incautaciones',
    displayName: 'Incautaciones',
    primaryKey: 'id',
    editableFields: ['fecha', 'hora', 'provincia', 'localidad', 'region', 'tipoIncautacion', 'descripcion', 'cantidad', 'unidadMedida', 'valorEstimado', 'estado', 'custodio', 'observaciones'],
    requiredFields: ['numeroCaso', 'fecha', 'tipoIncautacion', 'descripcion', 'cantidad']
  }
};