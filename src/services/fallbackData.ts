// Datos de fallback para cuando Supabase no esté disponible en producción
export const fallbackData = {
  notas_informativas: [
    ['id', 'numeroCaso', 'fecha', 'hora', 'provincia', 'localidad', 'region', 'tipoActividad', 'areaTemática', 'notificados', 'procuraduria', 'resultado'],
    ['1', 'CASO-20250820-001', '2025-08-20', '10:00', 'Santo Domingo', 'Distrito Nacional', '10', 'Operativo', 'Medioambiente', 'Juan Pérez', true, 'En proceso'],
    ['2', 'CASO-20250820-002', '2025-08-20', '14:30', 'Santiago', 'Santiago', '07', 'Inspección', 'Recursos Naturales', 'María González', false, 'Completado']
  ],
  detenidos: [
    ['id', 'numeroCaso', 'fecha', 'hora', 'provincia', 'localidad', 'region', 'nombre', 'motivoDetencion', 'estadoProceso'],
    ['1', 'CASO-20250820-001', '2025-08-20', '10:00', 'Santo Domingo', 'Distrito Nacional', '10', 'José Martínez', 'Tala ilegal', 'Detenido'],
    ['2', 'CASO-20250820-002', '2025-08-20', '14:30', 'Santiago', 'Santiago', '07', 'Carlos Rodríguez', 'Minería ilegal', 'Procesado']
  ],
  vehiculos: [
    ['id', 'numeroCaso', 'tipo', 'marca', 'color', 'detalle', 'provinciaMunicipio', 'fecha'],
    ['1', 'CASO-20250820-001', 'Camión', 'Isuzu', 'Blanco', 'Transportando madera', 'Santo Domingo - DN', '2025-08-20'],
    ['2', 'CASO-20250820-002', 'Jeep', 'Toyota', 'Negro', 'Acceso no autorizado', 'Santiago - Santiago', '2025-08-20']
  ],
  incautaciones: [
    ['id', 'numeroCaso', 'fecha', 'hora', 'provincia', 'localidad', 'region', 'tipoIncautacion', 'descripcion', 'cantidad'],
    ['1', 'CASO-20250820-001', '2025-08-20', '10:00', 'Santo Domingo', 'Distrito Nacional', '10', 'Madera', 'Caoba ilegal', '500'],
    ['2', 'CASO-20250820-002', '2025-08-20', '14:30', 'Santiago', 'Santiago', '07', 'Equipos', 'Maquinaria pesada', '2']
  ]
};

export const isProductionFallback = () => {
  return import.meta.env.PROD && typeof window !== 'undefined';
};