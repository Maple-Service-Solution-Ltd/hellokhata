// Purchase Orders API - Simplified
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

function getSession(request: NextRequest) {
  return {
    businessId: request.headers.get('x-business-id'),
    userId: request.headers.get('x-user-id'),
  };
}

// GET /api/purchase-orders
export async function GET(request: NextRequest) {
  try {
    const { businessId } = getSession(request);
    if (!businessId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orders = await db.purchaseOrder.findMany({
      where: { businessId, deletedAt: null },
      include: {
        items: { where: { deletedAt: null } },
        party: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const transformedOrders = orders.map(order => ({
      id: order.id,
      poNo: order.poNo,
      partyId: order.supplierId,
      partyName: order.party?.name || 'Unknown',
      items: order.items.map(item => ({
        id: item.id,
        itemId: item.itemId,
        itemName: item.itemName,
        sku: '',
        quantity: item.quantity,
        receivedQuantity: item.receivedQty || 0,
        unitCost: item.unitCost,
        total: item.total,
      })),
      totalAmount: order.total,
      status: order.status,
      expectedDate: order.expectedDate?.toISOString(),
      notes: order.notes,
      createdBy: order.createdBy || '',
      createdAt: order.createdAt.toISOString(),
      approvedBy: order.approvedBy,
      approvedAt: order.approvedAt?.toISOString(),
    }));

    return NextResponse.json(transformedOrders);
  } catch (error) {
    console.error('Error fetching purchase orders:', error);
    return NextResponse.json({ error: 'Failed to fetch purchase orders' }, { status: 500 });
  }
}

// POST /api/purchase-orders
export async function POST(request: NextRequest) {
  try {
    const { businessId, userId } = getSession(request);
    if (!businessId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { branchId, supplierId, items, expectedDate, notes } = body;

    let total = 0;
    const orderItems = items.map((item: any) => {
      const itemTotal = item.quantity * item.unitCost;
      total += itemTotal;
      return {
        itemId: item.itemId,
        itemName: item.itemName,
        quantity: item.quantity,
        unitCost: item.unitCost,
        total: itemTotal,
      };
    });

    const orderCount = await db.purchaseOrder.count({ where: { businessId } });
    const poNo = `PO-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(orderCount + 1).padStart(4, '0')}`;

    const purchaseOrder = await db.purchaseOrder.create({
      data: {
        businessId,
        branchId,
        supplierId,
        poNo,
        subtotal: total,
        total,
        status: 'draft',
        expectedDate: expectedDate ? new Date(expectedDate) : null,
        notes,
        createdBy: userId,
        items: { create: orderItems },
      },
      include: { items: true },
    });

    return NextResponse.json({ success: true, data: purchaseOrder });
  } catch (error) {
    console.error('Error creating purchase order:', error);
    return NextResponse.json({ error: 'Failed to create purchase order' }, { status: 500 });
  }
}

// PATCH /api/purchase-orders - Update status
export async function PATCH(request: NextRequest) {
  try {
    const { businessId, userId } = getSession(request);
    if (!businessId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { orderId, action } = body;

    const order = await db.purchaseOrder.findFirst({
      where: { id: orderId, businessId, deletedAt: null },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const statusMap: Record<string, string> = {
      submit: 'submitted',
      approve: 'approved',
      reject: 'rejected',
      cancel: 'cancelled',
    };

    const newStatus = statusMap[action] || order.status;
    const updateData: any = { status: newStatus };
    
    if (action === 'approve') {
      updateData.approvedBy = userId;
      updateData.approvedAt = new Date();
    }

    const updated = await db.purchaseOrder.update({
      where: { id: orderId },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating purchase order:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}
