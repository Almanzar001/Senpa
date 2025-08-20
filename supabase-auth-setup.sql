-- Script SQL para configurar autenticación con roles en Supabase
-- Ejecuta este script en el SQL Editor de Supabase

-- 1. Crear tabla de roles
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Insertar roles básicos
INSERT INTO user_roles (name, description) VALUES 
  ('admin', 'Administrador - puede ver, editar y borrar todo'),
  ('viewer', 'Visualizador - solo puede ver información')
ON CONFLICT (name) DO NOTHING;

-- 3. Crear tabla de perfiles de usuario
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  role_id UUID REFERENCES user_roles(id) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Función para actualizar timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Trigger para actualizar timestamp automáticamente
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- 6. Políticas RLS (Row Level Security)
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 7. Política: Solo usuarios autenticados pueden ver roles
CREATE POLICY "Users can view roles" ON user_roles
  FOR SELECT USING (auth.role() = 'authenticated');

-- 8. Política: Solo usuarios autenticados pueden ver perfiles (incluyendo el suyo)
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

-- 9. Política: Solo admins pueden ver todos los perfiles
CREATE POLICY "Admins can view all profiles" ON user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles up 
      JOIN user_roles ur ON up.role_id = ur.id 
      WHERE up.id = auth.uid() AND ur.name = 'admin'
    )
  );

-- 10. Función para obtener el rol del usuario actual
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT ur.name INTO user_role
  FROM user_profiles up
  JOIN user_roles ur ON up.role_id = ur.id
  WHERE up.id = auth.uid();
  
  RETURN COALESCE(user_role, 'unauthorized');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Función para verificar si el usuario es admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN get_user_role() = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Función para verificar permisos
CREATE OR REPLACE FUNCTION has_permission(required_role TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  user_role := get_user_role();
  
  -- Admin tiene todos los permisos
  IF user_role = 'admin' THEN
    RETURN TRUE;
  END IF;
  
  -- Verificar rol específico
  RETURN user_role = required_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Crear vista para obtener usuarios con roles
CREATE OR REPLACE VIEW users_with_roles AS
SELECT 
  up.id,
  up.email,
  up.full_name,
  ur.name as role_name,
  ur.description as role_description,
  up.is_active,
  up.created_at,
  up.updated_at
FROM user_profiles up
JOIN user_roles ur ON up.role_id = ur.id;

-- 14. Política adicional para user_profiles (para admins ver todos los perfiles)
CREATE POLICY "Admins can view all user profiles" ON user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles admin_up 
      JOIN user_roles admin_ur ON admin_up.role_id = admin_ur.id 
      WHERE admin_up.id = auth.uid() AND admin_ur.name = 'admin'
    )
  );

-- 15. Política para permitir actualizar perfiles (solo admins)
CREATE POLICY "Admins can update user profiles" ON user_profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles admin_up 
      JOIN user_roles admin_ur ON admin_up.role_id = admin_ur.id 
      WHERE admin_up.id = auth.uid() AND admin_ur.name = 'admin'
    )
  );

-- 16. Función para obtener todos los usuarios con roles (solo para admins)
CREATE OR REPLACE FUNCTION get_all_users_with_roles()
RETURNS TABLE (
  id UUID,
  email VARCHAR,
  full_name VARCHAR,
  role_name VARCHAR,
  role_description TEXT,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  -- Verificar que el usuario actual es admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Acceso denegado: se requieren permisos de administrador';
  END IF;

  -- Retornar todos los usuarios con sus roles
  RETURN QUERY
  SELECT 
    up.id,
    up.email,
    up.full_name,
    ur.name,
    ur.description,
    up.is_active,
    up.created_at,
    up.updated_at
  FROM user_profiles up
  JOIN user_roles ur ON up.role_id = ur.id
  ORDER BY up.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 17. Función para obtener perfil de usuario específico
CREATE OR REPLACE FUNCTION get_user_profile(user_id UUID)
RETURNS TABLE (
  id UUID,
  email VARCHAR,
  full_name VARCHAR,
  role_name VARCHAR,
  role_description TEXT,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  -- El usuario puede ver su propio perfil o ser admin para ver otros
  IF user_id != auth.uid() AND NOT is_admin() THEN
    RAISE EXCEPTION 'Acceso denegado: no puedes ver este perfil';
  END IF;

  -- Retornar el perfil del usuario
  RETURN QUERY
  SELECT 
    up.id,
    up.email,
    up.full_name,
    ur.name,
    ur.description,
    up.is_active,
    up.created_at,
    up.updated_at
  FROM user_profiles up
  JOIN user_roles ur ON up.role_id = ur.id
  WHERE up.id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;