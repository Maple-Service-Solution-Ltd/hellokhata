// Approvals API - Simplified
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

function getSession(request: NextRequest) {
  return {
    businessId: request.headers.get('x-business-id'),
    userId: request.headers.get('x-user-id'),
  };
}

// GET /api/approvals - List pending approvals
export async function GET(request: NextRequest) {
  try {
    const { businessId } = getSession(request);
    if (!businessId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get purchase orders needing approval
    const pos = await db.purchaseOrder.findMany({
      where: {
        businessId,
        status: 'submitted',
        deletedAt: null,
      },
      include: { party: { select: { name: true } } },
      take: 20,
    });

    const approvals = pos.map(po => ({
      id: po.id,
      type: 'purchase' as const,
      referenceNo: po.poNo,
      requestedBy: po.createdBy || 'System',
      amount: po.total,
      status: 'pending' as const,
      createdAt: po.createdAt.toISOString(),
    }));

    return NextResponse.json(approvals);
  } catch (error) {
    console.error('Error fetching approvals:', error);
    return NextResponse.json({ error: 'Failed to fetch approvals' }, { status: 500 });
  }
}

// POST /api/approvals - Approve/Reject
export async function POST(request: NextRequest) {
  try {
    const { businessId, userId } = getSession(request);
    if (!businessId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { orderId, action } = body;

    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    const updated = await db.purchaseOrder.update({
      where: { id: orderId, businessId },
      data: {
        status: newStatus,
        approvedBy: userId,
        approvedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error processing approval:', error);
    return NextResponse.json({ error: 'Failed to process' }, { status: 500 });
  }
}
