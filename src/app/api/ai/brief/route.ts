// Hello Khata OS - AI Brief API
// GET: Return AI-generated brief insights for the business

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Insight types
interface Insight {
  id: string;
  type: 'alert' | 'opportunity' | 'achievement' | 'info';
  title: string;
  titleBn: string;
  description: string;
  descriptionBn: string;
  impact: 'high' | 'medium' | 'low';
  action: string;
  actionBn: string;
  actionType?: string;
}

interface QuickStat {
  label: string;
  labelBn: string;
  value: string;
  trend?: string;
  positive?: boolean;
}

// Helper functions
function getStartEndOfDay(date: Date): { start: Date; end: Date } {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function formatCurrency(amount: number): string {
  return `৳${amount.toLocaleString('bn-BD')}`;
}

// GET /api/ai/brief - Get AI brief insights
export async function GET(request: NextRequest) {
  try {
    const businessId = request.headers.get('x-business-id');

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

    // Get date ranges
    const today = new Date();
    const { start: todayStart, end: todayEnd } = getStartEndOfDay(today);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const { start: yesterdayStart, end: yesterdayEnd } = getStartEndOfDay(yesterday);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Fetch data in parallel
    const [
      todaySales,
      yesterdaySales,
      monthSales,
      todayExpenses,
      lowStockItems,
      overdueParties,
      creditLimitParties,
      deadStockItems,
      topSellingItems,
      pendingPayments,
    ] = await Promise.all([
      // Today's sales
      db.sale.aggregate({
        where: {
          businessId,
          createdAt: { gte: todayStart, lte: todayEnd },
          status: { not: 'cancelled' },
        },
        _sum: { total: true, profit: true },
        _count: true,
      }),
      // Yesterday's sales
      db.sale.aggregate({
        where: {
          businessId,
          createdAt: { gte: yesterdayStart, lte: yesterdayEnd },
          status: { not: 'cancelled' },
        },
        _sum: { total: true },
      }),
      // This month's sales
      db.sale.aggregate({
        where: {
          businessId,
          createdAt: { gte: thirtyDaysAgo },
          status: { not: 'cancelled' },
        },
        _sum: { total: true, profit: true },
        _count: true,
      }),
      // Today's expenses
      db.expense.aggregate({
        where: {
          businessId,
          date: { gte: todayStart, lte: todayEnd },
        },
        _sum: { amount: true },
      }),
      // Low stock items
      db.item.findMany({
        where: {
          businessId,
          isActive: true,
          currentStock: { lte: db.item.fields.minStock },
        },
        select: { name: true, nameBn: true, currentStock: true, minStock: true },
        take: 5,
      }),
      // Overdue parties (payment not received in 30+ days)
      db.party.findMany({
        where: {
          businessId,
          currentBalance: { gt: 0 },
          lastPaymentDate: { lt: thirtyDaysAgo },
        },
        select: { name: true, currentBalance: true },
        take: 5,
      }),
      // Parties near credit limit (80%+)
      db.party.findMany({
        where: {
          businessId,
          isActive: true,
          creditLimit: { gt: 0 },
        },
        select: {
          name: true,
          currentBalance: true,
          creditLimit: true,
        },
      }),
      // Dead stock (not sold in 90 days)
      db.item.findMany({
        where: {
          businessId,
          isActive: true,
          currentStock: { gt: 0 },
          OR: [
            { lastSaleDate: null },
            { lastSaleDate: { lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } },
          ],
        },
        select: { name: true, nameBn: true, currentStock: true, costPrice: true },
        take: 5,
      }),
      // Top selling items this month
      db.saleItem.groupBy({
        by: ['itemId', 'itemName'],
        where: {
          sale: { businessId, createdAt: { gte: thirtyDaysAgo }, status: { not: 'cancelled' } },
        },
        _sum: { quantity: true, total: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),
      // Pending payments count
      db.sale.count({
        where: {
          businessId,
          dueAmount: { gt: 0 },
          status: { not: 'cancelled' },
        },
      }),
    ]);

    // Calculate values
    const todaySalesTotal = todaySales._sum.total || 0;
    const todaySalesCount = todaySales._count;
    const todayProfit = (todaySales._sum.profit || 0) - (todayExpenses._sum.amount || 0);
    const yesterdaySalesTotal = yesterdaySales._sum.total || 0;
    const monthSalesTotal = monthSales._sum.total || 0;

    // Calculate growth
    let salesGrowth = 0;
    if (yesterdaySalesTotal > 0) {
      salesGrowth = ((todaySalesTotal - yesterdaySalesTotal) / yesterdaySalesTotal) * 100;
    } else if (todaySalesTotal > 0) {
      salesGrowth = 100;
    }

    // Build insights array
    const insights: Insight[] = [];

    // Credit risk alert
    const highRiskParties = creditLimitParties.filter(p => {
      if (!p.creditLimit || p.creditLimit === 0) return false;
      const usagePercent = (p.currentBalance / p.creditLimit) * 100;
      return usagePercent >= 80;
    });

    if (highRiskParties.length > 0) {
      insights.push({
        id: 'credit-risk',
        type: 'alert',
        title: 'Credit Risk Alert',
        titleBn: 'ক্রেডিট ঝুঁকি সতর্কতা',
        description: `${highRiskParties.length} customers exceed 80% credit limit`,
        descriptionBn: `${highRiskParties.length} জন গ্রাহক ৮০% ক্রেডিট সীমা অতিক্রম করেছে`,
        impact: 'high',
        action: 'Review Now',
        actionBn: 'এখনই দেখুন',
        actionType: 'view-credit',
      });
    }

    // Overdue payments alert
    if (overdueParties.length > 0) {
      const totalOverdue = overdueParties.reduce((sum, p) => sum + p.currentBalance, 0);
      insights.push({
        id: 'overdue-payments',
        type: 'alert',
        title: 'Overdue Payments',
        titleBn: 'বকেয়া পেমেন্ট',
        description: `${overdueParties.length} customers with ৳${Math.round(totalOverdue).toLocaleString()} overdue 30+ days`,
        descriptionBn: `${overdueParties.length} জন গ্রাহকের ৩০+ দিনের ৳${Math.round(totalOverdue).toLocaleString()} বকেয়া`,
        impact: 'high',
        action: 'Collect Now',
        actionBn: 'এখনই আদায় করুন',
        actionType: 'collect-overdue',
      });
    }

    // Low stock alert
    if (lowStockItems.length > 0) {
      insights.push({
        id: 'low-stock',
        type: 'alert',
        title: 'Low Stock Alert',
        titleBn: 'স্টক কম আছে',
        description: `${lowStockItems.length} items are below minimum stock level`,
        descriptionBn: `${lowStockItems.length}টি পণ্য ন্যূনতম স্টকের নিচে`,
        impact: 'medium',
        action: 'View Items',
        actionBn: 'পণ্য দেখুন',
        actionType: 'view-low-stock',
      });
    }

    // Dead stock opportunity
    if (deadStockItems.length > 0) {
      const deadStockValue = deadStockItems.reduce((sum, i) => sum + i.currentStock * i.costPrice, 0);
      insights.push({
        id: 'dead-stock',
        type: 'opportunity',
        title: 'Clear Dead Stock',
        titleBn: 'অচল স্টক সাফ করুন',
        description: `${deadStockItems.length} items worth ৳${Math.round(deadStockValue).toLocaleString()} not sold in 90 days`,
        descriptionBn: `${deadStockItems.length}টি পণ্য ৳${Math.round(deadStockValue).toLocaleString()} মূল্যের ৯০ দিনে বিক্রি হয়নি`,
        impact: 'medium',
        action: 'View Items',
        actionBn: 'পণ্য দেখুন',
        actionType: 'view-dead-stock',
      });
    }

    // Sales growth achievement
    if (salesGrowth > 10) {
      insights.push({
        id: 'sales-growth',
        type: 'achievement',
        title: 'Sales Growth!',
        titleBn: 'বিক্রি বেড়েছে!',
        description: `Today's sales ${Math.round(salesGrowth)}% higher than yesterday`,
        descriptionBn: `আজকের বিক্রি গতকালের চেয়ে ${Math.round(salesGrowth)}% বেশি`,
        impact: 'low',
        action: 'View Report',
        actionBn: 'রিপোর্ট দেখুন',
        actionType: 'view-report',
      });
    } else if (salesGrowth < -10) {
      insights.push({
        id: 'sales-decline',
        type: 'alert',
        title: 'Sales Decline',
        titleBn: 'বিক্রি কমেছে',
        description: `Today's sales ${Math.abs(Math.round(salesGrowth))}% lower than yesterday`,
        descriptionBn: `আজকের বিক্রি গতকালের চেয়ে ${Math.abs(Math.round(salesGrowth))}% কম`,
        impact: 'medium',
        action: 'View Details',
        actionBn: 'বিস্তারিত দেখুন',
        actionType: 'view-report',
      });
    }

    // Top selling items opportunity
    if (topSellingItems.length > 0) {
      insights.push({
        id: 'top-items',
        type: 'opportunity',
        title: 'Trending Items',
        titleBn: 'জনপ্রিয় পণ্য',
        description: `${topSellingItems[0].itemName} is your best seller this month`,
        descriptionBn: `${topSellingItems[0].itemName} এই মাসে সবচেয়ে বেশি বিক্রি হয়েছে`,
        impact: 'low',
        action: 'View All',
        actionBn: 'সব দেখুন',
        actionType: 'view-top-items',
      });
    }

    // Quick stats
    const quickStats: QuickStat[] = [
      {
        label: 'Sales Today',
        labelBn: 'আজকের বিক্রি',
        value: formatCurrency(todaySalesTotal),
        trend: salesGrowth >= 0 ? `+${Math.round(salesGrowth)}%` : `${Math.round(salesGrowth)}%`,
        positive: salesGrowth >= 0,
      },
      {
        label: 'Invoices',
        labelBn: 'ইনভয়েস',
        value: `${todaySalesCount}`,
      },
      {
        label: 'Profit Today',
        labelBn: 'আজকের মুনাফা',
        value: formatCurrency(todayProfit),
        positive: todayProfit >= 0,
      },
      {
        label: 'Month Sales',
        labelBn: 'মাসিক বিক্রি',
        value: formatCurrency(monthSalesTotal),
      },
    ];

    return NextResponse.json({
      success: true,
      data: {
        insights,
        quickStats,
        summary: {
          todaySales: todaySalesTotal,
          todayProfit,
          salesGrowth,
          lowStockCount: lowStockItems.length,
          overdueCount: overdueParties.length,
          pendingPayments,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching AI brief:', error);
    return NextResponse.json(
      { success: false, error: { code: 'FETCH_ERROR', message: 'Failed to fetch AI brief' } },
      { status: 500 }
    );
  }
}
