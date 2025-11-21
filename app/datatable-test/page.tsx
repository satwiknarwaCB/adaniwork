"use client";

import { useState } from 'react';
import DataTable from '../components/DataTable';

export default function DataTableTestPage() {
  const [fiscalYear, setFiscalYear] = useState('FY_25');
  const [view, setView] = useState('new'); // 'new' or 'old'
  
  const fiscalYearOptions = [
    { value: 'FY_23', label: 'FY 2023-24' },
    { value: 'FY_24', label: 'FY 2024-25' },
    { value: 'FY_25', label: 'FY 2025-26' },
    { value: 'FY_26', label: 'FY 2026-27' },
    { value: 'FY_27', label: 'FY 2027-28' }
  ];

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground dark:text-white mb-2">Data Table Comparison</h1>
        <p className="text-foreground/70 dark:text-gray-300">
          Compare the old and new implementations of the data table component.
        </p>
      </div>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-foreground dark:text-white mb-2">
          Select Fiscal Year
        </label>
        <div className="flex flex-wrap gap-2 mb-4">
          {fiscalYearOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setFiscalYear(option.value)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                fiscalYear === option.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        
        <label className="block text-sm font-medium text-foreground dark:text-white mb-2">
          Select Implementation
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setView('new')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              view === 'new'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600'
            }`}
          >
            New Implementation
          </button>
          <button
            onClick={() => setView('old')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              view === 'old'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600'
            }`}
          >
            Old Implementation
          </button>
        </div>
      </div>
      
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        {view === 'new' ? (
          <DataTable fiscalYear={fiscalYear} />
        ) : (
          <DataTable fiscalYear={fiscalYear} />
        )}
      </div>
    </div>
  );
}