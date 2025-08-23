import { CONFIG } from '../config'
// Importar el cliente único de config.ts para evitar múltiples instancias
import { supabase } from '../config'

// Re-exportar el cliente único
export { supabase }

export interface DatabaseRow {
  [key: string]: any;
}

export interface SheetData {
  name: string;
  data: (string | number)[][];
  lastUpdated?: number;
}

class SupabaseService {
  
  async getTableData(tableName: string): Promise<SheetData> {
    try {
      // Verificar que el cliente Supabase esté disponible
      if (!supabase) {
        console.error('❌ Cliente Supabase no disponible');
        throw new Error('Configuración de Supabase no válida. Verifica las variables de entorno.');
      }

      console.log('🔍 Obteniendo datos de tabla:', tableName);
      console.log('🔗 URL Supabase configurada:', CONFIG.SUPABASE_URL);

      const { data, error } = await supabase
        .from(tableName)
        .select('*');

      if (error) {
        console.error(`❌ Supabase error for ${tableName}:`, error);
        console.error(`❌ Error details:`, JSON.stringify(error, null, 2));
        throw new Error(`Error fetching data from ${tableName}: ${error.message}`);
      }

      // Convertir datos de Supabase al formato que espera el sistema (como Google Sheets)
      if (!data || data.length === 0) {
        return {
          name: tableName,
          data: []
        };
      }

      // Obtener headers de las columnas del primer registro
      const headers = Object.keys(data[0]);
      
      // Convertir datos a formato matriz (como Google Sheets)
      const rows = data.map(row => 
        headers.map(header => row[header] || '')
      );

      return {
        name: tableName,
        data: [headers, ...rows]
      };
    } catch (error: any) {
      console.error(`Error fetching table ${tableName}:`, error);
      throw new Error(`Error al obtener datos de "${tableName}": ${error.message}`);
    }
  }

  async getAllTables(): Promise<string[]> {
    try {
      // Verificar que el cliente Supabase esté disponible
      if (!supabase) {
        console.error('❌ Cliente Supabase no disponible');
        return ['notas_informativas', 'detenidos', 'incautaciones', 'vehiculos'];
      }

      // Probar conexión con una tabla conocida
      const { error } = await supabase.from('detenidos').select('id').limit(1);
      
      if (error) {
        console.warn('No se pudo conectar a Supabase:', error.message);
        throw new Error(`Error de conexión a Supabase: ${error.message}`);
      }

      // Si hay conexión exitosa, retornar las tablas configuradas
      return ['notas_informativas', 'detenidos', 'incautaciones', 'vehiculos'];
    } catch (error: any) {
      console.error('Error connecting to Supabase:', error);
      throw new Error(`No se puede conectar a Supabase en ${supabaseUrl}. Verifica la URL y configuración.`);
    }
  }

  async getMultipleTables(tableNames: string[]): Promise<SheetData[]> {
    try {
      const promises = tableNames.map(tableName => this.getTableData(tableName));
      return await Promise.all(promises);
    } catch (error) {
      console.error('Error fetching multiple tables:', error);
      throw new Error('Failed to fetch multiple tables');
    }
  }

  processTableData(tableData: SheetData): {
    headers: string[];
    rows: Record<string, any>[];
  } {
    if (tableData.data.length === 0) {
      return { headers: [], rows: [] };
    }

    const headers = tableData.data[0] as string[];
    const rows = tableData.data.slice(1).map(row => {
      const obj: Record<string, any> = {};
      headers.forEach((header, index) => {
        obj[header] = row[index] || '';
      });
      return obj;
    });

    return { headers, rows };
  }

  // Método para insertar datos
  async insertData(tableName: string, data: any): Promise<any> {
    try {
      const { data: result, error } = await supabase
        .from(tableName)
        .insert(data)
        .select();

      if (error) {
        throw new Error(`Error inserting data into ${tableName}: ${error.message}`);
      }

      return result;
    } catch (error: any) {
      console.error(`Error inserting data into ${tableName}:`, error);
      throw error;
    }
  }

  // Método para actualizar datos
  async updateData(tableName: string, id: string, data: any): Promise<any> {
    try {
      const { data: result, error } = await supabase
        .from(tableName)
        .update(data)
        .eq('id', id)
        .select();

      if (error) {
        throw new Error(`Error updating data in ${tableName}: ${error.message}`);
      }

      return result;
    } catch (error: any) {
      console.error(`Error updating data in ${tableName}:`, error);
      throw error;
    }
  }

  // Método para eliminar datos
  async deleteData(tableName: string, id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`Error deleting data from ${tableName}: ${error.message}`);
      }
    } catch (error: any) {
      console.error(`Error deleting data from ${tableName}:`, error);
      throw error;
    }
  }
}

export default SupabaseService;