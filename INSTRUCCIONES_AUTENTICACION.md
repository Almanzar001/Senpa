# Sistema de Autenticación con Roles - Dashboard SENPA

## Configuración Implementada

Se ha implementado un sistema de autenticación completo con los siguientes componentes:

### 🔐 Características del Sistema

1. **Sin registro público** - Solo administradores pueden crear usuarios
2. **Sistema de roles**:
   - `admin`: Puede ver, editar, borrar y gestionar usuarios
   - `viewer`: Solo puede ver información
3. **Autenticación con Supabase**
4. **Protección de rutas basada en permisos**
5. **Interfaz de gestión de usuarios para admins**

## 📋 Pasos para Configurar

### 1. Configurar Base de Datos en Supabase

1. Ve a tu panel de Supabase
2. Abre el **SQL Editor**
3. Ejecuta el script `supabase-auth-setup-fixed.sql` que se encuentra en la raíz del proyecto

> ⚠️ **Nota**: Usa el archivo `supabase-auth-setup-fixed.sql` que corrige el error de políticas en vistas.

### 2. Crear tu Primer Usuario Admin

Después de ejecutar el script SQL, necesitas crear tu primer usuario administrador:

```sql
-- 1. Primero obtén el ID del rol admin
SELECT id FROM user_roles WHERE name = 'admin';

-- 2. Crea el usuario en Supabase Auth (hazlo desde el panel de Supabase)
-- Ve a Authentication > Users > Add user
-- Email: tu-email@ejemplo.com
-- Password: tu-contraseña-segura

-- 3. Después de crear el usuario, obtén su ID desde el panel y ejecuta:
INSERT INTO user_profiles (id, email, full_name, role_id, is_active)
VALUES (
  'el-id-del-usuario-creado',  -- ID del usuario de auth.users
  'tu-email@ejemplo.com',      -- Email del usuario
  'Tu Nombre Completo',        -- Nombre opcional
  'el-id-del-rol-admin',       -- ID del rol admin obtenido en paso 1
  true                         -- Usuario activo
);
```

### 3. Archivos Creados/Modificados

#### Nuevos Archivos:
- `src/services/auth.ts` - Servicio de autenticación
- `src/components/auth/LoginForm.tsx` - Formulario de login
- `src/components/auth/ProtectedRoute.tsx` - Protección de rutas
- `src/components/auth/UserProfile.tsx` - Perfil de usuario
- `src/components/admin/UserManagement.tsx` - Gestión de usuarios
- `src/hooks/usePermissions.ts` - Hook para permisos
- `supabase-auth-setup.sql` - Script de configuración de BD

#### Archivos Modificados:
- `src/contexts/AuthContext.tsx` - Actualizado para Supabase
- `src/config.ts` - Cliente de Supabase agregado
- `src/App.tsx` - Integración del sistema de auth

## 🚀 Cómo Usar

### Para Usuarios Finales:

1. **Login**: Ve a `/login` e ingresa tus credenciales
2. **Dashboard**: Una vez autenticado, accedes automáticamente
3. **Permisos**: 
   - **Viewers**: Solo pueden ver dashboards y datos
   - **Admins**: Pueden editar, borrar y gestionar usuarios

### Para Administradores:

1. **Gestión de Usuarios**: Accede a `/admin/users` (necesitas implementar esta ruta)
2. **Crear Usuarios**: 
   - Crea el usuario en Supabase Auth Panel
   - Asigna el rol en la tabla `user_profiles`
3. **Activar/Desactivar**: Usa el switch en la gestión de usuarios

## 🛡️ Protección de Rutas

Las rutas están protegidas según permisos:

```tsx
// Solo lectura (viewer y admin)
<ProtectedRoute>
  <Dashboard />
</ProtectedRoute>

// Solo escritura (admin)
<ProtectedRoute requiredPermission="write">
  <EditPage />
</ProtectedRoute>

// Solo admins
<ProtectedRoute adminOnly>
  <AdminPanel />
</ProtectedRoute>
```

## 🔧 Personalización

### Agregar Nuevos Roles:

```sql
INSERT INTO user_roles (name, description) VALUES 
('editor', 'Editor - puede ver y editar pero no borrar');
```

### Modificar Permisos:

Edita la función `hasPermission` en `src/hooks/usePermissions.ts`

## 🚨 Seguridad

1. **RLS Activado**: Row Level Security está activo en todas las tablas
2. **Validación de Roles**: Se valida tanto en frontend como backend
3. **Sesiones Seguras**: Supabase maneja las sesiones automáticamente
4. **Tokens JWT**: Autenticación basada en tokens seguros

## 📱 Integración con Componentes Existentes

Para usar el sistema en tus componentes existentes:

```tsx
import { useAuth } from '../contexts/AuthContext';
import usePermissions from '../hooks/usePermissions';

function MiComponente() {
  const { user, profile, logout } = useAuth();
  const { canWrite, canDelete, isAdmin } = usePermissions();

  return (
    <div>
      <p>Hola {profile?.full_name || user?.email}</p>
      
      {canWrite && <button>Editar</button>}
      {canDelete && <button>Borrar</button>}
      {isAdmin && <button>Panel Admin</button>}
      
      <button onClick={logout}>Cerrar Sesión</button>
    </div>
  );
}
```

## 🔄 Próximos Pasos

1. Agregar la ruta `/admin/users` en App.tsx
2. Personalizar los permisos según tus necesidades
3. Agregar más roles si es necesario
4. Implementar notificaciones para cambios de estado
5. Agregar logs de auditoría si se requiere

## 📞 Soporte

Si tienes problemas:

1. Verifica que el script SQL se ejecutó correctamente
2. Confirma que el usuario admin fue creado
3. Revisa la consola del navegador para errores
4. Verifica la configuración de Supabase en `config.ts`

¡El sistema está listo para usar! 🎉