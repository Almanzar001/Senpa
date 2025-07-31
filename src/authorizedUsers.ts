// Lista de emails autorizados para acceder al Dashboard SENPA
// Agrega aquí los emails de los usuarios que pueden acceder
export const AUTHORIZED_EMAILS = [
  // Email autorizado para testing y administración
  'jezrael01@gmail.com',
  
  // IMPORTANTE: Agrega emails reales de SENPA aquí
  'director@senpa.gob.do',
  'subdirector@senpa.gob.do',
  'coordinador@senpa.gob.do',
  'analista@senpa.gob.do',
  
  // Agrega más emails según sea necesario
];

// Función para verificar si un email está autorizado
export const isEmailAuthorized = (email: string): boolean => {
  return AUTHORIZED_EMAILS.includes(email.toLowerCase());
};

// Función para verificar si un dominio está autorizado (opcional)
export const isEmailFromAuthorizedDomain = (email: string): boolean => {
  const authorizedDomains = ['senpa.gob.do', 'gmail.com']; // Agrega dominios autorizados
  const domain = email.split('@')[1]?.toLowerCase();
  return domain ? authorizedDomains.includes(domain) : false;
};