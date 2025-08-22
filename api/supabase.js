// API proxy para evitar problemas de CORS con Supabase
// Ruta: /api/supabase.js maneja /api/supabase?path=...

export default async function handler(req, res) {
  const { path: apiPath, ...queryParams } = req.query;
  const supabaseUrl = 'https://nnsupabasenn.coman2uniformes.com';
  
  // Si no hay path, devolver error
  if (!apiPath) {
    return res.status(400).json({ 
      error: 'Missing path parameter',
      usage: '/api/supabase?path=rest/v1/table_name&select=*'
    });
  }
  
  // Construir la URL completa
  const queryString = Object.keys(queryParams)
    .map(key => `${key}=${encodeURIComponent(queryParams[key])}`)
    .join('&');
  
  const targetUrl = `${supabaseUrl}/${apiPath}${queryString ? '?' + queryString : ''}`;

  // Configurar CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, apikey, Prefer'
  );

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    console.log('🔄 Supabase Proxy (simple) forwarding to:', targetUrl);
    
    // Preparar headers para Supabase
    const forwardHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    // Agregar API key desde headers
    if (req.headers.apikey) {
      forwardHeaders.apikey = req.headers.apikey;
      forwardHeaders.Authorization = `Bearer ${req.headers.apikey}`;
    }
    
    if (req.headers.authorization) {
      forwardHeaders.Authorization = req.headers.authorization;
    }
    
    if (req.headers.prefer) {
      forwardHeaders.Prefer = req.headers.prefer;
    }

    // Forward the request to Supabase
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: forwardHeaders,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined
    });

    const responseText = await response.text();
    let data;
    
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      data = responseText;
    }
    
    console.log('✅ Supabase Proxy (simple) response status:', response.status);
    
    // Set response headers
    if (response.headers.get('content-type')) {
      res.setHeader('Content-Type', response.headers.get('content-type'));
    }
    
    res.status(response.status).json(data);
    
  } catch (error) {
    console.error('❌ Supabase Proxy (simple) error:', error);
    res.status(500).json({ 
      error: 'Supabase Proxy failed', 
      message: error.message,
      target: targetUrl
    });
  }
}