import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '@/hooks/useAuth'

interface AuthGuardProps {
  children: React.ReactNode
  requiredRole?: 'USER' | 'ADMIN' // Ajusta según tus roles
}

export default function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      // Si no hay usuario, redirigir al home
      if (!user) {
        router.push('/')
        return
      }

      // Si se requiere un rol específico y el usuario no lo tiene
      if (requiredRole && user.role !== requiredRole) {
        router.push('/dashboard')
        return
      }
    }
  }, [user, isLoading, router, requiredRole])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Cargando...</div>
      </div>
    )
  }

  // Si no cumple con los requisitos de rol, no renderizar
  if (!user || (requiredRole && user.role !== requiredRole)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Acceso Denegado</h1>
          <p className="text-gray-600 mb-4">No tienes permisos para acceder a esta página.</p>
          <button 
            onClick={() => router.push('/dashboard')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Volver al Dashboard
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}