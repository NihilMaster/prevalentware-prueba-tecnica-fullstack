import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { requireAdmin } from '../../../lib/auth-utils';

const prisma = new PrismaClient();

/**
 * @swagger
 * /api/reports/summary:
 *   get:
 *     summary: Obtener datos resumen para gráficos (Solo administradores)
 *     description: Retorna datos agregados de movimientos para generar gráficos y reportes
 *     tags:
 *       - Reportes
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [day, week, month, year]
 *           default: month
 *         description: Período de tiempo para el reporte
 *       - in: query
 *         name: userIds
 *         schema:
 *           type: string
 *           default: all
 *         description: IDs de usuarios separados por coma o 'all' para todos los usuarios
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de inicio personalizada (formato YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de fin personalizada (formato YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Datos del reporte obtenidos exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 labels:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["01 Ene", "02 Ene", "03 Ene"]
 *                   description: Etiquetas para el eje X del gráfico
 *                 datasets:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       label:
 *                         type: string
 *                         example: "Ingresos"
 *                       data:
 *                         type: array
 *                         items:
 *                           type: number
 *                         example: [100, 150, 200]
 *                       borderColor:
 *                         type: string
 *                         example: "#10b981"
 *                       backgroundColor:
 *                         type: string
 *                         example: "rgba(16, 185, 129, 0.1)"
 *                 totalBalance:
 *                   type: number
 *                   example: 1500.75
 *                   description: Balance total (ingresos - egresos)
 *                 totalIncome:
 *                   type: number
 *                   example: 3000.50
 *                   description: Total de ingresos
 *                 totalExpense:
 *                   type: number
 *                   example: 1499.75
 *                   description: Total de egresos
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
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

interface SummaryData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
  }[];
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
}

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
        period = 'month', // day, week, month, year
        userIds = 'all', // 'all' o lista de IDs separados por coma
        startDate,
        endDate 
      } = req.query;

      // Determinar el rango de fechas
      const now = new Date();
      let dateFrom: Date;
      
      switch (period) {
        case 'day':
          dateFrom = new Date(now.setDate(now.getDate() - 1));
          break;
        case 'week':
          dateFrom = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'year':
          dateFrom = new Date(now.setFullYear(now.getFullYear() - 1));
          break;
        case 'month':
        default:
          dateFrom = new Date(now.setMonth(now.getMonth() - 1));
          break;
      }

      // Si se proporcionan fechas específicas, usarlas
      if (startDate && typeof startDate === 'string') {
        dateFrom = new Date(startDate);
      }
      
      const dateTo = endDate && typeof endDate === 'string' ? new Date(endDate) : new Date();

      // Construir where clause
      const where: any = {
        date: {
          gte: dateFrom,
          lte: dateTo
        }
      };

      // Filtrar por usuarios si se especifica
      if (userIds !== 'all' && typeof userIds === 'string') {
        const userIdArray = userIds.split(',');
        where.userId = { in: userIdArray };
      }

      // Obtener todos los movimientos en el período
      const movements = await prisma.movement.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          date: 'asc'
        }
      });

      // Generar datos para el gráfico
      const chartData = generateChartData(movements, dateFrom, dateTo, period as string);
      
      // Calcular totales
      const totals = calculateTotals(movements);

      const response: SummaryData = {
        ...chartData,
        ...totals
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Error generating summary report:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
    return;
  }

  res.status(405).json({ message: 'Method Not Allowed' });
}

// Función para generar datos del gráfico
function generateChartData(
  movements: any[], 
  dateFrom: Date, 
  dateTo: Date, 
  period: string
) {
  const labels: string[] = [];
  const incomeData: number[] = [];
  const expenseData: number[] = [];
  const balanceData: number[] = [];

  // Crear buckets de tiempo según el período
  const timeBuckets = createTimeBuckets(dateFrom, dateTo, period);
  
  // Inicializar buckets
  const incomeBuckets: { [key: string]: number } = {};
  const expenseBuckets: { [key: string]: number } = {};
  
  timeBuckets.forEach(bucket => {
    incomeBuckets[bucket] = 0;
    expenseBuckets[bucket] = 0;
    labels.push(bucket);
  });

  // Agrupar movimientos por buckets de tiempo
  movements.forEach(movement => {
    const bucket = getTimeBucket(movement.date, period);
    const amount = parseFloat(movement.amount.toString());
    
    if (movement.type === 'INCOME') {
      incomeBuckets[bucket] += amount;
    } else {
      expenseBuckets[bucket] += amount;
    }
  });

  // Construir arrays de datos y calcular balance acumulado
  let runningBalance = 0;
  
  labels.forEach(label => {
    const income = incomeBuckets[label] || 0;
    const expense = expenseBuckets[label] || 0;
    const net = income - expense;
    
    incomeData.push(income);
    expenseData.push(expense);
    
    runningBalance += net;
    balanceData.push(runningBalance);
  });

  return {
    labels,
    datasets: [
      {
        label: 'Ingresos',
        data: incomeData,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
      },
      {
        label: 'Egresos',
        data: expenseData,
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
      },
      {
        label: 'Balance Acumulado',
        data: balanceData,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
      }
    ]
  };
}

// Función para crear buckets de tiempo
function createTimeBuckets(dateFrom: Date, dateTo: Date, period: string): string[] {
  const buckets: string[] = [];
  const current = new Date(dateFrom);
  
  while (current <= dateTo) {
    buckets.push(getTimeBucket(new Date(current), period));
    
    switch (period) {
      case 'day':
        current.setHours(current.getHours() + 1);
        break;
      case 'week':
        current.setDate(current.getDate() + 1);
        break;
      case 'year':
        current.setMonth(current.getMonth() + 1);
        break;
      case 'month':
      default:
        current.setDate(current.getDate() + 1);
        break;
    }
  }
  
  return buckets;
}

// Función para obtener el bucket de tiempo de una fecha
function getTimeBucket(date: Date, period: string): string {
  switch (period) {
    case 'day':
      return date.toLocaleTimeString('es-ES', { hour: '2-digit', hour12: false });
    case 'week':
      return date.toLocaleDateString('es-ES', { weekday: 'short' });
    case 'year':
      return date.toLocaleDateString('es-ES', { month: 'short' });
    case 'month':
    default:
      return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
  }
}

// Función para calcular totales
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