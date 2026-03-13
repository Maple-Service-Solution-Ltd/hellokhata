// Hello Khata OS - Dead Stock Report API
// Returns items that haven't sold in 60+ days

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const DEAD_STOCK_DAYS = 60;

// GET /api/inventory/dead-stock
export async function GET(request: NextRequest) {
  try {
    const businessId = request.headers.get('x-business-id');

    if (!businessId) {
      return NextResponse.json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Business ID required' },
      }, { status: 401 });
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - DEAD_STOCK_DAYS);

    // Get items with no sales in the last 60 days
    const items = await db.item.findMany({
      where: {
        businessId,
        isActive: true,
        currentStock: { gt: 0 },
        OR: [
          { lastSaleDate: null },
          { lastSaleDate: { lt: cutoffDate } },
        ],
      },
      include: {
        category: {
          select: { id: true, name: true, nameBn: true },
        },
      },
    });

    // Calculate days without sale and capital stuck
    const deadStockItems = items.map((item) => {
      const daysWithoutSale = item.lastSaleDate
        ? Math.floor((Date.now() - item.lastSaleDate.getTime()) / (1000 * 60 * 60 * 24))
        : DEAD_STOCK_DAYS + 30; // If never sold, assume 90 days

      const stockValue = item.currentStock * item.costPrice;

      // Determine priority
      let priority: 'low' | 'medium' | 'high' = 'low';
      if (daysWithoutSale > 90 && stockValue > 10000) {
        priority = 'high';
      } else if (daysWithoutSale > 75 || stockValue > 5000) {
        priority = 'medium';
      }

      // Suggest action
      let suggestedAction: 'discount' | 'return' | 'donate' | 'write_off' = 'discount';
      if (daysWithoutSale > 120) {
        suggestedAction = 'write_off';
      } else if (daysWithoutSale > 90) {
        suggestedAction = 'donate';
      } else if (item.supplierId) {
        suggestedAction = 'return';
      }

      return {
        itemId: item.id,
        itemName: item.name,
        itemNameBn: item.nameBn,
        sku: item.sku,
        category: item.category,
        currentStock: item.currentStock,
        stockValue,
        daysWithoutSale,
        lastSaleDate: item.lastSaleDate,
        turnoverRate: 0, // Would need more complex calculation
        suggestedAction,
        priority,
        costPrice: item.costPrice,
        sellingPrice: item.sellingPrice,
      };
    });

    // Sort by priority and value
    deadStockItems.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return b.stockValue - a.stockValue;
    });

    // Summary stats
    const totalValue = deadStockItems.reduce((sum, item) => sum + item.stockValue, 0);
    const highPriorityCount = deadStockItems.filter((i) => i.priority === 'high').length;

    return NextResponse.json({
      success: true,
      data: deadStockItems,
      meta: {
        totalItems: deadStockItems.length,
        totalValue,
        highPriorityCount,
        cutoffDays: DEAD_STOCK_DAYS,
      },
    });
  } catch (error) {
    console.error('Get dead stock error:', error);
    return NextResponse.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch dead stock report' },
    }, { status: 500 });
  }
}
