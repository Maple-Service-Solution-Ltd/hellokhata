// Hello Khata OS - Single Item API
// GET, PATCH, DELETE for individual items

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/items/[id] - Get single item
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const businessId = request.headers.get('x-business-id');
    const { id } = await params;

    if (!businessId) {
      return NextResponse.json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Business ID required' },
      }, { status: 401 });
    }

    const item = await db.item.findFirst({
      where: { id, businessId },
      include: {
        category: {
          select: { id: true, name: true, nameBn: true },
        },
      },
    });

    if (!item) {
      return NextResponse.json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Item not found' },
      }, { status: 404 });
    }

    // Get stock history
    const stockHistory = await db.stockLedger.findMany({
      where: { itemId: id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return NextResponse.json({
      success: true,
      data: {
        ...item,
        margin: item.costPrice > 0 
          ? ((item.sellingPrice - item.costPrice) / item.costPrice) * 100 
          : 0,
        isLowStock: item.currentStock <= item.minStock,
        stockValue: item.currentStock * item.costPrice,
        stockHistory,
      },
    });
  } catch (error) {
    console.error('Get item error:', error);
    return NextResponse.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch item' },
    }, { status: 500 });
  }
}

// PATCH /api/items/[id] - Update item
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const businessId = request.headers.get('x-business-id');
    const { id } = await params;

    if (!businessId) {
      return NextResponse.json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Business ID required' },
      }, { status: 401 });
    }

    const existingItem = await db.item.findFirst({
      where: { id, businessId },
    });

    if (!existingItem) {
      return NextResponse.json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Item not found' },
      }, { status: 404 });
    }

    const body = await request.json();
    const updateData: any = {};

    // Allowed fields for update
    const allowedFields = [
      'name', 'nameBn', 'sku', 'barcode', 'categoryId',
      'description', 'unit', 'costPrice', 'sellingPrice',
      'wholesalePrice', 'vipPrice', 'minimumPrice',
      'currentStock', 'minStock', 'maxStock', 'supplierId',
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (['costPrice', 'sellingPrice', 'wholesalePrice', 'vipPrice', 'minimumPrice', 'currentStock', 'minStock', 'maxStock'].includes(field)) {
          updateData[field] = parseFloat(body[field]) || 0;
        } else {
          updateData[field] = body[field];
        }
      }
    }

    // Handle stock adjustment
    if (body.stockAdjustment !== undefined) {
      const adjustment = parseFloat(body.stockAdjustment);
      const previousStock = existingItem.currentStock;
      const newStock = previousStock + adjustment;

      updateData.currentStock = newStock;

      // Create stock ledger entry
      await db.stockLedger.create({
        data: {
          businessId,
          itemId: id,
          type: adjustment > 0 ? 'purchase' : 'sale',
          quantity: Math.abs(adjustment),
          previousStock,
          newStock,
          reason: body.adjustmentReason || 'Manual adjustment',
          createdBy: request.headers.get('x-user-id'),
        },
      });
    }

    const item = await db.item.update({
      where: { id },
      data: updateData,
      include: {
        category: {
          select: { id: true, name: true, nameBn: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...item,
        margin: item.costPrice > 0 
          ? ((item.sellingPrice - item.costPrice) / item.costPrice) * 100 
          : 0,
        isLowStock: item.currentStock <= item.minStock,
        stockValue: item.currentStock * item.costPrice,
      },
    });
  } catch (error) {
    console.error('Update item error:', error);
    return NextResponse.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update item' },
    }, { status: 500 });
  }
}

// DELETE /api/items/[id] - Soft delete item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const businessId = request.headers.get('x-business-id');
    const { id } = await params;

    if (!businessId) {
      return NextResponse.json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Business ID required' },
      }, { status: 401 });
    }

    const item = await db.item.findFirst({
      where: { id, businessId },
    });

    if (!item) {
      return NextResponse.json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Item not found' },
      }, { status: 404 });
    }

    // Soft delete
    await db.item.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({
      success: true,
      data: { id },
    });
  } catch (error) {
    console.error('Delete item error:', error);
    return NextResponse.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to delete item' },
    }, { status: 500 });
  }
}
