import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient, MovementType } from '@prisma/client';
import { validateMovementData } from '../../../lib/validation';
import { getAuthenticatedUser } from '../../../lib/auth-utils';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Verificar autenticación para todos los endpoints
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ 
      error: 'No autorizado',
      message: 'Debes iniciar sesión para acceder a los movimientos'
    });
  }

  if (req.method === 'GET') {
    try {
      // Obtener parámetros de query
      const { page = '1', limit = '10', type } = req.query;
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      // Construir where clause
      const where: any = {
        userId: user.id, // Solo movimientos del usuario autenticado
      };

      if (type && (type === 'INCOME' || type === 'EXPENSE')) {
        where.type = type as MovementType;
      }

      // Obtener movimientos del usuario
      const movements = await prisma.movement.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: {
          createdAt: 'desc',
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
      // Validar datos de entrada
      const validation = validateMovementData(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          error: 'Datos inválidos',
          details: validation.error
        });
      }

      // Los campos ahora son requeridos, así que no pueden ser undefined
      const { amount, description, type, date } = validation.data!;

      // Crear movimiento asociado al usuario autenticado
      const movement = await prisma.movement.create({
        data: {
          amount: amount!, // Usar non-null assertion porque sabemos que existe
          description: description!,
          type: type as MovementType,
          date: new Date(date!), // date siempre tendrá valor por el default
          userId: user.id,
        }
      });

      res.status(201).json(movement);
    } catch (error) {
      console.error('Error creating movement:', error);
      res.status(500).json({ error: 'Error creando movimiento' });
    }
    return;
  }

  res.status(405).json({ message: 'Method Not Allowed' });
}