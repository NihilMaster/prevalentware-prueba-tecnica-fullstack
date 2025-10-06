import { useAuth } from '../../hooks/useAuth'

export default function Header() {
  const { user, logout } = useAuth()

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold">Gestión Financiera</h1>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <span className="text-sm text-gray-700">Hola, {user.name}</span>
                <button 
                  onClick={logout}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm"
                >
                  Cerrar Sesión
                </button>
              </>
            ) : (
              <span className="text-sm text-gray-500">No autenticado</span>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}