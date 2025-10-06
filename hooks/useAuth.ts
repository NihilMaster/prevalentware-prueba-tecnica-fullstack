import { useSession, signIn, signOut } from '@/lib/auth/client'
import { useState, useEffect } from 'react'

interface User {
  id: string
  name: string
  email: string
  role: 'USER' | 'ADMIN'
  emailVerified: boolean
  createdAt: string
  updatedAt: string
}

export function useAuth() {
  const { data: session, isPending: sessionLoading } = useSession()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserWithRole = async () => {
      if (!session?.user?.id) {
        
        setUser(null)
        setIsLoading(false)
        return
      }

      try {
        // ✅ ENVIAR tanto ID como email para mayor seguridad
        const response = await fetch(`/api/user/me?userId=${session.user.id}&userEmail=${encodeURIComponent(session.user.email)}`)
      
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${await response.text()}`)
        }

        const data = await response.json()

        setUser(data.user)
        setError(null)
      } catch (err) {
        
        setError(err instanceof Error ? err.message : 'Error desconocido')
        
        // Fallback: usar datos básicos de session
        setUser({
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          role: 'USER', // Valor por defecto
          emailVerified: session.user.emailVerified,
          createdAt: session.user.createdAt.toISOString(),
          updatedAt: session.user.updatedAt.toISOString()
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserWithRole()
  }, [session?.user?.id, session?.user?.email])

  const isAdmin = user?.role === 'ADMIN'
  const isUser = user?.role === 'USER'

  return {
    user,
    isAdmin,
    isUser,
    isLoading: sessionLoading || isLoading,
    error,
    login: async (email: string, password: string) => {
      const result = await signIn.email({
        email,
        password,
      })
      
      if (result.error) {
        throw new Error(result.error.message)
      }
      
      return result
    },
    logout: async () => {
      await signOut()
    }
  }
}