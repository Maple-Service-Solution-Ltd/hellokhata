// Hello Khata OS - Import Items API
// Bulk import items from CSV file

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/items/import - Import items from CSV
export async function POST(request: NextRequest) {
  try {
    const businessId = request.headers.get('x-business-id');
    const userId = request.headers.get('x-user-id');

    if (!businessId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Business ID required' } },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'No file provided' } },
        { status: 400 }
      );
    }

    // Read file content
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());

    if (lines.length < 2) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'CSV file must have header and at least one data row' } },
        { status: 400 }
      );
    }

    // Parse header
    const header = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
    const requiredFields = ['name'];
    const hasRequired = requiredFields.every(field => header.includes(field));

    if (!hasRequired) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'CSV must have at least a "name" column' } },
        { status: 400 }
      );
    }

    // Get column indices
    const nameIdx = header.indexOf('name');
    const categoryIdx = header.indexOf('category');
    const skuIdx = header.indexOf('sku');
    const barcodeIdx = header.indexOf('barcode');
    const unitIdx = header.indexOf('unit');
    const costPriceIdx = header.indexOf('costprice');
    const sellingPriceIdx = header.indexOf('sellingprice');
    const wholesalePriceIdx = header.indexOf('wholesaleprice');
    const vipPriceIdx = header.indexOf('vipprice');
    const currentStockIdx = header.indexOf('currentstock');
    const minStockIdx = header.indexOf('minstock');

    // Fetch categories for name lookup
    const categories = await db.category.findMany({
      where: { businessId },
      select: { id: true, name: true, nameBn: true },
    });

    const imported: any[] = [];
    const errors: string[] = [];
    const skipped: string[] = [];

    // Process each row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;

      const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      const name = values[nameIdx];

      if (!name) {
        errors.push(`Row ${i + 1}: Missing name`);
        continue;
      }

      try {
        // Find category ID
        let categoryId: string | undefined;
        if (categoryIdx >= 0 && values[categoryIdx]) {
          const catName = values[categoryIdx];
          const category = categories.find(
            c => c.name.toLowerCase() === catName.toLowerCase() || 
                 c.nameBn?.toLowerCase() === catName.toLowerCase()
          );
          if (category) {
            categoryId = category.id;
          }
        }

        // Check for duplicate SKU
        const sku = skuIdx >= 0 ? values[skuIdx] : undefined;
        if (sku) {
          const existing = await db.item.findFirst({
            where: { businessId, sku },
          });
          if (existing) {
            skipped.push(`Row ${i + 1}: SKU "${sku}" already exists`);
            continue;
          }
        }

        // Create item
        const item = await db.item.create({
          data: {
            businessId,
            name,
            categoryId,
            sku: sku || undefined,
            barcode: barcodeIdx >= 0 ? values[barcodeIdx] || undefined : undefined,
            unit: unitIdx >= 0 && values[unitIdx] ? values[unitIdx] : 'pcs',
            costPrice: costPriceIdx >= 0 ? parseFloat(values[costPriceIdx]) || 0 : 0,
            sellingPrice: sellingPriceIdx >= 0 ? parseFloat(values[sellingPriceIdx]) || 0 : 0,
            wholesalePrice: wholesalePriceIdx >= 0 && values[wholesalePriceIdx] ? parseFloat(values[wholesalePriceIdx]) : null,
            vipPrice: vipPriceIdx >= 0 && values[vipPriceIdx] ? parseFloat(values[vipPriceIdx]) : null,
            currentStock: currentStockIdx >= 0 ? parseFloat(values[currentStockIdx]) || 0 : 0,
            minStock: minStockIdx >= 0 ? parseFloat(values[minStockIdx]) || 10 : 10,
            isActive: true,
          },
        });

        // Create stock ledger entry for opening stock
        if (item.currentStock > 0) {
          await db.stockLedger.create({
            data: {
              businessId,
              itemId: item.id,
              type: 'purchase',
              quantity: item.currentStock,
              previousStock: 0,
              newStock: item.currentStock,
              referenceType: 'adjustment',
              reason: 'Opening stock (import)',
              createdBy: userId || null,
            },
          });
        }

        imported.push(item);
      } catch (error) {
        errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        imported: imported.length,
        failed: errors.length + skipped.length,
        errors: [...errors, ...skipped],
        items: imported.map(i => ({ id: i.id, name: i.name })),
      },
    });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'IMPORT_ERROR', message: 'Failed to import items' } },
      { status: 500 }
    );
  }
}
