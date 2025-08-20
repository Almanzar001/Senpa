import React, { useState, useEffect } from 'react';
import { CONFIG } from '../config';
import { supabase } from '../config';

const DebugInfo: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [testResult, setTestResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Recopilar información de configuración
    const info = {
      supabaseUrl: CONFIG.SUPABASE_URL,
      supabaseKeyLength: CONFIG.SUPABASE_ANON_KEY.length,
      supabaseKeyStart: CONFIG.SUPABASE_ANON_KEY.substring(0, 20) + '...',
      environment: import.meta.env.MODE,
      origin: window.location.origin,
      userAgent: navigator.userAgent,
      supabaseClient: !!supabase,
      timestamp: new Date().toISOString()
    };
    setDebugInfo(info);
  }, []);

  const testConnection = async () => {
    setLoading(true);
    setTestResult('Probando conexión...');

    try {
      console.log('🔍 Test: Iniciando prueba de conexión');
      console.log('🔍 Test: URL:', CONFIG.SUPABASE_URL);
      console.log('🔍 Test: API Key:', CONFIG.SUPABASE_ANON_KEY.substring(0, 20) + '...');

      if (!supabase) {
        setTestResult('❌ ERROR: Cliente Supabase no inicializado');
        return;
      }

      // Probar conexión básica
      const { data, error, status, statusText } = await supabase
        .from('detenidos')
        .select('id, numerocaso, nombre')
        .limit(1);

      console.log('🔍 Test: Response status:', status);
      console.log('🔍 Test: Response data:', data);
      console.log('🔍 Test: Response error:', error);

      if (error) {
        setTestResult(`❌ ERROR: ${error.message}\nDetalles: ${JSON.stringify(error, null, 2)}`);
      } else {
        setTestResult(`✅ ÉXITO: Conectado correctamente\nDatos recibidos: ${data?.length || 0} registros\nPrimer registro: ${JSON.stringify(data?.[0] || {}, null, 2)}`);
      }
    } catch (err: any) {
      console.error('🔍 Test: Error completo:', err);
      setTestResult(`❌ EXCEPCIÓN: ${err.message}\nStack: ${err.stack}`);
    } finally {
      setLoading(false);
    }
  };

  const testDirectFetch = async () => {
    setLoading(true);
    setTestResult('Probando fetch directo...');

    try {
      const url = `${CONFIG.SUPABASE_URL}/rest/v1/detenidos?limit=1`;
      const headers = {
        'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`,
        'apikey': CONFIG.SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };

      console.log('🔍 Direct Test: URL:', url);
      console.log('🔍 Direct Test: Headers:', headers);

      const response = await fetch(url, {
        method: 'GET',
        headers
      });

      console.log('🔍 Direct Test: Response status:', response.status);
      console.log('🔍 Direct Test: Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        setTestResult(`❌ ERROR HTTP ${response.status}: ${response.statusText}\nResponse: ${errorText}`);
      } else {
        const data = await response.json();
        setTestResult(`✅ FETCH DIRECTO ÉXITO\nStatus: ${response.status}\nDatos: ${JSON.stringify(data, null, 2)}`);
      }
    } catch (err: any) {
      console.error('🔍 Direct Test: Error:', err);
      setTestResult(`❌ FETCH ERROR: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-gray-900">🔧 Debug Information</h1>

        {/* Información de Configuración */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">📋 Configuración Actual</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>

        {/* Botones de Prueba */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">🧪 Pruebas de Conexión</h2>
          <div className="flex space-x-4 mb-4">
            <button
              onClick={testConnection}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Probando...' : 'Probar Supabase Client'}
            </button>
            <button
              onClick={testDirectFetch}
              disabled={loading}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Probando...' : 'Probar Fetch Directo'}
            </button>
          </div>

          {testResult && (
            <div className="bg-gray-100 p-4 rounded">
              <h3 className="font-medium mb-2">Resultado de la Prueba:</h3>
              <pre className="whitespace-pre-wrap text-sm">{testResult}</pre>
            </div>
          )}
        </div>

        {/* Variables de Entorno */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">🌍 Variables de Entorno</h2>
          <div className="space-y-2 text-sm">
            <div><strong>VITE_SUPABASE_URL:</strong> {import.meta.env.VITE_SUPABASE_URL || 'No definida'}</div>
            <div><strong>VITE_SUPABASE_ANON_KEY:</strong> {import.meta.env.VITE_SUPABASE_ANON_KEY ? `${import.meta.env.VITE_SUPABASE_ANON_KEY.substring(0, 20)}...` : 'No definida'}</div>
            <div><strong>MODE:</strong> {import.meta.env.MODE}</div>
            <div><strong>PROD:</strong> {import.meta.env.PROD ? 'true' : 'false'}</div>
          </div>
        </div>

        {/* Instrucciones */}
        <div className="bg-blue-50 border-l-4 border-blue-400 p-6">
          <h2 className="text-lg font-semibold mb-2 text-blue-800">💡 Instrucciones</h2>
          <ul className="list-disc list-inside text-blue-700 space-y-1">
            <li>Verifica que SUPABASE_URL sea: https://nnsupabasenn.coman2uniformes.com</li>
            <li>Verifica que SUPABASE_ANON_KEY tenga el valor correcto</li>
            <li>Prueba ambos botones para ver dónde está el problema</li>
            <li>Revisa la consola del navegador para más detalles</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DebugInfo;