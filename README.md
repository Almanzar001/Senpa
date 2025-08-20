# Dashboard SENPA 🌿

Sistema de dashboard ambiental para el Servicio Nacional de Protección Ambiental (SENPA) de República Dominicana.

## 📋 Descripción

Dashboard interactivo para la visualización y gestión de datos ambientales, casos operativos, y administración de usuarios del SENPA. Incluye funcionalidades de autenticación, gestión de usuarios, y análisis de datos ambientales con visualizaciones en tiempo real.

## ✨ Características

### 🔐 Sistema de Autenticación
- **Tres roles de usuario**: Superadmin, Admin, User
- **Autenticación segura** con Supabase
- **Gestión de contraseñas**: Cambio de contraseña personal y administrativa
- **Protección de rutas** basada en roles

### 👥 Gestión de Usuarios
- **Creación de usuarios** con asignación de roles
- **Cambio de contraseñas** (personal y administrativa)
- **Generador de contraseñas** seguras automático
- **Eliminación de usuarios** (solo superadmin)

### 📊 Dashboard de Datos
- **Visualización de métricas** ambientales en tiempo real
- **Filtros avanzados** por fecha, provincia, tipo de actividad
- **Mapas interactivos** para detenidos y vehículos
- **Exportación de datos** y reportes

### 🗺️ Mapas Integrados
- **Google Maps** para visualización geográfica
- **Marcadores dinámicos** para casos y operativos
- **Filtros geográficos** por ubicación

## 🚀 Instalación

### Prerrequisitos

- Node.js 18+ 
- npm o yarn
- Cuenta de Supabase
- Google Maps API Key

### Pasos de instalación

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/Almanzar001/Senpa.git
   cd Senpa
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   ```bash
   cp .env.example .env.local
   ```
   
   Editar `.env.local` con tus claves:
   ```env
   VITE_SUPABASE_URL=https://tu-proyecto-supabase.com
   VITE_SUPABASE_ANON_KEY=tu_supabase_service_role_key
   VITE_GOOGLE_MAPS_API_KEY=tu_google_maps_api_key
   ```

4. **Configurar base de datos**
   - Ejecutar el script `database_setup_usuarios.sql` en Supabase
   - Configurar las políticas RLS según se requiera

5. **Ejecutar en desarrollo**
   ```bash
   npm run dev
   ```

## 🏗️ Estructura del Proyecto

```
src/
├── components/          # Componentes React
│   ├── auth/           # Componentes de autenticación
│   ├── maps/           # Componentes de mapas
│   └── admin/          # Componentes de administración
├── contexts/           # Contextos React
├── services/           # Servicios de API y autenticación
├── hooks/             # Hooks personalizados
├── types/             # Definiciones de tipos TypeScript
└── utils/             # Utilidades y helpers
```

## 👤 Roles de Usuario

### 🔱 Superadmin
- **Gestión completa de usuarios** (crear, eliminar, cambiar contraseñas)
- **Acceso total** a todas las funcionalidades
- **Administración del sistema**

### 🔑 Admin  
- **Acceso completo al dashboard** y datos
- **Gestión de casos** (crear, editar, eliminar)
- **Sin acceso** a gestión de usuarios

### 👀 User
- **Acceso de solo lectura** al dashboard
- **Visualización de datos** y reportes
- **Sin permisos** de modificación

## 🛠️ Tecnologías Utilizadas

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Material-UI
- **Autenticación**: Supabase Auth + Sistema personalizado
- **Base de datos**: Supabase (PostgreSQL)
- **Mapas**: Google Maps API
- **Charts**: Chart.js, Recharts
- **Estado**: React Context API

## 🔧 Scripts Disponibles

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build para producción  
npm run preview      # Vista previa del build
npm run lint         # Linter ESLint
npm run type-check   # Verificación de tipos TypeScript
```

## 🔐 Seguridad

### Autenticación
- **Hashing de contraseñas** con algoritmo seguro
- **Tokens JWT** para sesiones
- **Verificación de roles** en cada ruta protegida
- **Validación de permisos** en frontend y backend

### Variables de Entorno
- **Claves API** nunca expuestas en el código
- **Configuración por ambiente** (desarrollo, producción)
- **Archivos sensibles** en `.gitignore`

## 📱 Responsive Design

- ✅ **Desktop** (1200px+)
- ✅ **Tablet** (768px - 1199px)  
- ✅ **Mobile** (320px - 767px)

## 🤝 Contribución

1. Fork el proyecto
2. Crear branch de feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Agrega nueva funcionalidad'`)
4. Push al branch (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver archivo `LICENSE` para más detalles.

## 🎯 Roadmap

- [ ] **Notificaciones push** en tiempo real
- [ ] **Exportación avanzada** (PDF, Excel, CSV)
- [ ] **Reportes automáticos** por email
- [ ] **Dashboard móvil** nativo
- [ ] **API REST** pública documentada
- [ ] **Integración** con otros sistemas gubernamentales

## 📞 Soporte

Para soporte técnico o consultas:
- 📧 Email: soporte@senpa.gov.do
- 📱 Teléfono: +1 (809) 123-4567
- 🌐 Web: [www.senpa.gov.do](https://www.senpa.gov.do)

---

Desarrollado con ❤️ para el SENPA - República Dominicana 🇩🇴