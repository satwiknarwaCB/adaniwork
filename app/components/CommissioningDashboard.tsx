"use client";

import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, AreaChart, Area, LineChart, Line
} from 'recharts';

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

// Premium Color Palette
const COLORS = {
    plan: 'url(#gradientPlan)',
    actual: 'url(#gradientActual)',
    rephase: 'url(#gradientRephase)',
    solar: '#FDBA74',     // Light Orange
    wind: '#67E8F9',      // Light Cyan
    ppa: '#C084FC',       // Light Purple
    merchant: '#F472B6',  // Light Pink
    group: '#2DD4BF',     // Light Teal
    ahead: '#10B981',
    behind: '#F43F5E',
};

const GRADIENTS = (
    <defs>
        <linearGradient id="gradientPlan" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#2563EB" stopOpacity={0.8} />
        </linearGradient>
        <linearGradient id="gradientActual" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#059669" stopOpacity={0.8} />
        </linearGradient>
        <linearGradient id="gradientRephase" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#D97706" stopOpacity={0.8} />
        </linearGradient>
        <filter id="shadow" height="130%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
            <feOffset dx="0" dy="2" result="offsetblur" />
            <feComponentTransfer>
                <feFuncA type="linear" slope="0.2" />
            </feComponentTransfer>
            <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
            </feMerge>
        </filter>
    </defs>
);

const monthKeys = ['apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec', 'jan', 'feb', 'mar'];
const monthLabels = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];

const SECTION_OPTIONS = [
    { value: 'all', label: 'All Sections' },
    { value: 'Khavda Solar Projects', label: 'Khavda Solar' },
    { value: 'Rajasthan Solar Projects', label: 'Rajasthan Solar' },
    { value: 'Rajasthan Solar Additional 500MW', label: 'Rajasthan Addl' },
    { value: 'Khavda Wind Projects', label: 'Khavda Wind' },
    { value: 'Mundra Wind 76MW', label: 'Mundra Wind' },
];

export default function CommissioningDashboard() {
    const fiscalYear = 'FY_25-26';
    const [activeDashboard, setActiveDashboard] = useState<'overview' | 'solar' | 'wind' | 'models' | 'deviation'>('overview');
    const [achieveView, setAchieveView] = useState<'yearly' | 'half-yearly' | 'quarterly' | 'monthly'>('yearly');
    const [achieveCategory, setAchieveCategory] = useState('All Categories');
    const [achieveProject, setAchieveProject] = useState('All Projects');
    const [timelineView, setTimelineView] = useState<'yearly' | 'half-yearly' | 'quarterly' | 'monthly'>('quarterly');
    const [deviationView, setDeviationView] = useState<'yearly' | 'half-yearly' | 'quarterly' | 'monthly'>('quarterly');

    const [mainTimelineStatus, setMainTimelineStatus] = useState('All Projects');
    const [mainTimelineProject, setMainTimelineProject] = useState('All Projects');
    const [mainTimelineSPV, setMainTimelineSPV] = useState('All SPVs');

    const [solarPhase, setSolarPhase] = useState('All Phases');
    const [solarViewMode, setSolarViewMode] = useState('Target View');
    const [windSPV, setWindSPV] = useState('All SPVs');
    const [windMarket, setWindMarket] = useState('Growth View');
    const [modelMetric, setModelMetric] = useState('Capacity Share');
    const [modelDrill, setModelDrill] = useState('Project Select');

    const [categoryFilter, setCategoryFilter] = useState<'all' | 'solar' | 'wind'>('all');
    const [selectedSections, setSelectedSections] = useState<string[]>(['all']);
    const [selectedModels, setSelectedModels] = useState<string[]>(['all']);
    const [selectedFY, setSelectedFY] = useState('2025-26');

    // Local Chart States for specific card dropdowns
    const [techMixStatus, setTechMixStatus] = useState('All Projects');
    const [techMixProject, setTechMixProject] = useState('All Projects');
    const [techMixCategory, setTechMixCategory] = useState('All Categories');
    const [techMixHovered, setTechMixHovered] = useState<any>(null);

    // Business Model Filter for charts
    const [businessModelFilter, setBusinessModelFilter] = useState('All Models');
    const [timelineBusinessModel, setTimelineBusinessModel] = useState('All Models');
    const [timelineCategory, setTimelineCategory] = useState('All Categories');

    // Solar Dashboard specific
    const [solarCategory, setSolarCategory] = useState('All Categories');
    const [solarBusinessModel, setSolarBusinessModel] = useState('All Models');

    // Wind Dashboard specific
    const [windCategory, setWindCategory] = useState('All Categories');
    const [windBusinessModel, setWindBusinessModel] = useState('All Models');

    // Models Dashboard
    const [modelsCategory, setModelsCategory] = useState('All Categories');
    const [modelsTechnology, setModelsTechnology] = useState('All');

    // KPI scope derived from global category filter
    const globalKpiScope = categoryFilter === 'all' ? 'Overall' : categoryFilter === 'solar' ? 'Solar' : 'Wind';

    const { data: allProjects = [], isLoading } = useQuery<CommissioningProject[]>({
        queryKey: ['commissioning-projects', fiscalYear],
        queryFn: async () => {
            const response = await fetch(`/api/commissioning-projects?fiscalYear=${fiscalYear}`);
            if (!response.ok) throw new Error('Failed to fetch projects');
            return response.json();
        },
        staleTime: 0, // Always fetch fresh data when navigating
    });

    const filteredProjects = useMemo(() => {
        return allProjects.filter(p => {
            if (!p.includedInTotal) return false;
            const cat = p.category ? p.category.toLowerCase() : '';
            if (categoryFilter === 'solar' && !cat.includes('solar')) return false;
            if (categoryFilter === 'wind' && !cat.includes('wind')) return false;
            if (!selectedSections.includes('all') && !selectedSections.includes(p.category)) return false;
            if (!selectedModels.includes('all') && !selectedModels.includes(p.projectType)) return false;
            return true;
        });
    }, [allProjects, categoryFilter, selectedSections, selectedModels]);

    const getKPIData = (scope: string) => {
        let projs = allProjects.filter(p => p.includedInTotal);
        if (scope === 'Solar') projs = projs.filter(p => p.category?.toLowerCase().includes('solar'));
        if (scope === 'Wind') projs = projs.filter(p => p.category?.toLowerCase().includes('wind'));
        if (scope !== 'Overall' && scope !== 'Solar' && scope !== 'Wind') projs = projs.filter(p => p.projectName === scope);

        const plan = projs.filter(p => p.planActual === 'Plan').reduce((s, p) => s + (p.capacity || 0), 0);
        const actual = projs.filter(p => p.planActual === 'Actual').reduce((s, p) => s + (p.totalCapacity || 0), 0);
        const projectsCount = new Set(projs.filter(p => p.planActual === 'Plan').map(p => p.projectName)).size;

        return { plan, actual, projectsCount, achievement: plan > 0 ? (actual / plan) * 100 : 0 };
    };

    const overallKpi = getKPIData('Overall');
    // All KPIs now use the same scope from global filter
    const kpi1 = getKPIData(globalKpiScope);
    const kpi2 = getKPIData(globalKpiScope);
    const kpi3 = getKPIData(globalKpiScope);
    const kpi4 = getKPIData(globalKpiScope);

    // Category Options - pulled from actual project data
    const categoryOptions = useMemo(() => {
        const categories = allProjects
            .filter(p => p.includedInTotal)
            .map(p => p.category)
            .filter(Boolean);
        const uniqueCategories = Array.from(new Set(categories)).sort();
        return ['All Categories', ...uniqueCategories];
    }, [allProjects]);

    // Business Model Options
    const businessModelOptions = ['All Models', 'PPA', 'Merchant', 'Group'];

    const projectOptions = useMemo(() => {
        const included = allProjects.filter(p => p.includedInTotal);
        const names = Array.from(new Set(included.map(p => p.projectName))).sort();
        return ['All Projects', ...names];
    }, [allProjects]);

    const spvOptions = useMemo(() => {
        const included = allProjects.filter(p => p.includedInTotal);
        const names = Array.from(new Set(included.map(p => p.spv))).filter(Boolean).sort();
        return ['All SPVs', ...names];
    }, [allProjects]);

    // Helper to filter by category
    const filterByCategory = (projects: CommissioningProject[], cat: string) => {
        if (cat === 'All Categories') return projects;
        return projects.filter(p => p.category === cat);
    };

    // Helper to filter by business model
    const filterByBusinessModel = (projects: CommissioningProject[], model: string) => {
        if (model === 'All Models') return projects;
        return projects.filter(p => p.projectType === model);
    };

    const filteredTimelineProjects = useMemo(() => {
        let projs = allProjects.filter(p => p.includedInTotal);
        if (mainTimelineProject !== 'All Projects') projs = projs.filter(p => p.projectName === mainTimelineProject);
        if (mainTimelineSPV !== 'All SPVs') projs = projs.filter(p => p.spv === mainTimelineSPV);
        projs = filterByCategory(projs, timelineCategory);
        projs = filterByBusinessModel(projs, timelineBusinessModel);
        return projs;
    }, [allProjects, mainTimelineProject, mainTimelineSPV, timelineCategory, timelineBusinessModel]);


    const halfYearlyData = useMemo(() => {
        const h1Months = ['apr', 'may', 'jun', 'jul', 'aug', 'sep'];
        const h2Months = ['oct', 'nov', 'dec', 'jan', 'feb', 'mar'];
        return [
            { name: 'H1 (Apr-Sep)', period: 'h1', months: h1Months },
            { name: 'H2 (Oct-Mar)', period: 'h2', months: h2Months }
        ].map(h => ({
            name: h.name,
            'PPA Plan': filteredTimelineProjects.filter(p => p.planActual === 'Plan').reduce((s, p) => s + h.months.reduce((ms, m) => ms + ((p as any)[m] || 0), 0), 0),
            'Actual Commissioning': filteredTimelineProjects.filter(p => p.planActual === 'Actual').reduce((s, p) => s + h.months.reduce((ms, m) => ms + ((p as any)[m] || 0), 0), 0),
            'Rephase Strategy': filteredTimelineProjects.filter(p => p.planActual === 'Rephase').reduce((s, p) => s + h.months.reduce((ms, m) => ms + ((p as any)[m] || 0), 0), 0),
        }));
    }, [filteredTimelineProjects]);

    const quarterlyData = useMemo(() => {
        return ['Q1', 'Q2', 'Q3', 'Q4'].map((q, idx) => {
            const key = `q${idx + 1}` as 'q1' | 'q2' | 'q3' | 'q4';
            return {
                name: q,
                'PPA Plan': filteredTimelineProjects.filter(p => p.planActual === 'Plan').reduce((s, p) => s + (p[key] || 0), 0),
                'Actual Commissioning': filteredTimelineProjects.filter(p => p.planActual === 'Actual').reduce((s, p) => s + (p[key] || 0), 0),
                'Rephase Strategy': filteredTimelineProjects.filter(p => p.planActual === 'Rephase').reduce((s, p) => s + (p[key] || 0), 0),
            };
        });
    }, [filteredTimelineProjects]);

    const monthlyData = useMemo(() => {
        return monthKeys.map((key, idx) => {
            const planVal = filteredTimelineProjects.filter(p => p.planActual === 'Plan').reduce((s, p) => s + ((p as any)[key] || 0), 0);
            const actualVal = filteredTimelineProjects.filter(p => p.planActual === 'Actual').reduce((s, p) => s + ((p as any)[key] || 0), 0);
            const rephaseVal = filteredTimelineProjects.filter(p => p.planActual === 'Rephase').reduce((s, p) => s + ((p as any)[key] || 0), 0);
            return {
                name: monthLabels[idx],
                'PPA Plan': planVal,
                'Actual Commissioning': actualVal,
                'Rephase Strategy': rephaseVal,
                Deviation: actualVal - planVal,
            };
        });
    }, [filteredTimelineProjects]);

    const gaugeData = useMemo(() => {
        let projs = allProjects.filter(p => p.includedInTotal);
        if (achieveCategory !== 'All Categories') projs = projs.filter(p => p.category === achieveCategory);
        if (achieveProject !== 'All Projects') projs = projs.filter(p => p.projectName === achieveProject);

        let plan = 0;
        let actual = 0;
        let periodName = 'Yearly';

        // Current Period configuration based on "As on 31-Oct-25"
        if (achieveView === 'yearly') {
            plan = projs.filter(p => p.planActual === 'Plan').reduce((s, p) => s + (p.capacity || 0), 0);
            actual = projs.filter(p => p.planActual === 'Actual').reduce((s, p) => s + (p.totalCapacity || 0), 0);
            periodName = 'Full FY';
        } else if (achieveView === 'half-yearly') {
            // H2: Oct-Mar
            const months = ['oct', 'nov', 'dec', 'jan', 'feb', 'mar'];
            plan = projs.filter(p => p.planActual === 'Plan').reduce((s, p) => s + months.reduce((ms, m) => ms + ((p as any)[m] || 0), 0), 0);
            actual = projs.filter(p => p.planActual === 'Actual').reduce((s, p) => s + months.reduce((ms, m) => ms + ((p as any)[m] || 0), 0), 0);
            periodName = 'H2 (Oct-Mar)';
        } else if (achieveView === 'quarterly') {
            // Q3: Oct-Dec
            plan = projs.filter(p => p.planActual === 'Plan').reduce((s, p) => s + (p.q3 || 0), 0);
            actual = projs.filter(p => p.planActual === 'Actual').reduce((s, p) => s + (p.q3 || 0), 0);
            periodName = 'Q3 (Oct-Dec)';
        } else if (achieveView === 'monthly') {
            // October
            plan = projs.filter(p => p.planActual === 'Plan').reduce((s, p) => s + (p.oct || 0), 0);
            actual = projs.filter(p => p.planActual === 'Actual').reduce((s, p) => s + (p.oct || 0), 0);
            periodName = 'October 2025';
        }

        return {
            plan,
            actual,
            periodName,
            achievement: plan > 0 ? (actual / plan) * 100 : 0,
            chart: [
                { name: 'Completed', value: actual, color: '#10B981' },
                { name: 'Remaining', value: Math.max(0, plan - actual), color: '#3B82F620' },
            ]
        };
    }, [allProjects, achieveView, achieveCategory, achieveProject]);

    const techSplitData = useMemo(() => {
        let projects = allProjects.filter(p => p.planActual === 'Plan' && p.includedInTotal);
        projects = filterByCategory(projects, techMixCategory);
        if (techMixProject !== 'All Projects') {
            projects = projects.filter(p => p.projectName === techMixProject);
        } else if (techMixStatus !== 'All Projects') {
            const isCompleted = techMixStatus === 'Completed';
            projects = projects.filter(p => {
                const actual = allProjects.find(ap => ap.projectName === p.projectName && ap.planActual === 'Actual');
                return isCompleted ? (actual?.totalCapacity || 0) >= p.capacity : (actual?.totalCapacity || 0) < p.capacity;
            });
        }
        const solar = projects.filter(p => p.category?.toLowerCase().includes('solar')).reduce((s, p) => s + (p.capacity || 0), 0);
        const wind = projects.filter(p => p.category?.toLowerCase().includes('wind')).reduce((s, p) => s + (p.capacity || 0), 0);

        return {
            data: [
                { name: 'Solar', value: solar, color: '#F97316' },
                { name: 'Wind', value: wind, color: '#06B6D4' },
            ].filter(d => d.value > 0),
            total: solar + wind
        };
    }, [allProjects, techMixProject, techMixStatus, techMixCategory]);


    const modelSplitData = useMemo(() => {
        const planProjects = filteredProjects.filter(p => p.planActual === 'Plan');
        return [
            { name: 'PPA', value: planProjects.filter(p => p.projectType === 'PPA').reduce((s, p) => s + (p.capacity || 0), 0), color: '#8B5CF6' },
            { name: 'Merchant', value: planProjects.filter(p => p.projectType === 'Merchant').reduce((s, p) => s + (p.capacity || 0), 0), color: '#EC4899' },
            { name: 'Group', value: planProjects.filter(p => p.projectType === 'Group').reduce((s, p) => s + (p.capacity || 0), 0), color: '#14B8A6' },
        ].filter(d => d.value > 0);
    }, [filteredProjects]);

    const cumulativeData = useMemo(() => {
        let cumPlan = 0;
        let cumActual = 0;
        return monthlyData.map(m => {
            cumPlan += m['PPA Plan'];
            cumActual += m['Actual Commissioning'];
            return {
                name: m.name,
                'PPA Plan': cumPlan,
                'Actual Commissioning': cumActual,
            };
        });
    }, [monthlyData]);

    const solarData = useMemo(() => {
        const solarProjects = allProjects.filter(p => p.includedInTotal && p.category && p.category.toLowerCase().includes('solar'));
        const planProjects = solarProjects.filter(p => p.planActual === 'Plan');
        const actualProjects = solarProjects.filter(p => p.planActual === 'Actual');
        const totalPlan = planProjects.reduce((s, p) => s + (p.capacity || 0), 0);
        const totalActual = actualProjects.reduce((s, p) => s + (p.totalCapacity || 0), 0);
        const quarterly = ['Q1', 'Q2', 'Q3', 'Q4'].map((q, idx) => {
            const key = `q${idx + 1}` as 'q1' | 'q2' | 'q3' | 'q4';
            return {
                name: q,
                'PPA Plan': planProjects.reduce((s, p) => s + (p[key] || 0), 0),
                'Actual Commissioning': actualProjects.reduce((s, p) => s + (p[key] || 0), 0),
            };
        });
        const monthly = monthKeys.map((key, idx) => ({
            name: monthLabels[idx],
            'PPA Plan': planProjects.reduce((s, p) => s + ((p as any)[key] || 0), 0),
            'Actual Commissioning': actualProjects.reduce((s, p) => s + ((p as any)[key] || 0), 0),
        }));
        return { totalPlan, totalActual, quarterly, monthly, projectCount: new Set(planProjects.map(p => p.projectName)).size };
    }, [allProjects]);

    const windData = useMemo(() => {
        const windProjects = allProjects.filter(p => p.includedInTotal && p.category && p.category.toLowerCase().includes('wind'));
        const planProjects = windProjects.filter(p => p.planActual === 'Plan');
        const actualProjects = windProjects.filter(p => p.planActual === 'Actual');
        const totalPlan = planProjects.reduce((s, p) => s + (p.capacity || 0), 0);
        const totalActual = actualProjects.reduce((s, p) => s + (p.totalCapacity || 0), 0);
        const quarterly = ['Q1', 'Q2', 'Q3', 'Q4'].map((q, idx) => {
            const key = `q${idx + 1}` as 'q1' | 'q2' | 'q3' | 'q4';
            return {
                name: q,
                'PPA Plan': planProjects.reduce((s, p) => s + (p[key] || 0), 0),
                'Actual Commissioning': actualProjects.reduce((s, p) => s + (p[key] || 0), 0),
            };
        });
        const monthly = monthKeys.map((key, idx) => ({
            name: monthLabels[idx],
            'PPA Plan': planProjects.reduce((s, p) => s + ((p as any)[key] || 0), 0),
            'Actual Commissioning': actualProjects.reduce((s, p) => s + ((p as any)[key] || 0), 0),
        }));
        return { totalPlan, totalActual, quarterly, monthly, projectCount: new Set(planProjects.map(p => p.projectName)).size };
    }, [allProjects]);

    const deviationChartData = useMemo(() => {
        const sourceData = deviationView === 'monthly' ? monthlyData : deviationView === 'half-yearly' ? halfYearlyData : quarterlyData;
        return sourceData.map(q => ({
            name: q.name,
            Deviation: (q as any)['Actual Commissioning'] - (q as any)['PPA Plan'],
        }));
    }, [quarterlyData, monthlyData, halfYearlyData, deviationView]);

    const criticalProjects = useMemo(() => {
        const planProjects = allProjects.filter(p => p.planActual === 'Plan' && p.includedInTotal);
        return planProjects.map(pp => {
            const actual = allProjects.find(ap => ap.projectName === pp.projectName && ap.planActual === 'Actual');
            const diff = (actual?.totalCapacity || 0) - (pp.capacity || 0);
            return {
                name: pp.projectName,
                plan: pp.capacity,
                actual: actual?.totalCapacity || 0,
                diff,
                status: diff >= 0 ? 'Ahead' : 'Behind',
                category: pp.category
            };
        }).sort((a, b) => a.diff - b.diff).slice(0, 5);
    }, [allProjects]);

    if (isLoading) return <div className="p-20 text-center animate-pulse">Initializing Adani BI Engine...</div>;

    return (
        <div className="min-h-screen max-w-full overflow-x-hidden p-3 rounded-md space-y-4 sm:space-y-6 font-sans">
            {/* Corporate Header - Adani Themed */}
            <div className="z-[100] bg-white dark:bg-[#1F2937] border border-[#D1D5DB] dark:border-gray-700 rounded-lg p-3 sm:p-4 shadow-sm relative">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    {/* Left: Logo, Title, FY selector - all inline */}
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#0B74B0] rounded-lg flex-shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                            <h1 className="text-base sm:text-lg font-semibold text-[#1F2937] dark:text-white whitespace-nowrap">
                                AGEL Tracker
                            </h1>
                            <div className="flex items-center gap-2 px-2 py-1 dark:bg-gray-800 rounded-md h-8">
                                <span className="text-xs font-medium text-[#4B5563] dark:text-gray-400 whitespace-nowrap pt-[2px]">Fiscal Year</span>
                                <CardSelect
                                    label=""
                                    options={['2024-25', '2025-26', '2026-27']}
                                    value={selectedFY}
                                    onChange={setSelectedFY}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right: Category Filter */}
                    <GlobalSlicer
                        label=""
                        options={['All', 'Solar', 'Wind']}
                        value={categoryFilter}
                        onChange={(v: string) => setCategoryFilter(v.toLowerCase() as any)}
                    />
                </div>

                {/* Navigation Tabs - Clean aligned style */}
                <div className="mt-3 pt-3 border-t border-[#D1D5DB] dark:border-gray-700">
                    <nav className="flex items-center gap-1 bg-[#F5F7FA] dark:bg-gray-800 p-1 rounded-lg border border-[#D1D5DB] dark:border-gray-700 w-fit overflow-x-auto max-w-full">
                        {[
                            { id: 'overview', label: 'Overview' },
                            { id: 'solar', label: 'Solar' },
                            { id: 'wind', label: 'Wind' },
                            { id: 'models', label: 'Models' },
                            { id: 'deviation', label: 'Deviations' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveDashboard(tab.id as any)}
                                className={`h-8 px-3 sm:px-4 rounded-md text-xs font-medium transition-all flex items-center whitespace-nowrap ${activeDashboard === tab.id
                                    ? 'bg-[#0B74B0] text-white shadow-sm'
                                    : 'text-[#4B5563] dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 hover:text-[#1F2937]'}`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            {/* KPI Section */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
                <KPICard
                    label="PPA PORTFOLIO PLAN"
                    value={kpi1.plan}
                    unit="MW"
                    trend={`Total: ${kpi1.projectsCount} Projects`}
                    gradient="from-blue-600 to-indigo-700"
                />
                <KPICard
                    label="ACTUAL COMMISSIONING"
                    value={kpi2.actual}
                    unit="MW"
                    trend={`${kpi2.achievement.toFixed(4)}% of Plan`}
                    gradient="from-emerald-500 to-teal-600"
                />
                <KPICard
                    label="STATUS PERFORMANCE"
                    value={kpi3.achievement}
                    unit="%"
                    trend={kpi3.achievement > 70 ? "Excellent" : "On Track"}
                    gradient="from-indigo-500 to-purple-600"
                />
                <KPICard
                    label="EXECUTION DEVIATION"
                    value={kpi4.actual - kpi4.plan}
                    unit="MW"
                    trend={kpi4.actual >= kpi4.plan ? "Above Target" : "Below Target"}
                    gradient={kpi4.actual >= kpi4.plan ? "from-emerald-400 to-emerald-600" : "from-rose-500 to-red-700"}
                />
            </div>

            {/* Section Divider */}
            <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-300 dark:bg-gray-700" />
                <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Portfolio Analytics
                </h2>
                <div className="flex-1 h-px bg-gray-300 dark:bg-gray-700" />
            </div>

            <div className="space-y-4 w-full">
                {activeDashboard === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 w-full">
                        {/* Left Column - Gauge and Tech Mix */}
                        <div className="space-y-4">
                            <ChartContainer
                                title={`${achieveCategory === 'All Categories' ? 'Overall' : achieveCategory} Achievement`}
                                controls={
                                    <div className="flex flex-wrap items-center gap-2">
                                        <CardSelect label="" options={categoryOptions} value={achieveCategory} onChange={setAchieveCategory} />
                                        <CardSelect label="" options={projectOptions} value={achieveProject} onChange={setAchieveProject} />
                                        <div className="hidden sm:block w-px h-6 bg-gray-200 dark:bg-gray-700" />
                                        <ViewPivot active={achieveView} onChange={setAchieveView} label="" />
                                    </div>
                                }
                            >
                                <div className="mb-2 text-center">
                                    <span className="text-[10px] font-bold text-[#0B74B0] dark:text-blue-400 uppercase tracking-widest bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full border border-blue-100 dark:border-blue-800 shadow-sm inline-block">
                                        {gaugeData.periodName} Target: {gaugeData.plan.toLocaleString(undefined, { maximumFractionDigits: 4 })} MW
                                    </span>
                                </div>
                                <div className="h-[180px] relative">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={gaugeData.chart} innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value" stroke="none">
                                                {gaugeData.chart.map((e, i) => <Cell key={i} fill={e.color} style={{ filter: 'url(#shadow)' }} />)}
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-4 text-center">
                                        <div className="flex flex-col items-center leading-tight">
                                            <span className="text-3xl font-black text-[#1F2937] dark:text-white">
                                                {gaugeData.achievement.toFixed(4)}
                                                <span className="text-sm ml-0.5 font-bold text-gray-400">%</span>
                                            </span>
                                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mt-0.5">Achievement</span>
                                        </div>
                                        <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-800 w-24 flex flex-col items-center">
                                            <span className="text-[12px] font-bold text-[#10B981]">{gaugeData.actual.toLocaleString(undefined, { maximumFractionDigits: 4 })} MW</span>
                                            <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Actually Achieved</span>
                                        </div>
                                    </div>
                                </div>
                            </ChartContainer>

                            <ChartContainer
                                title={`${techMixCategory === 'All Categories' ? 'Overall' : techMixCategory} Technology Mix`}
                                controls={
                                    <div className="flex flex-wrap items-center gap-2">
                                        <CardSelect label="" options={categoryOptions} value={techMixCategory} onChange={setTechMixCategory} />
                                        <CardSelect label="" options={projectOptions} value={techMixProject} onChange={setTechMixProject} />
                                        <CardSelect label="" options={businessModelOptions} value={businessModelFilter} onChange={setBusinessModelFilter} />
                                    </div>
                                }
                            >
                                <div className="h-[160px] relative">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={techSplitData.data}
                                                innerRadius={50}
                                                outerRadius={70}
                                                dataKey="value"
                                                stroke="none"
                                                animationBegin={0}
                                                animationDuration={800}
                                                onMouseEnter={(_, index) => setTechMixHovered(techSplitData.data[index])}
                                                onMouseLeave={() => setTechMixHovered(null)}
                                            >
                                                {techSplitData.data.map((e, i) => (
                                                    <Cell
                                                        key={i}
                                                        fill={e.color}
                                                        style={{
                                                            filter: techMixHovered && techMixHovered.name !== e.name ? 'opacity(0.3)' : 'url(#shadow)',
                                                            transition: 'all 0.3s'
                                                        }}
                                                    />
                                                ))}
                                            </Pie>
                                            <Tooltip content={() => null} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                        <span className="text-xl font-bold text-gray-800 dark:text-white leading-none">
                                            {(techMixHovered ? techMixHovered.value : techSplitData.total).toLocaleString(undefined, { maximumFractionDigits: 4 })}
                                        </span>
                                        <span className="text-[8px] font-semibold text-gray-400 uppercase mt-0.5">
                                            {techMixHovered ? techMixHovered.name : "Total MW"}
                                        </span>
                                    </div>
                                </div>
                                {/* Technology breakdown */}
                                <div className="flex justify-center gap-4 mt-2">
                                    {techSplitData.data.map(d => {
                                        const perc = techSplitData.total > 0 ? (d.value / techSplitData.total) * 100 : 0;
                                        return (
                                            <div
                                                key={d.name}
                                                className={`flex flex-col items-center transition-all ${techMixHovered && techMixHovered.name !== d.name ? 'opacity-30' : 'opacity-100'}`}
                                            >
                                                <div className="flex items-center gap-1 mb-0.5">
                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                                                    <span className="text-[9px] font-semibold text-gray-500 uppercase">{d.name}</span>
                                                </div>
                                                <span className="text-xs font-bold text-gray-900 dark:text-white">{d.value.toLocaleString(undefined, { maximumFractionDigits: 4 })} MW</span>
                                                <span className="text-[9px] font-medium text-[#0B74B0]">{perc.toFixed(4)}%</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </ChartContainer>
                        </div>

                        {/* Right Column - Quarterly Performance */}
                        <div className="lg:col-span-2">
                            <ChartContainer
                                className="h-full"
                                title={timelineView === 'monthly' ? "Monthly Timeline" : timelineView === 'quarterly' ? "Quarterly Performance" : timelineView === 'half-yearly' ? "Half-Yearly View" : "Annual Summary"}
                                controls={
                                    <div className="flex flex-wrap items-center gap-2">
                                        <CardSelect label="" options={categoryOptions} value={timelineCategory} onChange={setTimelineCategory} />
                                        <CardSelect label="" options={businessModelOptions} value={timelineBusinessModel} onChange={setTimelineBusinessModel} />
                                        <CardSelect label="" options={projectOptions} value={mainTimelineProject} onChange={setMainTimelineProject} />
                                        <CardSelect label="" options={spvOptions} value={mainTimelineSPV} onChange={setMainTimelineSPV} />
                                        <div className="hidden sm:block w-px h-6 bg-gray-300 dark:bg-gray-600" />
                                        <ViewPivot active={timelineView} onChange={setTimelineView} label="" />
                                    </div>
                                }
                            >
                                {/* Filter tags */}
                                <div className="mb-3 flex flex-wrap gap-1 text-[9px]">
                                    <span className="bg-gray-100 dark:bg-gray-800 text-gray-500 px-1.5 py-0.5 rounded font-medium">FY {selectedFY}</span>
                                    <span className="bg-gray-100 dark:bg-gray-800 text-gray-500 px-1.5 py-0.5 rounded font-medium">{categoryFilter === 'all' ? 'Solar + Wind' : categoryFilter}</span>
                                    <span className="bg-gray-100 dark:bg-gray-800 text-gray-500 px-1.5 py-0.5 rounded font-medium">{timelineBusinessModel}</span>
                                    <span className="bg-gray-100 dark:bg-gray-800 text-gray-500 px-1.5 py-0.5 rounded font-medium">{timelineCategory}</span>
                                </div>

                                <ResponsiveContainer width="100%" height={350}>
                                    <BarChart data={timelineView === 'monthly' ? monthlyData : timelineView === 'half-yearly' ? halfYearlyData : quarterlyData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                        {GRADIENTS}
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                        <Tooltip
                                            cursor={{ fill: '#f1f5f9' }}
                                            content={({ active, payload, label }) => {
                                                if (active && payload && payload.length) {
                                                    return (
                                                        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 min-w-[220px]">
                                                            <p className="font-black text-lg mb-2">{label}</p>
                                                            {payload.map((p: any) => (
                                                                <div key={p.name} className="flex justify-between items-center py-1">
                                                                    <span className="text-gray-500 text-sm font-bold flex items-center gap-1">
                                                                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }}></span>
                                                                        {p.name}:
                                                                    </span>
                                                                    <span className="font-black text-gray-900 dark:text-white ml-4">{p.value.toLocaleString()} MW</span>
                                                                </div>
                                                            ))}
                                                            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 text-[9px] text-gray-400 font-bold uppercase">
                                                                {timelineCategory} | {timelineBusinessModel} | FY {selectedFY}
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Legend iconType="rect" verticalAlign="top" align="right" />
                                        <Bar dataKey="PPA Plan" name="PPA Plan" fill="url(#gradientPlan)" radius={[4, 4, 0, 0]} barSize={32} />
                                        <Bar dataKey="Actual Commissioning" name="Actual Commissioning" fill="url(#gradientActual)" radius={[4, 4, 0, 0]} barSize={32} />
                                        <Bar dataKey="Rephase Strategy" name="Rephase Strategy" fill="url(#gradientRephase)" radius={[4, 4, 0, 0]} barSize={32} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </ChartContainer>
                        </div>

                    </div>
                )}

                {activeDashboard === 'solar' && (
                    <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-sm space-y-6">
                        <div className="flex flex-wrap justify-between items-center gap-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <span className="w-1 h-5 bg-orange-500 rounded-sm" />
                                Solar Portfolio Analysis
                            </h3>
                            <div className="flex flex-wrap gap-2 relative z-50">
                                <CardSelect label="Category" options={categoryOptions} value={solarCategory} onChange={setSolarCategory} />
                                <CardSelect label="Model" options={businessModelOptions} value={solarBusinessModel} onChange={setSolarBusinessModel} />
                                <MultiSlicer label="Projects" options={SECTION_OPTIONS.filter(s => s.label.includes('Solar'))} selected={selectedSections} onChange={setSelectedSections} />
                            </div>
                        </div>

                        {/* Solar Summary */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                            <div className="text-center">
                                <p className="text-xs font-medium text-gray-500 uppercase">Total Plan</p>
                                <p className="text-xl font-bold text-gray-900 dark:text-white">{solarData.totalPlan.toLocaleString(undefined, { maximumFractionDigits: 4 })} <span className="text-sm text-gray-400">MW</span></p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs font-medium text-gray-500 uppercase">Actual</p>
                                <p className="text-xl font-bold text-gray-900 dark:text-white">{solarData.totalActual.toLocaleString(undefined, { maximumFractionDigits: 4 })} <span className="text-sm text-gray-400">MW</span></p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs font-medium text-gray-500 uppercase">Achievement</p>
                                <p className="text-xl font-bold text-gray-900 dark:text-white">{solarData.totalPlan > 0 ? ((solarData.totalActual / solarData.totalPlan) * 100).toFixed(4) : 0}%</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs font-medium text-gray-500 uppercase">Projects</p>
                                <p className="text-xl font-bold text-gray-900 dark:text-white">{solarData.projectCount}</p>
                            </div>
                        </div>

                        {/* Filter Tags */}
                        <div className="flex flex-wrap gap-2 text-xs">
                            <span className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded font-medium">FY {selectedFY}</span>
                            <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-2 py-1 rounded font-medium">Solar</span>
                            <span className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded font-medium">
                                {solarBusinessModel === 'All Models' ? 'All Models' : solarBusinessModel}
                            </span>
                            <span className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded font-medium">
                                {solarCategory === 'All Categories' ? 'All Categories' : solarCategory}
                            </span>
                        </div>


                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <ChartContainer
                                title="Solar - Quarterly Comparison"
                                controls={<CardSelect label="PROJECT PHASE" options={['All Phases', 'Phase 1', 'Phase 2']} value={solarPhase} onChange={setSolarPhase} />}
                            >
                                <ResponsiveContainer width="100%" height={250}>
                                    <BarChart data={solarData.quarterly}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                        <YAxis axisLine={false} tickLine={false} />
                                        <Tooltip formatter={(v: any) => `${v.toLocaleString(undefined, { maximumFractionDigits: 4 })} MW`} />
                                        <Bar dataKey="PPA Plan" fill="#F97316" radius={[6, 6, 0, 0]} barSize={32} />
                                        <Bar dataKey="Actual Commissioning" fill="#10B981" radius={[6, 6, 0, 0]} barSize={32} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </ChartContainer>
                            <ChartContainer
                                title="Solar - Monthly Trend"
                                controls={<CardSelect label="DATA VIEW" options={['Target View', 'Execution View']} value={solarViewMode} onChange={setSolarViewMode} />}
                            >
                                <ResponsiveContainer width="100%" height={250}>
                                    <AreaChart data={solarData.monthly}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                        <YAxis axisLine={false} tickLine={false} />
                                        <Tooltip formatter={(v: any) => `${v.toLocaleString(undefined, { maximumFractionDigits: 4 })} MW`} />
                                        <Area type="monotone" dataKey="PPA Plan" stroke="#F97316" fill="#FED7AA" strokeWidth={3} />
                                        <Area type="monotone" dataKey="Actual Commissioning" stroke="#10B981" fill="#A7F3D0" strokeWidth={3} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </ChartContainer>
                        </div>


                        <div className="bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-[2.5rem] p-8 shadow-sm">
                            <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6">Solar Project Portfolio Breakdown</h4>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-gray-100 dark:border-gray-800 text-[10px] font-black uppercase text-gray-400">
                                            <th className="pb-4">Project Name</th>
                                            <th className="pb-4">Target Capacity</th>
                                            <th className="pb-4">Actual Achieved</th>
                                            <th className="pb-4">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 dark:divide-gray-900">
                                        {allProjects.filter(p => (selectedSections.includes('all') || selectedSections.includes(p.category)) && p.category?.toLowerCase().includes('solar') && p.planActual === 'Plan').map(p => {
                                            const actual = allProjects.find(ap => ap.projectName === p.projectName && ap.planActual === 'Actual');
                                            return (
                                                <tr key={p.projectName} className="group">
                                                    <td className="py-4 text-sm font-bold text-gray-800 dark:text-gray-200 group-hover:text-blue-600 transition-colors uppercase">{p.projectName}</td>
                                                    <td className="py-4 text-sm font-black text-gray-900 dark:text-white">{p.capacity} MW</td>
                                                    <td className="py-4 text-sm font-black text-gray-900 dark:text-white">{actual?.totalCapacity || 0} MW</td>
                                                    <td className="py-4">
                                                        <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${(actual?.totalCapacity || 0) >= p.capacity ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                                                            {(actual?.totalCapacity || 0) >= p.capacity ? 'Completed' : 'On-Going'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {activeDashboard === 'wind' && (
                    <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-sm space-y-6">
                        <div className="flex flex-wrap justify-between items-center gap-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <span className="w-1 h-5 bg-cyan-500 rounded-sm" />
                                Wind Portfolio Analysis
                            </h3>
                            <div className="flex flex-wrap gap-2 relative z-50">
                                <CardSelect label="Category" options={categoryOptions} value={windCategory} onChange={setWindCategory} />
                                <CardSelect label="Model" options={businessModelOptions} value={windBusinessModel} onChange={setWindBusinessModel} />
                                <MultiSlicer label="Projects" options={SECTION_OPTIONS.filter(s => s.label.includes('Wind'))} selected={selectedSections} onChange={setSelectedSections} />
                            </div>
                        </div>

                        {/* Wind Summary */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                            <div className="text-center">
                                <p className="text-xs font-medium text-gray-500 uppercase">Total Plan</p>
                                <p className="text-xl font-bold text-gray-900 dark:text-white">{windData.totalPlan.toLocaleString(undefined, { maximumFractionDigits: 4 })} <span className="text-sm text-gray-400">MW</span></p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs font-medium text-gray-500 uppercase">Actual</p>
                                <p className="text-xl font-bold text-gray-900 dark:text-white">{windData.totalActual.toLocaleString(undefined, { maximumFractionDigits: 4 })} <span className="text-sm text-gray-400">MW</span></p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs font-medium text-gray-500 uppercase">Achievement</p>
                                <p className="text-xl font-bold text-gray-900 dark:text-white">{windData.totalPlan > 0 ? ((windData.totalActual / windData.totalPlan) * 100).toFixed(4) : 0}%</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs font-medium text-gray-500 uppercase">Projects</p>
                                <p className="text-xl font-bold text-gray-900 dark:text-white">{windData.projectCount}</p>
                            </div>
                        </div>

                        {/* Filter Tags */}
                        <div className="flex flex-wrap gap-2 text-xs">
                            <span className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded font-medium">FY {selectedFY}</span>
                            <span className="bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 px-2 py-1 rounded font-medium">Wind</span>
                            <span className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded font-medium">
                                {windBusinessModel === 'All Models' ? 'All Models' : windBusinessModel}
                            </span>
                            <span className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded font-medium">
                                {windCategory === 'All Categories' ? 'All Categories' : windCategory}
                            </span>
                        </div>


                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <ChartContainer
                                title="Wind - Quarterly Comparison"
                                controls={<CardSelect label="SPV FILTER" options={['All SPVs', 'Selected SPVs']} value={windSPV} onChange={setWindSPV} />}
                            >
                                <ResponsiveContainer width="100%" height={250}>
                                    <BarChart data={windData.quarterly}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                        <YAxis axisLine={false} tickLine={false} />
                                        <Tooltip formatter={(v: any) => `${v.toLocaleString(undefined, { maximumFractionDigits: 4 })} MW`} />
                                        <Bar dataKey="PPA Plan" fill="#06B6D4" radius={[6, 6, 0, 0]} barSize={32} />
                                        <Bar dataKey="Actual Commissioning" fill="#10B981" radius={[6, 6, 0, 0]} barSize={32} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </ChartContainer>
                            <ChartContainer
                                title="Wind - Monthly Trend"
                                controls={<CardSelect label="MARKET TYPE" options={['Growth View', 'Standard View']} value={windMarket} onChange={setWindMarket} />}
                            >
                                <ResponsiveContainer width="100%" height={250}>
                                    <AreaChart data={windData.monthly}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                        <YAxis axisLine={false} tickLine={false} />
                                        <Tooltip formatter={(v: any) => `${v.toLocaleString(undefined, { maximumFractionDigits: 4 })} MW`} />
                                        <Area type="monotone" dataKey="PPA Plan" stroke="#06B6D4" fill="#A5F3FC" strokeWidth={3} />
                                        <Area type="monotone" dataKey="Actual Commissioning" stroke="#10B981" fill="#A7F3D0" strokeWidth={3} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </ChartContainer>

                        </div>

                        <div className="bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-[2.5rem] p-8 shadow-sm">
                            <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6">Wind Project Portfolio Breakdown</h4>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-gray-100 dark:border-gray-800 text-[10px] font-black uppercase text-gray-400">
                                            <th className="pb-4">Project Name</th>
                                            <th className="pb-4">Target Capacity</th>
                                            <th className="pb-4">Actual Achieved</th>
                                            <th className="pb-4">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 dark:divide-gray-900">
                                        {allProjects.filter(p => (selectedSections.includes('all') || selectedSections.includes(p.category)) && p.category?.toLowerCase().includes('wind') && p.planActual === 'Plan').map(p => {
                                            const actual = allProjects.find(ap => ap.projectName === p.projectName && ap.planActual === 'Actual');
                                            return (
                                                <tr key={p.projectName} className="group">
                                                    <td className="py-4 text-sm font-bold text-gray-800 dark:text-gray-200 group-hover:text-blue-600 transition-colors uppercase">{p.projectName}</td>
                                                    <td className="py-4 text-sm font-black text-gray-900 dark:text-white">{p.capacity} MW</td>
                                                    <td className="py-4 text-sm font-black text-gray-900 dark:text-white">{actual?.totalCapacity || 0} MW</td>
                                                    <td className="py-4">
                                                        <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${(actual?.totalCapacity || 0) >= p.capacity ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                                                            {(actual?.totalCapacity || 0) >= p.capacity ? 'Completed' : 'On-Going'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {activeDashboard === 'models' && (
                    <div className="space-y-6">
                        {/* Models Dashboard Header */}
                        <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                            <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                    <span className="w-1 h-5 bg-purple-500 rounded-sm" />
                                    Business Model Analysis
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    <GlobalSlicer label="Technology" options={['All', 'Solar', 'Wind']} value={modelsTechnology} onChange={setModelsTechnology} />
                                    <CardSelect label="Category" options={categoryOptions} value={modelsCategory} onChange={setModelsCategory} />
                                </div>
                            </div>
                            {/* Filter Tags */}
                            <div className="flex flex-wrap gap-2 text-xs">
                                <span className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded font-medium">FY {selectedFY}</span>
                                <span className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded font-medium">
                                    {modelsTechnology === 'All' ? 'Solar + Wind' : modelsTechnology}
                                </span>
                                <span className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded font-medium">
                                    {modelsCategory === 'All Categories' ? 'All Categories' : modelsCategory}
                                </span>
                            </div>

                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <ChartContainer
                                title="Business Model Distribution"
                                controls={<CardSelect label="Metric" options={['Capacity Share', 'Project Count']} value={modelMetric} onChange={setModelMetric} />}
                            >

                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie data={modelSplitData} innerRadius={80} outerRadius={110} dataKey="value" stroke="none">
                                            {modelSplitData.map((e, i) => <Cell key={i} fill={e.color} />)}
                                        </Pie>
                                        <Tooltip formatter={(v: any) => `${v.toLocaleString()} MW`} />
                                        <Legend verticalAlign="bottom" iconType="circle" />
                                    </PieChart>
                                </ResponsiveContainer>
                            </ChartContainer>
                            <div className="lg:col-span-2">
                                <ChartContainer
                                    title="📊 Model vs Target Breakdown"
                                    controls={<CardSelect label="DRILL DOWN" options={['Project Drill-down', 'Phase Breakdown']} value={modelDrill} onChange={setModelDrill} />}
                                >
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 h-[300px]">
                                        {modelSplitData.map(m => (
                                            <div key={m.name} className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-[2rem] flex flex-col justify-center items-center shadow-inner hover:shadow-md transition-all border border-transparent hover:border-gray-200 dark:hover:border-gray-700 group">
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{m.name}</span>
                                                <span className="text-3xl font-black group-hover:scale-110 transition-transform" style={{ color: m.color }}>{m.value.toLocaleString()} MW</span>
                                                <div className="mt-4 w-full h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                                                    <motion.div initial={{ width: 0 }} animate={{ width: `${(m.value / overallKpi.plan) * 100}%` }} className="h-full" style={{ backgroundColor: m.color }} />
                                                </div>
                                                <span className="mt-2 text-[10px] font-bold text-gray-500 uppercase tracking-tighter">{((m.value / (overallKpi.plan || 1)) * 100).toFixed(1)}% of total</span>
                                            </div>
                                        ))}
                                    </div>
                                </ChartContainer>
                            </div>
                        </div>
                    </div>
                )}

                {activeDashboard === 'deviation' && (
                    <div className="space-y-6">
                        {/* Deviation Dashboard Header */}
                        <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                    <span className="w-1 h-5 bg-rose-500 rounded-sm" />
                                    Deviation Analysis
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    <GlobalSlicer label="Technology" options={['All', 'Solar', 'Wind']} value={categoryFilter === 'all' ? 'All' : categoryFilter === 'solar' ? 'Solar' : 'Wind'} onChange={(v: string) => setCategoryFilter(v.toLowerCase() as any)} />
                                    <CardSelect label="Model" options={businessModelOptions} value={timelineBusinessModel} onChange={setTimelineBusinessModel} />
                                    <CardSelect label="Category" options={categoryOptions} value={timelineCategory} onChange={setTimelineCategory} />
                                </div>
                            </div>

                            {/* Deviation Summary Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
                                    <p className="text-xs font-medium text-gray-500 uppercase">Total Deviation</p>
                                    <p className={`text-xl font-bold ${(overallKpi.actual - overallKpi.plan) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {(overallKpi.actual - overallKpi.plan) >= 0 ? '+' : ''}{(overallKpi.actual - overallKpi.plan).toLocaleString()} <span className="text-sm">MW</span>
                                    </p>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
                                    <p className="text-xs font-medium text-gray-500 uppercase">Periods Behind</p>
                                    <p className="text-xl font-bold text-rose-600">{deviationChartData.filter(d => d.Deviation < 0).length}</p>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
                                    <p className="text-xs font-medium text-gray-500 uppercase">Periods Ahead</p>
                                    <p className="text-xl font-bold text-emerald-600">{deviationChartData.filter(d => d.Deviation >= 0).length}</p>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
                                    <p className="text-xs font-medium text-gray-500 uppercase">Projects Critical</p>
                                    <p className="text-xl font-bold text-amber-600">{criticalProjects.filter(p => p.diff < 0).length}</p>
                                </div>
                            </div>

                            {/* Filter Tags */}
                            <div className="flex flex-wrap gap-2 text-xs">
                                <span className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded font-medium">FY {selectedFY}</span>
                                <span className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded font-medium">
                                    {categoryFilter === 'all' ? 'Solar + Wind' : categoryFilter}
                                </span>
                                <span className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded font-medium">
                                    {timelineBusinessModel === 'All Models' ? 'All Models' : timelineBusinessModel}
                                </span>
                                <span className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded font-medium">
                                    {timelineCategory === 'All Categories' ? 'All Categories' : timelineCategory}
                                </span>
                            </div>

                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <ChartContainer
                                title="Deviation by Period (Actual − Plan)"
                                controls={
                                    <ViewPivot active={deviationView} onChange={setDeviationView} />
                                }
                            >
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={deviationChartData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                        <YAxis axisLine={false} tickLine={false} />
                                        <Tooltip
                                            cursor={{ fill: '#fef2f2' }}
                                            content={({ active, payload, label }) => {
                                                if (active && payload && payload.length) {
                                                    const val = payload[0].value as number;
                                                    return (
                                                        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-2xl border-2" style={{ borderColor: val >= 0 ? '#10B981' : '#F43F5E' }}>
                                                            <p className="font-black text-lg">{label}</p>
                                                            <p className={`text-2xl font-black ${val >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                                {val >= 0 ? '+' : ''}{val.toLocaleString()} MW
                                                            </p>
                                                            <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">
                                                                {val >= 0 ? 'Ahead of Schedule' : 'Action Required'}
                                                            </p>
                                                            <p className="text-[9px] text-gray-400 mt-2 border-t pt-2">
                                                                {categoryFilter === 'all' ? 'All Technologies' : categoryFilter} | {timelineBusinessModel} | {timelineCategory}
                                                            </p>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }} />
                                        <Bar dataKey="Deviation" radius={[6, 6, 0, 0]} barSize={40}>
                                            {deviationChartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.Deviation >= 0 ? '#10B981' : '#F43F5E'} fillOpacity={0.8} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </ChartContainer>


                            <ChartContainer
                                title="📋 Critical Action Required (Top 5 Deviations)"
                                controls={<div className="flex flex-col items-end gap-0.5"><span className="text-[8px] font-black text-rose-500 uppercase tracking-widest">CRITICALITY</span><span className="text-[10px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-100">PRIORITY 1</span></div>}
                            >
                                <div className="space-y-4 h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    {criticalProjects.map((p, i) => (
                                        <div key={i} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-transparent hover:border-rose-200 dark:hover:border-rose-900 transition-all group">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-xl ${p.diff < 0 ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'}`}>
                                                    {p.category?.toLowerCase().includes('solar') ? '☀️' : '🌬️'}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-gray-800 dark:text-white group-hover:text-rose-600 transition-colors uppercase">{p.name}</p>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Plan: {p.plan} MW | Actual: {p.actual} MW</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-sm font-black ${p.diff < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                                    {p.diff < 0 ? '' : '+'}{p.diff.toLocaleString()} MW
                                                </p>
                                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${p.diff < 0 ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                                    {p.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ChartContainer>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2">
                                <ChartContainer
                                    title="📈 Cumulative Flow Analysis"
                                    controls={<div className="flex flex-col items-end gap-0.5"><span className="text-[8px] font-black text-blue-500 uppercase tracking-widest">VIEW</span><span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100 uppercase">TRENDS</span></div>}
                                >
                                    <ResponsiveContainer width="100%" height={300}>
                                        <LineChart data={cumulativeData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                            <YAxis axisLine={false} tickLine={false} />
                                            <Tooltip formatter={(v: any) => `${v.toLocaleString()} MW`} />
                                            <Legend verticalAlign="top" align="right" />
                                            <Line type="monotone" dataKey="Actual Commissioning" name="✅ Cumulative Actual" stroke="#10B981" strokeWidth={4} dot={{ r: 6, fill: "#10B981" }} />
                                            <Line type="monotone" dataKey="PPA Plan" name="📋 Cumulative Plan" stroke="#3B82F6" strokeWidth={4} strokeDasharray="5 5" dot={{ r: 4 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </ChartContainer>
                            </div>

                            <ChartContainer
                                title="📊 Period Accuracy"
                                controls={<div className="flex flex-col items-end gap-0.5"><span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">ACCURACY</span><span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100 uppercase">REAL-TIME</span></div>}
                            >
                                <div className="space-y-6 flex flex-col justify-center h-full pb-8">
                                    {(timelineView === 'monthly' ? monthlyData : timelineView === 'half-yearly' ? halfYearlyData : quarterlyData).slice(0, 4).map((q: any) => {
                                        const plan = q['PPA Plan'] || 0;
                                        const actual = q['Actual Commissioning'] || 0;
                                        const perc = plan > 0 ? (actual / plan) * 100 : 100;
                                        return (
                                            <div key={q.name} className="space-y-1">
                                                <div className="flex justify-between text-[10px] font-black uppercase text-gray-400">
                                                    <span>{q.name}</span>
                                                    <span>{perc.toFixed(0)}%</span>
                                                </div>
                                                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                                    <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(perc, 100)}%` }} className={`h-full ${perc >= 90 ? 'bg-emerald-500' : perc > 60 ? 'bg-amber-500' : 'bg-rose-500'}`} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {achieveView === 'yearly' && (
                                        <div className="text-center py-8">
                                            <p className="text-4xl font-black text-blue-600">{overallKpi.achievement.toFixed(1)}%</p>
                                            <p className="text-xs font-bold text-gray-400 uppercase mt-2">Annual Target Met</p>
                                        </div>
                                    )}
                                </div>
                            </ChartContainer>
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
}


// Sub-components
// Sub-components
function GlobalSlicer({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (v: string) => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const buttonRef = React.useRef<HTMLButtonElement>(null);

    const handleOpen = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsOpen(!isOpen);
    };

    return (
        <div className="relative flex flex-col gap-1 items-start">
            {label && <span className="text-[10px] font-medium text-[#6B7280] dark:text-gray-400 uppercase">{label}</span>}
            <button
                ref={buttonRef}
                onClick={handleOpen}
                className="flex items-center gap-2 bg-[#F5F7FA] dark:bg-gray-800 hover:bg-white dark:hover:bg-gray-700 border border-[#D1D5DB] dark:border-gray-600 rounded-md px-3 py-1.5 text-xs font-medium text-[#1F2937] dark:text-gray-200 transition-colors"
            >
                {value}
                <span className={`text-[10px] text-[#6B7280] transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-[200]" onClick={() => setIsOpen(false)} />
                    <div className="absolute top-full mt-1 right-0 min-w-[120px] bg-white dark:bg-gray-800 border border-[#D1D5DB] dark:border-gray-700 rounded-md shadow-lg p-1 z-[210]">
                        <div className="max-h-60 overflow-y-auto">
                            {options.map(o => (
                                <button
                                    key={o}
                                    onClick={() => { onChange(o.toLowerCase() as any); setIsOpen(false); }}
                                    className={`w-full text-left px-3 py-1.5 text-xs font-medium rounded transition-colors ${value.toLowerCase() === o.toLowerCase() ? 'bg-[#0B74B0] text-white' : 'text-[#1F2937] dark:text-gray-200 hover:bg-[#F5F7FA] dark:hover:bg-gray-700'}`}
                                >
                                    {o}
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}




function ViewPivot({ active, onChange, label = "Period" }: { active: string; onChange: (v: any) => void; label?: string }) {
    return (
        <div className="flex flex-col items-start gap-1">
            {label && <span className="text-[10px] font-medium text-[#6B7280] dark:text-gray-400 uppercase">{label}</span>}
            <div className="h-8 bg-[#F3F4F6] dark:bg-gray-800 p-1 rounded-md flex items-center border border-[#D1D5DB] dark:border-gray-700 box-border">
                {['yearly', 'half-yearly', 'quarterly', 'monthly'].map((v) => (
                    <button
                        key={v}
                        onClick={() => onChange(v as any)}
                        className={`h-full px-3 rounded text-[10px] sm:text-xs font-medium transition-colors whitespace-nowrap flex items-center ${active === v
                            ? 'bg-[#0B74B0] text-white shadow-sm'
                            : 'text-[#4B5563] dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700'}`}
                    >
                        {v === 'half-yearly' ? 'Half' : v.charAt(0).toUpperCase() + v.slice(1).replace('-yearly', '')}
                    </button>
                ))}
            </div>
        </div>
    );
}


function MultiSlicer({ label, options, selected, onChange }: { label: string; options: any[]; selected: string[]; onChange: (v: string[]) => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const buttonRef = React.useRef<HTMLButtonElement>(null);

    const handleOpen = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setIsOpen(!isOpen);
    };

    return (
        <div className="relative flex flex-col gap-1">
            <span className="text-[10px] font-medium text-[#6B7280] dark:text-gray-400 uppercase">{label}</span>
            <button
                ref={buttonRef}
                onClick={handleOpen}
                className="h-8 flex items-center justify-between gap-2 bg-white dark:bg-gray-800 hover:bg-[#F9FAFB] dark:hover:bg-gray-700 border border-[#D1D5DB] dark:border-gray-600 rounded-md px-3 text-xs font-medium text-[#1F2937] dark:text-gray-200 transition-colors min-w-[100px]"
            >
                <span className="truncate">{selected.includes('all') ? 'All' : `${selected.length} Selected`}</span>
                <span className={`text-[10px] text-[#6B7280] transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-[200]" onClick={() => setIsOpen(false)} />
                    <div className="absolute top-full mt-1 left-0 w-48 bg-white dark:bg-gray-800 border border-[#D1D5DB] dark:border-gray-700 rounded-md shadow-lg p-1 z-[210]">
                        <div className="max-h-60 overflow-y-auto">
                            <button
                                onClick={() => { onChange(['all']); setIsOpen(false); }}
                                className={`w-full text-left px-3 py-1.5 text-xs font-medium rounded transition-colors ${selected.includes('all') ? 'bg-[#0B74B0] text-white' : 'text-[#374151] dark:text-gray-200 hover:bg-[#F3F4F6] dark:hover:bg-gray-700'}`}
                            >
                                Show All
                            </button>
                            {options.map((o) => (
                                <div key={o.value} className="flex items-center gap-2 px-3 py-1.5 hover:bg-[#F3F4F6] dark:hover:bg-gray-700 rounded cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selected.includes(o.value)}
                                        onChange={(e) => {
                                            const next = e.target.checked
                                                ? [...selected.filter(i => i !== 'all'), o.value]
                                                : selected.filter(i => i !== o.value);
                                            onChange(next.length === 0 ? ['all'] : next);
                                        }}
                                        className="rounded border-gray-300 text-[#0B74B0] focus:ring-[#0B74B0] w-3 h-3"
                                    />
                                    <span className="text-xs font-medium text-[#374151] dark:text-gray-300">{o.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}


function CardSelect({ label, options, value, onChange, variant = 'light' }: { label: string; options: string[]; value: string; onChange?: (v: string) => void; variant?: 'light' | 'dark' }) {
    const [isOpen, setIsOpen] = useState(false);
    const buttonRef = React.useRef<HTMLButtonElement>(null);

    const handleOpen = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setIsOpen(!isOpen);
    };

    // Light variant: for white backgrounds
    // Dark variant: for colored/dark backgrounds
    const labelClass = variant === 'dark'
        ? "text-[10px] font-medium text-white/70 uppercase mb-1"
        : "text-[10px] font-medium text-[#6B7280] uppercase mb-1";

    const buttonClass = variant === 'dark'
        ? "h-8 w-[150px] flex items-center justify-between gap-2 bg-white/20 hover:bg-white/30 border border-white/30 rounded-md px-3 text-xs font-medium text-white transition-colors"
        : "h-8 w-[150px] flex items-center justify-between gap-2 bg-[#F5F7FA] dark:bg-gray-800 hover:bg-white dark:hover:bg-gray-700 border border-[#D1D5DB] dark:border-gray-600 rounded-md px-3 text-xs font-medium text-[#1F2937] dark:text-gray-200 transition-colors";

    const arrowClass = variant === 'dark'
        ? `text-[10px] text-white/60 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`
        : `text-[10px] text-[#6B7280] transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`;

    return (
        <div className="relative flex flex-col items-start">
            {label && <span className={labelClass}>{label}</span>}
            <button
                ref={buttonRef}
                onClick={handleOpen}
                className={buttonClass}
            >
                <span className="truncate flex-1 text-left" title={value}>{value}</span>
                <span className={arrowClass}>▼</span>
            </button>
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-[200]" onClick={() => setIsOpen(false)} />
                    <div className="absolute top-full mt-1 right-0 min-w-[140px] bg-white dark:bg-gray-800 border border-[#D1D5DB] dark:border-gray-700 rounded-md shadow-lg p-1 z-[210]">
                        <div className="max-h-60 overflow-y-auto">
                            {options.map(o => (
                                <button
                                    key={o}
                                    onClick={() => { onChange?.(o); setIsOpen(false); }}
                                    className={`w-full text-left px-3 py-1.5 text-xs font-medium rounded transition-colors ${value === o ? 'bg-[#0B74B0] text-white' : 'text-[#1F2937] dark:text-gray-200 hover:bg-[#F5F7FA] dark:hover:bg-gray-700'}`}
                                >
                                    {o}
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}




function KPICard({ label, value, unit, trend, gradient }: { label: string; value: any; unit: string; trend: string; gradient: string }) {
    // Map gradient to Adani logo brand colors - Blue (#007B9E) → Purple (#6C2B85) → Magenta (#C02741)
    const getBgColor = () => {
        if (gradient.includes('blue') || gradient.includes('indigo')) return 'bg-gradient-to-br from-[#007B9E] to-[#005F7A]'; // Adani Blue (from logo)
        if (gradient.includes('emerald') || gradient.includes('teal')) return 'bg-gradient-to-br from-[#007B9E] to-[#6C2B85]'; // Adani Blue to Purple
        if (gradient.includes('purple')) return 'bg-gradient-to-br from-[#6C2B85] to-[#C02741]'; // Adani Purple to Magenta
        if (gradient.includes('rose') || gradient.includes('red')) return 'bg-gradient-to-br from-[#C02741] to-[#9E1F35]'; // Adani Magenta (from logo)
        return 'bg-gradient-to-br from-[#007B9E] to-[#005F7A]';
    };

    return (
        <div className={`${getBgColor()} p-4 rounded-xl shadow-md border border-white/10 relative overflow-hidden group`}>
            {/* Glossy Effect overlay */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/5 rounded-full -ml-12 -mb-12 pointer-events-none" />

            <div className="flex flex-col h-full justify-between relative z-10 gap-3">
                <div className="flex justify-between items-start gap-2">
                    <div className="space-y-1 sm:space-y-2 flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-white/90 uppercase tracking-widest leading-tight">{label}</p>
                        <div className="flex items-baseline gap-1.5 flex-wrap">
                            <h2 className="text-2xl sm:text-3xl font-bold text-white leading-none shadow-sm drop-shadow-sm">
                                {typeof value === 'number' ? value.toLocaleString(undefined, { maximumFractionDigits: 4 }) : value}
                            </h2>
                            <span className="text-sm font-medium text-white/80">{unit}</span>
                        </div>
                    </div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-lg py-1.5 px-3 self-start max-w-full border border-white/10 shadow-sm">
                    <span className="text-[10px] sm:text-[11px] font-semibold text-white block truncate tracking-wide">{trend}</span>
                </div>
            </div>
        </div>
    );
}

function ChartContainer({ title, children, controls, className = "" }: { title: string; children: React.ReactNode; controls?: React.ReactNode; className?: string }) {
    // Remove emojis from title for corporate look
    const cleanTitle = title.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]|[\u{231A}-\u{231B}]|[\u{23E9}-\u{23F3}]|[\u{23F8}-\u{23FA}]|[\u{25AA}-\u{25AB}]|[\u{25B6}]|[\u{25C0}]|[\u{25FB}-\u{25FE}]|[\u{2614}-\u{2615}]|[\u{2648}-\u{2653}]|[\u{267F}]|[\u{2693}]|[\u{26A1}]|[\u{26AA}-\u{26AB}]|[\u{26BD}-\u{26BE}]|[\u{26C4}-\u{26C5}]|[\u{26CE}]|[\u{26D4}]|[\u{26EA}]|[\u{26F2}-\u{26F3}]|[\u{26F5}]|[\u{26FA}]|[\u{26FD}]|[\u{2702}]|[\u{2705}]|[\u{2708}-\u{270D}]|[\u{270F}]|[\u{2712}]|[\u{2714}]|[\u{2716}]|[\u{271D}]|[\u{2721}]|[\u{2728}]|[\u{2733}-\u{2734}]|[\u{2744}]|[\u{2747}]|[\u{274C}]|[\u{274E}]|[\u{2753}-\u{2755}]|[\u{2757}]|[\u{2763}-\u{2764}]|[\u{2795}-\u{2797}]|[\u{27A1}]|[\u{27B0}]|[\u{27BF}]|[\u{2934}-\u{2935}]|[\u{2B05}-\u{2B07}]|[\u{2B1B}-\u{2B1C}]|[\u{2B50}]|[\u{2B55}]|[\u{3030}]|[\u{303D}]|[\u{3297}]|[\u{3299}]/gu, '').replace(/▣/g, '').trim();

    return (
        <div className={`bg-white dark:bg-[#1F2937] border-t-4 border-t-[#0B74B0] border border-[#D1D5DB] dark:border-gray-700 rounded-lg p-3 sm:p-4 lg:p-6 shadow-md hover:shadow-lg transition-shadow overflow-visible flex flex-col ${className}`}>
            <div className="flex flex-wrap justify-between items-start gap-y-2 gap-x-4 mb-4 sm:mb-6 min-h-[32px] border-b border-gray-100 dark:border-gray-700 pb-2">
                <h3 className="text-sm sm:text-base font-bold text-[#1F2937] dark:text-white flex items-start gap-2">
                    <span className="leading-tight">{cleanTitle}</span>
                </h3>
                {controls && (
                    <div className="flex flex-wrap items-center justify-end gap-2 flex-grow sm:flex-grow-0">
                        {controls}
                    </div>
                )}
            </div>
            <div className="flex-1 w-full relative">
                {children}
            </div>
        </div>
    );
}

// Custom Styles
const style = `
                        .custom-scrollbar::-webkit-scrollbar {
                            width: 4px;
  }
                        .custom-scrollbar::-webkit-scrollbar-track {
                            background: transparent;
  }
                        .custom-scrollbar::-webkit-scrollbar-thumb {
                            background: #E2E8F0;
                        border-radius: 10px;
  }
                        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                            background: #CBD5E1;
  }
                        `;

if (typeof document !== 'undefined') {
    const styleTag = document.createElement('style');
    styleTag.innerHTML = style;
    document.head.appendChild(styleTag);
}