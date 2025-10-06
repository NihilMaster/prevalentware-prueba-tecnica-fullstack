import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient, MovementType } from '@prisma/client';
import { validateMovementData } from '../../../lib/validation';
import { getAuthenticatedUser } from '../../../lib/auth-utils';

const prisma = new PrismaClient();

/**
 * @swagger
 * /api/movements:
 *   get:
 *     summary: Obtener lista de movimientos del usuario autenticado
 *     description: Retorna los movimientos financieros del usuario con paginación y filtros opcionales
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
 * 
 *   post:
 *     summary: Crear un nuevo movimiento
 *     description: Crea un nuevo movimiento financiero para el usuario autenticado
 *     tags:
 *       - Movimientos
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - description
 *               - type
 *             properties:
 *               amount:
 *                 type: number
 *                 minimum: 0.01
 *                 maximum: 1000000
 *                 example: 150.75
 *                 description: Monto del movimiento (debe ser mayor a 0)
 *               description:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 255
 *                 example: "Compra de supermercado"
 *                 description: Descripción del movimiento
 *               type:
 *                 type: string
 *                 enum: [INCOME, EXPENSE]
 *                 example: "EXPENSE"
 *                 description: Tipo de movimiento
 *               date:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-01-15T10:30:00.000Z"
 *                 description: Fecha del movimiento (opcional, por defecto fecha actual)
 *     responses:
 *       201:
 *         description: Movimiento creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Movement'
 *       400:
 *         description: Datos de entrada inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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