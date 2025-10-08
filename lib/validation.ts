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

// Función para validar los datos de entrada
export const validateMovementData = (
  data: unknown,
  isUpdate: boolean = false
): {
  success: boolean;
  data: CreateMovementInput | UpdateMovementInput | null;
  error: z.ZodIssue[] | { field: string; message: string }[] | null;
} => {
  const schema = isUpdate ? updateMovementSchema : createMovementSchema;

  // Verificar que data es un objeto
  if (typeof data !== 'object' || data === null) {
    return {
      success: false,
      data: null,
      error: [{ field: 'root', message: 'Datos de entrada inválidos' }],
    };
  }

  try {
    // Procesar datos antes de validar
    const processedData = { ...(data as Record<string, unknown>) };

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
};