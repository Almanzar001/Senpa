import React, { useState } from 'react';
import {
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Box,
} from '@mui/material';
import { Settings as SettingsIcon, Launch as LaunchIcon } from '@mui/icons-material';

interface ConfigFormProps {
  onSubmit: (spreadsheetId: string, apiKey: string) => void;
}

const ConfigForm: React.FC<ConfigFormProps> = ({ onSubmit }) => {
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!spreadsheetId.trim()) {
      setError('El ID de la hoja de cálculo es requerido');
      return;
    }

    if (!apiKey.trim()) {
      setError('La API Key de Google es requerida');
      return;
    }

    onSubmit(spreadsheetId.trim(), apiKey.trim());
  };

  const extractSpreadsheetId = (url: string) => {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : url;
  };

  const handleSpreadsheetIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const extractedId = extractSpreadsheetId(value);
    setSpreadsheetId(extractedId);
  };

  return (
    <div className="min-h-screen gradient-environmental-soft flex items-center justify-center p-6">
      <Card className="max-w-2xl w-full card-environmental backdrop-blur-environmental">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <SettingsIcon className="text-verde-musgo-600 mb-4" style={{ fontSize: 60 }} />
            <Typography variant="h4" className="font-display text-verde-musgo-800 mb-2">
              Dashboard Senpa
            </Typography>
            <Typography variant="h6" className="text-gris-suave-600">
              Configuración de Google Sheets
            </Typography>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert severity="error" className="mb-4">
                {error}
              </Alert>
            )}

            <TextField
              fullWidth
              label="ID o URL de Google Sheets"
              value={spreadsheetId}
              onChange={handleSpreadsheetIdChange}
              placeholder="Pega aquí la URL completa o solo el ID de tu Google Sheet"
              helperText="Puedes pegar la URL completa de Google Sheets y se extraerá automáticamente el ID"
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                },
              }}
            />

            <TextField
              fullWidth
              label="Google Sheets API Key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Ingresa tu API Key de Google Sheets"
              helperText="Obtén tu API Key desde Google Cloud Console"
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                },
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              startIcon={<LaunchIcon />}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              sx={{
                borderRadius: '12px',
                padding: '12px',
                fontSize: '1.1rem',
                fontWeight: 600,
                textTransform: 'none',
                boxShadow: '0 4px 20px rgba(59, 130, 246, 0.3)',
              }}
            >
              Cargar Dashboard
            </Button>
          </form>

          <Box className="mt-8 p-4 bg-blue-50 rounded-lg">
            <Typography variant="h6" className="font-semibold text-blue-800 mb-3">
              📋 Configuración paso a paso:
            </Typography>
            <Typography variant="body2" className="text-blue-700 space-y-2">
              <div><strong>1. Google Cloud Console:</strong></div>
              <div className="ml-4">• Ve a <a href="https://console.cloud.google.com/" target="_blank" rel="noopener" className="underline">console.cloud.google.com</a></div>
              <div className="ml-4">• Crea/selecciona un proyecto</div>
              <div className="ml-4">• Habilita "Google Sheets API"</div>
              <div className="ml-4">• Crea credenciales → API Key</div>
              
              <div className="mt-3"><strong>2. Tu Google Sheet:</strong></div>
              <div className="ml-4">• Abre tu Google Sheet</div>
              <div className="ml-4">• Clic en "Compartir" → "Cambiar a cualquier persona con el enlace"</div>
              <div className="ml-4">• Asegúrate de que tenga permisos de "Visualizador"</div>
              
              <div className="mt-3"><strong>3. Formato de datos:</strong></div>
              <div className="ml-4">• Primera fila = encabezados de columnas</div>
              <div className="ml-4">• Datos organizados en filas y columnas</div>
            </Typography>
          </Box>

          <Box className="mt-4 p-3 bg-red-50 rounded-lg">
            <Typography variant="body2" className="text-red-700">
              <strong>⚠️ Problema común:</strong> Si ves "API key expired", necesitas generar una nueva API Key en Google Cloud Console.
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConfigForm;
