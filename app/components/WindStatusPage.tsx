"use client";

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import * as XLSX from 'xlsx';
import { useAuth } from '@/lib/hooks/useAuth';
import { SummaryTable } from './CommissioningSummaryTable';

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

// Inline Editable Cell Component
interface EditableCellProps {
    project: CommissioningProject;
    field: string;
    value: number | null;
    isEditing: boolean;
    onEdit: () => void;
    onSave: (value: number | null) => void;
    onCancel: () => void;
    formatNumber: (value: number | null) => string;
    disabled: boolean;
}

function EditableCell({ value, isEditing, onEdit, onSave, onCancel, formatNumber, disabled }: EditableCellProps) {
    const [tempValue, setTempValue] = useState(value?.toString() || '');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing) {
            setTempValue(value === null || value === undefined ? '' : value.toString());
            setTimeout(() => inputRef.current?.focus(), 10);
        }
    }, [isEditing, value]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            const num = tempValue === '' ? null : parseFloat(tempValue);
            onSave(num);
        } else if (e.key === 'Escape') {
            onCancel();
        }
    };

    const handleBlur = () => {
        const num = tempValue === '' ? null : parseFloat(tempValue);
        if (num !== value) {
            onSave(num);
        } else {
            onCancel();
        }
    };

    if (isEditing) {
        return (
            <td className="px-1 py-1 border border-blue-500 shadow-inner bg-white">
                <input
                    ref={inputRef}
                    type="number"
                    step="0.1"
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={handleBlur}
                    className="w-full h-full text-center text-xs outline-none font-bold"
                />
            </td>
        );
    }

    return (
        <td
            onClick={onEdit}
            className={`px-2 py-2 text-right tabular-nums border-r border-gray-100 dark:border-gray-800 transition-colors cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 ${disabled ? 'opacity-30' : 'text-gray-700 dark:text-gray-300 font-medium'}`}
        >
            {formatNumber(value)}
        </td>
    );
}

interface GroupedProject {
    sno: number;
    projectName: string;
    spv: string;
    projectType: string;
    plotLocation: string;
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
    { value: 'A', label: 'A. Khavda Wind (Net)' },
    { value: 'B', label: 'B. Khavda Wind Internal' },
    { value: 'C', label: 'C. Mundra Wind' },
    { value: 'D', label: 'D. Mundra Wind Internal' },
];

export default function WindStatusPage() {
    const queryClient = useQueryClient();
    const { isAdmin } = useAuth();
    const [fiscalYear] = useState('FY_25-26');
    const [editingCell, setEditingCell] = useState<{ projectId: number, field: string } | null>(null);
    const [selectedSection, setSelectedSection] = useState('all');
    const [viewMode, setViewMode] = useState<'quarterly' | 'monthly'>('quarterly');
    const [selectedYear, setSelectedYear] = useState('all');
    const [selectedQuarter, setSelectedQuarter] = useState('all');
    const [projectTypeFilter, setProjectTypeFilter] = useState('all');
    const [capacityPointFilter, setCapacityPointFilter] = useState('all');
    const [showExportModal, setShowExportModal] = useState(false);
    const [exportMonths, setExportMonths] = useState<string[]>(['apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec', 'jan', 'feb', 'mar']);

    // Upload modal states
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState<any>(null);

    // Fetch Wind projects
    const { data: rawProjects = [], isLoading: projectsLoading } = useQuery<CommissioningProject[]>({
        queryKey: ['wind-projects', fiscalYear],
        queryFn: async () => {
            const response = await fetch(`/api/commissioning-projects?fiscalYear=${fiscalYear}&category=wind`);
            if (!response.ok) throw new Error('Failed to fetch projects');
            return response.json();
        },
        staleTime: 0,
        refetchOnWindowFocus: true,
    });

    const isLoading = projectsLoading;

    // Deduplicate and filter for Wind only
    const windProjects = useMemo(() => {
        const seen = new Set();
        return rawProjects.filter((p: any) => {
            // Robust technology check: must be wind-related and NOT solar-related
            const cat = (p.category || '').toLowerCase();
            const name = (p.projectName || '').toLowerCase();
            const isWind = (cat.includes('wind') || name.includes('wind')) && !cat.includes('solar') && !name.includes('solar');

            if (!isWind) return false;

            const key = `${p.sno}-${p.projectName}-${p.spv}-${p.category}-${p.section}-${p.planActual}-${p.capacity}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }, [rawProjects]);

    // Save single project cell mutation
    const saveCellMutation = useMutation({
        mutationFn: async ({ projectId, field, value }: { projectId: number; field: string; value: number | null }) => {
            const response = await fetch(`/api/commissioning-projects/${projectId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [field]: value }),
            });
            if (!response.ok) throw new Error('Failed to save changes');
            return response.json();
        },
        onSuccess: () => {
            // Invalidate all related queries so data refreshes everywhere
            queryClient.invalidateQueries({ queryKey: ['wind-projects', fiscalYear] });
            queryClient.invalidateQueries({ queryKey: ['commissioning-projects'] });
            queryClient.invalidateQueries({ queryKey: ['solar-projects'] });
        },
        onError: (error) => {
            alert('Failed to save: ' + error.message);
        }
    });

    // Handle inline cell save with confirmation
    const handleCellSave = (project: CommissioningProject, field: string, value: number | null) => {
        if (!isAdmin) {
            alert('You do not have permission to modify project data. Please login as an Admin.');
            setEditingCell(null);
            return;
        }

        // Show confirmation dialog
        const confirmed = window.confirm(
            `Are you sure you want to update ${field.toUpperCase()} for "${project.projectName}" to ${value ?? 0}?`
        );

        if (!confirmed) {
            setEditingCell(null);
            return;
        }

        saveCellMutation.mutate({ projectId: project.id!, field, value });
    };

    // Get available quarters based on year selection
    const availableQuarters = useMemo(() => {
        if (selectedYear === 'all') return QUARTER_OPTIONS;
        if (selectedYear === '2025') return QUARTER_OPTIONS.filter(q => ['all', 'Q1', 'Q2', 'Q3'].includes(q.value));
        if (selectedYear === '2026') return QUARTER_OPTIONS.filter(q => ['all', 'Q4'].includes(q.value));
        return QUARTER_OPTIONS;
    }, [selectedYear]);

    // Reset quarter when year changes if current quarter is invalid
    useEffect(() => {
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

    // Filters projects for high-level metrics (Top KPIs, Summary Table, Charts)
    // Should react to Section updates but ignores detailed project-level filters
    const overallFilteredProjects = useMemo(() => {
        return windProjects.filter((p: CommissioningProject) => {
            if (selectedSection !== 'all' && p.section !== selectedSection) return false;
            return true;
        });
    }, [windProjects, selectedSection]);

    // Filters for the detailed projects table sheet only
    const detailedFilteredProjects = useMemo(() => {
        return windProjects.filter((p: CommissioningProject) => {
            // Section Filter
            if (selectedSection !== 'all' && p.section !== selectedSection) return false;

            // Project Type Filter
            if (projectTypeFilter !== 'all' && p.projectType !== projectTypeFilter) return false;

            // Capacity Point Filter
            if (capacityPointFilter !== 'all' && p.planActual !== capacityPointFilter) return false;

            return true;
        });
    }, [windProjects, selectedSection, projectTypeFilter, capacityPointFilter]);

    // Group projects for detailed table
    const groupedProjects = useMemo(() => {
        const groups: Record<string, { plan?: CommissioningProject; rephase?: CommissioningProject; actual?: CommissioningProject }> = {};

        detailedFilteredProjects.forEach((p: CommissioningProject) => {
            const key = `${p.sno}|${p.projectName}|${p.spv}|${p.section}`;
            if (!groups[key]) groups[key] = {};

            if (p.planActual === 'Plan') groups[key].plan = p;
            if (p.planActual === 'Rephase') groups[key].rephase = p;
            if (p.planActual === 'Actual') groups[key].actual = p;
        });

        return Object.entries(groups).map(([key, group]) => {
            const [snoStr, projectName, spv, section] = key.split('|');
            const sno = parseInt(snoStr, 10);
            const refProject = group.plan || group.rephase || group.actual;
            return {
                sno: sno,
                projectName: projectName,
                spv: spv,
                projectType: refProject?.projectType || '',
                plotLocation: refProject?.plotLocation || '',
                category: refProject?.category || '',
                section: section,
                capacity: refProject?.capacity || 0,
                plan: group.plan || null,
                rephase: group.rephase || null,
                actual: group.actual || null,
            };
        }).sort((a, b) => a.projectName.localeCompare(b.projectName));
    }, [detailedFilteredProjects]);

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

    // Summary data for the table - Only include projects marked for totals
    const summaryData = useMemo(() => {
        const included = overallFilteredProjects.filter((p: CommissioningProject) => p.includedInTotal);
        const planProjects = included.filter((p: CommissioningProject) => p.planActual === 'Plan');
        const rephaseProjects = included.filter((p: CommissioningProject) => p.planActual === 'Rephase');
        const actualProjects = included.filter((p: CommissioningProject) => p.planActual === 'Actual');

        const filterByType = (projects: CommissioningProject[], type: string) =>
            projects.filter((p: CommissioningProject) => p.projectType?.toLowerCase().includes(type.toLowerCase()));

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
            }
        };
    }, [overallFilteredProjects, visibleMonths, calcRowData]);

    // KPIs - Only include projects marked for total inclusion for high-level metrics
    const kpis = useMemo(() => {
        const includedProjects = overallFilteredProjects.filter((p: CommissioningProject) => p.includedInTotal);
        const planProjects = includedProjects.filter((p: CommissioningProject) => p.planActual === 'Plan');
        const actualProjects = includedProjects.filter((p: CommissioningProject) => p.planActual === 'Actual');
        const rephaseProjects = includedProjects.filter((p: CommissioningProject) => p.planActual === 'Rephase');

        const totalPlan = planProjects.reduce((s: number, p: CommissioningProject) => s + (p.capacity || 0), 0);
        const totalActual = actualProjects.reduce((s: number, p: CommissioningProject) => s + (p.totalCapacity || 0), 0);
        const totalRephase = rephaseProjects.reduce((s: number, p: CommissioningProject) => s + (p.totalCapacity || 0), 0);
        // Count unique projects by name only (ignore planActual type)
        const projectCount = new Set(includedProjects.map((p: CommissioningProject) => `${p.projectName}|${p.spv}`)).size;
        const achievement = totalPlan > 0 ? (totalActual / totalPlan) * 100 : 0;

        return { totalPlan, totalActual, totalRephase, projectCount, achievement };
    }, [overallFilteredProjects]);

    // Section-wise capacity breakdown
    const sectionData = useMemo(() => {
        const planProjects = overallFilteredProjects.filter((p: CommissioningProject) => p.planActual === 'Plan' && p.includedInTotal);
        return WIND_SECTIONS.slice(1).map(section => {
            // Match by section field (A, B, C, D)
            const sectionProjects = planProjects.filter((p: CommissioningProject) => p.section === section.value);
            return {
                name: section.label.replace('A. ', '').replace('B. ', '').replace('C. ', '').replace('D. ', ''),
                value: sectionProjects.reduce((s: number, p: CommissioningProject) => s + (p.capacity || 0), 0),
                color: section.value === 'A' || section.value === 'B' ? '#06B6D4' : '#22D3EE'
            };
        }).filter(d => d.value > 0);
    }, [overallFilteredProjects]);

    // Chart data
    const quarterlyData = useMemo(() => {
        const planProjects = overallFilteredProjects.filter((p: CommissioningProject) => p.planActual === 'Plan');
        const actualProjects = overallFilteredProjects.filter((p: CommissioningProject) => p.planActual === 'Actual');
        const rephaseProjects = overallFilteredProjects.filter((p: CommissioningProject) => p.planActual === 'Rephase');

        return ['Q1', 'Q2', 'Q3', 'Q4'].map((q, idx) => {
            const key = `q${idx + 1}` as 'q1' | 'q2' | 'q3' | 'q4';
            return {
                name: q,
                Plan: planProjects.reduce((s: number, p: CommissioningProject) => s + (p[key] || 0), 0),
                Rephase: rephaseProjects.reduce((s: number, p: CommissioningProject) => s + (p[key] || 0), 0),
                'Actual/Fcst': actualProjects.reduce((s: number, p: CommissioningProject) => s + (p[key] || 0), 0),
            };
        });
    }, [overallFilteredProjects]);

    const monthlyData = useMemo(() => {
        const planProjects = overallFilteredProjects.filter((p: CommissioningProject) => p.planActual === 'Plan');
        const actualProjects = overallFilteredProjects.filter((p: CommissioningProject) => p.planActual === 'Actual');
        const rephaseProjects = overallFilteredProjects.filter((p: CommissioningProject) => p.planActual === 'Rephase');

        return ALL_MONTHS.map(m => ({
            name: m.label,
            Plan: planProjects.reduce((s: number, p: CommissioningProject) => s + ((p as any)[m.key] || 0), 0),
            Rephase: rephaseProjects.reduce((s: number, p: CommissioningProject) => s + ((p as any)[m.key] || 0), 0),
            'Actual/Fcst': actualProjects.reduce((s: number, p: CommissioningProject) => s + ((p as any)[m.key] || 0), 0),
        }));
    }, [overallFilteredProjects]);

    const formatNumber = (value: number | null | undefined): string => {
        if (value === null || value === undefined) return '0';
        // Round to 1 decimal place to avoid floating-point errors, then check if whole
        const rounded = Math.round(value * 10) / 10;
        if (Number.isInteger(rounded)) {
            return rounded.toLocaleString();
        }
        return rounded.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
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
        const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Wind Summary');
        XLSX.writeFile(wb, `Wind_Commissioning_Status_${fiscalYear}.xlsx`);
        setShowExportModal(false);
    };

    const handleExcelUpload = async (file: File) => {
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('fiscalYear', fiscalYear);

            const response = await fetch('/api/upload-excel', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                setUploadResult({
                    failed: 1,
                    errors: [data.detail || 'Upload failed']
                });
            } else {
                setUploadResult({
                    success: data.projects_imported || 0,
                    sheets_found: data.sheets_found
                });
                queryClient.invalidateQueries({ queryKey: ['wind-projects'] });
            }
        } catch (error: any) {
            setUploadResult({ errors: [error.message] });
        } finally {
            setUploading(false);
        }
    };

    const handleResetData = async () => {
        if (!isAdmin) return;
        if (!confirm('Are you sure you want to RESET ALL commissioning data? This cannot be undone.')) return;

        try {
            const response = await fetch('/api/reset-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fiscalYear })
            });

            if (response.ok) {
                alert('Data reset successfully');
                queryClient.invalidateQueries({ queryKey: ['wind-projects'] });
            }
        } catch (error) {
            alert('Reset failed');
        }
    };

    const toggleExportMonth = (key: string) => {
        setExportMonths(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
    };

    const selectAllMonths = () => setExportMonths(ALL_MONTHS.map(m => m.key));
    const clearAllMonths = () => setExportMonths([]);

    if (projectsLoading) {
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
                    <div className="flex items-center justify-between gap-3 mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl text-white">
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-3xl font-black text-white uppercase tracking-tight">Wind Portfolio Dashboard</h1>
                                <p className="text-cyan-50 text-sm font-medium mt-1 opacity-90 tracking-wide">Real-time wind commissioning tracking and portfolio performance</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {isAdmin && (
                                <button
                                    onClick={() => setShowUploadModal(true)}
                                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-black uppercase tracking-[0.1em] transition-all flex items-center gap-2 backdrop-blur-sm"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                    Upload
                                </button>
                            )}
                        </div>
                    </div>


                    {/* KPI Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mt-6">

                        <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                            <p className="text-white/60 text-[10px] font-black uppercase tracking-widest pl-0.5">Plan</p>
                            <p className="text-2xl font-black text-white mt-1 flex items-baseline">
                                {formatNumber(kpis.totalPlan)}
                                <span className="text-[10px] ml-1 font-bold opacity-70">MW</span>
                            </p>
                        </div>
                        <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                            <p className="text-white/60 text-[10px] font-black uppercase tracking-widest pl-0.5">Rephase</p>
                            <p className="text-2xl font-black text-white mt-1 flex items-baseline">
                                {formatNumber(kpis.totalRephase)}
                                <span className="text-[10px] ml-1 font-bold opacity-70">MW</span>
                            </p>
                        </div>
                        <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                            <p className="text-white/60 text-[10px] font-black uppercase tracking-widest pl-0.5">Actual/Fcst</p>
                            <p className="text-2xl font-black text-white mt-1 flex items-baseline">
                                {formatNumber(kpis.totalActual)}
                                <span className="text-[10px] ml-1 font-bold opacity-70">MW</span>
                            </p>
                        </div>
                        <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                            <p className="text-white/60 text-[10px] font-black uppercase tracking-widest pl-0.5">Achievement</p>
                            <p className="text-2xl font-black text-white mt-1 flex items-baseline">
                                {kpis.achievement.toFixed(2)}
                                <span className="text-[10px] ml-1 font-bold opacity-70">%</span>
                            </p>
                        </div>
                        <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                            <p className="text-white/60 text-[10px] font-black uppercase tracking-widest pl-0.5">Total Projects</p>
                            <p className="text-2xl font-black text-white mt-1">{kpis.projectCount}</p>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Pie Chart: Section Split */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-6"
                >
                    <h3 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
                        Capacity by Section
                    </h3>
                    <div className="h-[220px] relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={sectionData}
                                    innerRadius={60}
                                    outerRadius={90}
                                    dataKey="value"
                                    stroke="none"
                                    paddingAngle={2}
                                >
                                    {sectionData.map((entry, index) => (
                                        <Cell key={index} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                    formatter={(value: any) => [`${formatNumber(value)} MW`, 'Capacity']}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="text-center">
                                <p className="text-3xl font-black text-gray-800 dark:text-white leading-tight">{formatNumber(kpis.totalPlan)}</p>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total MW</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-6">
                        {sectionData.map(d => (
                            <div key={d.name} className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }}></div>
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">{d.name}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Performance Trend Chart */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-6"
                >
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                        <h3 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
                            Performance Trend
                        </h3>
                        <div className="flex bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-1">
                            <button
                                onClick={() => setViewMode('quarterly')}
                                className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all ${viewMode === 'quarterly' ? 'bg-cyan-500 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                Quarterly
                            </button>
                            <button
                                onClick={() => setViewMode('monthly')}
                                className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all ${viewMode === 'monthly' ? 'bg-cyan-500 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                Monthly
                            </button>
                        </div>
                    </div>

                    <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={viewMode === 'quarterly' ? quarterlyData : monthlyData}>
                                <defs>
                                    <linearGradient id="colorPlanWind" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorRephaseWind" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#F97316" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorActualWind" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                    formatter={(value: any) => [`${formatNumber(value)} MW`, '']}
                                />
                                <Legend
                                    verticalAlign="top"
                                    align="right"
                                    iconType="circle"
                                    wrapperStyle={{ top: -10, fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}
                                />
                                <Area type="monotone" dataKey="Plan" stroke="#3B82F6" strokeWidth={3} fill="url(#colorPlanWind)" />
                                <Area type="monotone" dataKey="Rephase" stroke="#F97316" strokeWidth={3} fill="url(#colorRephaseWind)" />
                                <Area type="monotone" dataKey="Actual/Fcst" stroke="#10B981" strokeWidth={3} fill="url(#colorActualWind)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            </div>

            {/* No Summary Tables as requested by user - Detailed View Only */}

            {/* AGEL Overall Wind Summary Table */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700"
            >
                <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <span className="text-cyan-500">1.</span>
                        AGEL OVERALL WIND FY {fiscalYear.replace('FY_', '').replace('-', '-20')}
                    </h3>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-white/50 dark:bg-gray-800/50 p-1 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(e.target.value)}
                                className="bg-transparent border-none text-[10px] font-bold text-gray-600 dark:text-gray-400 focus:ring-0 cursor-pointer py-1 pl-2 pr-6"
                            >
                                {YEAR_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                            <div className="w-px h-3 bg-gray-200 dark:bg-gray-600"></div>
                            <select
                                value={selectedQuarter}
                                onChange={(e) => setSelectedQuarter(e.target.value)}
                                className="bg-transparent border-none text-[10px] font-bold text-gray-600 dark:text-gray-400 focus:ring-0 cursor-pointer py-1 pl-2 pr-6"
                            >
                                {availableQuarters.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>

                        <button
                            onClick={() => setShowExportModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white rounded-lg text-xs font-bold transition-all shadow-md active:scale-95"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Export
                        </button>
                    </div>
                </div>

                {/* Summary Table */}
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

            {/* Filters and List Control Bar */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4"
            >
                <div className="flex flex-wrap items-center gap-6">
                    <div className="flex items-center gap-3">
                        <select
                            value={selectedSection}
                            onChange={(e) => setSelectedSection(e.target.value)}
                            className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-black uppercase text-cyan-600 tracking-widest transition-all focus:ring-2 focus:ring-cyan-500/20"
                        >
                            {WIND_SECTIONS.map(s => (
                                <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-4 border-l border-gray-200 dark:border-gray-700 pl-6">
                        <div className="flex flex-col gap-0.5">
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Project Type</span>
                            <select
                                value={projectTypeFilter}
                                onChange={(e) => setProjectTypeFilter(e.target.value)}
                                className="px-2 py-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-[10px] font-bold text-gray-700 outline-none focus:ring-1 focus:ring-cyan-500/20"
                            >
                                <option value="all">All Types</option>
                                <option value="PPA">PPA</option>
                                <option value="Merchant">Merchant</option>
                                <option value="Group">Group</option>
                            </select>
                        </div>

                        <div className="flex flex-col gap-0.5">
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Status</span>
                            <select
                                value={capacityPointFilter}
                                onChange={(e) => setCapacityPointFilter(e.target.value)}
                                className="px-2 py-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-[10px] font-bold text-gray-700 outline-none focus:ring-1 focus:ring-cyan-500/20"
                            >
                                <option value="all">All Status</option>
                                <option value="Plan">Plan</option>
                                <option value="Actual">Actual / Fcst</option>
                                <option value="Rephase">Rephase</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center gap-6 ml-auto">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50"></span>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Plan</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-orange-500 shadow-sm shadow-orange-500/50"></span>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Rephase</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50"></span>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Actual</span>
                        </div>
                    </div>
                    <div className="text-xs font-black text-gray-400 uppercase tracking-widest border-l border-gray-200 dark:border-gray-700 pl-6">
                        Projects: <span className="text-cyan-600">{groupedProjects.length}</span>
                    </div>
                </div>
            </motion.div>

            {/* Projects Table Card - Clean Wrapper */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-cyan-50 to-teal-50 dark:from-gray-800 dark:to-gray-800">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <svg className="w-5 h-5 text-cyan-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                        {selectedSection !== 'all' ? WIND_SECTIONS.find(s => s.value === selectedSection)?.label : 'Wind Projects - Plan / Rephase / Actual Comparison'}
                    </h3>
                </div>



                <div className="overflow-x-auto max-h-[600px] scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">
                    <table className="w-full text-sm border-collapse">
                        <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0 z-30">
                            <tr>
                                <th className="px-4 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 dark:bg-gray-900 sticky left-0 z-40 border-b border-gray-100 dark:border-gray-800 w-12 text-center">No</th>
                                <th className="px-4 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 dark:bg-gray-900 sticky left-12 z-40 border-b border-gray-100 dark:border-gray-800 min-w-[200px]">Project Name</th>
                                <th className="px-4 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-gray-800 min-w-[140px]">SPV</th>
                                <th className="px-4 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-gray-800">Type</th>
                                <th className="px-4 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-gray-800">Location</th>
                                <th className="px-4 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-gray-800">Capacity</th>
                                <th className="px-4 py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-gray-800 w-[120px]">Status</th>
                                {visibleMonths.map(m => (
                                    <th key={m.key} className="px-2 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-gray-800 w-24">{m.label}</th>
                                ))}
                                <th className="px-4 py-4 text-right text-[10px] font-black text-cyan-600 uppercase tracking-widest border-b border-gray-100 dark:border-gray-800 bg-cyan-50/30 dark:bg-cyan-900/10">Project Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {groupedProjects.map((group, idx) => (
                                <React.Fragment key={`${group.projectName}-${idx}`}>
                                    {/* Plan Row */}
                                    <tr className="group hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                                        <td className="px-4 py-3 text-gray-400 font-bold text-xs text-center border-r border-gray-50 dark:border-gray-800 sticky left-0 z-20 bg-inherit" rowSpan={3}>{idx + 1}</td>
                                        <td className="px-4 py-3 font-bold text-gray-800 dark:text-white sticky left-12 z-20 bg-inherit shadow-[4px_0_10px_rgba(0,0,0,0.02)]" rowSpan={3}>
                                            <span>{group.projectName}</span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400 font-medium text-xs truncate max-w-[140px]" rowSpan={3} title={group.spv}>{group.spv || '-'}</td>
                                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-[10px] font-bold uppercase" rowSpan={3}>
                                            <span className={`px-2 py-0.5 rounded-md ${group.projectType?.toLowerCase().includes('ppa') ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                                                {group.projectType || '-'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400 font-medium text-[10px]" rowSpan={3}>{group.plotLocation || '-'}</td>
                                        <td className="px-4 py-3 text-right font-black text-gray-900 dark:text-white" rowSpan={3}>{formatNumber(group.capacity)} <span className="text-[9px] font-bold opacity-30">MW</span></td>
                                        <td className="px-4 py-3 text-center border-l border-gray-50 dark:border-gray-800">
                                            <span className="inline-flex px-2.5 py-1 text-[9px] font-black uppercase rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 shadow-sm">Plan</span>
                                        </td>
                                        {visibleMonths.map(m => (
                                            <EditableCell
                                                key={m.key}
                                                project={group.plan!}
                                                field={m.key}
                                                value={group.plan ? (group.plan as any)[m.key] : 0}
                                                isEditing={editingCell?.projectId === group.plan?.id && editingCell?.field === m.key}
                                                onEdit={() => group.plan && setEditingCell({ projectId: group.plan.id!, field: m.key })}
                                                onSave={(val) => group.plan && handleCellSave(group.plan, m.key, val)}
                                                onCancel={() => setEditingCell(null)}
                                                formatNumber={formatNumber}
                                                disabled={!group.plan || !isAdmin}
                                            />
                                        ))}
                                        <td className="px-4 py-3 text-right font-black text-blue-600 dark:text-blue-400 bg-blue-50/30 dark:bg-blue-900/10">{formatNumber(group.plan?.totalCapacity)}</td>
                                    </tr>
                                    {/* Rephase Row */}
                                    <tr className="group hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                                        <td className="px-4 py-3 text-center border-l border-gray-50 dark:border-gray-800">
                                            <span className="inline-flex px-2.5 py-1 text-[9px] font-black uppercase rounded-lg bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 shadow-sm">Rephase</span>
                                        </td>
                                        {visibleMonths.map(m => (
                                            <EditableCell
                                                key={m.key}
                                                project={group.rephase!}
                                                field={m.key}
                                                value={group.rephase ? (group.rephase as any)[m.key] : 0}
                                                isEditing={editingCell?.projectId === group.rephase?.id && editingCell?.field === m.key}
                                                onEdit={() => group.rephase && setEditingCell({ projectId: group.rephase.id!, field: m.key })}
                                                onSave={(val) => group.rephase && handleCellSave(group.rephase, m.key, val)}
                                                onCancel={() => setEditingCell(null)}
                                                formatNumber={formatNumber}
                                                disabled={!group.rephase || !isAdmin}
                                            />
                                        ))}
                                        <td className="px-4 py-3 text-right font-black text-orange-600 dark:text-orange-400 bg-orange-50/30 dark:bg-orange-900/10">{formatNumber(group.rephase?.totalCapacity)}</td>
                                    </tr>
                                    {/* Actual Row */}
                                    <tr className="group hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors bg-white dark:bg-gray-900 border-b-2 border-gray-100 dark:border-gray-800">
                                        <td className="px-4 py-3 text-center border-l border-gray-50 dark:border-gray-800">
                                            <span className="inline-flex px-2.5 py-1 text-[9px] font-black uppercase rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 shadow-sm">Actual</span>
                                        </td>
                                        {visibleMonths.map(m => (
                                            <EditableCell
                                                key={m.key}
                                                project={group.actual!}
                                                field={m.key}
                                                value={group.actual ? (group.actual as any)[m.key] : 0}
                                                isEditing={editingCell?.projectId === group.actual?.id && editingCell?.field === m.key}
                                                onEdit={() => group.actual && setEditingCell({ projectId: group.actual.id!, field: m.key })}
                                                onSave={(val) => group.actual && handleCellSave(group.actual, m.key, val)}
                                                onCancel={() => setEditingCell(null)}
                                                formatNumber={formatNumber}
                                                disabled={!group.actual || !isAdmin}
                                            />
                                        ))}
                                        <td className="px-4 py-3 text-right font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50/30 dark:bg-emerald-900/10">{formatNumber(group.actual?.totalCapacity)}</td>
                                    </tr>
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </motion.div>


            {/* Export Modal */}
            <AnimatePresence>
                {
                    showExportModal && (
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
                    )
                }
            </AnimatePresence >

            {/* Upload Excel Modal */}
            <AnimatePresence>
                {
                    showUploadModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                            onClick={() => setShowUploadModal(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Upload Excel File</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Select an AGEL Commissioning Status Excel file to upload</p>
                                </div>

                                <div className="p-6">
                                    <input
                                        type="file"
                                        accept=".xlsx,.xls"
                                        id="wind-excel-upload"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                handleExcelUpload(file);
                                            }
                                        }}
                                    />
                                    <label
                                        htmlFor="wind-excel-upload"
                                        className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-cyan-300 dark:border-cyan-700 rounded-xl cursor-pointer hover:border-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 transition-all"
                                    >
                                        {uploading ? (
                                            <div className="flex flex-col items-center">
                                                <div className="w-10 h-10 border-4 border-cyan-200 border-t-cyan-500 rounded-full animate-spin mb-3"></div>
                                                <p className="text-sm font-medium text-cyan-600 dark:text-cyan-400">Uploading...</p>
                                            </div>
                                        ) : (
                                            <>
                                                <svg className="w-12 h-12 text-cyan-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                </svg>
                                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Click to select Excel file</p>
                                                <p className="text-xs text-gray-500 mt-1">.xlsx or .xls</p>
                                            </>
                                        )}
                                    </label>

                                    {uploadResult && (
                                        <div className={`mt-4 p-4 rounded-lg ${uploadResult.errors?.length ? 'bg-red-50 dark:bg-red-900/20' : 'bg-green-50 dark:bg-green-900/20'}`}>
                                            {uploadResult.success !== undefined && (
                                                <p className="text-sm font-medium text-green-700 dark:text-green-400">
                                                    ✓ Successfully imported {uploadResult.success} projects
                                                </p>
                                            )}
                                            {uploadResult.sheets_found && (
                                                <p className="text-xs text-gray-500 mt-1">Sheets: {uploadResult.sheets_found.join(', ')}</p>
                                            )}
                                            {uploadResult.errors?.map((err: string, i: number) => (
                                                <p key={i} className="text-sm text-red-600 dark:text-red-400">{err}</p>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                                    <button
                                        onClick={() => {
                                            setShowUploadModal(false);
                                            setUploadResult(null);
                                        }}
                                        className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
                                    >
                                        Close
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )
                }
            </AnimatePresence >
        </div >
    );
}
