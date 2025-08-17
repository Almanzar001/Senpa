import React, { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  TextField,
  InputAdornment,
  Chip,
  Typography,
  Card,
  CardContent,
  Breadcrumbs
} from '@mui/material';
import { 
  Search as SearchIcon,
  ArrowBack as BackIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { useData } from '../contexts/DataContext';
import EnvironmentalTable from './EnvironmentalTable';

const OperationsPage: React.FC = () => {
  const { filteredCases, loading, error, updateCase, deleteCase } = useData();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');

  // Get filter from URL params
  const filterType = searchParams.get('filter');
  const filterValue = searchParams.get('value');

  const filteredAndSearchedCases = useMemo(() => {
    let filtered = filteredCases;
    
    // Apply URL filter if present
    if (filterType && filterValue) {
      switch (filterType) {
        case 'operativos':
          filtered = filtered.filter(c => 
            c.tipoActividad && c.tipoActividad.toLowerCase().includes('operativo')
          );
          break;
        case 'patrullas':
          filtered = filtered.filter(c => 
            c.tipoActividad && c.tipoActividad.toLowerCase().includes('patrulla')
          );
          break;
        case 'detenidos':
          filtered = filtered.filter(c => 
            c.detenidos && c.detenidos > 0
          );
          break;
        case 'vehiculos':
          filtered = filtered.filter(c => 
            c.vehiculosDetenidos && c.vehiculosDetenidos > 0
          );
          break;
        case 'incautaciones':
          filtered = filtered.filter(c => 
            c.incautaciones && c.incautaciones.length > 0
          );
          break;
        case 'notificados':
          filtered = filtered.filter(c => 
            c.notificados && c.notificados > 0
          );
          break;
        case 'procuraduria':
          filtered = filtered.filter(c => 
            c.procuraduria === true
          );
          break;
      }
    }
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(caso => 
        Object.values(caso).some(value => 
          value && value.toString().toLowerCase().includes(term)
        )
      );
    }
    
    return filtered;
  }, [filteredCases, searchTerm, filterType, filterValue]);

  const clearFilter = () => {
    setSearchParams({});
  };

  const getFilterDisplayName = (type: string) => {
    const names: Record<string, string> = {
      operativos: 'Operativos Realizados',
      patrullas: 'Patrullas',
      detenidos: 'Detenidos',
      vehiculos: 'Vehículos Detenidos',
      incautaciones: 'Incautaciones',
      notificados: 'Notificados',
      procuraduria: 'Procuraduría'
    };
    return names[type] || type;
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">Cargando operaciones...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-red-600">
          <p>Error al cargar los datos: {error}</p>
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
            <Typography color="text.primary">Operaciones Detalladas</Typography>
          </Breadcrumbs>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-neutral-800 mb-2">
                Operaciones Detalladas
              </h1>
              {filterType && (
                <div className="flex items-center gap-2">
                  <Chip 
                    label={`Filtrado por: ${getFilterDisplayName(filterType)}`}
                    color="primary"
                    onDelete={clearFilter}
                    deleteIcon={<ClearIcon />}
                  />
                </div>
              )}
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

        {/* Stats Card */}
        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-sm text-neutral-600">Total de Operaciones</p>
                  <p className="text-2xl font-bold text-neutral-800">
                    {filteredAndSearchedCases.length.toLocaleString()}
                  </p>
                </div>
                {filterType && (
                  <div>
                    <p className="text-sm text-neutral-600">Mostrando</p>
                    <p className="text-lg font-semibold text-primary-600">
                      {getFilterDisplayName(filterType)}
                    </p>
                  </div>
                )}
              </div>
              <TextField
                size="small"
                placeholder="Buscar en operaciones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                className="w-64"
              />
            </div>
          </CardContent>
        </Card>

        {/* Operations Table with Editing Capabilities */}
        <EnvironmentalTable
          cases={filteredAndSearchedCases}
          onUpdateCase={updateCase}
          onDeleteCase={deleteCase}
          isEditable={true}
        />

      </div>
    </div>
  );
};

export default OperationsPage;