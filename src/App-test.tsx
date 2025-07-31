import Test from './Test';

function App() {
  return (
    <>
      <Test />
      <div className="p-8 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-primary-600 mb-4">Dashboard SENPA - Test de Estilos</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-6">
            <h2 className="metric-label mb-2">Métrica 1</h2>
            <div className="metric-value">1,234</div>
            <p className="text-neutral-600 text-sm">Descripción de la métrica</p>
          </div>
          <div className="card p-6">
            <h2 className="metric-label mb-2">Métrica 2</h2>
            <div className="metric-value">5,678</div>
            <p className="text-neutral-600 text-sm">Otra métrica importante</p>
          </div>
        </div>
        <div className="mt-8">
          <button className="btn-primary mr-4">Botón Primario</button>
          <button className="btn-outline">Botón Outline</button>
        </div>
      </div>
    </>
  );
}

export default App;