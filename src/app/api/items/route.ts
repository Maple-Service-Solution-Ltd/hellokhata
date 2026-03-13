// Hello Khata OS - Items API
// Inventory management with multi-tenant isolation

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/items - List items with filtering
export async function GET(request: NextRequest) {
  try {
    const businessId = request.headers.get('x-business-id');

    if (!businessId) {
      return NextResponse.json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Business ID required' },
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const lowStock = searchParams.get('lowStock');
    const search = searchParams.get('search');
    const branchId = searchParams.get('branchId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = {
      businessId,
      isActive: true,
    };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (lowStock === 'true') {
      // Items where current stock <= min stock
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { nameBn: { contains: search } },
        { sku: { contains: search } },
        { barcode: { contains: search } },
      ];
    }

    if (branchId) {
      where.OR = [
        { branchId },
        { branchId: null }, // Items without branch (shared)
      ];
    }

    const [items, total] = await Promise.all([
      db.item.findMany({
        where,
        include: {
          category: {
            select: { id: true, name: true, nameBn: true },
          },
        },
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.item.count({ where }),
    ]);

    // Add calculated fields
    const itemsWithCalcs = items.map((item) => ({
      ...item,
      margin: item.costPrice > 0 
        ? ((item.sellingPrice - item.costPrice) / item.costPrice) * 100 
        : 0,
      isLowStock: item.currentStock <= item.minStock,
      stockValue: item.currentStock * item.costPrice,
    }));

    return NextResponse.json({
      success: true,
      data: itemsWithCalcs,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get items error:', error);
    return NextResponse.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch items' },
    }, { status: 500 });
  }
}

// POST /api/items - Create new item
export async function POST(request: NextRequest) {
  try {
    const businessId = request.headers.get('x-business-id');
    const userId = request.headers.get('x-user-id');

    if (!businessId) {
      return NextResponse.json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Business ID required' },
      }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      nameBn,
      sku,
      barcode,
      categoryId,
      description,
      unit = 'pcs',
      costPrice = 0,
      sellingPrice = 0,
      wholesalePrice,
      vipPrice,
      minimumPrice,
      currentStock = 0,
      minStock = 0,
      maxStock,
      supplierId,
    } = body;

    if (!name) {
      return NextResponse.json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Item name is required' },
      }, { status: 400 });
    }

    // Check for duplicate SKU
    if (sku) {
      const existingSku = await db.item.findFirst({
        where: { businessId, sku },
      });

      if (existingSku) {
        return NextResponse.json({
          success: false,
          error: { code: 'DUPLICATE_SKU', message: 'An item with this SKU already exists' },
        }, { status: 400 });
      }
    }

    const item = await db.item.create({
      data: {
        businessId,
        name,
        nameBn,
        sku,
        barcode,
        categoryId,
        description,
        unit,
        costPrice: parseFloat(costPrice) || 0,
        sellingPrice: parseFloat(sellingPrice) || 0,
        wholesalePrice: wholesalePrice ? parseFloat(wholesalePrice) : null,
        vipPrice: vipPrice ? parseFloat(vipPrice) : null,
        minimumPrice: minimumPrice ? parseFloat(minimumPrice) : null,
        currentStock: parseFloat(currentStock) || 0,
        minStock: parseFloat(minStock) || 0,
        maxStock: maxStock ? parseFloat(maxStock) : null,
        supplierId,
        isActive: true,
      },
      include: {
        category: {
          select: { id: true, name: true, nameBn: true },
        },
      },
    });

    // Create stock ledger entry for opening stock
    if (currentStock > 0) {
      await db.stockLedger.create({
        data: {
          businessId,
          itemId: item.id,
          type: 'purchase',
          quantity: parseFloat(currentStock),
          previousStock: 0,
          newStock: parseFloat(currentStock),
          referenceType: 'adjustment',
          reason: 'Opening stock',
          createdBy: userId,
        },
      });
    }

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
    console.error('Create item error:', error);
    return NextResponse.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to create item' },
    }, { status: 500 });
  }
}
