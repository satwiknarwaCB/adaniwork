import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import * as XLSX from 'xlsx';
import { useAuth } from '@/lib/hooks/useAuth';

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
  { value: 'all', label: 'All' },
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

const SOLAR_SECTIONS = [
  { value: 'all', label: 'All Solar Projects' },
  { value: 'A', label: 'A. Khavda Solar' },
  { value: 'B', label: 'B. Rajasthan Solar' },
  { value: 'C', label: 'C. Rajasthan Additional' },
  { value: 'D1', label: 'D1. Khavda Copper+Merchant (Excl)' },
  { value: 'D2', label: 'D2. Khavda Internal (Excl)' },
];

export default function SolarStatusPage() {
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();
  const fiscalYear = 'FY_25-26';
  const [selectedSection, setSelectedSection] = useState('all');
  const [viewMode, setViewMode] = useState<'quarterly' | 'monthly'>('quarterly');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedQuarter, setSelectedQuarter] = useState('all');
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportMonths, setExportMonths] = useState<string[]>(ALL_MONTHS.map(m => m.key));
  const [editingCell, setEditingCell] = useState<{ projectId: number, field: string } | null>(null);

  const { data: allProjects = [], isLoading } = useQuery<CommissioningProject[]>({
    queryKey: ['commissioning-projects', fiscalYear],
    queryFn: async () => {
      const response = await fetch(`/api/commissioning-projects?fiscalYear=${fiscalYear}`);
      if (!response.ok) throw new Error('Failed to fetch projects');
      return response.json();
    },
    staleTime: 0,
  });

  // Save changes mutation
  const saveProjectsMutation = useMutation({
    mutationFn: async (updatedProjects: CommissioningProject[]) => {
      const response = await fetch('/api/commissioning-projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fiscalYear, projects: updatedProjects }),
      });
      if (!response.ok) throw new Error('Failed to save projects');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commissioning-projects', fiscalYear] });
    },
  });

  // Handle inline cell save
  const handleCellSave = (project: CommissioningProject, field: string, value: number | null) => {
    if (!isAdmin) {
      alert('You do not have permission to modify project data. Please login as an Admin.');
      return;
    }
    const updatedProject = { ...project, [field]: value };
    const updatedProjects = allProjects.map((p: CommissioningProject) =>
      p.id === project.id ? updatedProject : p
    );

    saveProjectsMutation.mutate(updatedProjects);
    setEditingCell(null);
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

  // Filter only Solar projects
  const solarProjects = useMemo(() => {
    return allProjects.filter(p =>
      p.category?.toLowerCase().includes('solar')
    );
  }, [allProjects]);


  // Group projects by name with Plan, Rephase, Actual
  const groupedProjects = useMemo(() => {
    let filtered = solarProjects;

    if (selectedSection !== 'all') {
      filtered = filtered.filter(p => p.section === selectedSection);
    }

    const projectMap = new Map<string, GroupedProject>();

    filtered.forEach(p => {
      const key = `${p.projectName}|${p.spv}|${p.section}`;
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
  }, [solarProjects, selectedSection]);

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
    const included = solarProjects.filter(p => p.includedInTotal);
    const planProjects = included.filter(p => p.planActual === 'Plan');
    const rephaseProjects = included.filter(p => p.planActual === 'Rephase');
    const actualProjects = included.filter(p => p.planActual === 'Actual');

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
  }, [solarProjects, visibleMonths, calcRowData]);

  // KPIs - Only include projects marked for total inclusion for high-level metrics
  const kpis = useMemo(() => {
    const includedProjects = solarProjects.filter(p => p.includedInTotal);
    const planProjects = includedProjects.filter(p => p.planActual === 'Plan');
    const actualProjects = includedProjects.filter(p => p.planActual === 'Actual');
    const rephaseProjects = includedProjects.filter(p => p.planActual === 'Rephase');

    const totalPlan = planProjects.reduce((s, p) => s + (p.capacity || 0), 0);
    const totalActual = actualProjects.reduce((s, p) => s + (p.totalCapacity || 0), 0);
    const totalRephase = rephaseProjects.reduce((s, p) => s + (p.totalCapacity || 0), 0);
    const projectCount = new Set(solarProjects.map(p => p.projectName)).size;
    const achievement = totalPlan > 0 ? (totalActual / totalPlan) * 100 : 0;

    return { totalPlan, totalActual, totalRephase, projectCount, achievement };
  }, [solarProjects]);

  // Section-wise capacity breakdown
  const sectionData = useMemo(() => {
    const planProjects = solarProjects.filter(p => p.planActual === 'Plan' && p.includedInTotal);
    return SOLAR_SECTIONS.slice(1).map(section => {
      const sectionProjects = planProjects.filter(p => p.category.includes(section.value));
      return {
        name: section.label.replace('A. ', '').replace('B. ', '').replace('C. ', ''),
        value: sectionProjects.reduce((s, p) => s + (p.capacity || 0), 0),
        color: section.value.includes('Khavda') ? '#F97316' :
          section.value.includes('Rajasthan Solar Additional') ? '#FB923C' : '#FDBA74'
      };
    }).filter(d => d.value > 0);
  }, [solarProjects]);

  // Chart data
  const quarterlyData = useMemo(() => {
    const planProjects = solarProjects.filter(p => p.planActual === 'Plan');
    const actualProjects = solarProjects.filter(p => p.planActual === 'Actual');
    const rephaseProjects = solarProjects.filter(p => p.planActual === 'Rephase');

    return ['Q1', 'Q2', 'Q3', 'Q4'].map((q, idx) => {
      const key = `q${idx + 1}` as 'q1' | 'q2' | 'q3' | 'q4';
      return {
        name: q,
        Plan: planProjects.reduce((s, p) => s + (p[key] || 0), 0),
        Rephase: rephaseProjects.reduce((s, p) => s + (p[key] || 0), 0),
        'Actual/Fcst': actualProjects.reduce((s, p) => s + (p[key] || 0), 0),
      };
    });
  }, [solarProjects]);

  const monthlyData = useMemo(() => {
    const planProjects = solarProjects.filter(p => p.planActual === 'Plan');
    const actualProjects = solarProjects.filter(p => p.planActual === 'Actual');
    const rephaseProjects = solarProjects.filter(p => p.planActual === 'Rephase');

    return ALL_MONTHS.map(m => ({
      name: m.label,
      Plan: planProjects.reduce((s, p) => s + ((p as any)[m.key] || 0), 0),
      Rephase: rephaseProjects.reduce((s, p) => s + ((p as any)[m.key] || 0), 0),
      'Actual/Fcst': actualProjects.reduce((s, p) => s + ((p as any)[m.key] || 0), 0),
    }));
  }, [solarProjects]);

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

    const planProjects = solarProjects.filter(p => p.planActual === 'Plan');
    const rephaseProjects = solarProjects.filter(p => p.planActual === 'Rephase');
    const actualProjects = solarProjects.filter(p => p.planActual === 'Actual');

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
    XLSX.utils.book_append_sheet(wb, ws, 'Solar Summary');

    // Download
    XLSX.writeFile(wb, `AGEL_Solar_Summary_${new Date().toISOString().split('T')[0]}.xlsx`);
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
        <div className="w-16 h-16 border-4 border-orange-200 dark:border-orange-800 border-t-orange-500 rounded-full animate-spin"></div>
        <span className="ml-4 text-orange-600 dark:text-orange-400 font-medium">Loading Solar Portfolio...</span>
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
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-400 p-6 shadow-xl"
      >
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Solar Portfolio Dashboard</h1>
              <p className="text-white/80 text-sm"></p>
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
              <p className="text-2xl font-black text-white mt-1">{kpis.achievement.toFixed(2)}<span className="text-sm font-medium">%</span></p>
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
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-orange-100 dark:border-gray-700 p-6"
        >
          <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="w-1 h-4 bg-orange-500 rounded-full"></span>
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
          className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-orange-100 dark:border-gray-700 p-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-2">
              <span className="w-1 h-4 bg-orange-500 rounded-full"></span>
              {viewMode === 'quarterly' ? 'Quarterly' : 'Monthly'} Performance
            </h3>
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('quarterly')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === 'quarterly' ? 'bg-orange-500 text-white shadow' : 'text-gray-600 dark:text-gray-400'}`}
              >
                Quarterly
              </button>
              <button
                onClick={() => setViewMode('monthly')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === 'monthly' ? 'bg-orange-500 text-white shadow' : 'text-gray-600 dark:text-gray-400'}`}
              >
                Monthly
              </button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={viewMode === 'quarterly' ? quarterlyData : monthlyData}>
              <defs>
                <linearGradient id="colorPlan" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorRephase" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F97316" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
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
              <Area type="monotone" dataKey="Plan" stroke="#3B82F6" strokeWidth={2} fill="url(#colorPlan)" dot={{ r: 4, fill: '#3B82F6' }} />
              <Area type="monotone" dataKey="Rephase" stroke="#F97316" strokeWidth={2} fill="url(#colorRephase)" dot={{ r: 4, fill: '#F97316' }} />
              <Area type="monotone" dataKey="Actual/Fcst" stroke="#10B981" strokeWidth={2} fill="url(#colorActual)" dot={{ r: 4, fill: '#10B981' }} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* AGEL Overall Solar Summary Table */}
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
              <span className="text-orange-500">1.</span>
              AGEL OVERALL SOLAR FY 2025-26
            </h3>
            <div className="flex items-center gap-3 flex-wrap">
              {/* Year Filter */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Year:</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-orange-500/20"
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
                  className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-orange-500/20"
                >
                  {availableQuarters.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              {/* Export Button */}
              <button
                onClick={() => setShowExportModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors"
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
        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-orange-100 dark:border-gray-700 p-4"
      >
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Section:</span>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              {SOLAR_SECTIONS.map(s => (
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
            Showing <span className="font-bold text-orange-600">{groupedProjects.length}</span> projects
          </div>
        </div>
      </motion.div>

      {/* Projects Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-orange-100 dark:border-gray-700 overflow-hidden"
      >
        <div className="p-4 border-b border-orange-100 dark:border-gray-700 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-gray-800 dark:to-gray-800">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
            Solar Projects - Plan / Rephase / Actual Comparison
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
                <th className="px-3 py-3 text-right text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {groupedProjects.map((group, idx) => (
                <React.Fragment key={`${group.projectName}-${idx}`}>
                  {/* Plan Row */}
                  <tr className="hover:bg-blue-50/30 dark:hover:bg-gray-700/30">
                    <td className="px-3 py-2 text-gray-600 dark:text-gray-400 font-bold" rowSpan={3}>{idx + 1}</td>
                    <td className="px-3 py-2 font-semibold text-gray-800 dark:text-white" rowSpan={3}>{group.projectName}</td>
                    <td className="px-3 py-2 text-right font-bold text-gray-800 dark:text-white" rowSpan={3}>{formatNumber(group.capacity)}</td>
                    <td className="px-3 py-2 text-center">
                      <span className="inline-flex px-2 py-0.5 text-xs font-bold rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Plan</span>
                    </td>
                    {ALL_MONTHS.map(m => (
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
                    <td className="px-3 py-2 text-right font-bold text-blue-600 dark:text-blue-400">{formatNumber(group.plan?.totalCapacity)}</td>
                  </tr>
                  {/* Rephase Row */}
                  <tr className="hover:bg-orange-50/30 dark:hover:bg-gray-700/30">
                    <td className="px-3 py-2 text-center">
                      <span className="inline-flex px-2 py-0.5 text-xs font-bold rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">Rephase</span>
                    </td>
                    {ALL_MONTHS.map(m => (
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
                    <td className="px-3 py-2 text-right font-bold text-orange-600 dark:text-orange-400">{formatNumber(group.rephase?.totalCapacity)}</td>
                  </tr>
                  {/* Actual Row */}
                  <tr className="hover:bg-green-50/30 dark:hover:bg-gray-700/30 border-b-2 border-gray-200 dark:border-gray-600">
                    <td className="px-3 py-2 text-center">
                      <span className="inline-flex px-2 py-0.5 text-xs font-bold rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Actual/Fcst</span>
                    </td>
                    {ALL_MONTHS.map(m => (
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
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">Export Solar Data</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Select which months to include in the export</p>
              </div>

              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Select Months</span>
                  <div className="flex gap-2">
                    <button onClick={selectAllMonths} className="text-xs text-orange-500 hover:text-orange-600">Select All</button>
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
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                    >
                      {m.label}-{m.year}
                    </button>
                  ))}
                </div>

                <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    <span className="text-orange-500 font-medium">{exportMonths.length}</span> months selected for export
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
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Export
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
