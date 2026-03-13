// Batches API - Simplified
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

function getSession(request: NextRequest) {
  return {
    businessId: request.headers.get('x-business-id'),
    userId: request.headers.get('x-user-id'),
  };
}

// GET /api/batches
export async function GET(request: NextRequest) {
  try {
    const { businessId } = getSession(request);
    if (!businessId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const batches = await db.batch.findMany({
      where: { businessId, deletedAt: null },
      include: {
        item: { select: { name: true, sku: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const now = new Date();
    const transformedBatches = batches.map(batch => {
      const daysUntilExpiry = batch.expiryDate
        ? Math.ceil((new Date(batch.expiryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : null;
      
      let status = 'active';
      if (batch.quantity === 0) status = 'depleted';
      else if (daysUntilExpiry !== null && daysUntilExpiry <= 0) status = 'expired';
      else if (daysUntilExpiry !== null && daysUntilExpiry <= 30) status = 'expiring';

      return {
        id: batch.id,
        batchNo: batch.batchNumber,
        itemId: batch.itemId,
        itemName: batch.item?.name || 'Unknown',
        sku: batch.item?.sku || '',
        quantity: batch.quantity,
        remainingQuantity: batch.quantity,
        manufacturingDate: batch.manufactureDate?.toISOString(),
        expiryDate: batch.expiryDate?.toISOString(),
        purchasePrice: batch.costPrice,
        mrp: batch.mrp,
        status,
        location: batch.location,
        createdAt: batch.createdAt.toISOString(),
      };
    });

    return NextResponse.json(transformedBatches);
  } catch (error) {
    console.error('Error fetching batches:', error);
    return NextResponse.json({ error: 'Failed to fetch batches' }, { status: 500 });
  }
}

// POST /api/batches
export async function POST(request: NextRequest) {
  try {
    const { businessId, userId } = getSession(request);
    if (!businessId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { itemId, batchNumber, expiryDate, manufactureDate, quantity, costPrice } = body;

    const batch = await db.batch.create({
      data: {
        businessId,
        itemId,
        batchNumber,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        manufactureDate: manufactureDate ? new Date(manufactureDate) : null,
        quantity: quantity || 0,
        costPrice: costPrice || 0,
      },
    });

    return NextResponse.json({ success: true, data: batch });
  } catch (error) {
    console.error('Error creating batch:', error);
    return NextResponse.json({ error: 'Failed to create batch' }, { status: 500 });
  }
}
