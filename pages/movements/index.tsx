import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import AuthGuard from '@/components/layout/AuthGuard'

interface Movement {
  id: string
  amount: number
  description: string
  type: string
  date: string
  createdAt: string
}

interface ApiResponse {
  movements: Movement[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export default function MovementsPage() {
  const { user } = useAuth()
  const [movements, setMovements] = useState<Movement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchMovements()
  }, [])

  const fetchMovements = async () => {
    try {
      const response = await fetch('/api/movements')
      const data: ApiResponse = await response.json()

      if (response.ok) {
        const movementsArray = Array.isArray(data.movements) ? data.movements : []
        setMovements(movementsArray)
      } else {
        setError(`Error: ${data || 'Error desconocido'}`)
      }
    } catch (error) {
      setError('Error de conexión con el servidor')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <AuthGuard>
        <div className="flex items-center justify-center h-screen">
          <p className="text-lg text-gray-700">Cargando movimientos...</p>
        </div>
      </AuthGuard>
    )
  }

  if (error) {
    return (
      <AuthGuard>
        <div className="flex flex-col items-center justify-center h-screen">
          <p className="text-red-600 mb-4 text-center">
            No se pudieron cargar los movimientos. Intenta nuevamente o inicia sesión con GitHub.
          </p>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <div className="flex gap-4">
            <button
              onClick={() => (window.location.href = '/')}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Iniciar sesión
            </button>
            <button
              onClick={fetchMovements}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
            >
              Reintentar
            </button>
          </div>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Movimientos</h1>
          {user?.role === 'ADMIN' && (
            <button
              onClick={() => (window.location.href = '/movements/new')}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              + Nuevo Movimiento
            </button>
          )}
        </div>

        <div className="mb-4">
          <p className="text-gray-600">
            <strong>Total:</strong> {movements.length} movimientos encontrados
          </p>
        </div>

        {movements.length === 0 ? (
          <div className="text-center border-2 border-dashed border-gray-300 rounded-lg p-10 text-gray-600">
            <p className="mb-4">No hay movimientos registrados.</p>
            <a
              href="/movements/new"
              className="text-blue-500 underline hover:text-blue-600"
            >
              Crear primer movimiento
            </a>
          </div>
        ) : (
          <div className="grid gap-4">
            {movements.map((movement) => (
              <div
                key={movement.id}
                className={`p-4 border rounded-lg shadow-sm ${
                  movement.type === 'INCOME'
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-1">
                      {movement.description}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {new Date(movement.createdAt).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`font-bold text-lg ${
                        movement.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {movement.type === 'INCOME' ? '+' : '-'}$
                      {parseFloat(movement.amount + '').toFixed(2)}
                    </span>
                    <div
                      className={`inline-block px-2 py-1 ml-2 rounded-full text-white text-xs ${
                        movement.type === 'INCOME' ? 'bg-green-600' : 'bg-red-600'
                      }`}
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
    </AuthGuard>
  )
}
