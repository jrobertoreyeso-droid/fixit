-- Tabla de perfiles de usuario
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    nombre TEXT,
    telefono TEXT,
    tipo TEXT CHECK (tipo IN ('tecnico', 'cliente')),
    verificado BOOLEAN DEFAULT false,
    estado_verificacion TEXT DEFAULT 'sin_verificar',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- Políticas de Seguridad (RLS)
-- Permitir que los usuarios vean su propio perfil
CREATE POLICY "Usuarios pueden ver su propio perfil"
ON usuarios FOR SELECT
USING (auth.uid() = id);

-- Permitir que los usuarios inserten su propio perfil al registrarse
CREATE POLICY "Usuarios pueden insertar su propio perfil"
ON usuarios FOR INSERT
WITH CHECK (auth.uid() = id);

-- Permitir que los usuarios actualicen su propio perfil
CREATE POLICY "Usuarios pueden actualizar su propio perfil"
ON usuarios FOR UPDATE
USING (auth.uid() = id);
