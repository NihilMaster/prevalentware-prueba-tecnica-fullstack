import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface BalanceResult {
  currentBalance: number;
  totalIncome: number;
  totalExpense: number;
  movementCount: number;
  lastMovementDate: Date | null;
}

/**
 * Calcula el saldo actual para un usuario o grupo de usuarios
 */
export async function calculateCurrentBalance(userId?: string | string[]): Promise<BalanceResult> {
  const where: any = {};

  if (userId) {
    if (Array.isArray(userId)) {
      where.userId = { in: userId };
    } else {
      where.userId = userId;
    }
  }

  const movements = await prisma.movement.findMany({
    where,
    orderBy: {
      date: 'desc'
    }
  });

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
    currentBalance: totalIncome - totalExpense,
    totalIncome,
    totalExpense,
    movementCount: movements.length,
    lastMovementDate: movements.length > 0 ? movements[0].date : null
  };
}

/**
 * Calcula el saldo histórico día por día
 */
export async function calculateHistoricalBalance(
  userId?: string | string[], 
  days: number = 30
): Promise<{ date: string; balance: number }[]> {
  const where: any = {};
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  if (userId) {
    if (Array.isArray(userId)) {
      where.userId = { in: userId };
    } else {
      where.userId = userId;
    }
  }

  where.date = {
    gte: startDate,
    lte: endDate
  };

  const movements = await prisma.movement.findMany({
    where,
    orderBy: {
      date: 'asc'
    }
  });

  // Agrupar movimientos por día y calcular balance acumulado
  const dailyBalances: { [key: string]: number } = {};
  let runningBalance = 0;

  // Inicializar todos los días con balance 0
  const current = new Date(startDate);
  while (current <= endDate) {
    const dateKey = current.toISOString().split('T')[0];
    dailyBalances[dateKey] = 0;
    current.setDate(current.getDate() + 1);
  }

  // Procesar movimientos y calcular balance acumulado
  movements.forEach(movement => {
    const dateKey = movement.date.toISOString().split('T')[0];
    const amount = parseFloat(movement.amount.toString());
    
    if (movement.type === 'INCOME') {
      runningBalance += amount;
    } else {
      runningBalance -= amount;
    }
    
    // Actualizar balance para este día y todos los días siguientes
    const current = new Date(movement.date);
    while (current <= endDate) {
      const futureDateKey = current.toISOString().split('T')[0];
      dailyBalances[futureDateKey] = runningBalance;
      current.setDate(current.getDate() + 1);
    }
  });

  // Convertir a array ordenado
  return Object.entries(dailyBalances)
    .map(([date, balance]) => ({
      date,
      balance
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}