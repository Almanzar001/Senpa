// Debug de configuración - verificar variables de entorno
console.log('🟦 Variables de entorno:');
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'PRESENTE' : 'FALTANTE');
console.log('VITE_GOOGLE_MAPS_API_KEY:', import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? 'PRESENTE' : 'FALTANTE');

import { CONFIG } from './config.ts';
console.log('🟦 CONFIG final:');
console.log('SUPABASE_URL:', CONFIG.SUPABASE_URL);
console.log('GOOGLE_MAPS_API_KEY:', CONFIG.GOOGLE_MAPS_API_KEY ? 'PRESENTE' : 'FALTANTE');