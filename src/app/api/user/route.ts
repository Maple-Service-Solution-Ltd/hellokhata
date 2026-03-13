// Hello Khata OS - User Profile API
// Update user profile information

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, name, email } = body;

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'MISSING_USER_ID',
          message: 'User ID is required',
          messageBn: 'ইউজার আইডি প্রয়োজন',
        },
      }, { status: 400 });
    }

    // Update user
    const user = await db.user.update({
      where: { id: userId },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        email: user.email,
        role: user.role,
        businessId: user.businessId,
        branchId: user.branchId,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update user',
        messageBn: 'ইউজার আপডেট ব্যর্থ হয়েছে',
      },
    }, { status: 500 });
  }
}
