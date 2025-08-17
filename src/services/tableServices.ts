import type { 
  NotaInformativa, 
  Detenido, 
  Vehiculo, 
  Incautacion, 
  TableType
} from '../types/tableTypes';
import { TABLE_METADATA } from '../types/tableTypes';

// Base service class for common functionality
abstract class BaseTableService<T extends { id: string; numeroCaso: string }> {
  public items: Map<string, T> = new Map();
  protected tableType: TableType;

  constructor(tableType: TableType) {
    this.tableType = tableType;
  }

  // Get all items
  getAll(): T[] {
    return Array.from(this.items.values());
  }

  // Get item by ID
  getById(id: string): T | undefined {
    return this.items.get(id);
  }

  // Add new item
  add(item: T): T {
    
    // Validate required fields
    const errors = this.validate(item);
    if (errors.length > 0) {
      throw new Error(`Errores de validación: ${errors.join(', ')}`);
    }

    // Check if ID already exists
    if (this.items.has(item.id)) {
      throw new Error('Ya existe un registro con este ID');
    }

    this.items.set(item.id, item);
    return item;
  }

  // Update item
  update(updatedItem: T): T {
    if (!this.items.has(updatedItem.id)) {
      throw new Error('El registro no existe');
    }

    // Validate required fields
    const errors = this.validate(updatedItem);
    if (errors.length > 0) {
      throw new Error(`Errores de validación: ${errors.join(', ')}`);
    }

    this.items.set(updatedItem.id, updatedItem);
    return updatedItem;
  }

  // Delete item
  delete(id: string): boolean {
    if (!this.items.has(id)) {
      throw new Error('El registro no existe');
    }
    return this.items.delete(id);
  }

  // Get items by case number
  getByCaseNumber(numeroCaso: string): T[] {
    return Array.from(this.items.values()).filter(item => item.numeroCaso === numeroCaso);
  }

  // Generate new ID
  generateId(): string {
    return `${this.tableType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Abstract validation method
  abstract validate(item: Partial<T>): string[];

  // Common validation helpers
  protected validateRequired(item: Partial<T>, field: keyof T, fieldName: string): string | null {
    const value = item[field];
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return `${fieldName} es requerido`;
    }
    return null;
  }

  protected validateDate(dateString: string): boolean {
    const dateFormats = [
      /^\d{4}-\d{1,2}-\d{1,2}$/,  // YYYY-MM-DD
      /^\d{1,2}\/\d{1,2}\/\d{4}$/,  // DD/MM/YYYY
      /^\d{1,2}-\d{1,2}-\d{4}$/,   // DD-MM-YYYY
    ];

    if (!dateFormats.some(format => format.test(dateString))) {
      return false;
    }

    const date = new Date(dateString);
    return !isNaN(date.getTime());
  }
}

// Notas Informativas Service
export class NotasInformativasService extends BaseTableService<NotaInformativa> {
  constructor() {
    super('notas_informativas');
  }

  validate(item: Partial<NotaInformativa>): string[] {
    const errors: string[] = [];
    const metadata = TABLE_METADATA[this.tableType];

    // Check required fields
    metadata.requiredFields.forEach(field => {
      const error = this.validateRequired(item, field as keyof NotaInformativa, field);
      if (error) errors.push(error);
    });

    // Validate date format
    if (item.fecha && !this.validateDate(item.fecha)) {
      errors.push('Formato de fecha inválido');
    }

    // Validate notificados
    if (item.notificados !== undefined && item.notificados < 0) {
      errors.push('Número de notificados no puede ser negativo');
    }

    return errors;
  }

  // Get by activity type (for patrullas/operativos filtering)
  getByActivityType(activityType: string): NotaInformativa[] {
    return this.getAll().filter(nota => 
      nota.tipoActividad.toLowerCase().includes(activityType.toLowerCase())
    );
  }

  // Get with procuraduria filter
  getWithProcuraduria(): NotaInformativa[] {
    return this.getAll().filter(nota => nota.procuraduria);
  }

  // Get notificados count
  getTotalNotificados(): number {
    return this.getAll().reduce((total, nota) => total + nota.notificados, 0);
  }
}

// Detenidos Service
export class DetenidosService extends BaseTableService<Detenido> {
  constructor() {
    super('detenidos');
  }

  validate(item: Partial<Detenido>): string[] {
    const errors: string[] = [];
    const metadata = TABLE_METADATA[this.tableType];

    // Check required fields
    metadata.requiredFields.forEach(field => {
      const error = this.validateRequired(item, field as keyof Detenido, field);
      if (error) errors.push(error);
    });

    // Validate date format
    if (item.fecha && !this.validateDate(item.fecha)) {
      errors.push('Formato de fecha inválido');
    }

    // Validate age
    if (item.edad !== undefined && (item.edad < 0 || item.edad > 150)) {
      errors.push('Edad debe estar entre 0 y 150 años');
    }

    // Validate cedula format (basic check)
    if (item.cedula && !/^[\d\-]+$/.test(item.cedula)) {
      errors.push('Formato de cédula inválido');
    }

    return errors;
  }

  // Get by nationality
  getByNationality(nationality: string): Detenido[] {
    return this.getAll().filter(detenido => 
      detenido.nacionalidad.toLowerCase().includes(nationality.toLowerCase())
    );
  }

  // Get total count
  getTotalDetenidos(): number {
    return this.getAll().length;
  }
}

// Vehiculos Service
export class VehiculosService extends BaseTableService<Vehiculo> {
  constructor() {
    super('vehiculos');
  }

  validate(item: Partial<Vehiculo>): string[] {
    const errors: string[] = [];
    const metadata = TABLE_METADATA[this.tableType];

    // Check required fields
    metadata.requiredFields.forEach(field => {
      const error = this.validateRequired(item, field as keyof Vehiculo, field);
      if (error) errors.push(error);
    });

    // Validate date format
    if (item.fecha && !this.validateDate(item.fecha)) {
      errors.push('Formato de fecha inválido');
    }

    // Validate year
    const currentYear = new Date().getFullYear();
    if (item.año !== undefined && (item.año < 1900 || item.año > currentYear + 1)) {
      errors.push(`Año debe estar entre 1900 y ${currentYear + 1}`);
    }

    // Validate placa format (basic check)
    if (item.placa && item.placa.length < 3) {
      errors.push('Placa debe tener al menos 3 caracteres');
    }

    return errors;
  }

  // Get by vehicle type
  getByType(type: string): Vehiculo[] {
    return this.getAll().filter(vehiculo => 
      vehiculo.tipoVehiculo.toLowerCase().includes(type.toLowerCase())
    );
  }

  // Get total count
  getTotalVehiculos(): number {
    return this.getAll().length;
  }
}

// Incautaciones Service
export class IncautacionesService extends BaseTableService<Incautacion> {
  constructor() {
    super('incautaciones');
  }

  validate(item: Partial<Incautacion>): string[] {
    const errors: string[] = [];
    const metadata = TABLE_METADATA[this.tableType];

    // Check required fields
    metadata.requiredFields.forEach(field => {
      const error = this.validateRequired(item, field as keyof Incautacion, field);
      if (error) errors.push(error);
    });

    // Validate date format
    if (item.fecha && !this.validateDate(item.fecha)) {
      errors.push('Formato de fecha inválido');
    }

    // Validate cantidad
    if (item.cantidad !== undefined && item.cantidad <= 0) {
      errors.push('Cantidad debe ser mayor a 0');
    }

    // Validate valor estimado
    if (item.valorEstimado !== undefined && item.valorEstimado < 0) {
      errors.push('Valor estimado no puede ser negativo');
    }

    return errors;
  }

  // Get by type
  getByType(type: string): Incautacion[] {
    return this.getAll().filter(incautacion => 
      incautacion.tipoIncautacion.toLowerCase().includes(type.toLowerCase())
    );
  }

  // Get total count
  getTotalIncautaciones(): number {
    return this.getAll().length;
  }

  // Get total estimated value
  getTotalEstimatedValue(): number {
    return this.getAll().reduce((total, incautacion) => 
      total + (incautacion.valorEstimado || 0), 0
    );
  }
}

// Export service instances
export const notasInformativasService = new NotasInformativasService();
export const detenidosService = new DetenidosService();
export const vehiculosService = new VehiculosService();
export const incautacionesService = new IncautacionesService();

// Service factory
export const getTableService = (tableType: TableType) => {
  switch (tableType) {
    case 'notas_informativas':
      return notasInformativasService;
    case 'detenidos':
      return detenidosService;
    case 'vehiculos':
      return vehiculosService;
    case 'incautaciones':
      return incautacionesService;
    default:
      throw new Error(`Servicio no encontrado para tabla: ${tableType}`);
  }
};