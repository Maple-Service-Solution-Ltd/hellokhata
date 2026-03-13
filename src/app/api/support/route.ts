// Support Tickets API - Simplified
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

function getSession(request: NextRequest) {
  return {
    businessId: request.headers.get('x-business-id'),
    userId: request.headers.get('x-user-id'),
  };
}

// GET /api/support
export async function GET(request: NextRequest) {
  try {
    const { businessId } = getSession(request);
    if (!businessId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tickets = await db.supportTicket.findMany({
      where: { businessId },
      include: { messages: { take: 1, orderBy: { createdAt: 'desc' } } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json(tickets);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return NextResponse.json([], { status: 200 });
  }
}

// POST /api/support
export async function POST(request: NextRequest) {
  try {
    const { businessId, userId } = getSession(request);
    if (!businessId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { subject, message, priority, category } = body;

    const ticket = await db.supportTicket.create({
      data: {
        businessId,
        userId: userId || 'anonymous',
        subject,
        status: 'open',
        priority: priority || 'medium',
        category: category || 'general',
      },
    });

    if (message) {
      await db.supportMessage.create({
        data: {
          ticketId: ticket.id,
          userId: userId || 'anonymous',
          message,
          isFromSupport: false,
        },
      });
    }

    return NextResponse.json({ success: true, data: ticket });
  } catch (error) {
    console.error('Error creating ticket:', error);
    return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 });
  }
}
