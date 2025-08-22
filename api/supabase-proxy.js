// API proxy directo para Supabase - maneja todas las rutas
export default async function handler(req, res) {
  const supabaseUrl = 'https://nnsupabasenn.coman2uniformes.com';
  
  // Obtener la ruta original del header 'x-vercel-forwarded-for' o del referer
  const url = new URL(req.url, `https://${req.headers.host}`);
  
  // Vercel rewrite pasa la ruta original, necesitamos reconstruirla
  // Las peticiones vienen como /rest/v1/tabla?query=... y se reescriben a /api/supabase-proxy
  // Necesitamos obtener la ruta original desde algún header o la query string
  
  let targetPath = '';
  
  // Intentar obtener la ruta desde diferentes fuentes
  if (req.headers['x-now-route-matches']) {
    // Vercel pasa información de la ruta en este header
    const routeInfo = JSON.parse(req.headers['x-now-route-matches']);
    targetPath = routeInfo['0'] || '';
  } else if (url.searchParams.has('path')) {
    // Si pasamos el path como query parameter
    targetPath = url.searchParams.get('path');
    url.searchParams.delete('path'); // Removemos el path del query string
  } else {
    // Como último recurso, intentar extraer del referer
    const referer = req.headers.referer || '';
    if (referer.includes('/rest/v1/')) {
      targetPath = referer.substring(referer.indexOf('/rest/v1/'));
      const queryIndex = targetPath.indexOf('?');
      if (queryIndex > 0) targetPath = targetPath.substring(0, queryIndex);
    } else {
      targetPath = '/rest/v1/notas_informativas'; // default para testing
    }
  }
  
  // Asegurar que targetPath empiece con /
  if (targetPath && !targetPath.startsWith('/')) {
    targetPath = `/${targetPath}`;
  }
  
  const targetUrl = `${supabaseUrl}${targetPath}${url.search}`;

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
    console.log('🔄 Direct Supabase Proxy to:', targetUrl);
    console.log('📝 Request method:', req.method);
    console.log('📋 Request headers:', JSON.stringify(req.headers, null, 2));
    
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
    
    if (req.headers.authorization) {
      forwardHeaders.Authorization = req.headers.authorization;
    }
    
    if (req.headers.prefer) {
      forwardHeaders.Prefer = req.headers.prefer;
    }

    console.log('📤 Forward headers:', JSON.stringify(forwardHeaders, null, 2));

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
      data = { raw: responseText, error: 'Could not parse JSON response' };
    }
    
    console.log('✅ Direct Supabase Proxy response status:', response.status);
    console.log('📥 Response preview:', JSON.stringify(data).substring(0, 200) + '...');
    
    // Set response headers
    if (response.headers.get('content-type')) {
      res.setHeader('Content-Type', response.headers.get('content-type'));
    }
    
    res.status(response.status).json(data);
    
  } catch (error) {
    console.error('❌ Direct Supabase Proxy error:', error);
    res.status(500).json({ 
      error: 'Direct Supabase Proxy failed', 
      message: error.message,
      target: targetUrl,
      requestUrl: req.url,
      method: req.method
    });
  }
}