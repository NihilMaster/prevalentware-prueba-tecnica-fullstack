import { useSession, signOut } from '@/lib/auth/client';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function Dashboard() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  // Redirigir si no está autenticado
  useEffect(() => {
    if (!isPending && !session) {
      router.push('/');
    }
  }, [session, isPending, router]);

  if (isPending) {
    return (
      <div style={{ padding: '20px' }}>
        <p>Cargando...</p>
      </div>
    );
  }

  if (!session) {
    return null; // El useEffect ya redirigirá
  }

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Dashboard</h1>
      <div style={{ marginTop: '20px' }}>
        <img 
          src={session.user.image || ''} 
          alt="Avatar" 
          style={{ borderRadius: '50%', width: '80px', height: '80px' }}
        />
        <p><strong>Nombre:</strong> {session.user.name}</p>
        <p><strong>Email:</strong> {session.user.email}</p>
        <p><strong>ID:</strong> {session.user.id}</p>
      </div>
      <button 
        onClick={handleSignOut}
        style={{ marginTop: '20px', padding: '10px 20px' }}
      >
        Cerrar Sesión
      </button>
    </div>
  );
}