import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { message } = await request.json();
        const userMsg = message.toLowerCase();

        let response = "I am your AGEL Data Assistant. I can help you with the Execution & Commissioning Tracker. You can ask about Solar/Wind status, User Roles, or how to use the dashboard.";

        if (userMsg.includes("hello") || userMsg.includes("hi")) {
            response = "Hello! I am your AGEL Data Assistant. The current dashboard reflects data as on 31-Oct-2025. How can I help you today?";
        } else if (userMsg.includes("status") || userMsg.includes("summary")) {
            response = "The Commissioning Status page provides a detailed breakdown of all projects. The AGEL Overall FY (1+2) summary is now at the top of the Overview section for quick reference.";
        } else if (userMsg.includes("solar")) {
            response = "Solar projects are categorized into Khavda (A), Rajasthan (B), and Rajasthan Additional (C). You can see the technology mix and achievement in the main dashboard.";
        } else if (userMsg.includes("wind")) {
            response = "Wind portfolio achievement is calculated for Khavda and Mundra projects. You can switch the view to 'Cumulative' in the charts to see progress over time.";
        } else if (userMsg.includes("export") || userMsg.includes("download")) {
            response = "You can export project data to Excel using the 'Export' button in the Commissioning Status page. It includes monthly phasing and quarterly totals.";
        } else if (userMsg.includes("role") || userMsg.includes("login") || userMsg.includes("persona")) {
            response = "The application now supports three roles: Super Admin (full control), Admin (editing & upload), and User (view-only). Access to the 'Reset Data' button is restricted to Super Admins.";
        } else if (userMsg.includes("quarter") || userMsg.includes("q4")) {
            response = "Quarterly results now correctly reflect 3 months each (e.g., Q4 includes Jan-Mar 2026). You can see future Q4 projections in both the status tables and trending charts.";
        } else if (userMsg.includes("duplicate")) {
            response = "I have implemented deduplication logic in the dashboard to ensure KPI cards and summaries are not inflated by duplicate entries in the source data.";
        }

        return NextResponse.json({ response }, { status: 200 });
    } catch (error: any) {
        console.error('Chat Error:', error);
        return NextResponse.json({ response: "I'm sorry, I'm having trouble responding right now. Please try again later." }, { status: 200 });
    }
}
