import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/commissioning-summaries - Get commissioning summaries for a fiscal year
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fiscalYear = searchParams.get('fiscalYear') || 'FY_25-26';

    const summaries = await prisma.commissioningSummary.findMany({
      where: {
        fiscalYear,
        isDeleted: false,
      },
    });

    return NextResponse.json(summaries, { status: 200 });
  } catch (error: any) {
    console.error('Error getting commissioning summaries:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/commissioning-summaries - Save commissioning summaries
export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fiscalYear = searchParams.get('fiscalYear') || 'FY_25-26';
    const summariesData = await request.json();

    // Soft delete existing
    await prisma.commissioningSummary.updateMany({
      where: { fiscalYear },
      data: { isDeleted: true },
    });

    // Create new records
    const createdCount = await prisma.commissioningSummary.createMany({
      data: summariesData.map((s: any) => ({
        fiscalYear,
        category: s.category,
        summaryType: s.summaryType,
        apr: s.apr, may: s.may, jun: s.jun,
        jul: s.jul, aug: s.aug, sep: s.sep,
        oct: s.oct, nov: s.nov, dec: s.dec,
        jan: s.jan, feb: s.feb, mar: s.mar,
        total: s.total,
        cummTillOct: s.cummTillOct,
        q1: s.q1, q2: s.q2, q3: s.q3, q4: s.q4,
      })),
    });

    return NextResponse.json({ message: 'Commissioning summaries saved successfully', count: createdCount.count }, { status: 200 });
  } catch (error: any) {
    console.error('Error saving commissioning summaries:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
