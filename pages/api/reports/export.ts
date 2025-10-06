import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { requireAdmin } from '../../../lib/auth-utils';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Verificar que sea admin
  const adminCheck = await requireAdmin(req, res);
  if (!adminCheck) return;

  if (req.method === 'GET') {
    try {
      const { 
        userIds = 'all',
        startDate,
        endDate,
        format = 'csv'
      } = req.query;

      // Construir where clause
      const where: any = {};

      // Filtrar por fechas
      if (startDate && typeof startDate === 'string') {
        where.date = { ...where.date, gte: new Date(startDate) };
      }
      if (endDate && typeof endDate === 'string') {
        where.date = { ...where.date, lte: new Date(endDate) };
      }

      // Filtrar por usuarios si se especifica
      if (userIds !== 'all' && typeof userIds === 'string') {
        const userIdArray = userIds.split(',');
        where.userId = { in: userIdArray };
      }

      // Obtener movimientos con información de usuario
      const movements = await prisma.movement.findMany({
        where,
        include: {
          user: {
            select: {
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          date: 'desc'
        }
      });

      if (format === 'csv') {
        // Generar CSV
        const csv = generateCSV(movements);
        
        // Configurar headers para descarga
        const filename = `reporte-movimientos-${new Date().toISOString().split('T')[0]}.csv`;
        
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.status(200).send(csv);
      } else {
        // Devolver JSON como alternativa
        res.status(200).json({ movements });
      }
    } catch (error) {
      console.error('Error generating export:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
    return;
  }

  res.status(405).json({ message: 'Method Not Allowed' });
}

// Función para generar CSV formateado correctamente
function generateCSV(movements: any[]): string {
  const headers = [
    'Fecha',
    'Usuario',
    'Email',
    'Tipo',
    'Monto',
    'Descripción',
    'Fecha de Creación'
  ];

  const csvRows = [headers.join(',')];

  movements.forEach(movement => {
    const row = [
      formatDateForCSV(movement.date),
      `"${escapeCSV(movement.user.name)}"`,
      `"${escapeCSV(movement.user.email)}"`,
      movement.type === 'INCOME' ? 'Ingreso' : 'Egreso',
      formatAmountForCSV(movement.amount),
      `"${escapeCSV(movement.description)}"`,
      formatDateForCSV(movement.createdAt)
    ];
    
    csvRows.push(row.join(','));
  });

  // Agregar totales al final
  const totals = calculateTotals(movements);
  csvRows.push(''); // Línea vacía
  csvRows.push('RESUMEN,,,,');
  csvRows.push(`Total Ingresos,,,${formatAmountForCSV(totals.totalIncome)}`);
  csvRows.push(`Total Egresos,,,${formatAmountForCSV(totals.totalExpense)}`);
  csvRows.push(`Balance Final,,,${formatAmountForCSV(totals.totalBalance)}`);

  return csvRows.join('\n');
}

// Función para escapar caracteres especiales en CSV
function escapeCSV(field: string): string {
  if (!field) return '';
  // Escapar comillas duplicándolas
  return field.replace(/"/g, '""');
}

// Función para formatear fecha para CSV
function formatDateForCSV(date: Date): string {
  return new Date(date).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Función para formatear montos para CSV
function formatAmountForCSV(amount: any): string {
  const num = parseFloat(amount.toString());
  return num.toFixed(2).replace('.', ',');
}

// Función para calcular totales (reutilizada)
function calculateTotals(movements: any[]) {
  let totalIncome = 0;
  let totalExpense = 0;

  movements.forEach(movement => {
    const amount = parseFloat(movement.amount.toString());
    if (movement.type === 'INCOME') {
      totalIncome += amount;
    } else {
      totalExpense += amount;
    }
  });

  return {
    totalBalance: totalIncome - totalExpense,
    totalIncome,
    totalExpense
  };
}