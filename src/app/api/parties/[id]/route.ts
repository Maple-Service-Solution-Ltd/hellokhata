// Hello Khata OS - Party by ID API Routes
// GET: Get single party, PATCH: Update party, DELETE: Soft delete party

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import type { PartyType, CustomerTier } from '@/types';

// GET /api/parties/[id] - Get single party by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get businessId from header (multi-tenant isolation)
    const businessId = request.headers.get('x-business-id');

    // Build where clause with business isolation
    const where: { id: string; businessId?: string } = { id };
    if (businessId) {
      where.businessId = businessId;
    }

    const party = await db.party.findFirst({
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
        sales: {
          select: {
            id: true,
            invoiceNo: true,
            total: true,
            paidAmount: true,
            dueAmount: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        purchases: {
          select: {
            id: true,
            invoiceNo: true,
            total: true,
            paidAmount: true,
            dueAmount: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        payments: {
          select: {
            id: true,
            type: true,
            mode: true,
            amount: true,
            reference: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!party) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Party not found' } },
        { status: 404 }
      );
    }

    // Get party ledger entries
    const ledgerEntries = await db.partyLedger.findMany({
      where: { partyId: id },
      orderBy: { date: 'desc' },
      take: 50,
    });

    // Calculate party statistics
    const totalSales = await db.sale.aggregate({
      where: { partyId: id, status: 'completed' },
      _sum: { total: true },
    });

    const totalPurchases = await db.purchase.aggregate({
      where: { supplierId: id, status: 'received' },
      _sum: { total: true },
    });

    const totalPaymentsReceived = await db.payment.aggregate({
      where: { partyId: id, type: 'received' },
      _sum: { amount: true },
    });

    const totalPaymentsMade = await db.payment.aggregate({
      where: { partyId: id, type: 'paid' },
      _sum: { amount: true },
    });

    const stats = {
      totalSalesAmount: totalSales._sum.total || 0,
      totalPurchasesAmount: totalPurchases._sum.total || 0,
      totalPaymentsReceived: totalPaymentsReceived._sum.amount || 0,
      totalPaymentsMade: totalPaymentsMade._sum.amount || 0,
      salesCount: party.sales.length,
      purchasesCount: party.purchases.length,
      paymentsCount: party.payments.length,
    };

    return NextResponse.json({
      success: true,
      data: {
        ...party,
        ledgerEntries,
        stats,
      },
    });
  } catch (error) {
    console.error('Error fetching party:', error);
    return NextResponse.json(
      { success: false, error: { code: 'FETCH_ERROR', message: 'Failed to fetch party' } },
      { status: 500 }
    );
  }
}

// PATCH /api/parties/[id] - Update party
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      name,
      phone,
      email,
      address,
      type,
      customerTier,
      categoryId,
      branchId,
      creditLimit,
      paymentTerms,
      notes,
      isActive,
      riskLevel,
    } = body;

    // Get businessId from header (multi-tenant isolation)
    const businessId = request.headers.get('x-business-id');

    // Build where clause with business isolation
    const where: { id: string; businessId?: string } = { id };
    if (businessId) {
      where.businessId = businessId;
    }

    // Check if party exists
    const existingParty = await db.party.findFirst({
      where,
    });

    if (!existingParty) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Party not found' } },
        { status: 404 }
      );
    }

    // Check for duplicate phone number if phone is being updated
    if (phone && phone !== existingParty.phone) {
      const duplicatePhone = await db.party.findFirst({
        where: {
          businessId: existingParty.businessId,
          phone,
          isActive: true,
          id: { not: id },
        },
      });

      if (duplicatePhone) {
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
    if (categoryId !== undefined && categoryId !== null) {
      const category = await db.partyCategory.findUnique({
        where: { id: categoryId },
      });

      if (!category || category.businessId !== existingParty.businessId) {
        return NextResponse.json(
          { success: false, error: { code: 'INVALID_CATEGORY', message: 'Invalid party category' } },
          { status: 400 }
        );
      }
    }

    // Validate branch if provided
    if (branchId !== undefined && branchId !== null) {
      const branch = await db.branch.findUnique({
        where: { id: branchId },
      });

      if (!branch || branch.businessId !== existingParty.businessId) {
        return NextResponse.json(
          { success: false, error: { code: 'INVALID_BRANCH', message: 'Invalid branch' } },
          { status: 400 }
        );
      }
    }

    // Build update data
    const updateData: {
      name?: string;
      phone?: string | null;
      email?: string | null;
      address?: string | null;
      type?: PartyType;
      customerTier?: CustomerTier | null;
      categoryId?: string | null;
      branchId?: string | null;
      creditLimit?: number | null;
      paymentTerms?: number | null;
      notes?: string | null;
      isActive?: boolean;
      riskLevel?: string | null;
      updatedAt: Date;
    } = {
      updatedAt: new Date(),
    };

    if (name !== undefined) updateData.name = name.trim();
    if (phone !== undefined) updateData.phone = phone?.trim() || null;
    if (email !== undefined) updateData.email = email?.trim() || null;
    if (address !== undefined) updateData.address = address?.trim() || null;
    if (type !== undefined) updateData.type = type as PartyType;
    if (customerTier !== undefined) updateData.customerTier = customerTier || null;
    if (categoryId !== undefined) updateData.categoryId = categoryId || null;
    if (branchId !== undefined) updateData.branchId = branchId || null;
    if (creditLimit !== undefined) updateData.creditLimit = creditLimit || null;
    if (paymentTerms !== undefined) updateData.paymentTerms = paymentTerms || null;
    if (notes !== undefined) updateData.notes = notes?.trim() || null;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (riskLevel !== undefined) updateData.riskLevel = riskLevel || null;

    const party = await db.party.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json({
      success: true,
      data: party,
      message: 'Party updated successfully',
    });
  } catch (error) {
    console.error('Error updating party:', error);
    return NextResponse.json(
      { success: false, error: { code: 'UPDATE_ERROR', message: 'Failed to update party' } },
      { status: 500 }
    );
  }
}

// DELETE /api/parties/[id] - Soft delete party (set isActive = false)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get businessId from header (multi-tenant isolation)
    const businessId = request.headers.get('x-business-id');

    // Build where clause with business isolation
    const where: { id: string; businessId?: string } = { id };
    if (businessId) {
      where.businessId = businessId;
    }

    // Check if party exists
    const existingParty = await db.party.findFirst({
      where,
    });

    if (!existingParty) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Party not found' } },
        { status: 404 }
      );
    }

    // Check for active transactions
    const activeSales = await db.sale.count({
      where: {
        partyId: id,
        status: { in: ['completed', 'pending'] },
        dueAmount: { gt: 0 },
      },
    });

    if (activeSales > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'HAS_ACTIVE_TRANSACTIONS',
            message: 'Cannot delete party with active transactions or outstanding balance',
          },
        },
        { status: 400 }
      );
    }

    // Check for outstanding balance
    if (existingParty.currentBalance !== 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'HAS_OUTSTANDING_BALANCE',
            message: 'Cannot delete party with outstanding balance. Clear the balance first.',
          },
        },
        { status: 400 }
      );
    }

    // Soft delete by setting isActive = false
    const party = await db.party.update({
      where: { id },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: { id },
      message: 'Party deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting party:', error);
    return NextResponse.json(
      { success: false, error: { code: 'DELETE_ERROR', message: 'Failed to delete party' } },
      { status: 500 }
    );
  }
}
