import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { requireAdmin, getAuthenticatedUser } from '../../../lib/auth-utils';

const prisma = new PrismaClient();

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Obtener información detallada de un usuario (Solo administradores)
 *     description: Retorna información completa de un usuario específico incluyendo sus movimientos recientes
 *     tags:
 *       - Usuarios
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Información del usuario obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                     emailVerified:
 *                       type: boolean
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                     movements:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Movement'
 *                     _count:
 *                       type: object
 *                       properties:
 *                         movements:
 *                           type: integer
 *                         sessions:
 *                           type: integer
 *                         accounts:
 *                           type: integer
 *       401:
 *         description: No autorizado - Usuario no autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Prohibido - Se requieren permisos de administrador
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Usuario no encontrado
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
 *   put:
 *     summary: Actualizar información de un usuario (Solo administradores)
 *     description: Actualiza la información de un usuario específico. Los administradores no pueden cambiar su propio rol.
 *     tags:
 *       - Usuarios
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 255
 *                 example: "María García"
 *                 description: Nuevo nombre del usuario
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "maria@ejemplo.com"
 *                 description: Nuevo email del usuario
 *               role:
 *                 type: string
 *                 enum: [USER, ADMIN]
 *                 example: "ADMIN"
 *                 description: Nuevo rol del usuario (no aplicable para auto-edición)
 *     responses:
 *       200:
 *         description: Usuario actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Usuario actualizado correctamente"
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Datos inválidos o intento de auto-edición de rol
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
 *       403:
 *         description: Prohibido - Se requieren permisos de administrador
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Usuario no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Conflicto - Email ya en uso
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

// Esquema de validación para editar usuario
const updateUserSchema = {
  name: (value: any) => {
    if (
      value &&
      typeof value === 'string' &&
      value.length > 0 &&
      value.length <= 255
    ) {
      return value;
    }
    throw new Error('El nombre debe tener entre 1 y 255 caracteres');
  },
  email: (value: any) => {
    if (
      value &&
      typeof value === 'string' &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    ) {
      return value;
    }
    throw new Error('El email debe ser válido');
  },
  role: (value: any) => {
    if (value && ['USER', 'ADMIN'].includes(value)) {
      return value;
    }
    throw new Error('El rol debe ser USER o ADMIN');
  },
};

function validateUserUpdate(data: any) {
  const errors: { field: string; message: string }[] = [];
  const validatedData: any = {};

  for (const [field, validator] of Object.entries(updateUserSchema)) {
    if (data[field] !== undefined) {
      try {
        validatedData[field] = (validator as any)(data[field]);
      } catch (error) {
        errors.push({
          field,
          message: (error as Error).message,
        });
      }
    }
  }

  return {
    success: errors.length === 0,
    data: validatedData,
    errors,
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Verificar que sea admin
  const currentUser = await getAuthenticatedUser(req);
  if (!currentUser || currentUser.role !== 'ADMIN') {
    return res.status(403).json({
      error: 'Acceso denegado',
      message: 'Se requieren permisos de administrador',
    });
  }

  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'ID de usuario inválido' });
  }

  if (req.method === 'GET') {
    try {
      // Obtener usuario específico
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
          movements: {
            select: {
              id: true,
              amount: true,
              description: true,
              type: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
          _count: {
            select: {
              movements: true,
              sessions: true,
              accounts: true,
            },
          },
        },
      });

      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      res.status(200).json({ user });
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
    return;
  }

  if (req.method === 'PUT') {
    try {
      // 🔒 Prevenir auto-edición de rol
      if (
        id === currentUser.id &&
        req.body.role &&
        req.body.role !== currentUser.role
      ) {
        return res.status(400).json({
          error: 'Auto-edición de rol bloqueada',
          message: 'No puedes cambiar tu propio rol',
        });
      }

      // Validar datos de entrada
      const validation = validateUserUpdate(req.body);

      if (!validation.success) {
        return res.status(400).json({
          error: 'Datos inválidos',
          details: validation.errors,
        });
      }

      // Verificar que el usuario existe
      const existingUser = await prisma.user.findUnique({
        where: { id },
        select: { id: true },
      });

      if (!existingUser) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      // Verificar unicidad del email si se está actualizando
      if (validation.data.email) {
        const emailExists = await prisma.user.findFirst({
          where: {
            email: validation.data.email,
            id: { not: id },
          },
        });

        if (emailExists) {
          return res.status(400).json({
            error: 'Email en uso',
            message: 'El email ya está siendo utilizado por otro usuario',
          });
        }
      }

      // Actualizar usuario
      const updatedUser = await prisma.user.update({
        where: { id },
        data: validation.data,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      res.status(200).json({
        message: 'Usuario actualizado correctamente',
        user: updatedUser,
      });
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
    return;
  }

  res.status(405).json({ message: 'Method Not Allowed' });
}
