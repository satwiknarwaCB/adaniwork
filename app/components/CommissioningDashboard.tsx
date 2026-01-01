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
    const [activeView, setActiveView] = useState<'yearly' | 'quarterly' | 'monthly'>('yearly');
    const [categoryFilter, setCategoryFilter] = useState<'all' | 'solar' | 'wind'>('all');
    const [selectedSections, setSelectedSections] = useState<string[]>(['all']);
    const [selectedModels, setSelectedModels] = useState<string[]>(['all']);

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
            if (categoryFilter === 'solar' && !p.category.toLowerCase().includes('solar')) return false;
            if (categoryFilter === 'wind' && !p.category.toLowerCase().includes('wind')) return false;
            if (!selectedSections.includes('all') && !selectedSections.includes(p.category)) return false;
            if (!selectedModels.includes('all') && !selectedModels.includes(p.projectType)) return false;
            return true;
        });
    }, [allProjects, categoryFilter, selectedSections, selectedModels]);

    const kpis = useMemo(() => {
        const planProjects = filteredProjects.filter(p => p.planActual === 'Plan');
        const actualProjects = filteredProjects.filter(p => p.planActual === 'Actual');
        const totalPlan = planProjects.reduce((s, p) => s + (p.capacity || 0), 0);
        const totalActual = actualProjects.reduce((s, p) => s + (p.totalCapacity || 0), 0);
        const achievement = totalPlan > 0 ? (totalActual / totalPlan) * 100 : 0;
        const variance = totalActual - totalPlan;
        const projectCount = new Set(planProjects.map(p => p.projectName)).size;
        return { totalPlan, totalActual, achievement, variance, projectCount };
    }, [filteredProjects]);

    const deviationData = [
        { name: 'Achieved', value: kpis.totalActual, color: '#10B981' },
        { name: 'Remaining', value: Math.max(0, kpis.totalPlan - kpis.totalActual), color: '#3B82F620' },
    ];

    const techSplitData = useMemo(() => {
        const planProjects = filteredProjects.filter(p => p.planActual === 'Plan');
        const solar = planProjects.filter(p => p.category.toLowerCase().includes('solar')).reduce((s, p) => s + (p.capacity || 0), 0);
        const wind = planProjects.filter(p => p.category.toLowerCase().includes('wind')).reduce((s, p) => s + (p.capacity || 0), 0);
        return [
            { name: 'Solar', value: solar, color: '#F97316' },
            { name: 'Wind', value: wind, color: '#06B6D4' },
        ].filter(d => d.value > 0);
    }, [filteredProjects]);

    const modelSplitData = useMemo(() => {
        const planProjects = filteredProjects.filter(p => p.planActual === 'Plan');
        return [
            { name: 'PPA', value: planProjects.filter(p => p.projectType === 'PPA').reduce((s, p) => s + (p.capacity || 0), 0), color: '#8B5CF6' },
            { name: 'Merchant', value: planProjects.filter(p => p.projectType === 'Merchant').reduce((s, p) => s + (p.capacity || 0), 0), color: '#EC4899' },
            { name: 'Group', value: planProjects.filter(p => p.projectType === 'Group').reduce((s, p) => s + (p.capacity || 0), 0), color: '#14B8A6' },
        ].filter(d => d.value > 0);
    }, [filteredProjects]);

    const quarterlyData = useMemo(() => {
        return ['Q1', 'Q2', 'Q3', 'Q4'].map((q, idx) => {
            const key = `q${idx + 1}` as 'q1' | 'q2' | 'q3' | 'q4';
            return {
                name: q,
                Plan: filteredProjects.filter(p => p.planActual === 'Plan').reduce((s, p) => s + (p[key] || 0), 0),
                Actual: filteredProjects.filter(p => p.planActual === 'Actual').reduce((s, p) => s + (p[key] || 0), 0),
                Rephase: filteredProjects.filter(p => p.planActual === 'Rephase').reduce((s, p) => s + (p[key] || 0), 0),
            };
        });
    }, [filteredProjects]);

    const monthlyData = useMemo(() => {
        return monthKeys.map((key, idx) => {
            const planVal = filteredProjects.filter(p => p.planActual === 'Plan').reduce((s, p) => s + ((p as any)[key] || 0), 0);
            const actualVal = filteredProjects.filter(p => p.planActual === 'Actual').reduce((s, p) => s + ((p as any)[key] || 0), 0);
            const rephaseVal = filteredProjects.filter(p => p.planActual === 'Rephase').reduce((s, p) => s + ((p as any)[key] || 0), 0);
            return {
                name: monthLabels[idx],
                Plan: planVal,
                Actual: actualVal,
                Rephase: rephaseVal,
                Deviation: actualVal - planVal,
            };
        });
    }, [filteredProjects]);

    const cumulativeData = useMemo(() => {
        let cumPlan = 0;
        let cumActual = 0;
        return monthlyData.map(m => {
            cumPlan += m.Plan;
            cumActual += m.Actual;
            return {
                name: m.name,
                Plan: cumPlan,
                Actual: cumActual,
            };
        });
    }, [monthlyData]);

    if (isLoading) return <div className="p-20 text-center animate-pulse">Initializing Adani BI Engine...</div>;

    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-[#111] p-4 lg:p-8 space-y-8 font-sans selection:bg-blue-200">
            {/* Top Glass Header & Primary Filters */}
            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="sticky top-0 z-40 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-white/20 dark:border-gray-800 rounded-3xl p-5 shadow-2xl shadow-blue-500/10"
            >
                <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
                    <div>
                        <h1 className="text-3xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            Executive Insights
                        </h1>
                        <p className="text-sm font-medium text-gray-400">AGEL Execution Tracker • FY 2025-26</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <ViewPivot active={activeView} onChange={setActiveView} />
                        <div className="h-8 w-[1px] bg-gray-200 dark:bg-gray-800 hidden lg:block" />
                        <GlobalSlicer
                            label="Category"
                            options={['All', 'Solar', 'Wind']}
                            value={categoryFilter}
                            onChange={(v: string) => setCategoryFilter(v.toLowerCase() as any)}
                        />
                        <MultiSlicer
                            label="Sections"
                            options={SECTION_OPTIONS}
                            selected={selectedSections}
                            onChange={setSelectedSections}
                        />
                    </div>
                </div>
            </motion.div>

            {/* KPI Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard
                    label="Portfolio Plan"
                    value={kpis.totalPlan}
                    unit="MW"
                    trend={`Total: ${kpis.projectCount} Projects`}
                    gradient="from-blue-500 to-blue-700"
                />
                <KPICard
                    label="Current Achievement"
                    value={kpis.totalActual}
                    unit="MW"
                    trend={`${kpis.achievement.toFixed(1)}% of Plan`}
                    gradient="from-emerald-500 to-teal-600"
                />
                <KPICard
                    label="Status Performance"
                    value={kpis.achievement.toFixed(1)}
                    unit="%"
                    trend={kpis.achievement > 70 ? "Excellent" : "On Track"}
                    gradient="from-indigo-500 to-purple-600"
                />
                <KPICard
                    label="Target Deviation"
                    value={kpis.variance}
                    unit="MW"
                    trend={kpis.variance >= 0 ? "Above Target" : "Below Target"}
                    gradient={kpis.variance >= 0 ? "from-emerald-400 to-emerald-600" : "from-rose-500 to-red-700"}
                />
            </div>

            {/* Content Views */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeView}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-8"
                >
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Summary Donuts */}
                        <div className="lg:col-span-1 flex flex-col gap-8">
                            <ChartContainer title="Efficiency Gauge">
                                <div className="h-[250px] relative">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={deviationData}
                                                innerRadius={75}
                                                outerRadius={95}
                                                paddingAngle={5}
                                                dataKey="value"
                                                stroke="none"
                                            >
                                                {deviationData.map((e, i) => <Cell key={i} fill={e.color} />)}
                                            </Pie>
                                            <Tooltip formatter={(v: any) => `${v.toLocaleString()} MW`} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                        <span className="text-4xl font-black text-gray-800 dark:text-white">
                                            {kpis.achievement.toFixed(1)}%
                                        </span>
                                        <span className="text-xs font-bold text-gray-400 uppercase">Achievement</span>
                                    </div>
                                </div>
                            </ChartContainer>

                            <ChartContainer title="Technology Mix">
                                <ResponsiveContainer width="100%" height={220}>
                                    <PieChart>
                                        <Pie data={techSplitData} innerRadius={60} outerRadius={80} dataKey="value" stroke="none">
                                            {techSplitData.map((e, i) => <Cell key={i} fill={e.color} />)}
                                        </Pie>
                                        <Tooltip formatter={(v: any) => `${v.toLocaleString()} MW`} />
                                        <Legend verticalAlign="bottom" iconType="circle" />
                                    </PieChart>
                                </ResponsiveContainer>
                            </ChartContainer>
                        </div>

                        {/* Primary Trend Bar Chart */}
                        <div className="lg:col-span-2">
                            <ChartContainer title={activeView === 'monthly' ? "Execution Timeline" : "Quarterly Performance"}>
                                <ResponsiveContainer width="100%" height={560}>
                                    <BarChart data={activeView === 'monthly' ? monthlyData : quarterlyData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                        {GRADIENTS}
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                            cursor={{ fill: '#f1f5f9' }}
                                            formatter={(v: any) => `${v.toLocaleString()} MW`}
                                        />
                                        <Legend iconType="rect" verticalAlign="top" align="right" />
                                        <Bar dataKey="Plan" fill="url(#gradientPlan)" radius={[6, 6, 0, 0]} barSize={24} />
                                        <Bar dataKey="Actual" fill="url(#gradientActual)" radius={[6, 6, 0, 0]} barSize={24} />
                                        {(activeView === 'yearly' || activeView === 'quarterly') && <Bar dataKey="Rephase" fill="url(#gradientRephase)" radius={[6, 6, 0, 0]} barSize={24} />}
                                    </BarChart>
                                </ResponsiveContainer>
                            </ChartContainer>
                        </div>
                    </div>

                    {/* Quarterly Detail Cards (only in quarterly view) */}
                    {activeView === 'quarterly' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {quarterlyData.map((q) => (
                                <div key={q.name} className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
                                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">{q.name} Performance</p>
                                    <div className="flex items-baseline gap-2">
                                        <h4 className="text-2xl font-black text-gray-800 dark:text-white">{q.Actual.toLocaleString()}</h4>
                                        <span className="text-sm font-bold text-gray-400">/ {q.Plan.toLocaleString()} MW</span>
                                    </div>
                                    <div className="mt-4 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-emerald-500 rounded-full"
                                            style={{ width: `${Math.min(100, (q.Plan > 0 ? (q.Actual / q.Plan) * 100 : 0))}%` }}
                                        />
                                    </div>
                                    <p className="mt-2 text-[10px] font-bold text-emerald-600">
                                        {q.Plan > 0 ? ((q.Actual / q.Plan) * 100).toFixed(1) : 0}% Achieved
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Secondary Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <ChartContainer title="Business Model Distribution">
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie data={modelSplitData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" stroke="none">
                                        {modelSplitData.map((e, i) => <Cell key={i} fill={e.color} />)}
                                    </Pie>
                                    <Tooltip formatter={(v: any) => `${v.toLocaleString()} MW`} />
                                    <Legend iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        </ChartContainer>

                        <ChartContainer title="Execution Cumulative Progress">
                            <ResponsiveContainer width="100%" height={250}>
                                <LineChart data={cumulativeData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                    <Tooltip formatter={(v: any) => `${v.toLocaleString()} MW`} />
                                    <Legend />
                                    <Line type="monotone" dataKey="Actual" stroke="#10B981" strokeWidth={4} dot={{ r: 6, fill: "#10B981" }} />
                                    <Line type="monotone" dataKey="Plan" stroke="#3B82F6" strokeWidth={4} strokeDasharray="5 5" dot={{ r: 4 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    </div>

                    {/* Monthly Deviation (only in monthly view) */}
                    {activeView === 'monthly' && (
                        <ChartContainer title="Monthly Variance (Actual vs Plan)">
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                    <YAxis axisLine={false} tickLine={false} />
                                    <Tooltip formatter={(v: any) => `${v.toLocaleString()} MW`} />
                                    <Bar dataKey="Deviation" radius={[4, 4, 0, 0]}>
                                        {monthlyData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.Deviation >= 0 ? '#10B981' : '#F43F5E'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    )}
                </motion.div>
            </AnimatePresence>
            <ChatbotPanel />
        </div>
    );
}

// Sub-components
function ViewPivot({ active, onChange }: { active: string; onChange: (v: any) => void }) {
    return (
        <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl flex items-center">
            {['yearly', 'quarterly', 'monthly'].map((v) => (
                <button
                    key={v}
                    onClick={() => onChange(v)}
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all capitalize ${active === v
                        ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    {v}
                </button>
            ))}
        </div>
    );
}

function GlobalSlicer({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (v: string) => void }) {
    return (
        <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}:</span>
            <select
                value={value.charAt(0).toUpperCase() + value.slice(1)}
                onChange={(e) => onChange(e.target.value)}
                className="bg-transparent border-none text-sm font-bold text-gray-700 dark:text-gray-200 focus:ring-0 cursor-pointer"
            >
                {options.map((o: any) => <option key={o} value={o}>{o}</option>)}
            </select>
        </div>
    );
}

function MultiSlicer({ label, options, selected, onChange }: { label: string; options: any[]; selected: string[]; onChange: (v: string[]) => void }) {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-200"
            >
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}:</span>
                <span className="max-w-[100px] truncate">{selected.includes('all') ? 'All' : `${selected.length} selected`}</span>
                <span className="text-xs opacity-50">▼</span>
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
                            {options.map((o: any) => (
                                <div key={o.value} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selected.includes(o.value)}
                                        onChange={(e) => {
                                            const next = e.target.checked
                                                ? [...selected.filter((i: string) => i !== 'all'), o.value]
                                                : selected.filter((i: string) => i !== o.value);
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

function KPICard({ label, value, unit, trend, gradient }: { label: string; value: any; unit: string; trend: string; gradient: string }) {
    return (
        <motion.div
            whileHover={{ y: -5 }}
            className={`relative overflow-hidden bg-gradient-to-br ${gradient} p-6 rounded-3xl shadow-lg border border-white/10`}
        >
            <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                <div className="space-y-1">
                    <p className="text-[10px] font-black text-white/60 uppercase tracking-widest">{label}</p>
                    <div className="flex items-baseline gap-2">
                        <h2 className="text-4xl font-black text-white leading-none">
                            {typeof value === 'number' ? value.toLocaleString(undefined, { maximumFractionDigits: 1 }) : value}
                        </h2>
                        <span className="text-lg font-bold text-white/80">{unit}</span>
                    </div>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-2xl py-2 px-3 self-start">
                    <span className="text-xs font-bold text-white uppercase tracking-tighter">{trend}</span>
                </div>
            </div>
            {/* Background pattern */}
            <div className="absolute top-0 right-0 p-4 opacity-20 transform translate-x-1/4 -translate-y-1/4">
                <div className="w-32 h-32 rounded-full border-[20px] border-white/20" />
            </div>
        </motion.div>
    );
}


function ChartContainer({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[2rem] p-8 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden">
            <h3 className="text-lg font-black text-gray-800 dark:text-white mb-8 flex items-center gap-2">
                <span className="w-2 h-6 bg-blue-600 rounded-full" />
                {title}
            </h3>
            {children}
        </div>
    );
}

function ChatbotPanel() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Hello! I am your AGEL AI Analyst. How can I help you extract insights from the FY 25-26 commissioning data today?' }
    ]);

    const suggestions = [
        "What is the total solar capacity achieved?",
        "Show me lagging projects in Khavda.",
        "Compare Q2 Plan vs Actual.",
        "Summarize Wind performance."
    ];

    return (
        <div className="fixed bottom-8 right-8 z-50">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="absolute bottom-20 right-0 w-[400px] h-[600px] bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl border border-white/20 dark:border-gray-800 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden"
                    >
                        {/* Chat Header - Exact Adani Logo Gradient */}
                        <div className="p-6 bg-gradient-to-r from-[#007B9E] via-[#6C2B85] to-[#C02741] flex items-center justify-between shadow-lg">
                            <div className="flex items-center gap-3">
                                <div className="p-1.5 bg-white/15 rounded-xl relative flex items-center justify-center w-10 h-10 border border-white/20 shadow-inner">
                                    <svg viewBox="0 0 100 100" className="w-full h-full text-white fill-current">
                                        {/* Head Shape */}
                                        <path d="M25,40 Q25,20 50,20 Q75,20 75,40 L75,60 Q75,70 65,70 L35,70 Q25,70 25,60 Z" />
                                        {/* Visor Area - Adani Dark Blue */}
                                        <rect x="35" y="42" width="30" height="14" rx="7" fill="#00355f" />
                                        {/* Eyes - Adani Green */}
                                        <circle cx="44" cy="49" r="2.5" fill="#8cc63f" />
                                        <circle cx="56" cy="49" r="2.5" fill="#8cc63f" />
                                        {/* Headphones */}
                                        <rect x="18" y="45" width="7" height="20" rx="3.5" />
                                        <rect x="75" y="45" width="7" height="20" rx="3.5" />
                                        {/* Microphone Arm */}
                                        <path d="M78.5,65 Q78.5,80 65,80 L60,80" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
                                        {/* Adani Red accent */}
                                        <circle cx="58" cy="80" r="3.5" fill="#ee3124" />
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="text-white font-black leading-none">AGEL AI Analyst</h4>
                                    <p className="text-blue-100 text-[10px] font-bold uppercase tracking-widest mt-1">Real-time Insights</p>
                                </div>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="text-white/60 hover:text-white transition-colors">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                            {messages.map((m, i) => (
                                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] p-4 rounded-3xl text-sm font-medium ${m.role === 'user'
                                        ? 'bg-blue-600 text-white rounded-br-none'
                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-none'
                                        }`}>
                                        {m.content}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Suggested Pills */}
                        <div className="px-6 pb-2 flex flex-wrap gap-2">
                            {suggestions.map(s => (
                                <button key={s} className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-[10px] font-bold text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-full transition-all">
                                    {s}
                                </button>
                            ))}
                        </div>

                        {/* Input Area */}
                        <div className="p-6 border-t border-gray-100 dark:border-gray-800">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Ask for an insight..."
                                    className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl py-4 pl-6 pr-14 text-sm font-medium focus:ring-2 focus:ring-blue-500 transition-all dark:text-white"
                                />
                                <button className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Pulse Trigger Button - Exact Adani Logo Gradient */}
            <motion.button
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(!isOpen)}
                className="w-16 h-16 bg-gradient-to-br from-[#007B9E] via-[#6C2B85] to-[#C02741] rounded-full shadow-[0_10px_40px_-10px_rgba(108,43,133,0.5)] flex items-center justify-center relative overflow-hidden group border border-white/20"
            >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                {isOpen ? (
                    <svg className="w-8 h-8 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ) : (
                    <div className="relative flex items-center justify-center w-12 h-12">
                        <svg viewBox="0 0 100 100" className="w-full h-full text-white fill-current drop-shadow-xl">
                            {/* Head Shape */}
                            <path d="M25,40 Q25,20 50,20 Q75,20 75,40 L75,60 Q75,70 65,70 L35,70 Q25,70 25,60 Z" />
                            {/* Visor Area - Adani Dark Blue */}
                            <rect x="35" y="42" width="30" height="14" rx="7" fill="#00355f" />
                            {/* Eyes - Adani Green */}
                            <circle cx="44" cy="49" r="2.5" fill="#8cc63f" />
                            <circle cx="56" cy="49" r="2.5" fill="#8cc63f" />
                            {/* Headphones */}
                            <rect x="18" y="45" width="7" height="20" rx="3.5" />
                            <rect x="75" y="45" width="7" height="20" rx="3.5" />
                            {/* Microphone Arm */}
                            <path d="M78.5,65 Q78.5,80 65,80 L60,80" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
                            {/* Adani Yellow Accent */}
                            <circle cx="58" cy="80" r="3.5" fill="#fff200" />
                        </svg>
                    </div>
                )}
            </motion.button>
        </div>
    );
}
