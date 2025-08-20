-- Script para crear usuarios en SENPA Dashboard
-- Ejecutar desde PostgreSQL o interfaz web

-- Función para hashear contraseñas (hash simple - usar bcrypt en producción)
CREATE OR REPLACE FUNCTION simple_hash(password TEXT) RETURNS TEXT AS $$
BEGIN
    -- Hash simple para demo - en producción usar bcrypt
    RETURN encode(digest(password, 'md5'), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Crear usuarios de ejemplo
INSERT INTO senpa_usuarios (email, password_hash, full_name, role, is_active) VALUES 
('supervisor@senpa.gov.do', simple_hash('Supervisor123!'), 'Supervisor General', 'admin', true),
('analista@senpa.gov.do', simple_hash('Analista123!'), 'Analista de Datos', 'user', true),
('secretario@senpa.gov.do', simple_hash('Secretario123!'), 'Secretario Operativo', 'user', true)
ON CONFLICT (email) DO NOTHING;

-- Ver usuarios creados
SELECT id, email, full_name, role, is_active, created_at 
FROM senpa_usuarios 
ORDER BY created_at DESC;