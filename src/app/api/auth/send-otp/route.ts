// Hello Khata OS - Send OTP API
// Static OTP = "123456" for demo/development

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const STATIC_OTP = '123456';
const OTP_EXPIRY_MINUTES = 5;

// Rate limiting store (in-memory for simplicity)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(phone: string): boolean {
  const now = Date.now();
  const key = `otp_${phone}`;
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + 60000 }); // 1 minute window
    return false;
  }

  if (record.count >= 3) {
    return true;
  }

  record.count++;
  return false;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone } = body;

    if (!phone || !/^01[3-9]\d{8}$/.test(phone)) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_PHONE',
          message: 'Please enter a valid Bangladeshi phone number',
          messageBn: 'সঠিক বাংলাদেশি ফোন নম্বর দিন',
        },
      }, { status: 400 });
    }

    // Check rate limiting
    if (isRateLimited(phone)) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many OTP requests. Please wait 1 minute.',
          messageBn: 'অনেক বার OTP চেয়েছেন। ১ মিনিট অপেক্ষা করুন।',
        },
      }, { status: 429 });
    }

    // Delete existing OTPs for this phone
    await db.otp.deleteMany({
      where: {
        phone,
        verified: false,
      },
    });

    // Create new OTP
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await db.otp.create({
      data: {
        phone,
        code: STATIC_OTP,
        purpose: 'login',
        expiresAt,
      },
    });

    // In production, send SMS here
    // DEV ONLY: Static OTP for development - not logged in production

    return NextResponse.json({
      success: true,
      data: {
        message: 'OTP sent successfully',
        messageBn: 'OTP সফলভাবে পাঠানো হয়েছে',
        // For demo, show the OTP
        ...(process.env.NODE_ENV !== 'production' && { otp: STATIC_OTP }),
      },
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to send OTP',
        messageBn: 'OTP পাঠাতে ব্যর্থ হয়েছে',
      },
    }, { status: 500 });
  }
}
