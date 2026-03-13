// Account Transfers API - Simplified
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

function getSession(request: NextRequest) {
  return {
    businessId: request.headers.get('x-business-id'),
    userId: request.headers.get('x-user-id'),
  };
}

// GET /api/accounts/transfers
export async function GET(request: NextRequest) {
  try {
    const { businessId } = getSession(request);
    if (!businessId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const transfers = await db.accountTransfer.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json(transfers);
  } catch (error) {
    console.error('Error fetching transfers:', error);
    return NextResponse.json([], { status: 200 });
  }
}

// POST /api/accounts/transfers
export async function POST(request: NextRequest) {
  try {
    const { businessId, userId } = getSession(request);
    if (!businessId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { fromAccountId, toAccountId, amount, reference, notes } = body;

    const result = await db.$transaction(async (tx) => {
      // Create transfer record
      const transfer = await tx.accountTransfer.create({
        data: {
          businessId,
          fromAccountId,
          toAccountId,
          amount,
          reference,
          notes,
          status: 'completed',
          createdBy: userId,
        },
      });

      // Update account balances
      await tx.account.update({
        where: { id: fromAccountId },
        data: { currentBalance: { decrement: amount } },
      });

      await tx.account.update({
        where: { id: toAccountId },
        data: { currentBalance: { increment: amount } },
      });

      return transfer;
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Error creating transfer:', error);
    return NextResponse.json({ error: 'Failed to create transfer' }, { status: 500 });
  }
}
