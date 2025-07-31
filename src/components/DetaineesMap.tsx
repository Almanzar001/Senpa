import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
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

// Función para crear el icono personalizado para los detenidos
const createDetaineeIcon = () => {
  if (typeof google !== 'undefined' && google.maps) {
    return {
      url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="48" viewBox="0 0 24 24" width="48"><path fill="%23C70039" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>`,
      scaledSize: new google.maps.Size(40, 40),
      anchor: new google.maps.Point(20, 40),
    };
  }
  return undefined;
};

const DetaineesMap: React.FC = () => {
  const { filteredCases, loading, error } = useData();
  const [selectedCase, setSelectedCase] = useState<EnvironmentalCase | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: CONFIG.API_KEY,
    libraries: libraries,
  });

  const casesWithDetainees = useMemo(() => {
    return filteredCases.filter(c => 
      c.detenidos > 0 &&
      c.coordenadas &&
      typeof c.coordenadas.lat === 'number' &&
      typeof c.coordenadas.lng === 'number' &&
      Math.abs(c.coordenadas.lat) <= 90 &&
      Math.abs(c.coordenadas.lng) <= 180
    );
  }, [filteredCases]);

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
        {casesWithDetainees.map((caso) => (
          <Marker
            key={caso.numeroCaso}
            position={{ lat: caso.coordenadas!.lat, lng: caso.coordenadas!.lng }}
            onClick={() => setSelectedCase(caso)}
            icon={createDetaineeIcon()}
          />
        ))}

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
                <p><strong>Total Detenidos:</strong> {selectedCase.detenidos}</p>
                {selectedCase.detenidosInfo && selectedCase.detenidosInfo.length > 0 && (
                  <div>
                    <strong>Nombres:</strong>
                    <ul className="list-disc list-inside pl-2">
                      {selectedCase.detenidosInfo.map((d: any, i: number) => <li key={i}>{d.nombre}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
      <Link
        to="/"
        className="absolute top-4 left-4 z-[1000] bg-white p-2 rounded-md shadow-lg text-blue-600 hover:bg-gray-100"
      >
        Volver al Dashboard
      </Link>
      <div className="absolute top-4 right-4 z-[1000] bg-white p-3 rounded-md shadow-lg text-sm">
        <h3 className="font-bold mb-2">Resumen de Detenidos</h3>
        <p><strong>Casos con detenidos:</strong> {casesWithDetainees.length}</p>
      </div>
    </div>
  );
};

export default DetaineesMap;