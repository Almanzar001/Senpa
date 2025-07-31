# 🔑 Configuración de API Key - Dashboard SENPA

## ⚠️ Tu API Key anterior expiró. Necesitas generar una nueva:

### 📋 Pasos detallados:

1. **Ve a Google Cloud Console:** https://console.cloud.google.com/
2. **Selecciona o crea un proyecto**
3. **Ve a "APIs y servicios" → "Biblioteca"**
4. **Busca "Google Sheets API" y habilítala**
5. **Ve a "APIs y servicios" → "Credenciales"**
6. **Clic en "+ CREAR CREDENCIALES" → "Clave de API"**
7. **Copia la nueva API Key generada**

### 🔧 Configuración en el código:

**Archivo:** `src/config.ts` - línea 6:

```typescript
// Reemplaza esta línea:
API_KEY: 'TU_NUEVA_API_KEY_AQUI',

// Por tu API Key real:
API_KEY: 'AIzaSyC1234567890abcdefghijklmnopqrstuvwxyz',
```

## ✅ Dashboard Personalizado Completado:

- ✅ **Sin configuración inicial** - se conecta directamente
- ✅ **Métricas específicas:** "Detenidos de Hoy", "Incidentes Activos", etc.
- ✅ **Resumen operativo** con eventos del día y zonas activas
- ✅ **Análisis automático** de columnas de fecha, estado, ubicación
- ✅ **Visualizaciones personalizadas** para datos operativos
- ✅ **Dashboard responsive** y moderno

## 🎯 Características especiales agregadas:

- **Contador de detenidos de hoy** con análisis de fechas automático
- **Zonas más activas** identificadas automáticamente
- **Personal en servicio** basado en estados activos
- **Eventos recientes** con iconos y estados visuales
- **Métricas en tiempo real** con actualización automática

**Una vez que configures la API Key, el dashboard estará completamente funcional.**