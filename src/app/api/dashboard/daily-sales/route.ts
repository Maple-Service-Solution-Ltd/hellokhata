// Hello Khata OS - Daily Sales API Route
// GET: Return last 7 days of sales data for chart

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Helper function to get start and end of day
function getStartEndOfDay(date: Date): { start: Date; end: Date } {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

// Helper function to format date as YYYY-MM-DD
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// GET /api/dashboard/daily-sales - Get daily sales data for last 7 days
export async function GET(request: NextRequest) {
  try {
    // Get businessId from headers
    const businessId = request.headers.get('x-business-id');
    
    // SECURITY: Require businessId - no demo business creation
    if (!businessId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const business = await db.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Business not found' } },
        { status: 404 }
      );
    }

    const actualBusinessId = businessId;

    // Generate array of last 7 days
    const dailyData: Array<{
      date: string;
      sales: number;
      expenses: number;
      profit: number;
      transactions: number;
    }> = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const { start, end } = getStartEndOfDay(date);
      const dateStr = formatDate(date);

      // Fetch sales for this day
      const salesData = await db.sale.aggregate({
        where: {
          businessId: actualBusinessId,
          createdAt: {
            gte: start,
            lte: end,
          },
          status: { not: 'cancelled' },
        },
        _sum: {
          total: true,
          profit: true,
        },
        _count: true,
      });

      // Fetch expenses for this day
      const expensesData = await db.expense.aggregate({
        where: {
          businessId: actualBusinessId,
          date: {
            gte: start,
            lte: end,
          },
        },
        _sum: {
          amount: true,
        },
      });

      const sales = salesData._sum.total || 0;
      const expenses = expensesData._sum.amount || 0;
      const profit = (salesData._sum.profit || 0) - expenses;
      const transactions = salesData._count;

      dailyData.push({
        date: dateStr,
        sales,
        expenses,
        profit,
        transactions,
      });
    }

    return NextResponse.json({
      success: true,
      data: dailyData,
    });
  } catch (error) {
    console.error('Error fetching daily sales:', error);
    return NextResponse.json(
      { success: false, error: { code: 'FETCH_ERROR', message: 'Failed to fetch daily sales data' } },
      { status: 500 }
    );
  }
}
