// src/types/auth.d.ts (o la ruta que decidas)

import { RoleType } from '@prisma/client'; // Importa el Enum de Prisma

// *Ajusta la ruta 'better-auth/types' según la documentación real de Better Auth*
declare module 'better-auth/types' {
  /**
   * Extiende la interfaz de usuario para incluir el rol del usuario.
   */
  interface User {
    role: RoleType;
  }
}