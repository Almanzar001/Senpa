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
import { supabaseCrudService } from '../services/supabaseCrud';
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
    const loadData = async () => {
      if (cases && cases.length > 0) {
        try {
          console.log('🔍 NotificadosPage - Cargando datos desde Supabase...');
          
          // Cargar datos desde Supabase
          const notasData = await supabaseCrudService.getAll('notas_informativas');
          const notificadosData = (notasData as NotaInformativa[]).filter(nota => 
            nota.notificados && nota.notificados.toString().trim() !== ''
          );
          
          console.log('✅ NotificadosPage - Datos cargados:', notificadosData.length, 'registros con notificados');
          setNotificadosData(notificadosData);
          setError(null);
        } catch (err) {
          console.error('❌ NotificadosPage - Error cargando datos:', err);
          setError(err instanceof Error ? err.message : 'Error al cargar notificados');
        }
      }
    };
    
    loadData();
  }, [cases]);

  // Handle update with proper notificados logic
  const handleUpdate = async (item: NotaInformativa) => {
    console.log('🔄 NotificadosPage handleUpdate called with:', item);
    try {
      // Actualizar en Supabase
      await supabaseCrudService.update('notas_informativas', item.id, item);
      
      // Recargar datos desde Supabase
      const notasData = await supabaseCrudService.getAll('notas_informativas');
      const notificadosData = (notasData as NotaInformativa[]).filter(nota => 
        nota.notificados && nota.notificados.toString().trim() !== ''
      );
      
      setNotificadosData(notificadosData);
      
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

  const handleDelete = async (id: string) => {
    try {
      await supabaseCrudService.delete('notas_informativas', id);
      
      // Recargar datos desde Supabase
      const notasData = await supabaseCrudService.getAll('notas_informativas');
      const notificadosData = (notasData as NotaInformativa[]).filter(nota => 
        nota.notificados && nota.notificados.toString().trim() !== ''
      );
      
      setNotificadosData(notificadosData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar');
    }
  };

  const handleCreate = async (item: NotaInformativa) => {
    try {
      await supabaseCrudService.create('notas_informativas', item);
      
      // Recargar datos desde Supabase
      const notasData = await supabaseCrudService.getAll('notas_informativas');
      const notificadosData = (notasData as NotaInformativa[]).filter(nota => 
        nota.notificados && nota.notificados.toString().trim() !== ''
      );
      
      setNotificadosData(notificadosData);
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
          loading={loading}
          title="Notificados"
        />
      </div>
    </div>
  );
};

export default NotificadosPage;