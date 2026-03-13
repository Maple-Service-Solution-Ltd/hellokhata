// Hello Khata OS - Accounts API
// Cash/Bank account management

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/accounts - List accounts
export async function GET(request: NextRequest) {
  try {
    const businessId = request.headers.get('x-business-id');

    if (!businessId) {
      return NextResponse.json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Business ID required' },
      }, { status: 401 });
    }

    // Get or create default cash account
    let accounts = await db.account.findMany({
      where: { businessId },
      orderBy: { isDefault: 'desc' },
    });

    // Create default cash account if none exist
    if (accounts.length === 0) {
      const defaultAccount = await db.account.create({
        data: {
          businessId,
          name: 'Cash',
          nameBn: 'নগদ',
          type: 'cash',
          isDefault: true,
          status: 'active',
        },
      });
      accounts = [defaultAccount];
    }

    return NextResponse.json({
      success: true,
      data: accounts,
    });
  } catch (error) {
    console.error('Get accounts error:', error);
    return NextResponse.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch accounts' },
    }, { status: 500 });
  }
}

// POST /api/accounts - Create account
export async function POST(request: NextRequest) {
  try {
    const businessId = request.headers.get('x-business-id');

    if (!businessId) {
      return NextResponse.json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Business ID required' },
      }, { status: 401 });
    }

    const body = await request.json();
    const { name, nameBn, type, accountNumber, bankName, mobileNumber, openingBalance } = body;

    if (!name || !type) {
      return NextResponse.json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Name and type are required' },
      }, { status: 400 });
    }

    const account = await db.account.create({
      data: {
        businessId,
        name,
        nameBn,
        type,
        accountNumber,
        bankName,
        mobileNumber,
        openingBalance: openingBalance ? parseFloat(openingBalance) : 0,
        currentBalance: openingBalance ? parseFloat(openingBalance) : 0,
        isDefault: false,
      },
    });

    return NextResponse.json({
      success: true,
      data: account,
    });
  } catch (error) {
    console.error('Create account error:', error);
    return NextResponse.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to create account' },
    }, { status: 500 });
  }
}
