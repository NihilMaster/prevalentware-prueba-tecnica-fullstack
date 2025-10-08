import { auth } from '../lib/auth'; // Ajusta la ruta según tu estructura
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Tipos de roles
export type UserRole = 'USER' | 'ADMIN';

// Interfaz para usuario autenticado
export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

// Obtener usuario desde la sesión de Better Auth
export async function getAuthenticatedUser(
  req: any
): Promise<AuthenticatedUser | null> {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session || !session.user) {
      return null;
    }

    // Obtener usuario de la base de datos con su rol
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true, // Asumiendo que agregaste el campo role al modelo User
      },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: (user.role as UserRole) || 'USER', // Default to USER if no role
    };
  } catch (error) {
    console.error('Error getting authenticated user:', error);
    return null;
  }
}

// Middleware de autenticación
export async function requireAuth(req: any, res: any, next?: () => void) {
  const user = await getAuthenticatedUser(req);

  if (!user) {
    return res.status(401).json({
      error: 'No autorizado',
      message: 'Debes iniciar sesión para acceder a este recurso',
    });
  }

  // Si se pasa next, es middleware de Express
  if (next) {
    (req as any).user = user;
    next();
    return;
  }

  return user;
}

// Middleware de autorización por roles
export function requireRole(allowedRoles: UserRole[]) {
  return async (req: any, res: any, next?: () => void) => {
    const user = await getAuthenticatedUser(req);

    if (!user) {
      return res.status(401).json({
        error: 'No autorizado',
        message: 'Debes iniciar sesión para acceder a este recurso',
      });
    }

    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'No tienes permisos suficientes para realizar esta acción',
      });
    }

    // Si se pasa next, es middleware de Express
    if (next) {
      (req as any).user = user;
      next();
      return;
    }

    return user;
  };
}

// Funciones de utilidad
export const requireAdmin = requireRole(['ADMIN']);
export const requireUser = requireRole(['USER', 'ADMIN']);

// Verificar si es admin (para uso directo)
export async function isAdmin(req: any): Promise<boolean> {
  const user = await getAuthenticatedUser(req);
  return user?.role === 'ADMIN';
}

// Función específica para verificar permisos de administrador
export async function validateAdminPermissions(req: any): Promise<{
  hasPermission: boolean;
  user?: AuthenticatedUser;
  error?: string;
}> {
  try {
    const user = await getAuthenticatedUser(req);

    if (!user) {
      return {
        hasPermission: false,
        error: 'No autenticado',
      };
    }

    if (user.role !== 'ADMIN') {
      return {
        hasPermission: false,
        error: 'Se requieren permisos de administrador',
      };
    }

    return {
      hasPermission: true,
      user,
    };
  } catch (error) {
    console.error('Error validating admin permissions:', error);
    return {
      hasPermission: false,
      error: 'Error validando permisos',
    };
  }
}

// Middleware para prevenir auto-edición de rol
export function preventSelfRoleChange(
  targetUserId: string,
  currentUser: AuthenticatedUser,
  newRole?: string
) {
  if (
    targetUserId === currentUser.id &&
    newRole &&
    newRole !== currentUser.role
  ) {
    return {
      allowed: false,
      error: 'No puedes cambiar tu propio rol',
    };
  }
  return { allowed: true };
}

// Función para verificar si un usuario puede ser editado
export async function canEditUser(
  editor: AuthenticatedUser,
  targetUserId: string
) {
  // Admins pueden editar cualquier usuario excepto su propio rol
  if (editor.role === 'ADMIN') {
    return {
      allowed: true,
      restrictions: targetUserId === editor.id ? ['role'] : [],
    };
  }

  // Usuarios normales solo pueden auto-editarse (sin cambiar rol)
  if (editor.role === 'USER' && editor.id === targetUserId) {
    return {
      allowed: true,
      restrictions: ['role'],
    };
  }

  return {
    allowed: false,
    error: 'No tienes permisos para editar este usuario',
  };
}

export async function checkIsAdmin(
  req: any
): Promise<{ isAdmin: boolean; user?: AuthenticatedUser }> {
  try {
    const user = await getAuthenticatedUser(req);
    return {
      isAdmin: user?.role === 'ADMIN',
      user: user || undefined,
    };
  } catch (error) {
    console.error('Error checking admin status:', error);
    return { isAdmin: false };
  }
}
