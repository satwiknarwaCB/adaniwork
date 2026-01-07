import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { message } = await request.json();
        const userMsg = message.toLowerCase();

        let response = "I am currently in 'Offline Mode' to protect sensitive data. I can assist with general questions about the dashboard layout and features.";

        if (userMsg.includes("hello") || userMsg.includes("hi")) {
            response = "Hello! I am your AGEL Data Assistant. How can I help you navigate the dashboard today?";
        } else if (userMsg.includes("status") || userMsg.includes("summary")) {
            response = "You can view the latest Commissioning Status in the 'Commissioning Status' page. The data currently reflects the FY 25-26 project lifecycle as of the latest update.";
        } else if (userMsg.includes("solar")) {
            response = "The Solar portfolio is divided into Khavda and Rajasthan projects. You can filter by these categories in the main dashboard for a detailed drill-down.";
        } else if (userMsg.includes("wind")) {
            response = "The Wind portfolio includes Khavda and Mundra projects. Achievement is calculated based on cumulative capacity vs targets.";
        } else if (userMsg.includes("export") || userMsg.includes("download")) {
            response = "You can export the current view to Excel using the 'Export' button located at the top of the Commissioning Status page.";
        }

        return NextResponse.json({ response }, { status: 200 });
    } catch (error: any) {
        console.error('Chat Error:', error);
        return NextResponse.json({ response: "I'm sorry, I'm having trouble responding right now. Please try again later." }, { status: 200 });
    }
}
