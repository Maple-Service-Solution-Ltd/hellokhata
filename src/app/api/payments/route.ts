// Hello Khata OS - Payments API
// Handle customer payments and reduce receivables

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/payments - List payments
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
    const partyId = searchParams.get('partyId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = { businessId };

    if (partyId) {
      where.partyId = partyId;
    }

    const [payments, total] = await Promise.all([
      db.payment.findMany({
        where,
        include: {
          party: {
            select: { id: true, name: true, phone: true, type: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.payment.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: payments,
      meta: { page, limit, total },
    });
  } catch (error) {
    console.error('Get payments error:', error);
    return NextResponse.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch payments' },
    }, { status: 500 });
  }
}

// POST /api/payments - Create a payment (collect money from customer)
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
      partyId,
      amount,
      mode = 'cash', // cash, card, mobile_banking, bank_transfer
      accountId,
      saleId,
      reference,
      notes,
    } = body;

    if (!partyId || !amount || amount <= 0) {
      return NextResponse.json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Party ID and valid amount are required' },
      }, { status: 400 });
    }

    // Verify party exists and has balance
    const party = await db.party.findFirst({
      where: { id: partyId, businessId },
    });

    if (!party) {
      return NextResponse.json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Party not found' },
      }, { status: 404 });
    }

    // Use transaction to ensure data consistency
    const payment = await db.$transaction(async (tx) => {
      // Create the payment record
      const newPayment = await tx.payment.create({
        data: {
          businessId,
          partyId,
          type: 'received', // Payment received from customer
          mode,
          accountId,
          amount: parseFloat(amount),
          reference,
          saleId,
          notes,
          createdBy: userId,
        },
        include: {
          party: {
            select: { id: true, name: true, phone: true },
          },
        },
      });

      // Update party balance (reduce receivable)
      const newPartyBalance = party.currentBalance - parseFloat(amount);
      await tx.party.update({
        where: { id: partyId },
        data: {
          currentBalance: newPartyBalance,
          lastPaymentDate: new Date(),
        },
      });

      // Create party ledger entry
      await tx.partyLedger.create({
        data: {
          businessId,
          partyId,
          type: 'payment',
          referenceId: newPayment.id,
          referenceType: 'payment',
          amount: -parseFloat(amount), // Negative because it reduces balance
          balance: newPartyBalance,
          description: `Payment received - ${mode}${reference ? ` (${reference})` : ''}`,
          date: new Date(),
        },
      });

      // Update account balance (add money to account)
      let account = null;
      
      if (accountId) {
        account = await tx.account.findUnique({
          where: { id: accountId },
        });
      } else {
        // Find default account based on payment mode
        const accountType = mode === 'cash' ? 'cash' : 
                           mode === 'card' ? 'bank' : 
                           mode === 'mobile_banking' ? 'mobile_wallet' : 'cash';
        
        account = await tx.account.findFirst({
          where: { businessId, type: accountType },
        });
      }

      if (account) {
        await tx.account.update({
          where: { id: account.id },
          data: {
            currentBalance: account.currentBalance + parseFloat(amount),
          },
        });
      }

      return newPayment;
    });

    return NextResponse.json({
      success: true,
      data: payment,
    });
  } catch (error) {
    console.error('Create payment error:', error);
    return NextResponse.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to create payment' },
    }, { status: 500 });
  }
}
