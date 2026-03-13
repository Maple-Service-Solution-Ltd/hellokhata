// Hello Khata OS - Business Profile API
// Update business profile information

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessId, name, phone, address, email } = body;

    if (!businessId) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'MISSING_BUSINESS_ID',
          message: 'Business ID is required',
          messageBn: 'বিজনেস আইডি প্রয়োজন',
        },
      }, { status: 400 });
    }

    // Update business
    const business = await db.business.update({
      where: { id: businessId },
      data: {
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone }),
        ...(address !== undefined && { address }),
        ...(email !== undefined && { email }),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: business.id,
        name: business.name,
        nameBn: business.nameBn,
        type: business.type,
        phone: business.phone,
        email: business.email,
        address: business.address,
        currency: business.currency,
        timezone: business.timezone,
        language: business.language,
        isActive: business.isActive,
      },
    });
  } catch (error) {
    console.error('Update business error:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update business',
        messageBn: 'বিজনেস আপডেট ব্যর্থ হয়েছে',
      },
    }, { status: 500 });
  }
}
