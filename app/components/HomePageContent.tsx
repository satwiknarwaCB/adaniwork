"use client";

import { useTheme } from "@/app/components/ThemeProvider";

export default function HomePageContent() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-card-background text-foreground p-4 sm:p-8">
      <main className="max-w-7xl mx-auto">
        <div className="text-center mb-12 mt-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-4">
              Assest commissioning
            </h1>
            <button
              onClick={toggleTheme}
              className="px-4 py-2 rounded-md bg-card-background border border-card-border text-foreground hover:bg-table-row-hover transition-colors shadow-xs"
            >
              {theme === 'light' ? 'Switch to Dark' : 'Switch to Light'}
            </button>
          </div>
          <p className="text-foreground/70 max-w-2xl mx-auto">
            Manage your energy data efficiently with our intuitive table interface. Add, edit, and export your data to Excel.
          </p>
        </div>
        
        {/* <div className="bg-card-background rounded-xl border border-card-border p-6 shadow-2xl">
          <UserTable />
        </div> */}
        
        <div className="mt-12 text-center text-foreground/50 text-sm">
          <p>© {new Date().getFullYear()} Adani Excel. All rights reserved.</p>
        </div>
      </main>
    </div>
  );
}