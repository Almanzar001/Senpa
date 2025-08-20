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
    console.log(`🟦 ${this.tableType}Service - update iniciado`, updatedItem);
    
    if (!this.items.has(updatedItem.id)) {
      console.error(`🟦 ${this.tableType}Service - El registro no existe:`, updatedItem.id);
      throw new Error('El registro no existe');
    }

    // Validate required fields
    const errors = this.validate(updatedItem);
    console.log(`🟦 ${this.tableType}Service - Errores de validación:`, errors);
    
    if (errors.length > 0) {
      throw new Error(`Errores de validación: ${errors.join(', ')}`);
    }

    this.items.set(updatedItem.id, updatedItem);
    console.log(`🟦 ${this.tableType}Service - Item actualizado exitosamente`, updatedItem);
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

    // Validate notificados (now a string)
    // No specific validation needed for string field

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

  // Get notificados count (count non-empty names)
  getTotalNotificados(): number {
    return this.getAll().filter(nota => nota.notificados && nota.notificados.trim() !== '').length;
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

    // Validations removed - fields don't exist in current Detenido interface

    return errors;
  }

  // Get by nationality - method removed as nacionalidad field doesn't exist

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

    // Basic validation for simplified vehicle structure
    // No specific field validations needed for current simplified structure

    return errors;
  }

  // Get by vehicle type
  getByType(type: string): Vehiculo[] {
    return this.getAll().filter(vehiculo => 
      vehiculo.tipo.toLowerCase().includes(type.toLowerCase())
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