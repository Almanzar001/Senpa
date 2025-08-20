import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface TestRouteProps {
  children: React.ReactNode;
}

const TestRoute: React.FC<TestRouteProps> = ({ children }) => {
  const authContext = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    console.log('🔴 TestRoute - useEffect ejecutado');
    setMounted(true);
  }, []);

  console.log('🔴 TestRoute - Render ejecutado');
  console.log('🔴 TestRoute - mounted:', mounted);
  console.log('🔴 TestRoute - authContext:', authContext);
  console.log('🔴 TestRoute - user exists:', !!authContext?.user);
  console.log('🔴 TestRoute - profile exists:', !!authContext?.profile);

  if (!mounted) {
    console.log('🔴 TestRoute - Componente no mounted aún');
    return <div>Inicializando...</div>;
  }

  if (!authContext) {
    console.log('🔴 TestRoute - Sin AuthContext');
    return <div>Error: Sin contexto de autenticación</div>;
  }

  const { user, profile, loading } = authContext;

  if (loading) {
    console.log('🔴 TestRoute - Loading=true');
    return <div>Cargando autenticación...</div>;
  }

  if (!user || !profile) {
    console.log('🔴 TestRoute - Sin usuario o perfil');
    console.log('🔴 TestRoute - user:', user);
    console.log('🔴 TestRoute - profile:', profile);
    return <div>Sin usuario autenticado</div>;
  }

  console.log('🔴 TestRoute - Todo OK, mostrando contenido');
  return <>{children}</>;
};

export default TestRoute;