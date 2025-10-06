import { useState, useEffect } from 'react';

interface Movement {
  id: string;
  amount: number;
  description: string;
  type: string;
  date: string;
  createdAt: string;
}

interface ApiResponse {
  movements: Movement[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function MovementsList() {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMovements();
  }, []);

  const fetchMovements = async () => {
    try {
      console.log('🔄 Iniciando fetch a /api/movements...');
      const response = await fetch('/api/movements');
      console.log('📡 Response status:', response.status);
      
      const data: ApiResponse = await response.json();
      console.log('📦 Data recibida:', data);
      
      if (response.ok) {
        // La data ahora viene como { movements: [], pagination: {} }
        const movementsArray = Array.isArray(data.movements) ? data.movements : [];
        console.log('✅ Movimientos a mostrar:', movementsArray.length);
        setMovements(movementsArray);
      } else {
        console.error('❌ Error en response:', data);
        setError(`Error: ${data || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('💥 Error fetching movements:', error);
      setError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>Cargando movimientos...</div>;
  
  if (error) return (
    <div style={{ padding: '2rem' }}>
      <div style={{ color: 'red', marginBottom: '1rem' }}>{"No se pudieron cargar los usuarios, por favor intente nuevamente o inicie sesión con GitHub"}</div>
      <p>{error}</p>
      <button onClick={() => window.location.href = '/'}
        style={{
          padding: '0.5rem 1rem',
          backgroundColor: '#0070f3',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}>Iniciar sesión</button>
      <button 
        onClick={fetchMovements}
        style={{
          padding: '0.5rem 1rem',
          backgroundColor: '#0070f3',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}>Reintentar</button>
    </div>
  );

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Movimientos</h1>
      
      <div style={{ marginBottom: '2rem' }}>
        <a 
          href="/movements/new" 
          style={{
            display: 'inline-block',
            padding: '0.75rem 1.5rem',
            backgroundColor: '#0070f3',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '4px',
            marginRight: '1rem'
          }}
        >
          + Nuevo Movimiento
        </a>
        
        <button 
          onClick={fetchMovements}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#f0f0f0',
            color: '#333',
            border: '1px solid #ddd',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Actualizar
        </button>
      </div>

      <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
        <strong>Total:</strong> {movements.length} movimientos encontrados
      </div>

      {movements.length === 0 ? (
        <div style={{ 
          padding: '2rem', 
          textAlign: 'center', 
          border: '1px dashed #ddd',
          borderRadius: '4px'
        }}>
          <p>No hay movimientos registrados.</p>
          <a 
            href="/movements/new" 
            style={{
              color: '#0070f3',
              textDecoration: 'underline'
            }}
          >
            Crear primer movimiento
          </a>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {movements.map((movement) => (
            <div 
              key={movement.id}
              style={{
                padding: '1rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                backgroundColor: movement.type === 'INCOME' ? '#f0fff0' : '#fff0f0'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: '0 0 0.5rem 0' }}>{movement.description}</h3>
                  <p style={{ margin: 0, color: '#666' }}>
                    {new Date(movement.createdAt).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span 
                    style={{ 
                      color: movement.type === 'INCOME' ? 'green' : 'red',
                      fontWeight: 'bold',
                      fontSize: '1.1rem'
                    }}
                  >
                    {movement.type === 'INCOME' ? '+' : '-'}${parseFloat(movement.amount+"").toFixed(2)}
                  </span>
                  <div 
                    style={{
                      display: 'inline-block',
                      padding: '0.25rem 0.5rem',
                      backgroundColor: movement.type === 'INCOME' ? 'green' : 'red',
                      color: 'white',
                      borderRadius: '12px',
                      fontSize: '0.8rem',
                      marginLeft: '0.5rem'
                    }}
                  >
                    {movement.type === 'INCOME' ? 'INGRESO' : 'GASTO'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}