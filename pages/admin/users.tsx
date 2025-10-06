import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AuthGuard from '@/components/layout/AuthGuard';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    movements: number;
    sessions: number;
    accounts: number;
  };
}

interface UsersResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function AdminUsers() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', role: 'USER' });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data: UsersResponse = await response.json();
        setUsers(data.users);
      } else {
        setError('Error al cargar usuarios');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (user: User) => {
    setEditingUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      role: user.role
    });
  };

  const cancelEdit = () => {
    setEditingUser(null);
    setEditForm({ name: '', email: '', role: 'USER' });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const response = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });

      const result = await response.json();

      if (response.ok) {
        // Actualizar la lista
        await fetchUsers();
        cancelEdit();
        alert('Usuario actualizado correctamente');
      } else {
        alert(`Error: ${result.error} - ${result.message}`);
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Error al actualizar usuario');
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>Cargando usuarios...</div>;

  return (
    <AuthGuard requiredRole="ADMIN">
    <div style={{ padding: '2rem' }}>
      <h1>Administración de Usuarios</h1>
      
      <div style={{ marginBottom: '2rem' }}>
        <button 
          onClick={() => router.push('/movements')}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '1rem'
          }}
        >
          ← Volver a Movimientos
        </button>
        
        <button 
          onClick={fetchUsers}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Actualizar
        </button>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <strong>Total:</strong> {users.length} usuarios
      </div>

      {users.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', border: '1px dashed #ddd' }}>
          No hay usuarios registrados.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {users.map((user) => (
            <div 
              key={user.id}
              style={{
                padding: '1rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                backgroundColor: user.role === 'ADMIN' ? '#e8f4fd' : '#f8f9fa'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 0.5rem 0' }}>
                    {user.name}
                    {user.role === 'ADMIN' && (
                      <span 
                        style={{
                          display: 'inline-block',
                          padding: '0.25rem 0.5rem',
                          backgroundColor: '#007bff',
                          color: 'white',
                          borderRadius: '12px',
                          fontSize: '0.8rem',
                          marginLeft: '0.5rem'
                        }}
                      >
                        ADMIN
                      </span>
                    )}
                  </h3>
                  <p style={{ margin: '0 0 0.5rem 0', color: '#666' }}>
                    {user.email}
                    {user.emailVerified && (
                      <span style={{ color: '#28a745', marginLeft: '0.5rem' }}>✓ Verificado</span>
                    )}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#666' }}>
                    Registrado: {new Date(user.createdAt).toLocaleDateString('es-ES')}
                  </p>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#666' }}>
                    Movimientos: {user._count.movements} | Sesiones: {user._count.sessions}
                  </p>
                </div>
                
                <div>
                  <button 
                    onClick={() => startEdit(user)}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#ffc107',
                      color: '#212529',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      marginLeft: '0.5rem'
                    }}
                  >
                    Editar
                  </button>
                </div>
              </div>

              {/* Formulario de edición */}
              {editingUser?.id === user.id && (
                <div style={{ 
                  marginTop: '1rem', 
                  padding: '1rem', 
                  backgroundColor: '#f8f9fa',
                  border: '1px solid #dee2e6',
                  borderRadius: '4px'
                }}>
                  <h4>Editar Usuario</h4>
                  <form onSubmit={handleEditSubmit} style={{ display: 'grid', gap: '0.5rem' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.25rem' }}>
                        Nombre:
                      </label>
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                        style={{ width: '100%', padding: '0.5rem' }}
                      />
                    </div>
                    
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.25rem' }}>
                        Email:
                      </label>
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                        style={{ width: '100%', padding: '0.5rem' }}
                      />
                    </div>
                    
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.25rem' }}>
                        Rol:
                      </label>
                      <select
                        value={editForm.role}
                        onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                        style={{ width: '100%', padding: '0.5rem' }}
                      >
                        <option value="USER">Usuario</option>
                        <option value="ADMIN">Administrador</option>
                      </select>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                      <button 
                        type="submit"
                        style={{
                          padding: '0.5rem 1rem',
                          backgroundColor: '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        Guardar
                      </button>
                      <button 
                        type="button"
                        onClick={cancelEdit}
                        style={{
                          padding: '0.5rem 1rem',
                          backgroundColor: '#6c757d',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
    </AuthGuard>
  );
}