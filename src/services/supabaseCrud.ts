import { supabase } from '../config';
import type { TableType, NotaInformativa, Detenido, Vehiculo, Incautacion } from '../types/tableTypes';

export type TableItem = NotaInformativa | Detenido | Vehiculo | Incautacion;

// Mapeo de nombres de tabla en la UI a nombres reales en Supabase
const TABLE_MAPPING: Record<TableType, string> = {
  'notas_informativas': 'notas_informativas',
  'detenidos': 'detenidos',
  'vehiculos': 'vehiculos',
  'incautaciones': 'incautaciones'
};

// Mapeo de campos de la UI a campos de la base de datos
const FIELD_MAPPING: Record<string, string> = {
  // Campos comunes - Mapeo UI a DB
  'numeroCaso': 'numerocaso',
  'fecha': 'fecha',
  'hora': 'hora',
  'provinciamunicipio': 'provinciamunicipio',
  'localidad': 'localidad',
  'region': 'region',
  'observaciones': 'observaciones',
  'coordenadas': 'coordenadas',
  'nota': 'nota',
  
  // Campos específicos de notas_informativas
  'tipoActividad': 'tipoactividad',
  'areaTemática': 'areatematica',
  'notificados': 'notificados',
  'procuraduria': 'procuraduria',
  'resultado': 'resultado',
  
  // Campos específicos de detenidos
  'nombre': 'nombre',
  'motivoDetencion': 'motivodetencion',
  'estadoProceso': 'estadoproceso',
  
  // Campos específicos de vehiculos
  'tipo': 'tipo',
  'marca': 'marca',
  'color': 'color',
  'detalle': 'detalle',
  
  // Campos específicos de incautaciones
  'tipoIncautacion': 'tipoincautacion',
  'descripcion': 'descripcion',
  'cantidad': 'cantidad',
  'valorEstimado': 'valorestimado'
};

class SupabaseCrudService {
  
  // Convertir objeto de UI a formato de base de datos
  private mapToDatabase(tableType: TableType, item: Partial<TableItem>): Record<string, any> {
    const dbItem: Record<string, any> = {};
    
    // Campos que son enums y no deben enviarse si están vacíos
    const enumFields = ['provinciamunicipio', 'tipoactividad', 'areatematica', 'region'];
    
    // Mapear campos comunes
    Object.entries(item).forEach(([uiField, value]) => {
      const dbField = FIELD_MAPPING[uiField] || uiField.toLowerCase();
      
      // Manejar campos especiales
      if (uiField === 'procuraduria' && typeof value === 'string') {
        dbItem[dbField] = value; // Mantener como string (SI/NO)
      } else if (value !== undefined && value !== null) {
        // Para campos enum, no enviar si está vacío
        if (enumFields.includes(dbField) && (value === '' || value === null)) {
          console.log(`🟦 Skipping empty enum field ${dbField} for ${tableType}`);
          return; // Skip este campo
        }
        
        dbItem[dbField] = value;
      }
    });
    
    return dbItem;
  }
  
  // Convertir objeto de base de datos a formato de UI
  private mapFromDatabase(tableType: TableType, dbItem: Record<string, any>): any {
    const uiItem: Record<string, any> = {};
    
    
    // Mapear campos de base de datos a UI directamente para evitar conflictos
    Object.entries(dbItem).forEach(([dbField, value]) => {
      let uiField = dbField;
      
      // Mapeos específicos de DB a UI
      switch (dbField) {
        case 'numerocaso':
          uiField = 'numeroCaso';
          break;
        case 'provinciamunicipio':
          uiField = 'provinciamunicipio'; // Mantener el nombre original
          break;
        case 'tipoactividad':
          uiField = 'tipoActividad';
          break;
        case 'areatematica':
          uiField = 'areaTemática';
          break;
        case 'motivodetencion':
          uiField = 'motivoDetencion';
          break;
        case 'estadoproceso':
          uiField = 'estadoProceso';
          break;
        case 'tipovehiculo':
          uiField = 'tipoVehiculo';
          break;
        case 'estadovehiculo':
          uiField = 'estadoVehiculo';
          break;
        case 'tipoincautacion':
          uiField = 'tipoIncautacion';
          break;
        case 'cantidadincautada':
          uiField = 'cantidadIncautada';
          break;
      }
      
      // Manejar campos especiales
      if (dbField === 'procuraduria' && typeof value === 'string') {
        uiItem[uiField] = value; // Mantener como string (SI/NO)
      } else if (value !== undefined && value !== null) {
        uiItem[uiField] = value;
      }
    });
    
    
    return uiItem;
  }
  
  // Obtener todos los registros de una tabla con optimizaciones
  async getAll(tableType: TableType, options?: {
    limit?: number;
    offset?: number;
    fields?: string[];
  }): Promise<TableItem[]> {
    try {
      const tableName = TABLE_MAPPING[tableType];
      
      // Seleccionar solo campos necesarios o todos si no se especifica
      const selectFields = options?.fields ? options.fields.join(', ') : '*';
      
      let query = supabase
        .from(tableName)
        .select(selectFields)
        .order('fecha', { ascending: false });
      
      // Aplicar paginación si se especifica
      if (options?.limit) {
        query = query.limit(options.limit);
        if (options.offset) {
          query = query.range(options.offset, options.offset + options.limit - 1);
        }
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error(`❌ Error fetching ${tableType}:`, error);
        throw new Error(`Error al obtener ${tableType}: ${error.message}`);
      }
      
      return (data || []).map(item => this.mapFromDatabase(tableType, item));
    } catch (error: any) {
      console.error(`❌ Error in getAll for ${tableType}:`, error);
      throw error;
    }
  }
  
  // Obtener un registro por ID
  async getById(tableType: TableType, id: string): Promise<TableItem | null> {
    try {
      const tableName = TABLE_MAPPING[tableType];
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') { // No rows returned
          return null;
        }
        console.error(`❌ Error fetching ${tableType} by ID:`, error);
        throw new Error(`Error al obtener ${tableType}: ${error.message}`);
      }
      
      return data ? this.mapFromDatabase(tableType, data) : null;
    } catch (error: any) {
      console.error(`❌ Error in getById for ${tableType}:`, error);
      throw error;
    }
  }
  
  // Crear un nuevo registro
  async create(tableType: TableType, item: Partial<TableItem>): Promise<TableItem> {
    try {
      const tableName = TABLE_MAPPING[tableType];
      const dbItem = this.mapToDatabase(tableType, item);
      
      console.log(`🟦 Creating ${tableType}:`, { original: item, mapped: dbItem });
      
      const { data, error } = await supabase
        .from(tableName)
        .insert(dbItem)
        .select()
        .single();
      
      if (error) {
        console.error(`❌ Error creating ${tableType}:`, error);
        throw new Error(`Error al crear ${tableType}: ${error.message}`);
      }
      
      const result = this.mapFromDatabase(tableType, data);
      console.log(`✅ Created ${tableType}:`, result);
      return result;
    } catch (error: any) {
      console.error(`❌ Error in create for ${tableType}:`, error);
      throw error;
    }
  }
  
  // Actualizar un registro existente
  async update(tableType: TableType, id: string, updates: Partial<TableItem>): Promise<TableItem> {
    try {
      const tableName = TABLE_MAPPING[tableType];
      const dbUpdates = this.mapToDatabase(tableType, updates);
      
      console.log(`🟦 Updating ${tableType} ID ${id}:`, { original: updates, mapped: dbUpdates });
      
      // Remover el campo ID de las actualizaciones para evitar conflictos
      delete dbUpdates.id;
      
      // Para notas_informativas, usar numerocaso como identificador si el id parece ser un numerocaso
      let query = supabase.from(tableName).update(dbUpdates);
      
      if (tableType === 'notas_informativas' && id.startsWith('CASO-')) {
        // Si el ID parece ser un numerocaso, usar numerocaso como filtro
        query = query.eq('numerocaso', id);
        console.log(`🟦 Using numerocaso filter for ${tableType}:`, id);
      } else {
        // Para otros casos, usar id normal
        query = query.eq('id', id);
      }
      
      const { data, error } = await query.select().single();
      
      if (error) {
        console.error(`❌ Error updating ${tableType}:`, error);
        throw new Error(`Error al actualizar ${tableType}: ${error.message}`);
      }
      
      if (!data) {
        throw new Error(`No se encontró el registro ${tableType} con ID ${id}`);
      }
      
      const result = this.mapFromDatabase(tableType, data);
      console.log(`✅ Updated ${tableType}:`, result);
      return result;
    } catch (error: any) {
      console.error(`❌ Error in update for ${tableType}:`, error);
      throw error;
    }
  }
  
  // Eliminar un registro
  async delete(tableType: TableType, id: string): Promise<boolean> {
    try {
      const tableName = TABLE_MAPPING[tableType];
      
      console.log(`🟦 Deleting ${tableType} ID ${id}`);
      
      // Para notas_informativas, usar numerocaso como identificador si el id parece ser un numerocaso
      let query = supabase.from(tableName).delete();
      
      if (tableType === 'notas_informativas' && id.startsWith('CASO-')) {
        // Si el ID parece ser un numerocaso, usar numerocaso como filtro
        query = query.eq('numerocaso', id);
        console.log(`🟦 Using numerocaso filter for delete ${tableType}:`, id);
      } else {
        // Para otros casos, usar id normal
        query = query.eq('id', id);
      }
      
      const { error } = await query;
      
      if (error) {
        console.error(`❌ Error deleting ${tableType}:`, error);
        throw new Error(`Error al eliminar ${tableType}: ${error.message}`);
      }
      
      console.log(`✅ Deleted ${tableType} ID ${id}`);
      return true;
    } catch (error: any) {
      console.error(`❌ Error in delete for ${tableType}:`, error);
      throw error;
    }
  }
  
  // Obtener registros por número de caso
  async getByCaseNumber(tableType: TableType, numeroCaso: string): Promise<TableItem[]> {
    try {
      const tableName = TABLE_MAPPING[tableType];
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('numerocaso', numeroCaso)
        .order('fecha', { ascending: false });
      
      if (error) {
        console.error(`❌ Error fetching ${tableType} by case number:`, error);
        throw new Error(`Error al obtener ${tableType} por número de caso: ${error.message}`);
      }
      
      return (data || []).map(item => this.mapFromDatabase(tableType, item));
    } catch (error: any) {
      console.error(`❌ Error in getByCaseNumber for ${tableType}:`, error);
      throw error;
    }
  }
}

// Exportar instancia única del servicio
export const supabaseCrudService = new SupabaseCrudService();
export default supabaseCrudService;
