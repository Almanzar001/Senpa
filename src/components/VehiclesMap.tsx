import React, { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { useData } from '../contexts/DataContext';
import { type EnvironmentalCase } from '../services/environmentalAnalytics';
import { CONFIG } from '../config';

const containerStyle = {
  width: '100%',
  height: '100vh'
};

const center = {
  lat: 18.7357,
  lng: -70.1627
};

const libraries: "visualization"[] = ["visualization"];

// Función para crear el icono personalizado con el logo de vehículos detenidos SENPA
const createVehicleIcon = () => {
  if (typeof google !== 'undefined' && google.maps) {
    const icon = {
      url: `${window.location.origin}/senpa-vehicle-icon.png`,
      scaledSize: new google.maps.Size(35, 35),
      anchor: new google.maps.Point(17, 17),
    };
    console.log('🎯 Icono creado con URL completa:', icon);
    return icon;
  }
  console.log('❌ Google Maps no disponible para crear icono');
  return undefined;
};

const VehiclesMap: React.FC = () => {
  const { filteredCases, loading, error, filters } = useData();
  const [selectedCase, setSelectedCase] = useState<EnvironmentalCase | null>(null);
  const [searchParams] = useSearchParams();
  
  // Determine return destination based on "from" query parameter
  const returnTo = searchParams.get('from') === 'executive' ? '/' : '/dashboard';
  const returnLabel = searchParams.get('from') === 'executive' ? 'Volver al Dashboard Ejecutivo' : 'Volver al Dashboard';

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: CONFIG.GOOGLE_MAPS_API_KEY,
    libraries: libraries,
  });

  const casesWithVehicles = useMemo(() => {
    console.log('📊 Total filteredCases en mapa:', filteredCases.length);
    console.log('📊 Filtros aplicados en mapa:', { 
      dateFrom: filters.dateFrom, 
      dateTo: filters.dateTo 
    });
    console.log('📊 Primeros 3 casos:', filteredCases.slice(0, 3));
    
    const vehicleCases = filteredCases.filter(c => {
      const hasVehicles = c.vehiculosDetenidos > 0;
      const hasCoords = c.coordenadas && 
        typeof c.coordenadas.lat === 'number' && 
        typeof c.coordenadas.lng === 'number' &&
        Math.abs(c.coordenadas.lat) <= 90 &&
        Math.abs(c.coordenadas.lng) <= 180;
      
      if (hasVehicles && !hasCoords) {
        console.log('🚗 Caso con vehículos pero sin coordenadas válidas:', c.numeroCaso, c.coordenadas);
      }
      
      return hasVehicles && hasCoords;
    });
    
    console.log('🚗 Casos con vehículos y coordenadas válidas (filtrados):', vehicleCases.length);
    console.log('🚗 Casos con vehículos (muestra fechas):', vehicleCases.slice(0, 5).map(c => ({ 
      numeroCaso: c.numeroCaso, 
      fecha: c.fecha, 
      vehiculos: c.vehiculosDetenidos 
    })));
    
    return vehicleCases;
  }, [filteredCases, filters.dateFrom, filters.dateTo]);

  if (loading || !isLoaded) {
    return <div className="flex justify-center items-center h-screen">Cargando mapa...</div>;
  }

  if (error || loadError) {
    return <div className="flex justify-center items-center h-screen text-red-500">{error || loadError?.message}</div>;
  }

  return (
    <div className="relative h-screen w-screen">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={8}
        onClick={() => setSelectedCase(null)} // Cierra la InfoWindow al hacer clic en el mapa
      >
        {casesWithVehicles.map((caso) => {
          const position = { lat: caso.coordenadas!.lat, lng: caso.coordenadas!.lng };
          console.log(`📍 Renderizando marcador para caso ${caso.numeroCaso}:`, position, `Vehículos: ${caso.vehiculosDetenidos}`);
          return (
            <Marker
              key={caso.numeroCaso}
              position={position}
              onClick={() => setSelectedCase(caso)}
              icon={createVehicleIcon()}
            />
          );
        })}

        {selectedCase && (
          <InfoWindow
            position={{ lat: selectedCase.coordenadas!.lat, lng: selectedCase.coordenadas!.lng }}
            onCloseClick={() => setSelectedCase(null)}
          >
            <div className="p-2 font-sans max-w-xs">
              <h3 className="font-bold text-base mb-2 text-gray-800">{selectedCase.numeroCaso}</h3>
              <div className="space-y-1 text-sm">
                <p><strong>Fecha:</strong> {selectedCase.fecha}</p>
                <p><strong>Provincia:</strong> {selectedCase.provincia}</p>
                <p><strong>Total Vehículos:</strong> {selectedCase.vehiculosDetenidos}</p>
                {selectedCase.vehiculosInfo && selectedCase.vehiculosInfo.length > 0 && (
                  <div>
                    <strong>Vehículos:</strong>
                    <ul className="list-disc list-inside pl-2">
                      {selectedCase.vehiculosInfo.map((v: any, i: number) => (
                        <li key={i}>
                          {v.tipo} {v.marca && `- ${v.marca}`} {v.color && `(${v.color})`}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
      <Link
        to={returnTo}
        className="absolute top-4 left-4 z-[1000] bg-white p-2 rounded-md shadow-lg text-blue-600 hover:bg-gray-100"
      >
        {returnLabel}
      </Link>
      <div className="absolute top-4 right-4 z-[1000] bg-white p-3 rounded-md shadow-lg text-sm">
        <h3 className="font-bold mb-2">Resumen de Vehículos</h3>
        <p><strong>Total casos:</strong> {filteredCases.length}</p>
        <p><strong>Casos con vehículos:</strong> {casesWithVehicles.length}</p>
        {(filters.dateFrom || filters.dateTo) && (
          <div className="mt-2 p-2 bg-blue-50 rounded">
            <p className="text-blue-700 font-medium">📅 Filtros de fecha:</p>
            <p className="text-blue-600 text-xs">
              Desde: {filters.dateFrom || 'Sin límite'}
            </p>
            <p className="text-blue-600 text-xs">
              Hasta: {filters.dateTo || 'Sin límite'}
            </p>
          </div>
        )}
        <p><strong>Estado mapa:</strong> {isLoaded ? '✅ Cargado' : '⏳ Cargando'}</p>
      </div>
    </div>
  );
};

export default VehiclesMap;