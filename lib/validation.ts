import { z } from 'zod';

// Definir el enum que coincida con Prisma
export const MovementType = z.enum(['INCOME', 'EXPENSE']);
export type MovementType = z.infer<typeof MovementType>;

// Esquema de validación para crear movimientos (todos los campos requeridos)
export const createMovementSchema = z.object({
  amount: z
    .number({})
    .positive('El monto debe ser mayor a 0')
    .max(1000000, 'El monto no puede exceder 1,000,000'),

  description: z
    .string({})
    .min(1, 'La descripción es requerida')
    .max(255, 'La descripción no puede exceder 255 caracteres'),

  type: MovementType,

  date: z.string().datetime().optional().default(new Date().toISOString()),
});

// Esquema de validación para actualizar movimientos (todos opcionales)
export const updateMovementSchema = z.object({
  amount: z
    .number()
    .positive('El monto debe ser mayor a 0')
    .max(1000000, 'El monto no puede exceder 1,000,000')
    .optional(),

  description: z
    .string()
    .min(1, 'La descripción es requerida')
    .max(255, 'La descripción no puede exceder 255 caracteres')
    .optional(),

  type: MovementType.optional(),

  date: z.string().datetime().optional(),
});

// Tipo TypeScript inferido del esquema
export type CreateMovementInput = z.infer<typeof createMovementSchema>;
export type UpdateMovementInput = z.infer<typeof updateMovementSchema>;

// Función de validación mejorada
export function validateMovementData(data: unknown, isUpdate: boolean = false) {
  const schema = isUpdate ? updateMovementSchema : createMovementSchema;

  try {
    // Procesar datos antes de validar
    const processedData: Record<string, any> = (typeof data === 'object' && data !== null) ? { ...data } : {};

    // Convertir amount a número si es string
    if (processedData.amount !== undefined && processedData.amount !== null) {
      if (typeof processedData.amount === 'string') {
        processedData.amount = parseFloat(processedData.amount);
      }
    }

    // Proporcionar fecha por defecto si no existe
    if (!isUpdate && !processedData.date) {
      processedData.date = new Date().toISOString();
    }

    const validatedData = schema.parse(processedData);

    return {
      success: true,
      data: validatedData,
      error: null,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        data: null,
        error: error.issues,
      };
    }

    return {
      success: false,
      data: null,
      error: [{ field: 'unknown', message: 'Error de validación desconocido' }],
    };
  }
}
