import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { requireAdmin } from '../../../lib/auth-utils';
import {
  calculateHistoricalBalance,
  calculateCurrentBalance,
} from '@/lib/balance-calculator';

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
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Prohibido
 *       500:
 *         description: Error interno del servidor
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Solo GET permitido
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // Verificar rol administrador
  const adminCheck = await requireAdmin(req, res);
  if (!adminCheck) return;

  try {
    const { period = 'month', userIds = 'all', startDate, endDate } = req.query;

    // Determinar rango de fechas
    let days = 30;
    switch (period) {
      case 'day':
        days = 1;
        break;
      case 'week':
        days = 7;
        break;
      case 'month':
        days = 30;
        break;
      case 'year':
        days = 365;
        break;
    }

    const dateFrom = startDate
      ? new Date(startDate as string)
      : new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const dateTo = endDate ? new Date(endDate as string) : new Date();

    // Construir filtro base
    const where: any = {
      date: { gte: dateFrom, lte: dateTo },
    };

    // Filtrar usuarios
    if (userIds !== 'all' && typeof userIds === 'string') {
      const ids = userIds.split(',').map((id) => id.trim());
      where.userId = { in: ids };
    }

    // Calcular balances históricos y totales
    const historicalData = await calculateHistoricalBalance(
      where.userId?.in ?? undefined,
      days
    );
    const currentBalance = await calculateCurrentBalance();

    // Consultar movimientos para construir gráfico
    const movements = await prisma.movement.findMany({
      where,
      orderBy: { date: 'asc' },
    });

    // Agrupar movimientos por día
    const dailyData: Record<string, { income: number; expense: number }> = {};
    const allDates = historicalData.map(
      (item) => new Date(item.date).toISOString().split('T')[0]
    );

    allDates.forEach((dateKey) => {
      dailyData[dateKey] = { income: 0, expense: 0 };
    });

    movements.forEach((movement) => {
      const dateKey = movement.date.toISOString().split('T')[0];
      const amount = parseFloat(movement.amount.toString());
      if (!dailyData[dateKey]) dailyData[dateKey] = { income: 0, expense: 0 };
      if (movement.type === 'INCOME') {
        dailyData[dateKey].income += amount;
      } else {
        dailyData[dateKey].expense += amount;
      }
    });

    // Ejes y datasets
    const labels = allDates.map((date) =>
      new Date(date).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
      })
    );

    const incomeData = allDates.map((date) => dailyData[date]?.income || 0);
    const expenseData = allDates.map((date) => dailyData[date]?.expense || 0);
    const balanceData = historicalData.map((item) => item.balance);

    const summaryData = {
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
          label: 'Balance',
          data: balanceData,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
        },
      ],
      totalBalance: currentBalance.currentBalance,
      totalIncome: currentBalance.totalIncome,
      totalExpense: currentBalance.totalExpense,
    };

    res.status(200).json(summaryData);
  } catch (error) {
    console.error('Error generating summary report:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}
