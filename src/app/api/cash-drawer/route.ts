// Cash Drawer API - Simplified
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

function getSession(request: NextRequest) {
  return {
    businessId: request.headers.get('x-business-id'),
    userId: request.headers.get('x-user-id'),
  };
}

// GET /api/cash-drawer
export async function GET(request: NextRequest) {
  try {
    const { businessId } = getSession(request);
    if (!businessId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessions = await db.cashDrawerSession.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json(sessions);
  } catch (error) {
    console.error('Error fetching cash drawer sessions:', error);
    return NextResponse.json([], { status: 200 });
  }
}

// POST /api/cash-drawer - Open/Close session
export async function POST(request: NextRequest) {
  try {
    const { businessId, userId } = getSession(request);
    if (!businessId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, branchId, openingBalance, closingBalance, notes } = body;

    if (action === 'open') {
      const session = await db.cashDrawerSession.create({
        data: {
          businessId,
          branchId,
          userId: userId || 'system',
          openingBalance: openingBalance || 0,
          status: 'open',
          openedAt: new Date(),
        },
      });
      return NextResponse.json({ success: true, data: session });
    }

    if (action === 'close') {
      const openSession = await db.cashDrawerSession.findFirst({
        where: { businessId, branchId, status: 'open' },
      });

      if (!openSession) {
        return NextResponse.json({ error: 'No open session found' }, { status: 404 });
      }

      const session = await db.cashDrawerSession.update({
        where: { id: openSession.id },
        data: {
          closingBalance: closingBalance || 0,
          status: 'closed',
          closedAt: new Date(),
          notes,
        },
      });

      return NextResponse.json({ success: true, data: session });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error managing cash drawer:', error);
    return NextResponse.json({ error: 'Failed to manage session' }, { status: 500 });
  }
}
