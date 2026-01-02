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

    // KPI Specific Filters
    const [kpi1Scope, setKpi1Scope] = useState('Overall');
    const [kpi2Scope, setKpi2Scope] = useState('Overall');
    const [kpi3Scope, setKpi3Scope] = useState('Overall');
    const [kpi4Scope, setKpi4Scope] = useState('Overall');

    const { data: allProjects = [], isLoading } = useQuery<CommissioningProject[]>({
        queryKey: ['commissioning-projects-all', fiscalYear],
        queryFn: async () => {
            const response = await fetch(`/api/commissioning-projects?fiscalYear=${fiscalYear}`);
            if (!response.ok) throw new Error('Failed to fetch projects');
            return response.json();
        }
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
    const kpi1 = getKPIData(kpi1Scope);
    const kpi2 = getKPIData(kpi2Scope);
    const kpi3 = getKPIData(kpi3Scope);
    const kpi4 = getKPIData(kpi4Scope);

    const kpiScopes = ['Overall', 'Solar', 'Wind'];


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

    const filteredTimelineProjects = useMemo(() => {
        let projs = allProjects.filter(p => p.includedInTotal);
        if (mainTimelineProject !== 'All Projects') projs = projs.filter(p => p.projectName === mainTimelineProject);
        if (mainTimelineSPV !== 'All SPVs') projs = projs.filter(p => p.spv === mainTimelineSPV);
        return projs;
    }, [allProjects, mainTimelineProject, mainTimelineSPV]);

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
        let plan = overallKpi.plan;
        let actual = overallKpi.actual;
        if (achieveView !== 'yearly') {
            const source = achieveView === 'monthly' ? monthlyData : achieveView === 'half-yearly' ? halfYearlyData : quarterlyData;
            plan = source.reduce((s, d: any) => s + (d['PPA Plan'] || 0), 0);
            actual = source.reduce((s, d: any) => s + (d['Actual Commissioning'] || 0), 0);
        }
        return {
            achievement: plan > 0 ? (actual / plan) * 100 : 0,
            chart: [
                { name: 'Completed', value: actual, color: '#10B981' },
                { name: 'Remaining PPA', value: Math.max(0, plan - actual), color: '#3B82F620' },
            ]
        };
    }, [overallKpi, achieveView, monthlyData, halfYearlyData, quarterlyData]);

    const techSplitData = useMemo(() => {
        let projects = allProjects.filter(p => p.planActual === 'Plan' && p.includedInTotal);
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
        return [
            { name: 'Solar', value: solar, color: '#F97316' },
            { name: 'Wind', value: wind, color: '#06B6D4' },
        ].filter(d => d.value > 0);
    }, [allProjects, techMixProject, techMixStatus]);

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
        <div className="min-h-screen bg-gray-50/50 dark:bg-[#111] p-4 lg:p-8 space-y-8 font-sans selection:bg-blue-200">
            {/* Top Glass Header & Primary Filters */}
            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="sticky top-0 z-[100] bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-gray-200 dark:border-gray-800 rounded-3xl p-5 shadow-2xl"
            >
                <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-2 sm:p-3 bg-blue-600 rounded-xl sm:rounded-2xl shadow-lg shadow-blue-500/20">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-8 sm:w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-3xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                Executive Insights
                            </h1>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                <p className="text-[10px] sm:text-sm font-medium text-gray-400">AGEL Execution Tracker •</p>
                                <CardSelect
                                    label="FISCAL YEAR"
                                    options={['2024-25', '2025-26', '2026-27']}
                                    value={selectedFY}
                                    onChange={setSelectedFY}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        <nav className="flex bg-gray-100 dark:bg-gray-800 p-1.5 rounded-2xl">
                            {[
                                { id: 'overview', label: 'Overview', icon: '▣' },
                                { id: 'solar', label: 'Solar', icon: '☀️' },
                                { id: 'wind', label: 'Wind', icon: '🌬️' },
                                { id: 'models', label: 'Models', icon: '💼' },
                                { id: 'deviation', label: 'Deviation', icon: '⚠️' }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveDashboard(tab.id as any)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${activeDashboard === tab.id
                                        ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-md scale-105'
                                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white'}`}
                                >
                                    <span>{tab.icon}</span>
                                    {tab.label}
                                </button>
                            ))}
                        </nav>

                        <div className="h-8 w-[1px] bg-gray-200 dark:bg-gray-800 hidden lg:block" />

                        <div className="flex items-center gap-3">
                            <GlobalSlicer
                                label="Type"
                                options={['All', 'Solar', 'Wind']}
                                value={categoryFilter}
                                onChange={(v: string) => setCategoryFilter(v.toLowerCase() as any)}
                            />
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* KPI Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard
                    label="PPA PORTFOLIO PLAN"
                    value={kpi1.plan}
                    unit="MW"
                    trend={`Total: ${kpi1.projectsCount} Projects`}
                    gradient="from-blue-600 to-indigo-700"
                    scope={kpi1Scope}
                    onScopeChange={setKpi1Scope}
                    options={kpiScopes}
                />
                <KPICard
                    label="ACTUAL COMMISSIONING"
                    value={kpi2.actual}
                    unit="MW"
                    trend={`${kpi2.achievement.toFixed(1)}% of Plan`}
                    gradient="from-emerald-500 to-teal-600"
                    scope={kpi2Scope}
                    onScopeChange={setKpi2Scope}
                    options={kpiScopes}
                />
                <KPICard
                    label="STATUS PERFORMANCE"
                    value={kpi3.achievement.toFixed(1)}
                    unit="%"
                    trend={kpi3.achievement > 70 ? "Excellent" : "On Track"}
                    gradient="from-indigo-500 to-purple-600"
                    scope={kpi3Scope}
                    onScopeChange={setKpi3Scope}
                    options={kpiScopes}
                />
                <KPICard
                    label="EXECUTION DEVIATION"
                    value={kpi4.actual - kpi4.plan}
                    unit="MW"
                    trend={kpi4.actual >= kpi4.plan ? "Above Target" : "Below Target"}
                    gradient={kpi4.actual >= kpi4.plan ? "from-emerald-400 to-emerald-600" : "from-rose-500 to-red-700"}
                    scope={kpi4Scope}
                    onScopeChange={setKpi4Scope}
                    options={kpiScopes}
                />
            </div>

            {/* SECTION HEADER */}
            <div className="flex items-center gap-4 mb-2">
                <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-blue-200 dark:via-blue-900 to-transparent" />
                <h2 className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.3em]">
                    PORTFOLIO ANALYTICS • BI DASHBOARD
                </h2>
                <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-blue-200 dark:via-blue-900 to-transparent" />
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={activeDashboard + categoryFilter}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-8 w-full"
                >
                    {activeDashboard === 'overview' && (
                        <div className="flex flex-col lg:flex-row gap-8 items-stretch w-full">
                            <div className="w-full lg:w-1/3 flex flex-col gap-8">
                                <ChartContainer
                                    title="📊 Overall Achievement Gauge"
                                    controls={<ViewPivot active={achieveView} onChange={setAchieveView} />}
                                >
                                    <div className="h-[250px] relative">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie data={gaugeData.chart} innerRadius={75} outerRadius={95} paddingAngle={5} dataKey="value" stroke="none">
                                                    {gaugeData.chart.map((e, i) => <Cell key={i} fill={e.color} />)}
                                                </Pie>
                                                <Tooltip
                                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                                    formatter={(v: any) => `${v.toLocaleString()} MW`}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                            <span className="text-4xl font-black text-gray-800 dark:text-white">{gaugeData.achievement.toFixed(1)}%</span>
                                            <span className="text-xs font-bold text-gray-400 uppercase">Achievement</span>
                                        </div>
                                    </div>
                                </ChartContainer>

                                <ChartContainer
                                    title={techMixProject !== 'All Projects' ? `⚡ ${techMixProject} Mix` : "⚡ Technology Mix"}
                                    controls={
                                        <div className="flex gap-2">
                                            <CardSelect label="PROJECT" options={projectOptions} value={techMixProject} onChange={setTechMixProject} />
                                            <CardSelect label="STATUS" options={['All Projects', 'Completed', 'Upcoming']} value={techMixStatus} onChange={setTechMixStatus} />
                                        </div>
                                    }
                                >
                                    <div className="h-[220px] relative">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={techSplitData}
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    dataKey="value"
                                                    stroke="none"
                                                    animationBegin={0}
                                                    animationDuration={800}
                                                >
                                                    {techSplitData.map((e, i) => <Cell key={i} fill={e.color} />)}
                                                </Pie>
                                                <Tooltip
                                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                    formatter={(v: any, name: any) => [`${v.toLocaleString()} MW`, name]}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                            <span className="text-2xl font-black text-gray-800 dark:text-white">
                                                {techSplitData.reduce((s, p) => s + p.value, 0).toLocaleString()}
                                            </span>
                                            <span className="text-[8px] font-black text-gray-400 uppercase">Total MW</span>
                                        </div>
                                    </div>
                                    <div className="flex justify-center gap-6 mt-4">
                                        {techSplitData.map(d => {
                                            const total = techSplitData.reduce((s, x) => s + x.value, 0);
                                            const perc = total > 0 ? (d.value / total) * 100 : 0;
                                            return (
                                                <div key={d.name} className="flex flex-col items-center">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                                                        <span className="text-[10px] font-black text-gray-500 uppercase">{d.name}</span>
                                                    </div>
                                                    <span className="text-xs font-black text-gray-900 dark:text-white">{d.value.toLocaleString()} MW</span>
                                                    <span className="text-[9px] font-bold text-blue-500">{perc.toFixed(1)}%</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </ChartContainer>
                            </div>

                            <div className="w-full lg:w-2/3 flex flex-col min-w-0">
                                <ChartContainer
                                    title={mainTimelineProject !== 'All Projects' ? `📈 ${mainTimelineProject} Performance` : (timelineView === 'monthly' ? "📅 Monthly Timeline" : timelineView === 'quarterly' ? "📊 Quarterly Performance" : timelineView === 'half-yearly' ? "📅 Half-Yearly View" : "📈 Annual Summary")}
                                    controls={
                                        <div className="flex flex-wrap items-end gap-4">
                                            <CardSelect label="PROJECT" options={projectOptions} value={mainTimelineProject} onChange={setMainTimelineProject} />
                                            <CardSelect label="SPV VIEW" options={spvOptions} value={mainTimelineSPV} onChange={setMainTimelineSPV} />
                                            <ViewPivot active={timelineView} onChange={setTimelineView} />
                                        </div>
                                    }
                                >
                                    <ResponsiveContainer width="100%" height={560}>
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
                                                            <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 min-w-[200px]">
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
                                                                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                                                    Max Info Context Available
                                                                </div>
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                }}
                                            />
                                            <Legend iconType="rect" verticalAlign="top" align="right" />
                                            <Bar dataKey="PPA Plan" name="📋 PPA Plan" fill="url(#gradientPlan)" radius={[6, 6, 0, 0]} barSize={24} />
                                            <Bar dataKey="Actual Commissioning" name="✅ Actual Commissioning" fill="url(#gradientActual)" radius={[6, 6, 0, 0]} barSize={24} />
                                            <Bar dataKey="Rephase Strategy" name="🔄 Rephase Strategy" fill="url(#gradientRephase)" radius={[6, 6, 0, 0]} barSize={24} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </ChartContainer>
                            </div>
                        </div>
                    )}

                    {activeDashboard === 'solar' && (
                        <div className="bg-gradient-to-br from-orange-50/50 via-white to-white dark:from-orange-950/20 dark:via-gray-900 dark:to-gray-900 rounded-[3rem] p-8 border border-orange-100/50 dark:border-gray-800 shadow-xl space-y-8">
                            <div className="flex justify-between items-center">
                                <h3 className="text-2xl font-black text-gray-800 dark:text-white flex items-center gap-4">
                                    <span className="p-3 bg-orange-500 rounded-2xl text-white shadow-lg shadow-orange-500/30 text-2xl">☀️</span>
                                    Solar Portfolio Analysis
                                </h3>
                                <div className="flex gap-4">
                                    <MultiSlicer label="Projects" options={SECTION_OPTIONS.filter(s => s.label.includes('Solar'))} selected={selectedSections} onChange={setSelectedSections} />
                                </div>
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
                                            <Tooltip formatter={(v: any) => `${v.toLocaleString()} MW`} />
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
                                            <Tooltip formatter={(v: any) => `${v.toLocaleString()} MW`} />
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
                        <div className="bg-gradient-to-br from-cyan-50/50 via-white to-white dark:from-cyan-950/20 dark:via-gray-900 dark:to-gray-900 rounded-[3rem] p-8 border border-cyan-100/50 dark:border-gray-800 shadow-xl space-y-8">
                            <div className="flex justify-between items-center">
                                <h3 className="text-2xl font-black text-gray-800 dark:text-white flex items-center gap-4">
                                    <span className="p-3 bg-cyan-500 rounded-2xl text-white shadow-lg shadow-cyan-500/30 text-2xl">🌬️</span>
                                    Wind Portfolio Analysis
                                </h3>
                                <div className="flex gap-4">
                                    <MultiSlicer label="Projects" options={SECTION_OPTIONS.filter(s => s.label.includes('Wind'))} selected={selectedSections} onChange={setSelectedSections} />
                                </div>
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
                                            <Tooltip formatter={(v: any) => `${v.toLocaleString()} MW`} />
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
                                            <Tooltip formatter={(v: any) => `${v.toLocaleString()} MW`} />
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
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <ChartContainer
                                    title="💼 Business Model Distribution"
                                    controls={<CardSelect label="METRIC" options={['Capacity Share', 'Project Count']} value={modelMetric} onChange={setModelMetric} />}
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
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <ChartContainer
                                    title="⚠️ Target Deviation (Actual vs Plan)"
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
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

// Sub-components
function GlobalSlicer({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (v: string) => void }) {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="flex flex-col gap-1 relative items-end">
            <span className="text-[8px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest">{label}</span>
            <button
                onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
                className="flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-[11px] font-black text-gray-700 dark:text-gray-200 hover:border-indigo-400 transition-all shadow-md group/gs"
            >
                {value.toUpperCase()}
                <span className={`text-[8px] opacity-40 group-hover/gs:text-indigo-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
            </button>
            <AnimatePresence>
                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-[60]" onClick={() => setIsOpen(false)} />
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute top-full right-0 mt-2 w-40 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-2xl p-2 z-[70]"
                        >
                            {options.map(o => (
                                <button
                                    key={o}
                                    onClick={() => { onChange(o.toLowerCase() as any); setIsOpen(false); }}
                                    className={`w-full text-left px-4 py-2 text-[10px] font-black uppercase rounded-lg transition-colors ${value.toLowerCase() === o.toLowerCase() ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                                >
                                    {o}
                                </button>
                            ))}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

function ViewPivot({ active, onChange, label = "VIEW PERIOD" }: { active: string; onChange: (v: any) => void; label?: string }) {
    return (
        <div className="flex flex-col items-end gap-1">
            <span className="text-[8px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-[0.15em] mb-1">{label}</span>
            <div className="bg-gray-100/80 dark:bg-gray-800/80 p-1.5 rounded-xl flex items-center shadow-inner border border-gray-200 dark:border-gray-700 backdrop-blur-sm">
                {['yearly', 'half-yearly', 'quarterly', 'monthly'].map((v) => (
                    <button
                        key={v}
                        onClick={() => onChange(v as any)}
                        className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all duration-300 ${active === v
                            ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-lg scale-105'
                            : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
                    >
                        {v.replace('-yearly', '')}
                    </button>
                ))}
            </div>
        </div>
    );
}

function MultiSlicer({ label, options, selected, onChange }: { label: string; options: any[]; selected: string[]; onChange: (v: string[]) => void }) {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="flex flex-col gap-1 relative">
            <span className="text-[8px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest">{label}</span>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between gap-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-[11px] font-black text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500/20 cursor-pointer hover:border-indigo-400 transition-all shadow-sm min-w-[120px]"
            >
                <span className="truncate">{selected.includes('all') ? 'ALL PROJECTS' : `${selected.length} SELECTED`}</span>
                <span className="text-[8px] opacity-40">▼</span>
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-2xl p-3 z-50"
                    >
                        <div className="space-y-1 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                            <button
                                onClick={() => { onChange(['all']); setIsOpen(false); }}
                                className="w-full text-left px-3 py-2 text-xs font-bold hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl"
                            >
                                Show All
                            </button>
                            {options.map((o) => (
                                <div key={o.value} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selected.includes(o.value)}
                                        onChange={(e) => {
                                            const next = e.target.checked
                                                ? [...selected.filter(i => i !== 'all'), o.value]
                                                : selected.filter(i => i !== o.value);
                                            onChange(next.length === 0 ? ['all'] : next);
                                        }}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{o.label}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function CardSelect({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange?: (v: string) => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const buttonRef = React.useRef<HTMLButtonElement>(null);
    const [dropdownPos, setDropdownPos] = React.useState({ top: 0, right: 0 });

    const handleOpen = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setDropdownPos({
                top: rect.bottom + 8,
                right: window.innerWidth - rect.right,
            });
        }
        setIsOpen(!isOpen);
    };

    return (
        <div className="relative flex flex-col items-end">
            <span className="text-[8px] font-black text-white/60 uppercase tracking-[0.15em] mb-1">{label}</span>
            <button
                ref={buttonRef}
                onClick={handleOpen}
                className="flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl px-3 py-1.5 text-[10px] font-black uppercase text-white hover:bg-white/30 transition-all shadow-sm group/btn"
            >
                {value}
                <span className={`text-[8px] text-white/60 group-hover/btn:text-white transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>▼</span>
            </button>
            <AnimatePresence>
                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-[200]" onClick={() => setIsOpen(false)} />
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            style={{ top: dropdownPos.top, right: dropdownPos.right }}
                            className="fixed w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl p-2 z-[210] overflow-hidden"
                        >
                            {options.map(o => (
                                <button
                                    key={o}
                                    onClick={() => { onChange?.(o); setIsOpen(false); }}
                                    className={`w-full text-left px-4 py-2.5 text-[10px] font-black uppercase rounded-lg transition-colors ${value === o ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                                >
                                    {o}
                                </button>
                            ))}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}


function KPICard({ label, value, unit, trend, gradient, scope, onScopeChange, options }: { label: string; value: any; unit: string; trend: string; gradient: string; scope: string; onScopeChange: (v: string) => void; options: string[] }) {
    return (
        <motion.div
            whileHover={{ y: -5 }}
            className={`relative overflow-hidden bg-gradient-to-br ${gradient} p-4 sm:p-6 rounded-[2rem] shadow-xl border border-white/20`}
        >
            <div className="relative z-10 flex flex-col h-full justify-between gap-3 sm:gap-4">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <p className="text-[9px] sm:text-[10px] font-black text-white/70 uppercase tracking-widest">{label}</p>
                        <div className="flex items-baseline gap-1 sm:gap-2">
                            <h2 className="text-2xl sm:text-4xl font-black text-white leading-none">
                                {typeof value === 'number' ? value.toLocaleString(undefined, { maximumFractionDigits: 1 }) : value}
                            </h2>
                            <span className="text-xs sm:text-lg font-bold text-white/50">{unit}</span>
                        </div>
                    </div>
                    <CardSelect
                        label="SCOPE"
                        options={options}
                        value={scope}
                        onChange={onScopeChange}
                    />
                </div>
                <div className="flex items-center justify-between mt-auto">
                    <div className="bg-white/15 backdrop-blur-md rounded-2xl py-1 sm:py-2 px-2 sm:px-4 self-start border border-white/10">
                        <span className="text-[9px] sm:text-xs font-black text-white uppercase tracking-tighter">{trend}</span>
                    </div>
                    <span className="text-[8px] font-black text-white/30 uppercase">LIVE TRACE • OK</span>
                </div>
            </div>
            <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-1/4 -translate-y-1/4">
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-[15px] sm:border-[20px] border-white" />
            </div>
        </motion.div>
    );
}

function ChartContainer({ title, children, controls }: { title: string; children: React.ReactNode; controls?: React.ReactNode }) {
    return (
        <div className="bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-[2.5rem] p-4 lg:p-8 shadow-sm hover:shadow-2xl transition-all duration-500 overflow-visible relative group/card flex-1">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6 lg:mb-8">
                <h3 className="text-base lg:text-lg font-black text-gray-800 dark:text-white flex items-center gap-3">
                    <span className="w-1.5 h-6 bg-blue-600 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.5)]" />
                    {title}
                </h3>
                {controls && (
                    <div className="flex flex-wrap items-center gap-3">
                        {controls}
                    </div>
                )}
            </div>
            {children}
        </div>
    );
}
