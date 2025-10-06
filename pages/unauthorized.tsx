import { useRouter } from 'next/router';

export default function Unauthorized() {
  const router = useRouter();

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      flexDirection: 'column',
      gap: '2rem',
      padding: '2rem',
      textAlign: 'center'
    }}>
      <div>
        <h1 style={{ fontSize: '4rem', margin: 0, color: '#dc3545' }}>⛔</h1>
        <h1 style={{ margin: '1rem 0 0.5rem 0' }}>Acceso Denegado</h1>
        <p style={{ color: '#666', fontSize: '1.1rem' }}>
          No tienes permisos suficientes para acceder a esta página.
        </p>
        <p style={{ color: '#888' }}>
          Esta sección está restringida exclusivamente a administradores del sistema.
        </p>
      </div>
      
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button 
          onClick={() => router.push('/')}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          🏠 Volver al Inicio
        </button>
        
        <button 
          onClick={() => router.push('/movements')}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          💰 Mis Movimientos
        </button>
        
        <button 
          onClick={() => router.back()}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          ↩️ Volver Atrás
        </button>
      </div>
      
      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px', maxWidth: '500px' }}>
        <h3 style={{ margin: '0 0 0.5rem 0' }}>¿Necesitas acceso?</h3>
        <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>
          Si crees que deberías tener acceso a esta sección, contacta al administrador del sistema.
        </p>
      </div>
    </div>
  );
}