// Purchase Returns API - Simplified
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

function getSession(request: NextRequest) {
  return {
    businessId: request.headers.get('x-business-id'),
    userId: request.headers.get('x-user-id'),
  };
}

// GET /api/purchases/returns
export async function GET(request: NextRequest) {
  try {
    const { businessId } = getSession(request);
    if (!businessId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const returns = await db.purchaseReturn.findMany({
      where: { businessId, deletedAt: null },
      include: {
        items: { where: { deletedAt: null } },
        party: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const transformedReturns = returns.map(r => ({
      id: r.id,
      returnNo: r.returnNo,
      originalPurchaseId: r.purchaseId,
      partyId: r.partyId,
      partyName: r.party?.name || 'Unknown',
      items: r.items.map(item => ({
        id: item.id,
        returnId: item.purchaseReturnId,
        itemId: item.itemId,
        itemName: item.itemName,
        quantity: item.quantity,
        unitPrice: item.unitCost,
        total: item.total,
        reason: item.reason || undefined,
      })),
      totalAmount: r.total,
      status: 'completed',
      createdAt: r.createdAt.toISOString(),
    }));

    return NextResponse.json(transformedReturns);
  } catch (error) {
    console.error('Error fetching purchase returns:', error);
    return NextResponse.json({ error: 'Failed to fetch purchase returns' }, { status: 500 });
  }
}

// POST /api/purchases/returns
export async function POST(request: NextRequest) {
  try {
    const { businessId, userId } = getSession(request);
    if (!businessId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { purchaseId, branchId, items, reason } = body;

    const purchase = await db.purchase.findFirst({
      where: { id: purchaseId, businessId, deletedAt: null },
      include: { items: { where: { deletedAt: null } } },
    });

    if (!purchase) {
      return NextResponse.json({ error: 'Purchase not found' }, { status: 404 });
    }

    // Calculate totals
    let total = 0;
    const returnItems = items.map((item: any) => {
      const purchaseItem = purchase.items.find(pi => pi.id === item.purchaseItemId);
      const itemTotal = (purchaseItem?.unitCost || 0) * item.quantity;
      total += itemTotal;
      return {
        purchaseItemId: item.purchaseItemId,
        itemId: purchaseItem?.itemId || '',
        itemName: purchaseItem?.itemName || '',
        quantity: item.quantity,
        unitCost: purchaseItem?.unitCost || 0,
        total: itemTotal,
        reason: item.reason,
      };
    });

    const returnCount = await db.purchaseReturn.count({ where: { businessId } });
    const returnNo = `PRN-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(returnCount + 1).padStart(4, '0')}`;

    const result = await db.purchaseReturn.create({
      data: {
        businessId,
        branchId: branchId || purchase.branchId,
        purchaseId,
        returnNo,
        supplierId: purchase.supplierId,
        subtotal: total,
        total,
        refundAmount: total,
        reason,
        createdBy: userId,
        items: { create: returnItems },
      },
      include: { items: true },
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Error creating purchase return:', error);
    return NextResponse.json({ error: 'Failed to create return' }, { status: 500 });
  }
}
