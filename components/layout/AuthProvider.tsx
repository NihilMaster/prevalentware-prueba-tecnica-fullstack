import { ReactNode } from 'react';
import { useSession } from '@/lib/auth/client';

interface AuthProviderProps {
  children: ReactNode;
}

// Este componente sirve como wrapper para manejar el estado de carga
export function AuthProvider({ children }: AuthProviderProps) {
  const { data: session, isPending } = useSession();

  // Puedes mostrar un loading global aquí si lo necesitas
  if (isPending) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-lg'>Cargando...</div>
      </div>
    );
  }

  return <>{children}</>;
}
