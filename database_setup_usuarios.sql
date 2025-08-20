-- Crear tabla de usuarios para gestión del dashboard SENPA
CREATE TABLE IF NOT EXISTS senpa_usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'user')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar usuarios iniciales (con contraseñas hasheadas)
INSERT INTO senpa_usuarios (email, password_hash, full_name, role, is_active) VALUES
('admin@senpa.gov.do', '$2b$10$rQVJ8qZZ5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K', 'Administrador SENPA', 'admin', true),
('operador@senpa.gov.do', '$2b$10$aQWE8qZZ5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K', 'Operador SENPA', 'user', true)
ON CONFLICT (email) DO NOTHING;

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_senpa_usuarios_email ON senpa_usuarios(email);
CREATE INDEX IF NOT EXISTS idx_senpa_usuarios_active ON senpa_usuarios(is_active);

-- Crear trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_senpa_usuarios_updated_at BEFORE UPDATE ON senpa_usuarios 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Habilitar Row Level Security (RLS)
ALTER TABLE senpa_usuarios ENABLE ROW LEVEL SECURITY;

-- Política para que solo usuarios admin puedan gestionar usuarios
CREATE POLICY "Admin can manage all users" ON senpa_usuarios
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM senpa_usuarios 
        WHERE email = current_setting('request.jwt.claims', true)::json->>'email' 
        AND role = 'admin' AND is_active = true
    )
);

-- Política para que los usuarios puedan ver su propio perfil
CREATE POLICY "Users can view own profile" ON senpa_usuarios
FOR SELECT USING (
    email = current_setting('request.jwt.claims', true)::json->>'email'
);

-- Conceder permisos para el rol 'anon' (necesario para login)
GRANT SELECT ON senpa_usuarios TO anon;
GRANT SELECT ON senpa_usuarios TO authenticated;