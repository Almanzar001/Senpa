import React from 'react';

const Test: React.FC = () => {
  return (
    <div className="p-8 bg-red-500 text-white">
      <h1 className="text-4xl font-bold mb-4">Tailwind Test</h1>
      <p className="text-lg">Si ves este texto en blanco sobre fondo rojo, Tailwind funciona!</p>
      <div className="mt-4 p-4 bg-blue-500 rounded-lg">
        <p>Este div debería ser azul con esquinas redondeadas</p>
      </div>
    </div>
  );
};

export default Test;