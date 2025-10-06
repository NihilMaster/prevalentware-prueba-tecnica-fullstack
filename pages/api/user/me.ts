import type { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' })
  }

  try {
    const { userId, userEmail } = req.query
    if (!userId && !userEmail) {
      return res.status(400).json({ error: 'Se requiere userId o userEmail' })
    }

    let user

    // ✅ BUSCAR por ID PRIMERO (más preciso)
    if (userId && typeof userId === 'string') {
      user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
        }
      })
    }

    // ✅ Si no se encuentra por ID, buscar por email
    if (!user && userEmail && typeof userEmail === 'string') {
      user = await prisma.user.findUnique({
        where: { email: userEmail },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
        }
      })
    }

    // ✅ Si aún no se encuentra, devolver error
    if (!user) {
      return res.status(404).json({ 
        error: 'Usuario no encontrado',
        details: `No se encontró usuario con ID: ${userId} o email: ${userEmail}`
      })
    }

    // ✅ VERIFICAR que los datos coincidan (seguridad adicional)
    if (userId && user.id !== userId) {
      return res.status(403).json({ error: 'No autorizado - ID no coincide' })
    }

    if (userEmail && user.email !== userEmail) {
      return res.status(403).json({ error: 'No autorizado - email no coincide' })
    }
    
    return res.status(200).json({ 
      user: {
        ...user,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString()
      }
    })

  } catch (error) {
    console.error('❌ /api/user/me - Error:', error)
    return res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    })
  }
}