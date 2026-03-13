// Item Variants API - Simplified
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

function getSession(request: NextRequest) {
  return {
    businessId: request.headers.get('x-business-id'),
    userId: request.headers.get('x-user-id'),
  };
}

// GET /api/items/variants
export async function GET(request: NextRequest) {
  try {
    const { businessId } = getSession(request);
    if (!businessId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const variants = await db.itemVariant.findMany({
      where: { businessId, deletedAt: null },
      include: { item: { select: { name: true, sku: true } } },
      take: 50,
    });

    return NextResponse.json(variants);
  } catch (error) {
    console.error('Error fetching variants:', error);
    return NextResponse.json({ error: 'Failed to fetch variants' }, { status: 500 });
  }
}

// POST /api/items/variants
export async function POST(request: NextRequest) {
  try {
    const { businessId, userId } = getSession(request);
    if (!businessId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { itemId, name, sku, barcode, attributes, costPrice, sellingPrice, currentStock } = body;

    const variant = await db.itemVariant.create({
      data: {
        businessId,
        itemId,
        name,
        sku,
        barcode,
        attributes: attributes ? JSON.stringify(attributes) : null,
        costPrice: costPrice || 0,
        sellingPrice: sellingPrice || 0,
        currentStock: currentStock || 0,
      },
    });

    return NextResponse.json({ success: true, data: variant });
  } catch (error) {
    console.error('Error creating variant:', error);
    return NextResponse.json({ error: 'Failed to create variant' }, { status: 500 });
  }
}
