import React, { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Chip,
  Alert,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  BugReport as BugIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { useData } from '../contexts/DataContext';
import EnvironmentalAnalyticsService from '../services/environmentalAnalytics';
import { debugDateParsing } from '../utils/dateUtils';

const DataIntegrityPanel: React.FC = () => {
  const { cases, loading } = useData();
  const [selectedCaseNumber, setSelectedCaseNumber] = useState('');
  const [debugResults, setDebugResults] = useState<any>(null);
  
  const analyticsService = useMemo(() => new EnvironmentalAnalyticsService(), []);

  // Validar integridad de datos
  const integrity = useMemo(() => {
    if (!cases || cases.length === 0) return null;
    
    // Convertir casos a formato SheetData para validación
    const sheetsData = [
      {
        name: 'casos_combinados',
        data: [
          Object.keys(cases[0]),
          ...cases.map(caso => Object.values(caso))
        ]
      }
    ];
    
    return analyticsService.validateDataIntegrity(sheetsData);
  }, [cases, analyticsService]);

  const handleDebugCase = () => {
    if (!selectedCaseNumber.trim()) return;
    
    // Primero cargar los casos en el analytics service
    if (cases) {
      cases.forEach(caso => analyticsService.cases.set(caso.numeroCaso, caso));
    }
    
    const result = analyticsService.debugCase(selectedCaseNumber.trim());
    setDebugResults(result);
  };

  const handleDebugDate = (dateString: string) => {
    return debugDateParsing(dateString);
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Typography>Cargando datos para validación...</Typography>
        </CardContent>
      </Card>
    );
  }

  if (!integrity) {
    return (
      <Card>
        <CardContent>
          <Typography color="text.secondary">
            No hay datos para validar
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box sx={{ width: '100%', maxWidth: 1200, margin: '0 auto', padding: 2 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <BugIcon color="primary" />
        Panel de Integridad de Datos SENPA
      </Typography>

      {/* Resumen de estadísticas */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            📊 Resumen de Datos
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
            <Chip 
              label={`Total de casos: ${integrity.stats.totalCases}`}
              color="primary"
              variant="outlined"
            />
            <Chip 
              label={`Tablas analizadas: ${integrity.stats.tablesAnalyzed}`}
              color="info"
              variant="outlined"
            />
            <Chip 
              label={`Fechas inválidas: ${integrity.stats.invalidDates}`}
              color={integrity.stats.invalidDates > 0 ? "warning" : "success"}
              variant="outlined"
            />
            <Chip 
              label={`Duplicados: ${integrity.stats.duplicatedCaseNumbers.length}`}
              color={integrity.stats.duplicatedCaseNumbers.length > 0 ? "error" : "success"}
              variant="outlined"
            />
          </Box>
        </CardContent>
      </Card>

      {/* Errores */}
      {integrity.errors.length > 0 && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Alert severity="error" icon={<ErrorIcon />} sx={{ mb: 2 }}>
              Se encontraron {integrity.errors.length} errores críticos
            </Alert>
            <List dense>
              {integrity.errors.map((error, index) => (
                <ListItem key={index}>
                  <ListItemText primary={error} />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Advertencias */}
      {integrity.warnings.length > 0 && (
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <WarningIcon color="warning" />
              <Typography>
                Advertencias ({integrity.warnings.length})
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <List dense>
              {integrity.warnings.map((warning, index) => (
                <ListItem key={index}>
                  <ListItemText primary={warning} />
                </ListItem>
              ))}
            </List>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Duplicados */}
      {integrity.stats.duplicatedCaseNumbers.length > 0 && (
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ErrorIcon color="error" />
              <Typography>
                Casos Duplicados ({integrity.stats.duplicatedCaseNumbers.length})
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {integrity.stats.duplicatedCaseNumbers.map((numeroCaso, index) => (
                <Chip 
                  key={index}
                  label={numeroCaso}
                  color="error"
                  variant="outlined"
                  onClick={() => setSelectedCaseNumber(numeroCaso)}
                  sx={{ cursor: 'pointer' }}
                />
              ))}
            </Box>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Debug de caso específico */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SearchIcon color="primary" />
            <Typography>Debug de Caso Específico</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              label="Número de Caso"
              value={selectedCaseNumber}
              onChange={(e) => setSelectedCaseNumber(e.target.value)}
              size="small"
              placeholder="Ej: CASO-20250821-123456"
            />
            <Button 
              variant="contained" 
              onClick={handleDebugCase}
              disabled={!selectedCaseNumber.trim()}
            >
              Analizar
            </Button>
          </Box>

          {debugResults && (
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Resultado del Debug: {debugResults.numeroCaso}
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Información Básica:
                  </Typography>
                  <Typography variant="body2" component="pre" sx={{ 
                    backgroundColor: '#f5f5f5', 
                    p: 1, 
                    borderRadius: 1, 
                    fontSize: '0.8em',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {JSON.stringify({
                      numeroCaso: debugResults.numeroCaso,
                      fecha: debugResults.fecha,
                      provincia: debugResults.provincia,
                      region: debugResults.region,
                      tipoActividad: debugResults.tipoActividad,
                      detenidos: debugResults.detenidos,
                      vehiculosDetenidos: debugResults.vehiculosDetenidos,
                      notificados: debugResults.notificados,
                      procuraduria: debugResults.procuraduria
                    }, null, 2)}
                  </Typography>
                </Box>

                {debugResults.fecha && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Debug de Fecha:
                    </Typography>
                    <Button
                      size="small"
                      onClick={() => handleDebugDate(debugResults.fecha)}
                      variant="outlined"
                    >
                      Analizar parsing de fecha: {debugResults.fecha}
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          )}

          {debugResults === null && selectedCaseNumber && (
            <Alert severity="warning">
              Caso "{selectedCaseNumber}" no encontrado
            </Alert>
          )}
        </AccordionDetails>
      </Accordion>

      {/* Información adicional */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <InfoIcon color="info" />
            <Typography>Información del Sistema</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <List>
            <ListItem>
              <ListItemText 
                primary="Casos cargados en memoria"
                secondary={`${cases?.length || 0} casos`}
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Tablas configuradas"
                secondary="notas_informativas, detenidos, incautaciones, vehiculos"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Sistema de fechas"
                secondary="Formato preferido: DD/MM/YYYY (Dominicano), soporta ISO y US"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Relación entre tablas"
                secondary="Campo 'numerocaso' conecta todas las tablas"
              />
            </ListItem>
          </List>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default DataIntegrityPanel;