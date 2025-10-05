import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { auth } from '../../../lib/auth/index';

const prisma = new PrismaClient();

// Tipos para TypeScript
interface MovementData {
  amount: number;
  description: string;
  type: 'INCOME' | 'EXPENSE';
  date?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Obtener sesión de Better Auth
  // 1. CONSTRUIR EL OBJETO HEADERS
  const headers = new Headers();
  
  // Itera sobre las cabeceras de Next.js y añádelas al objeto Headers.
  // Esto maneja el problema de los tipos y garantiza que solo se usen strings.
  for (const [key, value] of Object.entries(req.headers)) {
    if (typeof value === 'string') {
      headers.set(key, value);
    } 
    // Nota: Por simplicidad y uso común, ignoramos los arrays (cabeceras duplicadas)
    // que son raros excepto por 'Set-Cookie'
  }

  // Obtener sesión de Better Auth
  // 2. USA EL NUEVO OBJETO HEADERS
  const session = await auth.api.getSession({
    // ¡CORRECCIÓN APLICADA AQUÍ!
    headers: headers, 
  });

  if (!session) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  if (req.method === 'GET') {
    try {
      // Obtener parámetros de query para paginación y filtros
      const { page = '1', limit = '10', type } = req.query;
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      // Construir where clause
      const where: any = {
        userId: session.user.id,
      };

      if (type && (type === 'INCOME' || type === 'EXPENSE')) {
        where.type = type;
      }

      // Obtener movimientos del usuario autenticado
      const movements = await prisma.movement.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: {
          date: 'desc',
        },
        select: {
          id: true,
          amount: true,
          description: true,
          type: true,
          date: true,
          createdAt: true,
        },
      });

      // Obtener total para paginación
      const total = await prisma.movement.count({ where });

      res.status(200).json({
        movements,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      console.error('Error fetching movements:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
    return;
  }

  if (req.method === 'POST') {
    try {
      const data: MovementData = req.body;

      // Validaciones básicas
      if (!data.amount || !data.description || !data.type) {
        return res.status(400).json({ 
          error: 'Faltan campos requeridos: amount, description, type' 
        });
      }

      if (data.amount <= 0) {
        return res.status(400).json({ 
          error: 'El monto debe ser mayor a 0' 
        });
      }

      if (!['INCOME', 'EXPENSE'].includes(data.type)) {
        return res.status(400).json({ 
          error: 'Tipo de movimiento inválido. Use INCOME o EXPENSE' 
        });
      }

      // Crear movimiento
      const movement = await prisma.movement.create({
        data: {
          amount: data.amount,
          description: data.description,
          type: data.type,
          date: data.date ? new Date(data.date) : new Date(),
          userId: session.user.id,
        },
        select: {
          id: true,
          amount: true,
          description: true,
          type: true,
          date: true,
          createdAt: true,
        },
      });

      res.status(201).json(movement);
    } catch (error) {
      console.error('Error creating movement:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
    return;
  }

  res.status(405).json({ message: 'Method Not Allowed' });
}