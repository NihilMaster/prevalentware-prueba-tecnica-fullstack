import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '@/hooks/useAuth' // ✅ Importar useAuth
import { useSession, signOut } from '@/lib/auth/client'
import AuthGuard from '@/components/layout/AuthGuard'

export default function Dashboard() {
  const { user, isLoading, error, logout } = useAuth() // ✅ Usar useAuth
  const { data: session, isPending } = useSession()
  const router = useRouter()

  // Redirigir si no está autenticado
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/')
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-lg">Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center text-red-600">
          <p className="text-lg font-semibold">Error</p>
          <p>{error}</p>
          <button 
            onClick={() => router.push('/')}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    )
  }

  if (!user) return null // useEffect redirige

  const handleSignOut = async () => {
    await logout()
    router.push('/')
  }

  const getUserDashboard = () => {
    // ✅ AHORA USAMOS user.role REAL en lugar de router.query.role
    switch (user.role) {
      case 'ADMIN':
        return (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold">Dashboard Administrador</h1>
              <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                Administrador
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="font-semibold text-gray-700">Movimientos Totales</h3>
                <p className="text-2xl mt-2 text-blue-600">--</p>
                <p className="text-sm text-gray-500 mt-1">Todos los movimientos del sistema</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="font-semibold text-gray-700">Usuarios Activos</h3>
                <p className="text-2xl mt-2 text-green-600">--</p>
                <p className="text-sm text-gray-500 mt-1">Usuarios registrados</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="font-semibold text-gray-700">Saldo Total</h3>
                <p className="text-2xl mt-2 text-indigo-600">--</p>
                <p className="text-sm text-gray-500 mt-1">Balance general</p>
              </div>
            </div>

            {/* Acciones rápidas para admin */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="font-semibold text-gray-700 mb-4">Acciones Rápidas</h3>
              <div className="flex gap-4 flex-wrap">
                <button 
                  onClick={() => router.push('/admin/users')}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                >
                  Gestionar Usuarios
                </button>
                <button 
                  onClick={() => router.push('/admin/reports')}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
                >
                  Ver Reportes
                </button>
                <button 
                  onClick={() => router.push('/movements')}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition"
                >
                  Ver Movimientos
                </button>
              </div>
            </div>
          </div>
        )

      case 'USER':
        return (
          <div>
            <div className="flex items-center justify-between mb-6">
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                Usuario
              </span>
            </div>
          </div>
        )

      default:
        return (
          <div className="text-center py-8">
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded mb-4">
              <p className="font-semibold">Rol desconocido</p>
              <p>Tu rol ({user.role}) no está configurado correctamente.</p>
            </div>
            <button 
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
            >
              Volver al inicio
            </button>
          </div>
        )
    }
  }

  return (
    <AuthGuard>
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        {/* Header de usuario */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border">
          <div className="flex items-center mb-4 md:mb-0">
            <img
              src={session?.user?.image || '/default-avatar.png'}
              alt="Avatar"
              className="rounded-full w-16 h-16 mr-4 border-2 border-white shadow"
            />
            <div>
              <p className="text-lg font-medium text-gray-900">{user.name}</p>
              <p className="text-sm text-gray-600">{user.email}</p>
              <p className="text-xs text-gray-500">
                Miembro desde {new Date(user.createdAt).toLocaleDateString('es-ES')}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              user.role === 'ADMIN' 
                ? 'bg-purple-100 text-purple-800' 
                : 'bg-blue-100 text-blue-800'
            }`}>
              {user.role === 'ADMIN' ? 'Administrador' : 'Usuario'}
            </span>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Cerrar Sesión
            </button>
          </div>
        </div>

        {/* Debug info - puedes remover esto en producción */}
        <div className="mb-4 p-4 bg-gray-100 rounded-lg">
          <p className="text-sm text-gray-600">
            <strong>Debug:</strong> Rol detectado: <code>{user.role}</code> | 
            ID: <code>{user.id}</code> | 
            Email: <code>{user.email}</code>
          </p>
        </div>

        {/* Contenido del dashboard según el rol */}
        {getUserDashboard()}
      </div>
    </AuthGuard>
  )
}