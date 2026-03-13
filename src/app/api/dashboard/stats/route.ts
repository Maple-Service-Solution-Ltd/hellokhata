// Hello Khata OS - Dashboard Stats API Route
// GET: Return dashboard statistics for a business
// Branch-scoped with support for All Branches aggregation

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { 
  validateBranchAccess,
  buildBranchWhereClause
} from '@/lib/branch-context';

// Helper function to get start and end of day in local timezone
function getStartEndOfDay(date: Date): { start: Date; end: Date } {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

// GET /api/dashboard/stats - Get dashboard statistics
// Supports branch-scoped and all-branches mode
export async function GET(request: NextRequest) {
  try {
    // Get businessId from headers
    const businessId = request.headers.get('x-business-id');
    const branchId = request.headers.get('x-branch-id') || null; // null = All Branches mode
    
    // SECURITY: Require businessId
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

    // Validate branch access if branchId provided
    if (branchId) {
      const branchValidation = await validateBranchAccess(businessId, branchId);
      if (!branchValidation.valid) {
        return NextResponse.json({
          success: false,
          error: branchValidation.error,
        }, { status: 403 });
      }
    }

    // Build base where clause with branch scope
    const branchWhere = buildBranchWhereClause(businessId, branchId);

    // Get today's date range
    const today = new Date();
    const { start: todayStart, end: todayEnd } = getStartEndOfDay(today);

    // Get yesterday's date range
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const { start: yesterdayStart, end: yesterdayEnd } = getStartEndOfDay(yesterday);

    // Fetch today's sales with branch filter
    const todaySalesData = await db.sale.aggregate({
      where: {
        ...branchWhere,
        createdAt: {
          gte: todayStart,
          lte: todayEnd,
        },
        status: { not: 'cancelled' },
      },
      _sum: {
        total: true,
        profit: true,
      },
      _count: true,
    });

    const todaySales = todaySalesData._sum.total || 0;

    // Fetch today's expenses with branch filter
    const todayExpensesData = await db.expense.aggregate({
      where: {
        businessId,
        ...(branchId ? { branchId } : {}),
        date: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      _sum: {
        amount: true,
      },
    });

    const todayExpenses = todayExpensesData._sum.amount || 0;

    // Calculate today's profit (simplified: sales profit - expenses)
    const todayProfit = (todaySalesData._sum.profit || 0) - todayExpenses;

    // Fetch yesterday's sales for growth calculation with branch filter
    const yesterdaySalesData = await db.sale.aggregate({
      where: {
        ...branchWhere,
        createdAt: {
          gte: yesterdayStart,
          lte: yesterdayEnd,
        },
        status: { not: 'cancelled' },
      },
      _sum: {
        total: true,
        profit: true,
      },
    });

    const yesterdaySales = yesterdaySalesData._sum.total || 0;

    // Calculate sales growth percentage
    let salesGrowth = 0;
    if (yesterdaySales > 0) {
      salesGrowth = ((todaySales - yesterdaySales) / yesterdaySales) * 100;
    } else if (todaySales > 0) {
      salesGrowth = 100;
    }

    // Fetch receivable and payable from parties with branch filter
    // For parties, we check if branchId matches or party has no branchId (shared)
    const partyWhere = {
      businessId,
      isActive: true,
      ...(branchId ? {
        OR: [
          { branchId },
          { branchId: null }, // Include shared parties
        ],
      } : {}),
    };

    // Calculate receivable (positive balances - customers owe)
    const receivableData = await db.party.aggregate({
      where: {
        ...partyWhere,
        currentBalance: { gt: 0 },
      },
      _sum: {
        currentBalance: true,
      },
    });
    const receivable = receivableData._sum.currentBalance || 0;

    // Calculate payable (negative balances - owe to suppliers)
    const payableData = await db.party.aggregate({
      where: {
        ...partyWhere,
        currentBalance: { lt: 0 },
      },
      _sum: {
        currentBalance: true,
      },
    });
    const payable = Math.abs(payableData._sum.currentBalance || 0);

    // Fetch inventory stats with branch filter
    // Items can be branch-specific or shared (no branch)
    const itemWhere = {
      businessId,
      isActive: true,
      ...(branchId ? {
        OR: [
          { branchId },
          { branchId: null }, // Include shared items
        ],
      } : {}),
    };

    const inventoryStats = await db.item.aggregate({
      where: itemWhere,
      _sum: {
        currentStock: true,
      },
    });

    const totalStock = inventoryStats._sum.currentStock || 0;

    // Calculate stock value (currentStock * costPrice)
    const items = await db.item.findMany({
      where: itemWhere,
      select: {
        currentStock: true,
        costPrice: true,
      },
    });

    const stockValue = items.reduce(
      (sum, item) => sum + item.currentStock * item.costPrice,
      0
    );

    // Count low stock items
    const lowStockItems = await db.item.count({
      where: {
        ...itemWhere,
        currentStock: { lte: db.item.fields.minStock },
      },
    });

    // Count active parties
    const activeParties = await db.party.count({
      where: partyWhere,
    });

    // Count pending payments with branch filter
    const pendingPayments = await db.sale.count({
      where: {
        ...branchWhere,
        dueAmount: { gt: 0 },
        status: { not: 'cancelled' },
      },
    });

    // Get cash and bank balances from accounts with branch filter
    const accounts = await db.account.findMany({
      where: {
        businessId,
        status: 'active',
        ...(branchId ? {
          OR: [
            { branchId },
            { branchId: null }, // Include shared accounts
          ],
        } : {}),
      },
      select: {
        type: true,
        currentBalance: true,
      },
    });

    let cashBalance = 0;
    let bankBalance = 0;

    accounts.forEach((account) => {
      if (account.type === 'cash' || account.type === 'mobile_wallet') {
        cashBalance += account.currentBalance;
      } else if (account.type === 'bank') {
        bankBalance += account.currentBalance;
      }
    });

    // Calculate credit overdue (parties with balances overdue by more than 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const overdueParties = await db.party.findMany({
      where: {
        ...partyWhere,
        currentBalance: { gt: 0 },
        lastPaymentDate: { lt: thirtyDaysAgo },
      },
      select: {
        currentBalance: true,
      },
    });

    const creditOverdue = overdueParties.reduce(
      (sum, party) => sum + party.currentBalance,
      0
    );

    // Calculate dead stock value (items not sold in last 90 days with stock > 0)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const deadStockItems = await db.item.findMany({
      where: {
        ...itemWhere,
        currentStock: { gt: 0 },
        OR: [
          { lastSaleDate: null },
          { lastSaleDate: { lt: ninetyDaysAgo } },
        ],
      },
      select: {
        currentStock: true,
        costPrice: true,
      },
    });

    const deadStockValue = deadStockItems.reduce(
      (sum, item) => sum + item.currentStock * item.costPrice,
      0
    );

    // Calculate expense growth
    const yesterdayExpensesData = await db.expense.aggregate({
      where: {
        businessId,
        ...(branchId ? { branchId } : {}),
        date: {
          gte: yesterdayStart,
          lte: yesterdayEnd,
        },
      },
      _sum: {
        amount: true,
      },
    });

    const yesterdayExpenses = yesterdayExpensesData._sum.amount || 0;
    let expenseGrowth = 0;
    if (yesterdayExpenses > 0) {
      expenseGrowth = ((todayExpenses - yesterdayExpenses) / yesterdayExpenses) * 100;
    } else if (todayExpenses > 0) {
      expenseGrowth = 100;
    }

    // Calculate yesterday's profit for profit growth
    const yesterdayProfit = (yesterdaySalesData._sum.profit || 0) - yesterdayExpenses;
    let profitGrowth = 0;
    if (yesterdayProfit !== 0) {
      profitGrowth = ((todayProfit - yesterdayProfit) / Math.abs(yesterdayProfit)) * 100;
    } else if (todayProfit !== 0) {
      profitGrowth = todayProfit > 0 ? 100 : -100;
    }

    const stats = {
      todaySales,
      todayExpenses,
      todayProfit,
      receivable,
      payable,
      totalStock,
      stockValue,
      lowStockItems,
      activeParties,
      pendingPayments,
      salesGrowth: Math.round(salesGrowth * 100) / 100,
      profitGrowth: Math.round(profitGrowth * 100) / 100,
      expenseGrowth: Math.round(expenseGrowth * 100) / 100,
      cashBalance,
      bankBalance,
      creditOverdue,
      deadStockValue,
    };

    return NextResponse.json({
      success: true,
      data: stats,
      meta: {
        branchScope: branchId ? 'single' : 'all',
        branchId: branchId || null,
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { success: false, error: { code: 'FETCH_ERROR', message: 'Failed to fetch dashboard statistics' } },
      { status: 500 }
    );
  }
}
