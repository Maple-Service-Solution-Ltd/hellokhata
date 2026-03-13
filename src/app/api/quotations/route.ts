// Hello Khata OS - Quotations API Routes
// GET: List all quotations, POST: Create new quotation

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import type { QuotationItem, QuotationStatus } from '@/types/quotation';

// GET /api/quotations - List all quotations
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') as QuotationStatus | null;
    const search = searchParams.get('search');

    // Get businessId from headers (multi-tenant isolation)
    const businessId = request.headers.get('x-business-id');

    // SECURITY: Require businessId - no demo business creation
    if (!businessId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const business = await db.business.findUnique({ where: { id: businessId } });
    
    if (!business) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Business not found' } },
        { status: 404 }
      );
    }

    // Build where clause
    const where: {
      businessId: string;
      status?: string;
      OR?: Array<{
        quotationNo?: { contains: string };
        partyName?: { contains: string };
      }>;
    } = {
      businessId,
    };

    if (status && status !== 'all') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { quotationNo: { contains: search } },
        { partyName: { contains: search } },
      ];
    }

    const quotations = await db.quotation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // Parse items JSON for each quotation
    const parsedQuotations = quotations.map((q) => ({
      ...q,
      items: JSON.parse(q.items) as QuotationItem[],
    }));

    return NextResponse.json({
      success: true,
      data: parsedQuotations,
    });
  } catch (error) {
    console.error('Error fetching quotations:', error);
    return NextResponse.json(
      { success: false, error: { code: 'FETCH_ERROR', message: 'Failed to fetch quotations' } },
      { status: 500 }
    );
  }
}

// POST /api/quotations - Create new quotation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      partyId,
      partyName,
      items,
      discount,
      tax,
      validityDate,
      quotationDate,
      notes,
      status = 'draft',
    } = body;

    // Validate required fields
    if (!items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'At least one item is required' } },
        { status: 400 }
      );
    }

    if (!validityDate) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Validity date is required' } },
        { status: 400 }
      );
    }

    // Get businessId from headers (multi-tenant isolation)
    const businessId = request.headers.get('x-business-id');

    // SECURITY: Require businessId - no demo business creation
    if (!businessId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const business = await db.business.findUnique({ where: { id: businessId } });
    
    if (!business) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Business not found' } },
        { status: 404 }
      );
    }

    // Calculate totals
    const subtotal = items.reduce(
      (sum: number, item: { quantity: number; unitPrice: number; discount: number }) =>
        sum + item.quantity * item.unitPrice - item.discount,
      0
    );
    const total = subtotal - (discount || 0) + (tax || 0);

    // Generate quotation number
    const lastQuotation = await db.quotation.findFirst({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
    });

    let quotationNo = 'QT-2024-001';
    if (lastQuotation) {
      const lastNo = parseInt(lastQuotation.quotationNo.split('-').pop() || '0', 10);
      quotationNo = `QT-2024-${String(lastNo + 1).padStart(3, '0')}`;
    }

    // Create quotation with items as JSON
    const quotationItems: QuotationItem[] = items.map(
      (item: { itemId: string; itemName: string; quantity: number; unitPrice: number; discount: number }, index: number) => ({
        id: String(index + 1),
        itemId: item.itemId,
        itemName: item.itemName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount || 0,
        total: item.quantity * item.unitPrice - (item.discount || 0),
        createdAt: new Date(),
      })
    );

    const quotation = await db.quotation.create({
      data: {
        businessId,
        quotationNo,
        partyId: partyId || null,
        partyName: partyName || null,
        items: JSON.stringify(quotationItems),
        subtotal,
        discount: discount || 0,
        tax: tax || 0,
        total,
        validityDate: new Date(validityDate),
        quotationDate: quotationDate ? new Date(quotationDate) : new Date(),
        status,
        notes: notes || null,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...quotation,
        items: quotationItems,
      },
    });
  } catch (error) {
    console.error('Error creating quotation:', error);
    return NextResponse.json(
      { success: false, error: { code: 'CREATE_ERROR', message: 'Failed to create quotation' } },
      { status: 500 }
    );
  }
}
