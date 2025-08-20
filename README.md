# 🚔 Dashboard Operativo SENPA

Dashboard de monitoreo y análisis operacional para el Servicio Nacional de Policía Antinarcóticos (SENPA). Sistema completo de gestión y visualización de operaciones policiales.

## ✨ Características

- 🎯 **Dashboard Ejecutivo**: Métricas operacionales en tiempo real
- 🌿 **Dashboard Ambiental**: Análisis detallado de operaciones
- 🗺️ **Mapas Interactivos**: Visualización geográfica de detenidos y vehículos  
- 👮 **Gestión Operacional**: Control de notas informativas, detenidos, incautaciones
- 👨‍💼 **Sistema de Usuarios**: Roles y permisos (Admin/Viewer)
- 📊 **Gráficos Avanzados**: Visualizaciones con Recharts y Material-UI
- 📱 **Responsive**: Adaptable a todos los dispositivos
- 🔐 **Autenticación Segura**: Login con Supabase Auth

## 🚀 Instalación y Configuración

### 1. Clonar e Instalar

```bash
cd dashboard-senpa
npm install
```

### 2. Configurar Google Sheets API

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita la **Google Sheets API**
4. Crea credenciales (API Key)
5. Opcionalmente, puedes restringir la API Key a Google Sheets API

### 3. Preparar tu Google Sheet

1. Abre tu Google Sheet
2. Asegúrate de que esté **compartido públicamente** o con permisos de lectura
3. La primera fila de cada hoja debe contener los encabezados/nombres de columnas
4. Copia la URL de tu Google Sheet

### 4. Ejecutar la Aplicación

```bash
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173) en tu navegador.

## 📋 Uso

1. **Configuración Inicial**: 
   - Ingresa tu API Key de Google
   - Pega la URL completa de tu Google Sheet (o solo el ID)
   - Haz clic en "Cargar Dashboard"

2. **Navegación**:
   - Usa las pestañas para navegar entre diferentes hojas
   - Alterna entre vista de tabla y vista gráfica
   - Usa la búsqueda en la vista de tabla para filtrar datos

3. **Visualizaciones Automáticas**:
   - **Gráfico de Barras**: Para datos numéricos
   - **Gráfico de Torta**: Para distribución de categorías
   - **Gráfico de Líneas**: Para tendencias temporales
   - **Gráfico de Áreas**: Para datos acumulados

## 🛠️ Tecnologías Utilizadas

- **React 18** con TypeScript
- **Vite** como build tool
- **Material-UI (MUI)** para componentes
- **Tailwind CSS** para estilos
- **Recharts** para visualizaciones
- **Axios** para peticiones HTTP
- **Google Sheets API v4**

## 📊 Estructura de Datos

El dashboard funciona mejor cuando tus hojas de Google Sheets tienen:

- **Primera fila**: Nombres de columnas/encabezados
- **Datos numéricos**: Para gráficos estadísticos
- **Datos categóricos**: Para gráficos de distribución
- **Formato consistente**: Evitar celdas vacías en los encabezados

### Ejemplo de estructura:

| Producto | Ventas | Región | Fecha |
|----------|--------|--------|-------|
| Laptop   | 1500   | Norte  | 2024-01-15 |
| Mouse    | 25     | Sur    | 2024-01-16 |
| Teclado  | 75     | Este   | 2024-01-17 |

## 🎨 Personalización

### Colores y Tema

Edita `src/App.tsx` para cambiar el tema de Material-UI:

```typescript
const theme = createTheme({
  palette: {
    primary: {
      main: '#3b82f6', // Color principal
    },
    // ... más configuraciones
  },
});
```

### Estilos Adicionales

Modifica `tailwind.config.js` para personalizar colores y estilos:

```javascript
theme: {
  extend: {
    colors: {
      primary: {
        // Tus colores personalizados
      }
    }
  }
}
```

## 🔒 Seguridad

- **API Key**: Nunca committed tu API Key al repositorio
- **Variables de Entorno**: Considera usar `.env` para producción
- **CORS**: La Google Sheets API maneja CORS automáticamente
- **Permisos**: Configura permisos mínimos necesarios en Google Cloud

## 🚀 Deploy

### Vercel

```bash
npm run build
# Sube la carpeta 'dist' a Vercel
```

### Netlify

```bash
npm run build
# Arrastra la carpeta 'dist' a Netlify
```

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea tu feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 🆘 Soporte

Si encuentras algún problema:

1. Verifica que tu Google Sheet esté público o compartido
2. Confirma que tu API Key tenga permisos para Google Sheets API
3. Revisa la consola del navegador para errores
4. Asegúrate de que la primera fila contenga encabezados válidos

---

Hecho con ❤️ para análisis de datos moderno y sofisticado