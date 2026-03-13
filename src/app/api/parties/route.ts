// Hello Khata OS - Parties API Routes
// GET: List parties with filtering, POST: Create new party

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import type { PartyType, CustomerTier } from '@/types';

// GET /api/parties - List all parties with filtering
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') as PartyType | null;
    const search = searchParams.get('search');
    const branchId = searchParams.get('branchId');
    const isActive = searchParams.get('isActive');
    const customerTier = searchParams.get('customerTier') as CustomerTier | null;
    const riskLevel = searchParams.get('riskLevel') as 'low' | 'medium' | 'high' | null;

    // Get businessId from header (multi-tenant isolation)
    const businessId = request.headers.get('x-business-id');

    // SECURITY: Require businessId - no demo business creation
    if (!businessId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Verify business exists
    const business = await db.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      return NextResponse.json(
        { success: false, error: { code: 'BUSINESS_NOT_FOUND', message: 'Business not found' } },
        { status: 404 }
      );
    }

    // Build where clause
    const where: {
      businessId: string;
      type?: string;
      branchId?: string;
      isActive?: boolean;
      customerTier?: string;
      riskLevel?: string;
      OR?: Array<{
        name?: { contains: string };
        phone?: { contains: string };
        email?: { contains: string };
      }>;
    } = {
      businessId,
    };

    // Apply filters
    if (type && type !== 'all') {
      where.type = type;
    }

    if (branchId) {
      where.branchId = branchId;
    }

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true';
    } else {
      // By default, only show active parties
      where.isActive = true;
    }

    if (customerTier) {
      where.customerTier = customerTier;
    }

    if (riskLevel) {
      where.riskLevel = riskLevel;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const parties = await db.party.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            nameBn: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
            nameBn: true,
          },
        },
        _count: {
          select: {
            sales: true,
            purchases: true,
            payments: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Transform data for response
    const transformedParties = parties.map((party) => ({
      ...party,
      salesCount: party._count.sales,
      purchasesCount: party._count.purchases,
      paymentsCount: party._count.payments,
      _count: undefined,
    }));

    // Calculate summary statistics
    const summary = {
      total: transformedParties.length,
      customers: transformedParties.filter((p) => p.type === 'customer' || p.type === 'both').length,
      suppliers: transformedParties.filter((p) => p.type === 'supplier' || p.type === 'both').length,
      totalReceivable: transformedParties
        .filter((p) => p.type === 'customer' || p.type === 'both')
        .reduce((sum, p) => sum + (p.currentBalance > 0 ? p.currentBalance : 0), 0),
      totalPayable: transformedParties
        .filter((p) => p.type === 'supplier' || p.type === 'both')
        .reduce((sum, p) => sum + (p.currentBalance < 0 ? Math.abs(p.currentBalance) : 0), 0),
    };

    return NextResponse.json({
      success: true,
      data: transformedParties,
      summary,
    });
  } catch (error) {
    console.error('Error fetching parties:', error);
    return NextResponse.json(
      { success: false, error: { code: 'FETCH_ERROR', message: 'Failed to fetch parties' } },
      { status: 500 }
    );
  }
}

// POST /api/parties - Create new party
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      phone,
      email,
      address,
      type = 'customer',
      customerTier,
      categoryId,
      branchId,
      openingBalance = 0,
      creditLimit,
      paymentTerms,
      notes,
    } = body;

    // Validate required fields
    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Party name is required' } },
        { status: 400 }
      );
    }

    // Get businessId from header (multi-tenant isolation)
    const businessId = request.headers.get('x-business-id');

    // SECURITY: Require businessId - no demo business creation
    if (!businessId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Verify business exists
    const business = await db.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      return NextResponse.json(
        { success: false, error: { code: 'BUSINESS_NOT_FOUND', message: 'Business not found' } },
        { status: 404 }
      );
    }

    // Check for duplicate phone number within the same business
    if (phone) {
      const existingParty = await db.party.findFirst({
        where: {
          businessId,
          phone,
          isActive: true,
        },
      });

      if (existingParty) {
        return NextResponse.json(
          {
            success: false,
            error: { code: 'DUPLICATE_PHONE', message: 'A party with this phone number already exists' },
          },
          { status: 400 }
        );
      }
    }

    // Validate category if provided
    if (categoryId) {
      const category = await db.partyCategory.findUnique({
        where: { id: categoryId },
      });

      if (!category || category.businessId !== businessId) {
        return NextResponse.json(
          { success: false, error: { code: 'INVALID_CATEGORY', message: 'Invalid party category' } },
          { status: 400 }
        );
      }
    }

    // Validate branch if provided
    if (branchId) {
      const branch = await db.branch.findUnique({
        where: { id: branchId },
      });

      if (!branch || branch.businessId !== businessId) {
        return NextResponse.json(
          { success: false, error: { code: 'INVALID_BRANCH', message: 'Invalid branch' } },
          { status: 400 }
        );
      }
    }

    // Create party
    const party = await db.party.create({
      data: {
        businessId,
        name: name.trim(),
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        address: address?.trim() || null,
        type,
        customerTier: customerTier || null,
        categoryId: categoryId || null,
        branchId: branchId || null,
        openingBalance,
        currentBalance: openingBalance,
        creditLimit: creditLimit || null,
        paymentTerms: paymentTerms || null,
        notes: notes?.trim() || null,
        isActive: true,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            nameBn: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
            nameBn: true,
          },
        },
      },
    });

    // Create opening balance ledger entry if opening balance is not zero
    if (openingBalance !== 0) {
      await db.partyLedger.create({
        data: {
          businessId,
          branchId: branchId || null,
          partyId: party.id,
          type: 'opening',
          amount: openingBalance,
          balance: openingBalance,
          description: openingBalance > 0 ? 'Opening receivable balance' : 'Opening payable balance',
          date: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: party,
      message: 'Party created successfully',
    });
  } catch (error) {
    console.error('Error creating party:', error);
    return NextResponse.json(
      { success: false, error: { code: 'CREATE_ERROR', message: 'Failed to create party' } },
      { status: 500 }
    );
  }
}
