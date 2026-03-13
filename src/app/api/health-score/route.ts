// Hello Khata OS - Health Score API Route
// GET: Calculate and return business health score

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import type { BusinessHealthScore, HealthScoreComponents, HealthSuggestion } from '@/types';

// Helper function to get start and end of day
function getStartEndOfDay(date: Date): { start: Date; end: Date } {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

// Helper function to get date N days ago
function getDaysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

// Calculate profit margin score (0-100)
function calculateProfitMarginScore(profitMargin: number): { score: number; trend: 'up' | 'down' | 'stable' } {
  // Profit margin: net profit / revenue * 100
  // Score based on margin percentage
  let score: number;
  let trend: 'up' | 'down' | 'stable' = 'stable';

  if (profitMargin >= 30) {
    score = 100;
  } else if (profitMargin >= 20) {
    score = 85;
  } else if (profitMargin >= 15) {
    score = 70;
  } else if (profitMargin >= 10) {
    score = 55;
  } else if (profitMargin >= 5) {
    score = 40;
  } else if (profitMargin >= 0) {
    score = 20;
  } else {
    score = 0; // Negative margin
  }

  return { score, trend };
}

// Calculate credit risk score (0-100)
function calculateCreditRiskScore(overduePercentage: number): { score: number; trend: 'up' | 'down' | 'stable' } {
  // Lower overdue percentage = higher score
  let score: number;
  let trend: 'up' | 'down' | 'stable' = 'stable';

  if (overduePercentage <= 5) {
    score = 100;
  } else if (overduePercentage <= 10) {
    score = 85;
  } else if (overduePercentage <= 20) {
    score = 65;
  } else if (overduePercentage <= 30) {
    score = 45;
  } else if (overduePercentage <= 50) {
    score = 25;
  } else {
    score = 10;
  }

  return { score, trend };
}

// Calculate stock efficiency score (0-100)
function calculateStockEfficiencyScore(deadStockPercentage: number, lowStockPercentage: number): { score: number; trend: 'up' | 'down' | 'stable' } {
  // Lower dead stock and low stock = higher score
  let score: number;
  let trend: 'up' | 'down' | 'stable' = 'stable';

  const combinedIssue = deadStockPercentage + lowStockPercentage * 0.5;

  if (combinedIssue <= 5) {
    score = 100;
  } else if (combinedIssue <= 10) {
    score = 85;
  } else if (combinedIssue <= 20) {
    score = 70;
  } else if (combinedIssue <= 30) {
    score = 55;
  } else if (combinedIssue <= 50) {
    score = 35;
  } else {
    score = 20;
  }

  return { score, trend };
}

// Calculate cash flow score (0-100)
function calculateCashFlowScore(cashRatio: number): { score: number; trend: 'up' | 'down' | 'stable' } {
  // Cash ratio: liquid assets / short-term liabilities (simplified)
  let score: number;
  let trend: 'up' | 'down' | 'stable' = 'stable';

  if (cashRatio >= 2) {
    score = 100;
  } else if (cashRatio >= 1.5) {
    score = 85;
  } else if (cashRatio >= 1) {
    score = 70;
  } else if (cashRatio >= 0.75) {
    score = 55;
  } else if (cashRatio >= 0.5) {
    score = 35;
  } else {
    score = 15;
  }

  return { score, trend };
}

// Calculate sales growth score (0-100)
function calculateSalesGrowthScore(growthPercentage: number): { score: number; trend: 'up' | 'down' | 'stable' } {
  let score: number;
  let trend: 'up' | 'down' | 'stable';

  if (growthPercentage > 20) {
    score = 100;
    trend = 'up';
  } else if (growthPercentage > 10) {
    score = 85;
    trend = 'up';
  } else if (growthPercentage > 5) {
    score = 75;
    trend = 'up';
  } else if (growthPercentage > 0) {
    score = 65;
    trend = 'up';
  } else if (growthPercentage === 0) {
    score = 50;
    trend = 'stable';
  } else if (growthPercentage > -10) {
    score = 40;
    trend = 'down';
  } else if (growthPercentage > -20) {
    score = 25;
    trend = 'down';
  } else {
    score = 10;
    trend = 'down';
  }

  return { score, trend };
}

// Determine overall grade based on score
function getGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

// Determine overall trend
function getOverallTrend(components: HealthScoreComponents): 'improving' | 'stable' | 'declining' {
  const trends = Object.values(components).map(c => c.trend);
  const upCount = trends.filter(t => t === 'up').length;
  const downCount = trends.filter(t => t === 'down').length;

  if (upCount > downCount + 1) return 'improving';
  if (downCount > upCount + 1) return 'declining';
  return 'stable';
}

// Generate health suggestions based on scores
function generateSuggestions(components: HealthScoreComponents, locale: 'en' | 'bn' = 'en'): HealthSuggestion[] {
  const suggestions: HealthSuggestion[] = [];

  // Profit margin suggestions
  if (components.profitTrend.score < 60) {
    suggestions.push({
      id: 'profit-margin',
      component: 'profitTrend',
      priority: components.profitTrend.score < 40 ? 'high' : 'medium',
      title: 'Improve Profit Margins',
      titleBn: 'মুনাফার হার বাড়ান',
      description: 'Review pricing strategy and reduce operational costs to improve profit margins.',
      descriptionBn: 'মূল্য নীতি পর্যালোচনা করুন এবং পরিচালন খরচ কমান।',
      action: 'Review Pricing',
      actionUrl: '/inventory',
      potentialImpact: 15,
    });
  }

  // Credit risk suggestions
  if (components.creditRisk.score < 70) {
    suggestions.push({
      id: 'credit-risk',
      component: 'creditRisk',
      priority: components.creditRisk.score < 50 ? 'high' : 'medium',
      title: 'Reduce Credit Risk',
      titleBn: 'ঋণের ঝুঁকি কমান',
      description: 'Follow up on overdue payments and tighten credit terms for high-risk customers.',
      descriptionBn: 'বকেয়া পেমেন্টের অনুসরণ করুন এবং উচ্চ ঝুঁকিপূর্ণ গ্রাহকদের জন্য ঋণের শর্তাবলী কঠোর করুন।',
      action: 'View Credit Control',
      actionUrl: '/reports/credit-control',
      potentialImpact: 20,
    });
  }

  // Stock efficiency suggestions
  if (components.deadStock.score < 70) {
    suggestions.push({
      id: 'stock-efficiency',
      component: 'deadStock',
      priority: components.deadStock.score < 50 ? 'high' : 'medium',
      title: 'Optimize Inventory',
      titleBn: 'ইনভেন্টরি অপ্টিমাইজ করুন',
      description: 'Clear dead stock through discounts and reorder low stock items to maintain optimal inventory levels.',
      descriptionBn: 'ডিসকাউন্টের মাধ্যমে ডেড স্টক পরিষ্কার করুন এবং সর্বোত্তম ইনভেন্টরি স্তর বজায় রাখতে লো স্টক আইটেম পুনরায় অর্ডার করুন।',
      action: 'View Inventory',
      actionUrl: '/inventory',
      potentialImpact: 15,
    });
  }

  // Cash flow suggestions
  if (components.cashStability.score < 60) {
    suggestions.push({
      id: 'cash-flow',
      component: 'cashStability',
      priority: components.cashStability.score < 40 ? 'high' : 'medium',
      title: 'Improve Cash Flow',
      titleBn: 'নগদ প্রবাহ উন্নত করুন',
      description: 'Collect receivables faster and negotiate better payment terms with suppliers.',
      descriptionBn: 'দ্রুত প্রাপ্য সংগ্রহ করুন এবং সরবরাহকারীদের সাথে আরও ভাল পেমেন্ট শর্তাবলী আলোচনা করুন।',
      action: 'View Accounts',
      actionUrl: '/settings/accounts',
      potentialImpact: 20,
    });
  }

  // Sales growth suggestions
  if (components.salesConsistency.score < 50) {
    suggestions.push({
      id: 'sales-growth',
      component: 'salesConsistency',
      priority: 'high',
      title: 'Boost Sales Growth',
      titleBn: 'বিক্রয় প্রবৃদ্ধি বাড়ান',
      description: 'Implement marketing campaigns and promotions to increase sales volume.',
      descriptionBn: 'বিক্রয় পরিমাণ বাড়াতে মার্কেটিং ক্যাম্পেইন এবং প্রমোশন বাস্তবায়ন করুন।',
      action: 'View Sales',
      actionUrl: '/sales',
      potentialImpact: 25,
    });
  }

  // Sort by priority and potential impact
  return suggestions.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return b.potentialImpact - a.potentialImpact;
  }).slice(0, 5); // Return top 5 suggestions
}

// GET /api/health-score - Get business health score
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

    // === Calculate Profit Margin ===
    const thirtyDaysAgo = getDaysAgo(30);
    const today = new Date();
    const { start: thirtyDaysAgoStart, end: todayEnd } = getStartEndOfDay(today);

    // Get total revenue and profit for last 30 days
    const salesData = await db.sale.aggregate({
      where: {
        businessId: actualBusinessId,
        createdAt: {
          gte: thirtyDaysAgoStart,
          lte: todayEnd,
        },
        status: { not: 'cancelled' },
      },
      _sum: {
        total: true,
        profit: true,
      },
    });

    const totalRevenue = salesData._sum.total || 0;
    const totalProfit = salesData._sum.profit || 0;
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    const profitMarginResult = calculateProfitMarginScore(profitMargin);

    // === Calculate Credit Risk ===
    const totalReceivable = await db.party.aggregate({
      where: {
        businessId: actualBusinessId,
        currentBalance: { gt: 0 },
      },
      _sum: {
        currentBalance: true,
      },
    });

    const overdueReceivable = await db.party.aggregate({
      where: {
        businessId: actualBusinessId,
        currentBalance: { gt: 0 },
        lastPaymentDate: { lt: thirtyDaysAgo },
      },
      _sum: {
        currentBalance: true,
      },
    });

    const totalReceivableAmount = totalReceivable._sum.currentBalance || 0;
    const overdueAmount = overdueReceivable._sum.currentBalance || 0;
    const overduePercentage = totalReceivableAmount > 0 ? (overdueAmount / totalReceivableAmount) * 100 : 0;

    const creditRiskResult = calculateCreditRiskScore(overduePercentage);

    // === Calculate Stock Efficiency ===
    const totalItems = await db.item.count({
      where: {
        businessId: actualBusinessId,
        isActive: true,
      },
    });

    const ninetyDaysAgo = getDaysAgo(90);
    const deadStockItems = await db.item.count({
      where: {
        businessId: actualBusinessId,
        isActive: true,
        currentStock: { gt: 0 },
        OR: [
          { lastSaleDate: null },
          { lastSaleDate: { lt: ninetyDaysAgo } },
        ],
      },
    });

    const lowStockItems = await db.item.count({
      where: {
        businessId: actualBusinessId,
        isActive: true,
        currentStock: { lte: db.item.fields.minStock },
      },
    });

    const deadStockPercentage = totalItems > 0 ? (deadStockItems / totalItems) * 100 : 0;
    const lowStockPercentage = totalItems > 0 ? (lowStockItems / totalItems) * 100 : 0;

    const stockEfficiencyResult = calculateStockEfficiencyScore(deadStockPercentage, lowStockPercentage);

    // === Calculate Cash Flow Stability ===
    const accounts = await db.account.findMany({
      where: {
        businessId: actualBusinessId,
        status: 'active',
      },
      select: {
        type: true,
        currentBalance: true,
      },
    });

    let liquidAssets = 0;
    accounts.forEach((account) => {
      if (account.type === 'cash' || account.type === 'mobile_wallet' || account.type === 'bank') {
        liquidAssets += account.currentBalance;
      }
    });

    const payables = await db.party.aggregate({
      where: {
        businessId: actualBusinessId,
        currentBalance: { lt: 0 },
      },
      _sum: {
        currentBalance: true,
      },
    });

    const shortTermLiabilities = Math.abs(payables._sum.currentBalance || 0);
    const cashRatio = shortTermLiabilities > 0 ? liquidAssets / shortTermLiabilities : 2; // If no liabilities, assume good ratio

    const cashFlowResult = calculateCashFlowScore(Math.min(cashRatio, 3)); // Cap at 3 for scoring

    // === Calculate Sales Growth ===
    const sevenDaysAgo = getDaysAgo(7);
    const fourteenDaysAgo = getDaysAgo(14);

    const { start: sevenDaysAgoStart } = getStartEndOfDay(sevenDaysAgo);
    const { start: fourteenDaysAgoStart, end: sevenDaysAgoEnd } = getStartEndOfDay(sevenDaysAgo);

    // Last 7 days sales
    const last7DaysSales = await db.sale.aggregate({
      where: {
        businessId: actualBusinessId,
        createdAt: {
          gte: sevenDaysAgoStart,
          lte: todayEnd,
        },
        status: { not: 'cancelled' },
      },
      _sum: {
        total: true,
      },
    });

    // Previous 7 days sales (for comparison)
    const previous7DaysSales = await db.sale.aggregate({
      where: {
        businessId: actualBusinessId,
        createdAt: {
          gte: fourteenDaysAgoStart,
          lte: sevenDaysAgoEnd,
        },
        status: { not: 'cancelled' },
      },
      _sum: {
        total: true,
      },
    });

    const last7DaysTotal = last7DaysSales._sum.total || 0;
    const previous7DaysTotal = previous7DaysSales._sum.total || 0;
    const salesGrowthPercentage = previous7DaysTotal > 0 
      ? ((last7DaysTotal - previous7DaysTotal) / previous7DaysTotal) * 100 
      : (last7DaysTotal > 0 ? 100 : 0);

    const salesGrowthResult = calculateSalesGrowthScore(salesGrowthPercentage);

    // === Build Components ===
    const components: HealthScoreComponents = {
      profitTrend: {
        score: profitMarginResult.score,
        value: profitMargin,
        trend: profitMarginResult.trend,
        weight: 0.25,
      },
      creditRisk: {
        score: creditRiskResult.score,
        value: overduePercentage,
        trend: creditRiskResult.trend,
        weight: 0.20,
      },
      deadStock: {
        score: stockEfficiencyResult.score,
        value: deadStockPercentage,
        trend: stockEfficiencyResult.trend,
        weight: 0.15,
      },
      cashStability: {
        score: cashFlowResult.score,
        value: cashRatio,
        trend: cashFlowResult.trend,
        weight: 0.20,
      },
      salesConsistency: {
        score: salesGrowthResult.score,
        value: salesGrowthPercentage,
        trend: salesGrowthResult.trend,
        weight: 0.20,
      },
    };

    // Calculate weighted overall score
    const overallScore = Math.round(
      components.profitTrend.score * components.profitTrend.weight +
      components.creditRisk.score * components.creditRisk.weight +
      components.deadStock.score * components.deadStock.weight +
      components.cashStability.score * components.cashStability.weight +
      components.salesConsistency.score * components.salesConsistency.weight
    );

    // Generate suggestions
    const suggestions = generateSuggestions(components, business.language as 'en' | 'bn');

    const healthScore: BusinessHealthScore = {
      businessId: actualBusinessId,
      overallScore,
      grade: getGrade(overallScore),
      components,
      trend: getOverallTrend(components),
      lastCalculated: new Date(),
      suggestions,
    };

    return NextResponse.json({
      success: true,
      data: healthScore,
    });
  } catch (error) {
    console.error('Error calculating health score:', error);
    return NextResponse.json(
      { success: false, error: { code: 'CALCULATION_ERROR', message: 'Failed to calculate health score' } },
      { status: 500 }
    );
  }
}
