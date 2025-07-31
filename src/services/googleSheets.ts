import axios from 'axios';

export interface SheetData {
  name: string;
  data: (string | number)[][];
}

export interface GoogleSheetsConfig {
  spreadsheetId: string;
  apiKey: string;
  sheetNames?: string[];
}

class GoogleSheetsService {
  private apiKey: string;
  private baseUrl = 'https://sheets.googleapis.com/v4/spreadsheets';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getSheetData(spreadsheetId: string, sheetName: string): Promise<SheetData> {
    try {
      const url = `${this.baseUrl}/${spreadsheetId}/values/${sheetName}?key=${this.apiKey}`;
      const response = await axios.get(url);
      
      return {
        name: sheetName,
        data: response.data.values || []
      };
    } catch (error: any) {
      console.error(`Error fetching sheet ${sheetName}:`, error);
      
      if (error.response?.status === 400) {
        throw new Error(`API Key inválida o expirada. Por favor, genera una nueva API Key en Google Cloud Console.`);
      } else if (error.response?.status === 403) {
        throw new Error(`Sin permisos para acceder a la hoja "${sheetName}". Verifica que el Google Sheet esté compartido públicamente o que la API Key tenga permisos.`);
      } else if (error.response?.status === 404) {
        throw new Error(`No se encontró la hoja "${sheetName}" o el Google Sheet. Verifica el ID del spreadsheet.`);
      }
      
      throw new Error(`Error al obtener datos de "${sheetName}": ${error.response?.data?.error?.message || error.message}`);
    }
  }

  async getAllSheets(spreadsheetId: string): Promise<string[]> {
    try {
      const url = `${this.baseUrl}/${spreadsheetId}?key=${this.apiKey}`;
      const response = await axios.get(url);
      
      return response.data.sheets.map((sheet: any) => sheet.properties.title);
    } catch (error: any) {
      console.error('Error fetching sheet names:', error);
      
      if (error.response?.status === 400) {
        throw new Error(`API Key inválida o expirada. Por favor, genera una nueva API Key en Google Cloud Console.`);
      } else if (error.response?.status === 403) {
        throw new Error(`Sin permisos para acceder al Google Sheet. Verifica que esté compartido públicamente o que la API Key tenga permisos.`);
      } else if (error.response?.status === 404) {
        throw new Error(`No se encontró el Google Sheet. Verifica que el ID sea correcto y que el documento exista.`);
      }
      
      throw new Error(`Error al obtener las hojas del spreadsheet: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  async getMultipleSheets(spreadsheetId: string, sheetNames?: string[]): Promise<SheetData[]> {
    try {
      const sheets = sheetNames || await this.getAllSheets(spreadsheetId);
      const promises = sheets.map(sheetName => this.getSheetData(spreadsheetId, sheetName));
      
      return await Promise.all(promises);
    } catch (error) {
      console.error('Error fetching multiple sheets:', error);
      throw new Error('Failed to fetch multiple sheets');
    }
  }

  processSheetData(sheetData: SheetData): {
    headers: string[];
    rows: Record<string, any>[];
  } {
    if (sheetData.data.length === 0) {
      return { headers: [], rows: [] };
    }

    const headers = sheetData.data[0] as string[];
    const rows = sheetData.data.slice(1).map(row => {
      const obj: Record<string, any> = {};
      headers.forEach((header, index) => {
        obj[header] = row[index] || '';
      });
      return obj;
    });

    return { headers, rows };
  }
}

export default GoogleSheetsService;