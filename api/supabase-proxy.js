// API proxy directo para Supabase - maneja todas las rutas
export default async function handler(req, res) {
  const supabaseUrl = 'https://nnsupabasenn.coman2uniformes.com';
  
  // Obtener la ruta original del header 'x-vercel-forwarded-for' o del referer
  const url = new URL(req.url, `https://${req.headers.host}`);
  
  // Obtener el path desde el query parameter que Vercel pasa en el rewrite
  const targetPath = url.searchParams.get('path');
  
  console.log('🔍 Request URL:', req.url);
  console.log('🔍 Target path from rewrite:', targetPath);
  console.log('🔍 All URL search params:', url.searchParams.toString());
  console.log('🔍 Request method:', req.method);
  
  // Verificar que tenemos el path
  if (!targetPath) {
    console.error('❌ No path parameter found');
    return res.status(400).json({
      error: 'Missing path parameter',
      received: req.url,
      usage: 'This endpoint should be called via Vercel rewrites'
    });
  }
  
  // Reconstruir query string sin el parámetro path
  const remainingParams = new URLSearchParams();
  url.searchParams.forEach((value, key) => {
    if (key !== 'path') {
      remainingParams.append(key, value);
    }
  });
  
  const queryString = remainingParams.toString();
  console.log('🔍 Reconstructed query string:', queryString);
  
  // Construir la URL final
  const targetUrl = `${supabaseUrl}/${targetPath}${queryString ? '?' + queryString : ''}`;
  console.log('🎯 Final target URL:', targetUrl);

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