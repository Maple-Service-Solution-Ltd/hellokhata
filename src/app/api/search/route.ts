// Hello Khata OS - Global Search API
// Search across all entities

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/search?q=query
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
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
      return NextResponse.json({
        success: true,
        data: {
          query: query || '',
          results: [],
          groupedResults: {},
          totalResults: 0,
          searchTime: 0,
        },
      });
    }

    const startTime = Date.now();
    const searchQuery = query.toLowerCase();

    // Search in parallel
    const [items, parties, sales, expenses] = await Promise.all([
      // Search items
      db.item.findMany({
        where: {
          businessId,
          isActive: true,
          OR: [
            { name: { contains: searchQuery } },
            { nameBn: { contains: searchQuery } },
            { sku: { contains: searchQuery } },
            { barcode: { contains: searchQuery } },
          ],
        },
        take: 10,
      }),
      // Search parties
      db.party.findMany({
        where: {
          businessId,
          isActive: true,
          OR: [
            { name: { contains: searchQuery } },
            { phone: { contains: searchQuery } },
            { email: { contains: searchQuery } },
          ],
        },
        take: 10,
      }),
      // Search sales (by invoice number)
      db.sale.findMany({
        where: {
          businessId,
          invoiceNo: { contains: searchQuery },
        },
        include: {
          party: { select: { name: true } },
        },
        take: 10,
      }),
      // Search expenses
      db.expense.findMany({
        where: {
          businessId,
          description: { contains: searchQuery },
        },
        include: {
          category: { select: { name: true, icon: true } },
        },
        take: 10,
      }),
    ]);

    // Format results
    const results = [
      ...items.map((item) => ({
        id: item.id,
        type: 'item' as const,
        title: item.name,
        subtitle: item.sku || item.nameBn,
        description: `Stock: ${item.currentStock} | ৳${item.sellingPrice}`,
        url: `/inventory?id=${item.id}`,
        icon: 'package',
        score: 1,
      })),
      ...parties.map((party) => ({
        id: party.id,
        type: 'party' as const,
        title: party.name,
        subtitle: party.phone || undefined,
        description: `${party.type} | Balance: ৳${party.currentBalance}`,
        url: `/parties?id=${party.id}`,
        icon: 'user',
        score: 1,
      })),
      ...sales.map((sale) => ({
        id: sale.id,
        type: 'sale' as const,
        title: sale.invoiceNo,
        subtitle: sale.party?.name || 'Walk-in',
        description: `৳${sale.total} | ${new Date(sale.createdAt).toLocaleDateString()}`,
        url: `/sales?id=${sale.id}`,
        icon: 'receipt',
        score: 1,
      })),
      ...expenses.map((expense) => ({
        id: expense.id,
        type: 'expense' as const,
        title: expense.description,
        subtitle: expense.category?.name,
        description: `৳${expense.amount} | ${new Date(expense.date).toLocaleDateString()}`,
        url: `/expenses?id=${expense.id}`,
        icon: expense.category?.icon || 'credit-card',
        score: 1,
      })),
    ];

    // Group results by type
    const groupedResults = {
      item: results.filter((r) => r.type === 'item'),
      party: results.filter((r) => r.type === 'party'),
      sale: results.filter((r) => r.type === 'sale'),
      expense: results.filter((r) => r.type === 'expense'),
      account: [],
    };

    const searchTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: {
        query,
        results,
        groupedResults,
        totalResults: results.length,
        searchTime,
      },
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Search failed' },
    }, { status: 500 });
  }
}
