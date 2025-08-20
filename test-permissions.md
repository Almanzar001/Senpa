# Test de Permisos por Roles

## Configuración del Sistema

El sistema ahora tiene control completo de permisos por roles:

### Roles Disponibles:
- **admin**: Control total (read, write, delete)
- **viewer**: Solo lectura (read)

### Funcionalidades Implementadas:

#### 1. Hook de Permisos (`usePermissions`)
- `canViewRecords`: Ambos roles pueden ver datos
- `canCreateRecords`: Solo admin puede crear
- `canEditRecords`: Solo admin puede editar
- `canDeleteRecords`: Solo admin puede eliminar

#### 2. Componente GenericTable
- **Viewer**: 
  - ✅ Puede ver todos los datos de detenidos
  - ✅ Puede usar filtros y búsqueda
  - ❌ No ve botón "Agregar" 
  - ❌ No ve columna "Acciones"
  - ❌ No puede editar ni eliminar

- **Admin**:
  - ✅ Puede ver todos los datos
  - ✅ Puede agregar nuevos registros
  - ✅ Puede editar registros existentes
  - ✅ Puede eliminar registros

#### 3. Modal de Edición (SimpleEditModal)
- **Viewer**: Muestra mensaje de error si intenta acceder
- **Admin**: Acceso completo al formulario

#### 4. Rutas Protegidas
- `/detainees-map`: Requiere permiso "read" (viewer y admin)
- `/chart-builder`: Requiere permiso "read" (viewer y admin)
- `/operations`: Requiere permiso "read" (viewer y admin) - accesible desde cards del dashboard
- `/operations/detenidos`: Vista específica de detenidos (accesible desde cards)
- `/operations/vehiculos`: Vista específica de vehículos (accesible desde cards)
- `/operations/incautaciones`: Vista específica de incautaciones (accesible desde cards)
- `/admin/users`: Requiere rol admin

## Para Probar:

1. **Login como viewer**: 
   - Debe poder acceder a `/detainees-map` y `/chart-builder`
   - Debe poder hacer clic en las cards del dashboard para acceder a vistas específicas de datos
   - Debe ver todos los datos pero sin botones de "Agregar", "Editar" o "Eliminar"
   - En el dashboard debe ver los botones: "Detenidos" y "Gráficos"
   - Las vistas de vehículos, incautaciones, etc. son accesibles haciendo clic en las métricas del dashboard

2. **Login como admin**:
   - Acceso completo a todas las funcionalidades
   - Puede ver, crear, editar y eliminar registros

## Beneficios:
- **Seguridad**: Los viewers no pueden modificar datos críticos
- **Usabilidad**: Los viewers pueden consultar toda la información necesaria
- **Escalabilidad**: Fácil agregar nuevos roles y permisos