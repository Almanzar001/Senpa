// API proxy para evitar problemas de CORS con Supabase
export default async function handler(req, res) {
  const { path } = req.query;
  const supabaseUrl = 'https://nnsupabasenn.coman2uniformes.com';
  const apiPath = Array.isArray(path) ? path.join('/') : path;
  
  // Construir la URL completa manteniendo query parameters
  const queryString = Object.keys(req.query)
    .filter(key => key !== 'path') // Excluir el path del query
    .map(key => `${key}=${encodeURIComponent(req.query[key])}`)
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
    console.log('🔄 Proxy forwarding to:', targetUrl);
    
    // Preparar headers para Supabase
    const forwardHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    // Agregar API key
    if (req.headers.apikey) {
      forwardHeaders.apikey = req.headers.apikey;
      forwardHeaders.Authorization = `Bearer ${req.headers.apikey}`;
    }
    
    // Agregar otros headers importantes
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
    
    console.log('✅ Proxy response status:', response.status);
    res.status(response.status).json(data);
    
  } catch (error) {
    console.error('❌ Proxy error:', error);
    res.status(500).json({ 
      error: 'Proxy failed', 
      message: error.message,
      target: targetUrl
    });
  }
}