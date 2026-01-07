import { NextResponse } from 'next/server';
import { parseExcelWorkbook, importProjectsToDb } from '@/lib/excelParser';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const fiscalYear = (formData.get('fiscalYear') as string) || 'FY_25-26';

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        // Parse Excel
        const result = await parseExcelWorkbook(buffer);

        if (result.errors.length > 0 && result.projects.length === 0) {
            return NextResponse.json(
                {
                    error: 'Failed to parse Excel file',
                    errors: result.errors,
                    sheets_found: result.sheets_found
                },
                { status: 400 }
            );
        }

        // Import to database
        if (result.projects.length > 0) {
            const importResult = await importProjectsToDb(result.projects, fiscalYear);

            return NextResponse.json({
                message: 'Excel uploaded successfully',
                projects_imported: importResult.inserted_projects,
                summaries_imported: 0,
                sheets_found: result.sheets_found,
                sheet_count: result.sheets_found.length,
                parse_errors: result.errors
            }, { status: 200 });
        } else {
            return NextResponse.json({
                message: 'No projects found in Excel',
                projects_imported: 0,
                sheets_found: result.sheets_found,
                sheet_count: result.sheets_found.length,
                parse_errors: result.errors
            }, { status: 200 });
        }
    } catch (error: any) {
        console.error('Error uploading Excel file:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
