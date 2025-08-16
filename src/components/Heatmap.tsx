import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { GoogleMap, useJsApiLoader, HeatmapLayer } from '@react-google-maps/api';
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

const Heatmap: React.FC = () => {
  const { filteredCases, loading, error } = useData();

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: CONFIG.GOOGLE_MAPS_API_KEY,
    libraries: libraries,
  });

  const operativos = useMemo(() => {
    return filteredCases.filter(c => c.tipoActividad && c.tipoActividad.trim().toLowerCase() === 'operativo');
  }, [filteredCases]);

  const points = useMemo(() => {
    return operativos
      .filter((c: EnvironmentalCase) => {
        const hasValidCoords = c.coordenadas &&
                               typeof c.coordenadas.lat === 'number' &&
                               typeof c.coordenadas.lng === 'number' &&
                               Math.abs(c.coordenadas.lat) <= 90 &&
                               Math.abs(c.coordenadas.lng) <= 180;
        return hasValidCoords;
      })
      .map((c: EnvironmentalCase) => new google.maps.LatLng(c.coordenadas!.lat, c.coordenadas!.lng));
  }, [operativos]);

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
      >
        {points.length > 0 && (
          <HeatmapLayer
            data={points}
            options={{
              radius: 20,
              opacity: 0.6
            }}
          />
        )}
      </GoogleMap>
      <Link
        to="/"
        className="absolute top-4 left-4 z-[1000] bg-white p-2 rounded-md shadow-lg text-blue-600 hover:bg-gray-100"
      >
        Volver al Dashboard
      </Link>
      <div className="absolute top-4 right-4 z-[1000] bg-white p-3 rounded-md shadow-lg text-sm">
        <h3 className="font-bold mb-2">Resumen del Mapa</h3>
        <p><strong>Total de operativos:</strong> {operativos.length}</p>
        <p><strong>Mostrados en mapa:</strong> {points.length}</p>
        {operativos.length !== points.length && (
          <p className="text-xs text-gray-500 mt-1">
            ({operativos.length - points.length} operativos sin coordenadas)
          </p>
        )}
      </div>
    </div>
  );
};

export default Heatmap;