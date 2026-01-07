import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/commissioning-projects - Get commissioning projects for a fiscal year
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fiscalYear = searchParams.get('fiscalYear') || 'FY_25-26';

    const projects = await prisma.commissioningProject.findMany({
      where: {
        fiscalYear,
        isDeleted: false,
      },
      orderBy: [
        { category: 'asc' },
        { sno: 'asc' },
      ],
    });

    // Handle calculation logic like in the Python backend
    const enrichedProjects = projects.map(proj => {
      const months = [
        proj.apr || 0, proj.may || 0, proj.jun || 0,
        proj.jul || 0, proj.aug || 0, proj.sep || 0,
        proj.oct || 0, proj.nov || 0, proj.dec || 0,
        proj.jan || 0, proj.feb || 0, proj.mar || 0
      ];

      const monthlySum = months.reduce((a, b) => a + b, 0);

      // CRITICAL FIX: Row Total Logic per PDF Spec
      // PLAN/REPHASE: totalCapacity = capacity (the project's planned capacity)
      // ACTUAL: totalCapacity = sum of monthly values
      let totalCapacity = proj.totalCapacity || 0;
      if (proj.planActual === 'Plan' || proj.planActual === 'Rephase') {
        totalCapacity = proj.capacity || 0;
      } else {
        totalCapacity = monthlySum;
      }

      // Calculate cummTillOct (Actually Apr-Nov as per spec)
      const cummTillNov = [
        proj.apr || 0, proj.may || 0, proj.jun || 0,
        proj.jul || 0, proj.aug || 0, proj.sep || 0,
        proj.oct || 0, proj.nov || 0
      ].reduce((a, b) => a + b, 0);

      const q1 = (proj.apr || 0) + (proj.may || 0) + (proj.jun || 0);
      const q2 = (proj.jul || 0) + (proj.aug || 0) + (proj.sep || 0);
      const q3 = (proj.oct || 0) + (proj.nov || 0) + (proj.dec || 0);
      const q4 = (proj.jan || 0) + (proj.feb || 0) + (proj.mar || 0);

      return {
        ...proj,
        totalCapacity,
        cummTillOct: cummTillNov,
        q1, q2, q3, q4
      };
    });

    return NextResponse.json(enrichedProjects, { status: 200 });
  } catch (error: any) {
    console.error('Error getting commissioning projects:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/commissioning-projects - Save commissioning projects
export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fiscalYear = searchParams.get('fiscalYear') || 'FY_25-26';
    const projectsData = await request.json();

    // Soft delete existing
    await prisma.commissioningProject.updateMany({
      where: { fiscalYear },
      data: { isDeleted: true },
    });

    // Create new records
    const createdCount = await prisma.commissioningProject.createMany({
      data: projectsData.map((p: any) => ({
        fiscalYear,
        sno: p.sno,
        projectName: p.projectName,
        spv: p.spv || '',
        projectType: p.projectType || '',
        plotLocation: p.plotLocation || '',
        capacity: p.capacity,
        planActual: p.planActual,
        apr: p.apr, may: p.may, jun: p.jun,
        jul: p.jul, aug: p.aug, sep: p.sep,
        oct: p.oct, nov: p.nov, dec: p.dec,
        jan: p.jan, feb: p.feb, mar: p.mar,
        totalCapacity: p.totalCapacity,
        cummTillOct: p.cummTillOct,
        q1: p.q1, q2: p.q2, q3: p.q3, q4: p.q4,
        category: p.category,
        section: p.section || 'A',
        includedInTotal: p.includedInTotal ?? true,
      })),
    });

    return NextResponse.json({ message: 'Commissioning projects saved successfully', count: createdCount.count }, { status: 200 });
  } catch (error: any) {
    console.error('Error saving commissioning projects:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
