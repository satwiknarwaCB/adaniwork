"use client";

import React from 'react';

interface CommissioningProject {
    id?: number;
    sno: number;
    projectName: string;
    spv: string;
    projectType: string;
    plotLocation: string;
    capacity: number;
    planActual: string;
    apr: number | null;
    may: number | null;
    jun: number | null;
    jul: number | null;
    aug: number | null;
    sep: number | null;
    oct: number | null;
    nov: number | null;
    dec: number | null;
    jan: number | null;
    feb: number | null;
    mar: number | null;
    totalCapacity: number | null;
    cummTillOct: number | null;
    q1: number | null;
    q2: number | null;
    q3: number | null;
    q4: number | null;
    category: string;
    section: string;
    includedInTotal: boolean;
}

interface SummaryTableProps {
    title: string;
    projects: CommissioningProject[];
    monthColumns: string[];
    monthLabels: string[];
    formatNumber: (value: number | null | undefined) => string;
}

export function SummaryTable({ title, projects, monthColumns, monthLabels, formatNumber }: SummaryTableProps) {
    // Group projects by planActual and projectType
    const aggregateByType = (projs: CommissioningProject[], planActual: string) => {
        const filtered = projs.filter(p => p.planActual === planActual);

        const types = ['PPA', 'Merchant', 'Group'];
        const byType: Record<string, any> = {};

        types.forEach(type => {
            const typeProjs = filtered.filter(p => p.projectType === type);
            if (typeProjs.length === 0) return;

            byType[type] = {
                apr: typeProjs.reduce((s, p) => s + (p.apr || 0), 0),
                may: typeProjs.reduce((s, p) => s + (p.may || 0), 0),
                jun: typeProjs.reduce((s, p) => s + (p.jun || 0), 0),
                jul: typeProjs.reduce((s, p) => s + (p.jul || 0), 0),
                aug: typeProjs.reduce((s, p) => s + (p.aug || 0), 0),
                sep: typeProjs.reduce((s, p) => s + (p.sep || 0), 0),
                oct: typeProjs.reduce((s, p) => s + (p.oct || 0), 0),
                nov: typeProjs.reduce((s, p) => s + (p.nov || 0), 0),
                dec: typeProjs.reduce((s, p) => s + (p.dec || 0), 0),
                jan: typeProjs.reduce((s, p) => s + (p.jan || 0), 0),
                feb: typeProjs.reduce((s, p) => s + (p.feb || 0), 0),
                mar: typeProjs.reduce((s, p) => s + (p.mar || 0), 0),
                totalCapacity: typeProjs.reduce((s, p) => s + (p.totalCapacity || 0), 0),
                cummTillOct: typeProjs.reduce((s, p) => s + (p.cummTillOct || 0), 0),
                q1: typeProjs.reduce((s, p) => s + (p.q1 || 0), 0),
                q2: typeProjs.reduce((s, p) => s + (p.q2 || 0), 0),
                q3: typeProjs.reduce((s, p) => s + (p.q3 || 0), 0),
                q4: typeProjs.reduce((s, p) => s + (p.q4 || 0), 0),
            };
        });

        const total = {
            apr: filtered.reduce((s, p) => s + (p.apr || 0), 0),
            may: filtered.reduce((s, p) => s + (p.may || 0), 0),
            jun: filtered.reduce((s, p) => s + (p.jun || 0), 0),
            jul: filtered.reduce((s, p) => s + (p.jul || 0), 0),
            aug: filtered.reduce((s, p) => s + (p.aug || 0), 0),
            sep: filtered.reduce((s, p) => s + (p.sep || 0), 0),
            oct: filtered.reduce((s, p) => s + (p.oct || 0), 0),
            nov: filtered.reduce((s, p) => s + (p.nov || 0), 0),
            dec: filtered.reduce((s, p) => s + (p.dec || 0), 0),
            jan: filtered.reduce((s, p) => s + (p.jan || 0), 0),
            feb: filtered.reduce((s, p) => s + (p.feb || 0), 0),
            mar: filtered.reduce((s, p) => s + (p.mar || 0), 0),
            totalCapacity: filtered.reduce((s, p) => s + (p.totalCapacity || 0), 0),
            cummTillOct: filtered.reduce((s, p) => s + (p.cummTillOct || 0), 0),
            q1: filtered.reduce((s, p) => s + (p.q1 || 0), 0),
            q2: filtered.reduce((s, p) => s + (p.q2 || 0), 0),
            q3: filtered.reduce((s, p) => s + (p.q3 || 0), 0),
            q4: filtered.reduce((s, p) => s + (p.q4 || 0), 0),
        };

        return { byType, total };
    };

    const planData = aggregateByType(projects, 'Plan');
    const rephaseData = aggregateByType(projects, 'Rephase');
    const actualData = aggregateByType(projects, 'Actual/Fcst'); // Standardize on display name check or value check

    // Fallback for 'Actual' if 'Actual/Fcst' is not found
    if (actualData.total.totalCapacity === 0) {
        const actualInternal = aggregateByType(projects, 'Actual');
        actualData.byType = actualInternal.byType;
        actualData.total = actualInternal.total;
    }

    const renderRow = (label: string, data: any, bgClass: string = '') => (
        <tr className={bgClass}>
            <td className="px-2 py-1 text-[10px] font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">{label}</td>
            {monthColumns.map(m => (
                <td key={m} className="px-1 py-1 text-[10px] text-center text-gray-600 dark:text-gray-400">{formatNumber(data[m])}</td>
            ))}
            <td className="px-1 py-1 text-[10px] text-center font-bold text-gray-900 dark:text-white">{formatNumber(data.totalCapacity)}</td>
            <td className="px-1 py-1 text-[10px] text-center font-bold text-[#0B74B0] dark:text-blue-400">{formatNumber(data.cummTillOct)}</td>
            <td className="px-1 py-1 text-[10px] text-center text-gray-500">{formatNumber(data.q1)}</td>
            <td className="px-1 py-1 text-[10px] text-center text-gray-500">{formatNumber(data.q2)}</td>
            <td className="px-1 py-1 text-[10px] text-center text-gray-500">{formatNumber(data.q3)}</td>
            <td className="px-1 py-1 text-[10px] text-center text-gray-500">{formatNumber(data.q4)}</td>
        </tr>
    );

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
            <div className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-2">
                <h3 className="text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-widest">{title}</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full text-[10px]">
                    <thead className="bg-[#f8f9fa] dark:bg-gray-900">
                        <tr>
                            <th className="px-2 py-2 text-left text-[9px] font-bold text-gray-500 uppercase">Plan / Actual</th>
                            {monthLabels.map((m, idx) => (
                                <th key={idx} className="px-1 py-2 text-center text-[9px] font-bold text-gray-500 uppercase">{m}</th>
                            ))}
                            <th className="px-1 py-2 text-center text-[9px] font-bold text-gray-500 uppercase">Total Capacity</th>
                            <th className="px-1 py-2 text-center text-[9px] font-bold text-[#0B74B0] uppercase">Cumm till 30-Nov-25</th>
                            <th className="px-1 py-2 text-center text-[9px] font-bold text-gray-500 uppercase">Q1</th>
                            <th className="px-1 py-2 text-center text-[9px] font-bold text-gray-500 uppercase">Q2</th>
                            <th className="px-1 py-2 text-center text-[9px] font-bold text-gray-500 uppercase">Q3</th>
                            <th className="px-1 py-2 text-center text-[9px] font-bold text-gray-500 uppercase">Q4</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {renderRow('Plan', planData.total, 'bg-gray-50/50 dark:bg-gray-800/50 font-bold')}
                        {Object.entries(planData.byType).map(([type, data]) => renderRow(type, data))}
                        {renderRow('Rephase', rephaseData.total, 'bg-amber-50/30 dark:bg-amber-900/10 font-bold')}
                        {Object.entries(rephaseData.byType).map(([type, data]) => renderRow(type, data))}
                        {renderRow('Actual / Fcst', actualData.total, 'bg-green-50/30 dark:bg-green-900/10 font-bold')}
                        {Object.entries(actualData.byType).map(([type, data]) => renderRow(type, data))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
