
function TestApp() {
  return (
    <div style={{ padding: '20px', backgroundColor: '#f0f0f0', minHeight: '100vh' }}>
      <h1 style={{ color: '#333', fontSize: '32px' }}>¡Test Dashboard SENPA!</h1>
      <p style={{ color: '#666', fontSize: '18px' }}>
        Si puedes ver este mensaje, React está funcionando correctamente.
      </p>
      <div style={{ 
        backgroundColor: '#22c55e', 
        color: 'white', 
        padding: '20px', 
        borderRadius: '8px',
        marginTop: '20px'
      }}>
        <h2>Dashboard Ambiental SENPA</h2>
        <p>Prueba de visualización básica</p>
      </div>
    </div>
  );
}

export default TestApp;