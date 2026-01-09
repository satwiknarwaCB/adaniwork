import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PATCH /api/commissioning-projects/[id] - Update a single project field
export async function PATCH(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const projectId = parseInt(id, 10);

        if (isNaN(projectId)) {
            return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
        }

        const updates = await request.json();
        console.log('Updating project:', projectId, 'with:', updates);

        // Update the specific project
        const updatedProject = await prisma.commissioningProject.update({
            where: { id: projectId },
            data: updates,
        });

        // Recalculate derived fields
        const months = [
            updatedProject.apr || 0, updatedProject.may || 0, updatedProject.jun || 0,
            updatedProject.jul || 0, updatedProject.aug || 0, updatedProject.sep || 0,
            updatedProject.oct || 0, updatedProject.nov || 0, updatedProject.dec || 0,
            updatedProject.jan || 0, updatedProject.feb || 0, updatedProject.mar || 0
        ];

        const totalCapacity = months.reduce((a, b) => a + b, 0);
        const cummTillNov = months.slice(0, 8).reduce((a, b) => a + b, 0);
        const q1 = months.slice(0, 3).reduce((a, b) => a + b, 0);
        const q2 = months.slice(3, 6).reduce((a, b) => a + b, 0);
        const q3 = months.slice(6, 9).reduce((a, b) => a + b, 0);
        const q4 = months.slice(9, 12).reduce((a, b) => a + b, 0);

        // Update calculated fields
        await prisma.commissioningProject.update({
            where: { id: projectId },
            data: { totalCapacity, cummTillOct: cummTillNov, q1, q2, q3, q4 },
        });

        return NextResponse.json({
            message: 'Project updated successfully',
            project: { ...updatedProject, totalCapacity, cummTillOct: cummTillNov, q1, q2, q3, q4 }
        }, { status: 200 });
    } catch (error: any) {
        console.error('Error updating project:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
