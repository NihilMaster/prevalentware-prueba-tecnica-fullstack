import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient, MovementType } from '@prisma/client';
import { validateMovementData } from '../../../lib/validation';
import { getAuthenticatedUser } from '../../../lib/auth-utils';

/**
 * @swagger
 * /api/movimientos:
 *   get:
 *     summary: Obtener lista de movimientos
 *     description: |
 *       Retorna los movimientos financieros:
 *       - Administradores: ven todos los movimientos del sistema
 *       - Usuarios normales: solo ven sus propios movimientos
 *     tags:
 *       - Movimientos
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Número de página para paginación
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Cantidad de resultados por página
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [INCOME, EXPENSE]
 *         description: Filtrar por tipo de movimiento
 *     responses:
 *       200:
 *         description: Lista de movimientos obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 movements:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Movement'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: No autorizado - Usuario no autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

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
      message: 'Debes iniciar sesión para acceder a los movimientos',
    });
  }

  if (req.method === 'GET') {
    try {
      // Obtener parámetros de query
      const { page = '1', limit = '10', type } = req.query;
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      // Construir where clause - MODIFICADO: ya no filtra por usuario
      const where: any = {};

      // Solo los administradores pueden ver todos los movimientos
      if (user.role !== 'ADMIN') {
        where.userId = user.id; // Usuarios normales solo ven sus movimientos
      }

      if (type && (type === 'INCOME' || type === 'EXPENSE')) {
        where.type = type as MovementType;
      }

      // Obtener movimientos - MODIFICADO: incluir información del usuario
      const movements = await prisma.movement.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          // Incluir información del usuario
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
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
          details: validation.error,
        });
      }

      // Los campos ahora son requeridos, así que no pueden ser undefined
      const { amount, description, type, date } = validation.data!;

      // Crear movimiento - MODIFICADO: siempre asociado al usuario que lo crea
      const movement = await prisma.movement.create({
        data: {
          amount: amount!,
          description: description!,
          type: type as MovementType,
          date: new Date(date!),
          userId: user.id, // Siempre asociado al usuario autenticado
        },
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
