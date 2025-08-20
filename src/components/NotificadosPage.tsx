import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Typography,
  Card,
  CardContent,
  Breadcrumbs,
  Alert,
  Box
} from '@mui/material';
import { 
  ArrowBack as BackIcon
} from '@mui/icons-material';
import type { NotaInformativa } from '../types/tableTypes';
import { notasInformativasService } from '../services/tableServices';
import GenericTable from './GenericTable';
import { useData } from '../contexts/DataContext';
import { usePermissions } from '../hooks/usePermissions';

const NotificadosPage: React.FC = () => {
  const { cases, loading: dataLoading, error: dataError, updateCase } = useData();
  const permissions = usePermissions();
  const [error, setError] = useState<string | null>(null);
  const [notificadosData, setNotificadosData] = useState<NotaInformativa[]>([]);

  // Load and map data from cases with notificados
  useEffect(() => {
    if (cases && cases.length > 0) {
      try {
        console.log('🔍 Total cases:', cases.length);
        console.log('🔍 Checking notificados fields in first 5 cases:');
        cases.slice(0, 5).forEach((c, i) => {
          console.log(`  ${i+1}. ${c.numeroCaso}:`, {
            notificados: c.notificados,
            notificadosType: typeof c.notificados,
            notificadosInfo: c.notificadosInfo,
            notificadosInfoType: typeof c.notificadosInfo
          });
        });
        
        // Filter cases where the TEXT field "notificados" has names (not empty)
        const casesWithNotificados = cases.filter(c => {
          // Now notificados should be a string with actual names
          const notificadosText = c.notificados;
          const hasNotificados = notificadosText && 
                               typeof notificadosText === 'string' && 
                               notificadosText.trim() !== '';
          
          if (hasNotificados) {
            console.log('✅ Case with notificados:', c.numeroCaso, 'notificados:', notificadosText);
          }
          
          return hasNotificados;
        });
        
        console.log('🔍 Total cases with notificados:', casesWithNotificados.length);

        // Map to NotaInformativa format
        const mappedNotificados: NotaInformativa[] = casesWithNotificados.map(envCase => ({
          id: `nota_${envCase.numeroCaso}`,
          numeroCaso: envCase.numeroCaso,
          fecha: envCase.fecha,
          hora: envCase.hora,
          provincia: envCase.provincia,
          localidad: envCase.localidad,
          region: envCase.region,
          tipoActividad: envCase.tipoActividad,
          areaTemática: envCase.areaTemática,
          notificados: envCase.notificados || '',
          procuraduria: envCase.procuraduria,
          resultado: envCase.resultado || '',
          observaciones: '',
          coordenadas: envCase.coordenadas
        }));

        // Update service and state
        notasInformativasService.items.clear();
        mappedNotificados.forEach(nota => notasInformativasService.items.set(nota.id, nota));
        setNotificadosData(mappedNotificados);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar notificados');
      }
    }
  }, [cases]);

  // Handle update with proper notificados logic
  const handleUpdate = async (item: NotaInformativa) => {
    console.log('🔄 NotificadosPage handleUpdate called with:', item);
    try {
      // Update local service
      notasInformativasService.update(item);
      setNotificadosData(notasInformativasService.getAll());
      
      // Find original case
      const originalCase = cases.find(c => c.numeroCaso === item.numeroCaso);
      
      if (originalCase) {
        const updatedCase = {
          ...originalCase,
          fecha: item.fecha,
          hora: item.hora,
          provincia: item.provincia,
          localidad: item.localidad,
          region: item.region,
          tipoActividad: item.tipoActividad,
          areaTemática: item.areaTemática,
          // Update notificados as TEXT field (contains the actual names)
          notificados: String(item.notificados || ''), // This goes to the TEXT field in database
          procuraduria: item.procuraduria,
          resultado: item.resultado
        };
        
        // Update in database
        console.log('💾 About to updateCase with:', updatedCase);
        await updateCase(updatedCase);
        console.log('✅ updateCase completed successfully');
        
        // Update local data immediately
        const updatedCases = cases.map(c => 
          c.numeroCaso === updatedCase.numeroCaso ? updatedCase : c
        );
        
        // Re-filter and re-map with updated data
        const casesWithNotificados = updatedCases.filter(c => {
          return c.notificados && 
                 typeof c.notificados === 'string' && 
                 c.notificados.trim() !== '';
        });

        const remappedNotificados: NotaInformativa[] = casesWithNotificados.map(envCase => ({
          id: `nota_${envCase.numeroCaso}`,
          numeroCaso: envCase.numeroCaso,
          fecha: envCase.fecha,
          hora: envCase.hora,
          provincia: envCase.provincia,
          localidad: envCase.localidad,
          region: envCase.region,
          tipoActividad: envCase.tipoActividad,
          areaTemática: envCase.areaTemática,
          notificados: envCase.notificados || '',
          procuraduria: envCase.procuraduria,
          resultado: envCase.resultado || '',
          observaciones: '',
          coordenadas: envCase.coordenadas
        }));

        setNotificadosData(remappedNotificados);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar');
    }
  };

  const handleDelete = (id: string) => {
    try {
      notasInformativasService.delete(id);
      setNotificadosData(notasInformativasService.getAll());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar');
    }
  };

  const handleCreate = (item: NotaInformativa) => {
    try {
      notasInformativasService.add(item);
      setNotificadosData(notasInformativasService.getAll());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear');
    }
  };

  const loading = dataLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">Cargando notificados...</p>
        </div>
      </div>
    );
  }

  if (dataError || error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-red-600">
          <p>Error al cargar los datos: {dataError || error}</p>
          <Link to="/" className="text-blue-600 hover:underline mt-2 inline-block">
            Volver al Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Breadcrumbs className="mb-4">
            <Link to="/" className="text-blue-600 hover:underline">
              Dashboard
            </Link>
            <Typography color="text.primary">Notificados</Typography>
          </Breadcrumbs>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-neutral-800 mb-2">
                Personas Notificadas
              </h1>
              <Box>
                <Typography color="text.secondary">
                  Gestión de casos con personas notificadas
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {notificadosData.length} casos con notificaciones registradas
                </Typography>
              </Box>
            </div>
            <Link
              to="/"
              className="flex items-center gap-2 px-4 py-2 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
            >
              <BackIcon />
              Volver al Dashboard
            </Link>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Table */}
        <GenericTable
          tableType="notas_informativas"
          data={notificadosData}
          onUpdate={permissions.canEditRecords ? handleUpdate : () => {}}
          onDelete={permissions.canDeleteRecords ? handleDelete : () => {}}
          onCreate={() => {}} // Disabled - data comes from n8n automation
          loading={loading}
          title="Notificados"
          allowCreate={false} // Disabled - data comes from n8n automation
        />
      </div>
    </div>
  );
};

export default NotificadosPage;