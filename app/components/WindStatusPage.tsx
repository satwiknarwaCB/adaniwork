"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import * as XLSX from 'xlsx';

// Interfaces
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

interface GroupedProject {
    projectName: string;
    spv: string;
    category: string;
    section: string;
    capacity: number;
    plan: CommissioningProject | null;
    rephase: CommissioningProject | null;
    actual: CommissioningProject | null;
}

const ALL_MONTHS = [
    { key: 'apr', label: 'APR', year: '25', quarter: 'Q1' },
    { key: 'may', label: 'MAY', year: '25', quarter: 'Q1' },
    { key: 'jun', label: 'JUN', year: '25', quarter: 'Q1' },
    { key: 'jul', label: 'JUL', year: '25', quarter: 'Q2' },
    { key: 'aug', label: 'AUG', year: '25', quarter: 'Q2' },
    { key: 'sep', label: 'SEP', year: '25', quarter: 'Q2' },
    { key: 'oct', label: 'OCT', year: '25', quarter: 'Q3' },
    { key: 'nov', label: 'NOV', year: '25', quarter: 'Q3' },
    { key: 'dec', label: 'DEC', year: '25', quarter: 'Q3' },
    { key: 'jan', label: 'JAN', year: '26', quarter: 'Q4' },
    { key: 'feb', label: 'FEB', year: '26', quarter: 'Q4' },
    { key: 'mar', label: 'MAR', year: '26', quarter: 'Q4' },
];

const YEAR_OPTIONS = [
    { value: 'all', label: 'All (FY 25-26)' },
    { value: '2025', label: '2025 (Apr-Dec)' },
    { value: '2026', label: '2026 (Jan-Mar)' },
];

const QUARTER_OPTIONS = [
    { value: 'all', label: 'All Quarters' },
    { value: 'Q1', label: 'Q1 (Apr-Jun)' },
    { value: 'Q2', label: 'Q2 (Jul-Sep)' },
    { value: 'Q3', label: 'Q3 (Oct-Dec)' },
    { value: 'Q4', label: 'Q4 (Jan-Mar)' },
];

const WIND_SECTIONS = [
    { value: 'all', label: 'All Wind Projects' },
    { value: 'Khavda Wind', label: 'A. Khavda Wind' },
    { value: 'Mundra Wind', label: 'C. Mundra Wind' },
];

export default function WindStatusPage() {
    const fiscalYear = 'FY_25-26';
    const [selectedSection, setSelectedSection] = useState('all');
    const [viewMode, setViewMode] = useState<'quarterly' | 'monthly'>('quarterly');
    const [selectedYear, setSelectedYear] = useState('all');
    const [selectedQuarter, setSelectedQuarter] = useState('all');
    const [showExportModal, setShowExportModal] = useState(false);
    const [exportMonths, setExportMonths] = useState<string[]>(ALL_MONTHS.map(m => m.key));

    const { data: allProjects = [], isLoading } = useQuery<CommissioningProject[]>({
        queryKey: ['commissioning-projects', fiscalYear],
        queryFn: async () => {
            const response = await fetch(`/api/commissioning-projects?fiscalYear=${fiscalYear}`);
            if (!response.ok) throw new Error('Failed to fetch projects');
            return response.json();
        },
        staleTime: 0,
    });

    // Get available quarters based on year selection
    const availableQuarters = useMemo(() => {
        if (selectedYear === 'all') return QUARTER_OPTIONS;
        if (selectedYear === '2025') return QUARTER_OPTIONS.filter(q => ['all', 'Q1', 'Q2', 'Q3'].includes(q.value));
        if (selectedYear === '2026') return QUARTER_OPTIONS.filter(q => ['all', 'Q4'].includes(q.value));
        return QUARTER_OPTIONS;
    }, [selectedYear]);

    // Reset quarter when year changes if current quarter is invalid
    useMemo(() => {
        if (selectedYear === '2026' && !['all', 'Q4'].includes(selectedQuarter)) {
            setSelectedQuarter('all');
        }
        if (selectedYear === '2025' && selectedQuarter === 'Q4') {
            setSelectedQuarter('all');
        }
    }, [selectedYear, selectedQuarter]);

    // Get visible months based on year and quarter selection
    const visibleMonths = useMemo(() => {
        let months = ALL_MONTHS;

        if (selectedYear === '2025') {
            months = months.filter(m => m.year === '25');
        } else if (selectedYear === '2026') {
            months = months.filter(m => m.year === '26');
        }

        if (selectedQuarter !== 'all') {
            months = months.filter(m => m.quarter === selectedQuarter);
        }

        return months;
    }, [selectedYear, selectedQuarter]);

    // Filter only Wind projects
    const windProjects = useMemo(() => {
        return allProjects.filter(p =>
            p.includedInTotal &&
            p.category?.toLowerCase().includes('wind')
        );
    }, [allProjects]);

    // Group projects by name with Plan, Rephase, Actual
    const groupedProjects = useMemo(() => {
        let filtered = windProjects;

        if (selectedSection !== 'all') {
            filtered = filtered.filter(p => p.category.includes(selectedSection));
        }

        const projectMap = new Map<string, GroupedProject>();

        filtered.forEach(p => {
            const key = p.projectName;
            if (!projectMap.has(key)) {
                projectMap.set(key, {
                    projectName: p.projectName,
                    spv: p.spv,
                    category: p.category,
                    section: p.section,
                    capacity: p.capacity,
                    plan: null,
                    rephase: null,
                    actual: null,
                });
            }

            const group = projectMap.get(key)!;
            if (p.planActual === 'Plan') {
                group.plan = p;
                group.capacity = p.capacity;
            } else if (p.planActual === 'Rephase') {
                group.rephase = p;
            } else if (p.planActual === 'Actual') {
                group.actual = p;
            }
        });

        return Array.from(projectMap.values()).sort((a, b) => a.projectName.localeCompare(b.projectName));
    }, [windProjects, selectedSection]);

    // Calculate row data for summary table
    const calcRowData = useCallback((projects: CommissioningProject[], months: typeof ALL_MONTHS) => {
        return {
            months: months.map(m => projects.reduce((s, p) => s + ((p as any)[m.key] || 0), 0)),
            total: projects.reduce((s, p) => s + (p.totalCapacity || 0), 0),
            cumm: projects.reduce((s, p) => s + (p.cummTillOct || 0), 0),
            q1: projects.reduce((s, p) => s + (p.q1 || 0), 0),
            q2: projects.reduce((s, p) => s + (p.q2 || 0), 0),
            q3: projects.reduce((s, p) => s + (p.q3 || 0), 0),
            q4: projects.reduce((s, p) => s + (p.q4 || 0), 0),
        };
    }, []);

    // Summary data for the table
    const summaryData = useMemo(() => {
        const planProjects = windProjects.filter(p => p.planActual === 'Plan');
        const rephaseProjects = windProjects.filter(p => p.planActual === 'Rephase');
        const actualProjects = windProjects.filter(p => p.planActual === 'Actual');

        const filterByType = (projects: CommissioningProject[], type: string) =>
            projects.filter(p => p.projectType?.toLowerCase().includes(type));

        return {
            plan: {
                total: calcRowData(planProjects, visibleMonths),
                ppa: calcRowData(filterByType(planProjects, 'ppa'), visibleMonths),
                merchant: calcRowData(filterByType(planProjects, 'merchant'), visibleMonths),
                group: calcRowData(filterByType(planProjects, 'group'), visibleMonths),
            },
            rephase: {
                total: calcRowData(rephaseProjects, visibleMonths),
                ppa: calcRowData(filterByType(rephaseProjects, 'ppa'), visibleMonths),
                merchant: calcRowData(filterByType(rephaseProjects, 'merchant'), visibleMonths),
                group: calcRowData(filterByType(rephaseProjects, 'group'), visibleMonths),
            },
            actual: {
                total: calcRowData(actualProjects, visibleMonths),
                ppa: calcRowData(filterByType(actualProjects, 'ppa'), visibleMonths),
                merchant: calcRowData(filterByType(actualProjects, 'merchant'), visibleMonths),
                group: calcRowData(filterByType(actualProjects, 'group'), visibleMonths),
            },
        };
    }, [windProjects, visibleMonths, calcRowData]);

    // KPIs
    const kpis = useMemo(() => {
        const planProjects = windProjects.filter(p => p.planActual === 'Plan');
        const actualProjects = windProjects.filter(p => p.planActual === 'Actual');
        const rephaseProjects = windProjects.filter(p => p.planActual === 'Rephase');

        const totalPlan = planProjects.reduce((s, p) => s + (p.capacity || 0), 0);
        const totalActual = actualProjects.reduce((s, p) => s + (p.totalCapacity || 0), 0);
        const totalRephase = rephaseProjects.reduce((s, p) => s + (p.totalCapacity || 0), 0);
        const projectCount = new Set(planProjects.map(p => p.projectName)).size;
        const achievement = totalPlan > 0 ? (totalActual / totalPlan) * 100 : 0;

        return { totalPlan, totalActual, totalRephase, projectCount, achievement };
    }, [windProjects]);

    // Section-wise capacity breakdown
    const sectionData = useMemo(() => {
        const planProjects = windProjects.filter(p => p.planActual === 'Plan');
        return WIND_SECTIONS.slice(1).map(section => {
            const sectionProjects = planProjects.filter(p => p.category.includes(section.value));
            return {
                name: section.label.replace('A. ', '').replace('C. ', ''),
                value: sectionProjects.reduce((s, p) => s + (p.capacity || 0), 0),
                color: section.value.includes('Khavda') ? '#06B6D4' : '#22D3EE'
            };
        }).filter(d => d.value > 0);
    }, [windProjects]);

    // Chart data
    const quarterlyData = useMemo(() => {
        const planProjects = windProjects.filter(p => p.planActual === 'Plan');
        const actualProjects = windProjects.filter(p => p.planActual === 'Actual');
        const rephaseProjects = windProjects.filter(p => p.planActual === 'Rephase');

        return ['Q1', 'Q2', 'Q3', 'Q4'].map((q, idx) => {
            const key = `q${idx + 1}` as 'q1' | 'q2' | 'q3' | 'q4';
            return {
                name: q,
                Plan: planProjects.reduce((s, p) => s + (p[key] || 0), 0),
                Rephase: rephaseProjects.reduce((s, p) => s + (p[key] || 0), 0),
                'Actual/Fcst': actualProjects.reduce((s, p) => s + (p[key] || 0), 0),
            };
        });
    }, [windProjects]);

    const monthlyData = useMemo(() => {
        const planProjects = windProjects.filter(p => p.planActual === 'Plan');
        const actualProjects = windProjects.filter(p => p.planActual === 'Actual');
        const rephaseProjects = windProjects.filter(p => p.planActual === 'Rephase');

        return ALL_MONTHS.map(m => ({
            name: m.label,
            Plan: planProjects.reduce((s, p) => s + ((p as any)[m.key] || 0), 0),
            Rephase: rephaseProjects.reduce((s, p) => s + ((p as any)[m.key] || 0), 0),
            'Actual/Fcst': actualProjects.reduce((s, p) => s + ((p as any)[m.key] || 0), 0),
        }));
    }, [windProjects]);

    const formatNumber = (value: number | null | undefined): string => {
        if (value === null || value === undefined || value === 0) return '0';
        return value.toLocaleString(undefined, { maximumFractionDigits: 1 });
    };

    const handleExport = () => {
        const selectedMonthsData = ALL_MONTHS.filter(m => exportMonths.includes(m.key));
        const headers = ['Plan/Actual', ...selectedMonthsData.map(m => `${m.label}-${m.year}`), 'Total', 'Q1', 'Q2', 'Q3', 'Q4'];

        const rows: (string | number)[][] = [];

        const addRow = (label: string, projects: CommissioningProject[]) => {
            const monthValues = selectedMonthsData.map(m =>
                projects.reduce((s, p) => s + ((p as any)[m.key] || 0), 0)
            );
            const total = projects.reduce((s, p) => s + (p.totalCapacity || 0), 0);
            rows.push([
                label,
                ...monthValues,
                total,
                projects.reduce((s, p) => s + (p.q1 || 0), 0),
                projects.reduce((s, p) => s + (p.q2 || 0), 0),
                projects.reduce((s, p) => s + (p.q3 || 0), 0),
                projects.reduce((s, p) => s + (p.q4 || 0), 0),
            ]);
        };

        const planProjects = windProjects.filter(p => p.planActual === 'Plan');
        const rephaseProjects = windProjects.filter(p => p.planActual === 'Rephase');
        const actualProjects = windProjects.filter(p => p.planActual === 'Actual');

        addRow('Plan', planProjects);
        addRow('Plan - PPA', planProjects.filter(p => p.projectType?.toLowerCase().includes('ppa')));
        addRow('Plan - Merchant', planProjects.filter(p => p.projectType?.toLowerCase().includes('merchant')));
        addRow('Plan - Group', planProjects.filter(p => p.projectType?.toLowerCase().includes('group')));
        addRow('Rephase', rephaseProjects);
        addRow('Rephase - PPA', rephaseProjects.filter(p => p.projectType?.toLowerCase().includes('ppa')));
        addRow('Rephase - Merchant', rephaseProjects.filter(p => p.projectType?.toLowerCase().includes('merchant')));
        addRow('Rephase - Group', rephaseProjects.filter(p => p.projectType?.toLowerCase().includes('group')));
        addRow('Actual/Fcst', actualProjects);
        addRow('Actual/Fcst - PPA', actualProjects.filter(p => p.projectType?.toLowerCase().includes('ppa')));
        addRow('Actual/Fcst - Merchant', actualProjects.filter(p => p.projectType?.toLowerCase().includes('merchant')));
        addRow('Actual/Fcst - Group', actualProjects.filter(p => p.projectType?.toLowerCase().includes('group')));

        // Create Excel workbook
        const wsData = [headers, ...rows];
        const ws = XLSX.utils.aoa_to_sheet(wsData);

        // Set column widths
        ws['!cols'] = [{ wch: 18 }, ...selectedMonthsData.map(() => ({ wch: 10 })), { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Wind Summary');

        // Download
        XLSX.writeFile(wb, `AGEL_Wind_Summary_${new Date().toISOString().split('T')[0]}.xlsx`);
        setShowExportModal(false);
    };

    const toggleExportMonth = (key: string) => {
        setExportMonths(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
    };

    const selectAllMonths = () => setExportMonths(ALL_MONTHS.map(m => m.key));
    const clearAllMonths = () => setExportMonths([]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-16 h-16 border-4 border-cyan-200 dark:border-cyan-800 border-t-cyan-500 rounded-full animate-spin"></div>
                <span className="ml-4 text-cyan-600 dark:text-cyan-400 font-medium">Loading Wind Portfolio...</span>
            </div>
        );
    }

    // Summary table row component with theme support
    const SummaryRow = ({ label, data, isHeader, colorClass }: {
        label: string;
        data: ReturnType<typeof calcRowData>;
        isHeader?: boolean;
        colorClass: string;
    }) => (
        <tr className={`${isHeader ? colorClass + ' font-semibold' : 'text-gray-600 dark:text-gray-400'}`}>
            <td className={`px-4 py-2.5 whitespace-nowrap bg-white dark:bg-gray-900 ${isHeader ? 'font-semibold' : 'pl-8'}`}>
                {label}
            </td>
            {data.months.map((v, i) => (
                <td key={i} className="px-4 py-2.5 text-right tabular-nums whitespace-nowrap">{formatNumber(v)}</td>
            ))}
            <td className="px-4 py-2.5 text-right tabular-nums whitespace-nowrap text-orange-600 dark:text-orange-400 font-bold bg-orange-50 dark:bg-gray-800">
                {formatNumber(data.total)}
            </td>
            <td className="px-4 py-2.5 text-right tabular-nums whitespace-nowrap text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-gray-800">
                {formatNumber(data.cumm)}
            </td>
            <td className="px-4 py-2.5 text-right tabular-nums whitespace-nowrap">{formatNumber(data.q1)}</td>
            <td className="px-4 py-2.5 text-right tabular-nums whitespace-nowrap">{formatNumber(data.q2)}</td>
            <td className="px-4 py-2.5 text-right tabular-nums whitespace-nowrap">{formatNumber(data.q3)}</td>
            <td className="px-4 py-2.5 text-right tabular-nums whitespace-nowrap">{formatNumber(data.q4)}</td>
        </tr>
    );

    return (
        <div className="space-y-6 min-h-screen">
            {/* Hero Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-500 via-teal-500 to-emerald-400 p-6 shadow-xl"
            >
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -right-20 -top-20 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
                </div>

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Wind Portfolio Dashboard</h1>
                            <p className="text-white/80 text-sm">AGEL FY 2025-26 Wind Commissioning Status</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
                        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                            <p className="text-white/70 text-xs font-semibold uppercase tracking-wider">Plan</p>
                            <p className="text-2xl font-black text-white mt-1">{formatNumber(kpis.totalPlan)} <span className="text-sm font-medium">MW</span></p>
                        </div>
                        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                            <p className="text-white/70 text-xs font-semibold uppercase tracking-wider">Rephase</p>
                            <p className="text-2xl font-black text-white mt-1">{formatNumber(kpis.totalRephase)} <span className="text-sm font-medium">MW</span></p>
                        </div>
                        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                            <p className="text-white/70 text-xs font-semibold uppercase tracking-wider">Actual/Fcst</p>
                            <p className="text-2xl font-black text-white mt-1">{formatNumber(kpis.totalActual)} <span className="text-sm font-medium">MW</span></p>
                        </div>
                        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                            <p className="text-white/70 text-xs font-semibold uppercase tracking-wider">Achievement</p>
                            <p className="text-2xl font-black text-white mt-1">{kpis.achievement.toFixed(1)}<span className="text-sm font-medium">%</span></p>
                        </div>
                        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                            <p className="text-white/70 text-xs font-semibold uppercase tracking-wider">Projects</p>
                            <p className="text-2xl font-black text-white mt-1">{kpis.projectCount}</p>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Pie Chart */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-cyan-100 dark:border-gray-700 p-6"
                >
                    <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <span className="w-1 h-4 bg-cyan-500 rounded-full"></span>
                        Capacity by Section
                    </h3>
                    <div className="h-[200px] relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={sectionData} innerRadius={50} outerRadius={80} dataKey="value" stroke="none">
                                    {sectionData.map((entry, index) => (
                                        <Cell key={index} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: any) => `${formatNumber(value)} MW`} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="text-center">
                                <p className="text-2xl font-black text-gray-800 dark:text-white">{formatNumber(kpis.totalPlan)}</p>
                                <p className="text-[10px] font-bold text-gray-400 uppercase">Total MW</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-wrap justify-center gap-3 mt-4">
                        {sectionData.map(d => (
                            <div key={d.name} className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }}></div>
                                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{d.name}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Bar Chart */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-cyan-100 dark:border-gray-700 p-6"
                >
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                        <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-2">
                            <span className="w-1 h-4 bg-cyan-500 rounded-full"></span>
                            {viewMode === 'quarterly' ? 'Quarterly' : 'Monthly'} Performance
                        </h3>
                        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                            <button
                                onClick={() => setViewMode('quarterly')}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === 'quarterly' ? 'bg-cyan-500 text-white shadow' : 'text-gray-600 dark:text-gray-400'}`}
                            >
                                Quarterly
                            </button>
                            <button
                                onClick={() => setViewMode('monthly')}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === 'monthly' ? 'bg-cyan-500 text-white shadow' : 'text-gray-600 dark:text-gray-400'}`}
                            >
                                Monthly
                            </button>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={250}>
                        <AreaChart data={viewMode === 'quarterly' ? quarterlyData : monthlyData}>
                            <defs>
                                <linearGradient id="colorPlanWind" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorRephaseWind" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#F97316" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorActualWind" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                            <Tooltip
                                formatter={(value: any) => `${formatNumber(value)} MW`}
                                contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                            />
                            <Legend />
                            <Area type="monotone" dataKey="Plan" stroke="#3B82F6" strokeWidth={2} fill="url(#colorPlanWind)" dot={{ r: 4, fill: '#3B82F6' }} />
                            <Area type="monotone" dataKey="Rephase" stroke="#F97316" strokeWidth={2} fill="url(#colorRephaseWind)" dot={{ r: 4, fill: '#F97316' }} />
                            <Area type="monotone" dataKey="Actual/Fcst" stroke="#10B981" strokeWidth={2} fill="url(#colorActualWind)" dot={{ r: 4, fill: '#10B981' }} />
                        </AreaChart>
                    </ResponsiveContainer>
                </motion.div>
            </div>

            {/* AGEL Overall Wind Summary Table */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700"
            >
                {/* Header with controls */}
                <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            <span className="text-cyan-500">2.</span>
                            AGEL OVERALL WIND FY 2025-26
                        </h3>
                        <div className="flex items-center gap-3 flex-wrap">
                            {/* Year Filter */}
                            <div className="flex items-center gap-2">
                                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Year:</label>
                                <select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(e.target.value)}
                                    className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-cyan-500/20"
                                >
                                    {YEAR_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                            {/* Quarter Filter */}
                            <div className="flex items-center gap-2">
                                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Quarter:</label>
                                <select
                                    value={selectedQuarter}
                                    onChange={(e) => setSelectedQuarter(e.target.value)}
                                    className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-cyan-500/20"
                                >
                                    {availableQuarters.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                            {/* Export Button */}
                            <button
                                onClick={() => setShowExportModal(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Export
                            </button>
                        </div>
                    </div>
                </div>

                {/* Table with scrollable months section */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                            <tr>
                                <th className="px-4 py-3 text-left font-semibold uppercase tracking-wider min-w-[120px] bg-gray-50 dark:bg-gray-800">
                                    Plan / Actual
                                </th>
                                {visibleMonths.map(m => (
                                    <th key={m.key} className="px-4 py-3 text-right font-semibold uppercase tracking-wider min-w-[80px]">
                                        {m.label}-{m.year}
                                    </th>
                                ))}
                                <th className="px-4 py-3 text-right font-semibold uppercase tracking-wider text-orange-600 dark:text-orange-400 min-w-[90px] bg-orange-50 dark:bg-gray-800">
                                    TOTAL
                                </th>
                                <th className="px-4 py-3 text-right font-semibold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 min-w-[90px] bg-cyan-50 dark:bg-gray-800">
                                    CUMM
                                </th>
                                <th className="px-4 py-3 text-right font-semibold uppercase tracking-wider min-w-[70px]">Q1</th>
                                <th className="px-4 py-3 text-right font-semibold uppercase tracking-wider min-w-[70px]">Q2</th>
                                <th className="px-4 py-3 text-right font-semibold uppercase tracking-wider min-w-[70px]">Q3</th>
                                <th className="px-4 py-3 text-right font-semibold uppercase tracking-wider min-w-[70px]">Q4</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {/* Plan Section */}
                            <SummaryRow label="Plan" data={summaryData.plan.total} isHeader colorClass="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300" />
                            <SummaryRow label="PPA" data={summaryData.plan.ppa} colorClass="" />
                            <SummaryRow label="Merchant" data={summaryData.plan.merchant} colorClass="" />
                            <SummaryRow label="Group" data={summaryData.plan.group} colorClass="" />

                            {/* Rephase Section */}
                            <SummaryRow label="Rephase" data={summaryData.rephase.total} isHeader colorClass="bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300" />
                            <SummaryRow label="PPA" data={summaryData.rephase.ppa} colorClass="" />
                            <SummaryRow label="Merchant" data={summaryData.rephase.merchant} colorClass="" />
                            <SummaryRow label="Group" data={summaryData.rephase.group} colorClass="" />

                            {/* Actual Section */}
                            <SummaryRow label="Actual / Fcst" data={summaryData.actual.total} isHeader colorClass="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300" />
                            <SummaryRow label="PPA" data={summaryData.actual.ppa} colorClass="" />
                            <SummaryRow label="Merchant" data={summaryData.actual.merchant} colorClass="" />
                            <SummaryRow label="Group" data={summaryData.actual.group} colorClass="" />
                        </tbody>
                    </table>
                </div>
            </motion.div>

            {/* Filters and Projects Table */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-cyan-100 dark:border-gray-700 p-4"
            >
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Section:</span>
                        <select
                            value={selectedSection}
                            onChange={(e) => setSelectedSection(e.target.value)}
                            className="px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                            {WIND_SECTIONS.map(s => (
                                <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-4 ml-auto">
                        <div className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded bg-blue-500"></span>
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Plan</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded bg-orange-500"></span>
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Rephase</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded bg-green-500"></span>
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Actual/Fcst</span>
                        </div>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        Showing <span className="font-bold text-cyan-600">{groupedProjects.length}</span> projects
                    </div>
                </div>
            </motion.div>

            {/* Projects Table */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-cyan-100 dark:border-gray-700 overflow-hidden"
            >
                <div className="p-4 border-b border-cyan-100 dark:border-gray-700 bg-gradient-to-r from-cyan-50 to-teal-50 dark:from-gray-800 dark:to-gray-800">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <svg className="w-5 h-5 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                        Wind Projects - Plan / Rephase / Actual Comparison
                    </h3>
                </div>
                <div className="overflow-x-auto max-h-[500px]">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0">
                            <tr>
                                <th className="px-3 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-12">S.No</th>
                                <th className="px-3 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[180px]">Project Name</th>
                                <th className="px-3 py-3 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Capacity</th>
                                <th className="px-3 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-24">Type</th>
                                {ALL_MONTHS.map(m => (
                                    <th key={m.key} className="px-2 py-3 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-16">{m.label}</th>
                                ))}
                                <th className="px-3 py-3 text-right text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {groupedProjects.slice(0, 20).map((group, idx) => (
                                <React.Fragment key={group.projectName}>
                                    {/* Plan Row */}
                                    <tr className="hover:bg-blue-50/30 dark:hover:bg-gray-700/30">
                                        <td className="px-3 py-2 text-gray-600 dark:text-gray-400 font-bold" rowSpan={3}>{idx + 1}</td>
                                        <td className="px-3 py-2 font-semibold text-gray-800 dark:text-white" rowSpan={3}>{group.projectName}</td>
                                        <td className="px-3 py-2 text-right font-bold text-gray-800 dark:text-white" rowSpan={3}>{formatNumber(group.capacity)}</td>
                                        <td className="px-3 py-2 text-center">
                                            <span className="inline-flex px-2 py-0.5 text-xs font-bold rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Plan</span>
                                        </td>
                                        {ALL_MONTHS.map(m => (
                                            <td key={m.key} className="px-2 py-2 text-right text-gray-600 dark:text-gray-400 tabular-nums text-xs">
                                                {formatNumber(group.plan ? (group.plan as any)[m.key] : 0)}
                                            </td>
                                        ))}
                                        <td className="px-3 py-2 text-right font-bold text-blue-600 dark:text-blue-400">{formatNumber(group.plan?.totalCapacity)}</td>
                                    </tr>
                                    {/* Rephase Row */}
                                    <tr className="hover:bg-orange-50/30 dark:hover:bg-gray-700/30">
                                        <td className="px-3 py-2 text-center">
                                            <span className="inline-flex px-2 py-0.5 text-xs font-bold rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">Rephase</span>
                                        </td>
                                        {ALL_MONTHS.map(m => (
                                            <td key={m.key} className="px-2 py-2 text-right text-gray-600 dark:text-gray-400 tabular-nums text-xs">
                                                {formatNumber(group.rephase ? (group.rephase as any)[m.key] : 0)}
                                            </td>
                                        ))}
                                        <td className="px-3 py-2 text-right font-bold text-orange-600 dark:text-orange-400">{formatNumber(group.rephase?.totalCapacity)}</td>
                                    </tr>
                                    {/* Actual Row */}
                                    <tr className="hover:bg-green-50/30 dark:hover:bg-gray-700/30 border-b-2 border-gray-200 dark:border-gray-600">
                                        <td className="px-3 py-2 text-center">
                                            <span className="inline-flex px-2 py-0.5 text-xs font-bold rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Actual/Fcst</span>
                                        </td>
                                        {ALL_MONTHS.map(m => (
                                            <td key={m.key} className="px-2 py-2 text-right text-gray-600 dark:text-gray-400 tabular-nums text-xs">
                                                {formatNumber(group.actual ? (group.actual as any)[m.key] : 0)}
                                            </td>
                                        ))}
                                        <td className="px-3 py-2 text-right font-bold text-green-600 dark:text-green-400">{formatNumber(group.actual?.totalCapacity)}</td>
                                    </tr>
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </motion.div>

            {/* Export Modal */}
            <AnimatePresence>
                {showExportModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={() => setShowExportModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-lg"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                                <h3 className="text-xl font-bold text-gray-800 dark:text-white">Export Wind Data</h3>
                                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Select which months to include in the export</p>
                            </div>

                            <div className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Select Months</span>
                                    <div className="flex gap-2">
                                        <button onClick={selectAllMonths} className="text-xs text-cyan-500 hover:text-cyan-600">Select All</button>
                                        <span className="text-gray-300 dark:text-gray-600">|</span>
                                        <button onClick={clearAllMonths} className="text-xs text-gray-500 hover:text-gray-600">Clear All</button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-4 gap-2">
                                    {ALL_MONTHS.map(m => (
                                        <button
                                            key={m.key}
                                            onClick={() => toggleExportMonth(m.key)}
                                            className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${exportMonths.includes(m.key)
                                                ? 'bg-cyan-500 text-white'
                                                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                                                }`}
                                        >
                                            {m.label}-{m.year}
                                        </button>
                                    ))}
                                </div>

                                <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <p className="text-xs text-gray-600 dark:text-gray-400">
                                        <span className="text-cyan-500 font-medium">{exportMonths.length}</span> months selected for export
                                    </p>
                                </div>
                            </div>

                            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                                <button
                                    onClick={() => setShowExportModal(false)}
                                    className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleExport}
                                    disabled={exportMonths.length === 0}
                                    className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    Export CSV
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
