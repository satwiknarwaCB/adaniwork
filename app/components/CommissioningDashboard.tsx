"use client";

import React, { useMemo, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, AreaChart, Area, LineChart, Line
} from 'recharts';
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

    const [solarQMode, setSolarQMode] = useState('Absolute');
    const [solarMMode, setSolarMMode] = useState('Monthly');
    const [windQMode, setWindQMode] = useState('Absolute');
    const [windMMode, setWindMMode] = useState('Monthly');
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
    const [techMixView, setTechMixView] = useState('yearly');
    const [techMixHovered, setTechMixHovered] = useState<any>(null);

    // Business Model Split Chart - separate state
    const [bizModelCategory, setBizModelCategory] = useState('All Categories');
    const [bizModelProject, setBizModelProject] = useState('All Projects');
    const [bizModelView, setBizModelView] = useState('yearly');

    // Status Type Filter (Plan/Rephase/Actual) - Main toggle
    const [selectedStatusType, setSelectedStatusType] = useState<'Plan' | 'Rephase' | 'Actual'>('Plan');
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
    const [modelsProject, setModelsProject] = useState('All Projects');

    // KPI scope derived from global category filter
    const globalKpiScope = categoryFilter === 'all' ? 'Overall' : categoryFilter === 'solar' ? 'Solar' : 'Wind';
    // Convert display FY (2025-26) to API format (FY_25-26)
    const apiFiscalYear = useMemo(() => {
        // "2025-26" -> "FY_25-26"
        const parts = selectedFY.split('-');
        if (parts.length === 2) {
            return `FY_${parts[0].slice(-2)}-${parts[1]}`;
        }
        return selectedFY;
    }, [selectedFY]);

    const { data: rawProjects = [], isLoading } = useQuery<CommissioningProject[]>({
        queryKey: ['commissioning-projects', apiFiscalYear],
        queryFn: async () => {
            const response = await fetch(`/api/commissioning-projects?fiscalYear=${apiFiscalYear}`);
            if (!response.ok) throw new Error('Failed to fetch projects');
            return response.json();
        },
        staleTime: 0,
    });

    // Deduplicate projects to prevent card inflation
    const allProjects = useMemo(() => {
        const seen = new Set();
        return rawProjects.filter(p => {
            const key = `${p.sno}-${p.projectName}-${p.spv}-${p.category}-${p.section}-${p.planActual}-${p.capacity}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }, [rawProjects]);

    const filteredProjects = useMemo(() => {
        return allProjects.filter(p => {
            if (!p.includedInTotal) return false;
            const cat = (p.category || '').toLowerCase();
            const sec = (p.section || '').toLowerCase();
            const name = (p.projectName || '').toLowerCase();

            if (categoryFilter === 'solar') {
                const isSolar = (cat.includes('solar') || name.includes('solar')) && !cat.includes('wind') && !name.includes('wind');
                if (!isSolar) return false;
            }
            if (categoryFilter === 'wind') {
                const isWind = (cat.includes('wind') || name.includes('wind')) && !cat.includes('solar') && !name.includes('solar');
                if (!isWind) return false;
            }

            if (activeDashboard === 'overview' && selectedSections.length > 0 && !selectedSections.includes('all')) {
                if (!selectedSections.includes(p.projectName)) return false;
            }
            return true;
        });
    }, [allProjects, categoryFilter, selectedSections, activeDashboard]);

    const getKPIData = useCallback((scope: string) => {
        let projs = allProjects.filter(p => p.includedInTotal);

        const isSolar = (p: CommissioningProject) => {
            const cat = (p.category || '').toLowerCase();
            const name = (p.projectName || '').toLowerCase();
            return (cat.includes('solar') || name.includes('solar')) && !cat.includes('wind') && !name.includes('wind');
        };

        const isWind = (p: CommissioningProject) => {
            const cat = (p.category || '').toLowerCase();
            const name = (p.projectName || '').toLowerCase();
            return (cat.includes('wind') || name.includes('wind')) && !cat.includes('solar') && !name.includes('solar');
        };

        if (scope === 'Solar') projs = projs.filter(isSolar);
        if (scope === 'Wind') projs = projs.filter(isWind);
        if (scope !== 'Overall' && scope !== 'Solar' && scope !== 'Wind') projs = projs.filter(p => p.projectName === scope);

        const plan = projs.filter(p => p.planActual === 'Plan').reduce((s, p) => s + (p.totalCapacity || 0), 0);
        const rephase = projs.filter(p => p.planActual === 'Rephase').reduce((s, p) => s + (p.totalCapacity || 0), 0);
        const actual = projs.filter(p => p.planActual === 'Actual').reduce((s, p) => s + (p.totalCapacity || 0), 0);

        // Count unique projects by name only (ignore planActual type) - matches individual pages
        const uniqueProjects = new Set(projs.map(p => `${p.projectName}|${p.spv}`)).size;

        // Return the value based on selected status type
        const selectedValue = selectedStatusType === 'Plan' ? plan : selectedStatusType === 'Rephase' ? rephase : actual;
        const comparisonBasis = selectedStatusType === 'Plan' ? plan : rephase; // Compare against plan or rephase
        const achievement = comparisonBasis > 0 ? (actual / comparisonBasis) * 100 : 0;

        return { plan, rephase, actual, selectedValue, projectsCount: uniqueProjects, achievement };
    }, [allProjects, selectedStatusType]);

    const formatNumber = (val: any) => {
        if (val === null || val === undefined) return '-';
        return Number(val).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    };

    const overallKpi = useMemo(() => getKPIData('Overall'), [getKPIData]);
    const kpi1 = useMemo(() => getKPIData(globalKpiScope), [getKPIData, globalKpiScope]);
    const kpi2 = useMemo(() => getKPIData(globalKpiScope), [getKPIData, globalKpiScope]);
    const kpi3 = useMemo(() => getKPIData(globalKpiScope), [getKPIData, globalKpiScope]);
    const kpi4 = useMemo(() => getKPIData(globalKpiScope), [getKPIData, globalKpiScope]);

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

        // Apply business model filter
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
            'Target Plan': filteredTimelineProjects.filter(p => p.planActual === 'Plan').reduce((s, p) => s + h.months.reduce((ms, m) => ms + ((p as any)[m] || 0), 0), 0),
            'Actual Commissioning': filteredTimelineProjects.filter(p => p.planActual === 'Actual').reduce((s, p) => s + h.months.reduce((ms, m) => ms + ((p as any)[m] || 0), 0), 0),
            'Rephase Strategy': filteredTimelineProjects.filter(p => p.planActual === 'Rephase').reduce((s, p) => s + h.months.reduce((ms, m) => ms + ((p as any)[m] || 0), 0), 0),
        }));
    }, [filteredTimelineProjects]);

    const quarterlyData = useMemo(() => {
        return ['Q1', 'Q2', 'Q3', 'Q4'].map((q, idx) => {
            const key = `q${idx + 1}` as 'q1' | 'q2' | 'q3' | 'q4';
            return {
                name: q,
                'Target Plan': filteredTimelineProjects.filter(p => p.planActual === 'Plan').reduce((s, p) => s + ((p as any)[key] || 0), 0),
                'Actual Commissioning': filteredTimelineProjects.filter(p => p.planActual === 'Actual').reduce((s, p) => s + ((p as any)[key] || 0), 0),
                'Rephase Strategy': filteredTimelineProjects.filter(p => p.planActual === 'Rephase').reduce((s, p) => s + ((p as any)[key] || 0), 0),
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
                'Target Plan': planVal,
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
            // Use totalCapacity (sum of monthly phasing) NOT capacity (static rating)
            plan = projs.filter(p => p.planActual === 'Plan').reduce((s, p) => s + (p.totalCapacity || 0), 0);
            actual = projs.filter(p => p.planActual === 'Actual').reduce((s, p) => s + (p.totalCapacity || 0), 0);
            periodName = 'Full FY';
        } else if (achieveView === 'half-yearly') {
            // H2: Oct-Mar (Current Half)
            const months = ['oct', 'nov', 'dec', 'jan', 'feb', 'mar'];
            plan = projs.filter(p => p.planActual === 'Plan').reduce((s, p) => s + months.reduce((ms, m) => ms + ((p as any)[m] || 0), 0), 0);
            actual = projs.filter(p => p.planActual === 'Actual').reduce((s, p) => s + months.reduce((ms, m) => ms + ((p as any)[m] || 0), 0), 0);
            periodName = 'H2 (Oct-Mar)';
        } else if (achieveView === 'quarterly') {
            // Q3: Oct-Dec (Current Quarter)
            plan = projs.filter(p => p.planActual === 'Plan').reduce((s, p) => s + (p.q3 || 0), 0);
            actual = projs.filter(p => p.planActual === 'Actual').reduce((s, p) => s + (p.q3 || 0), 0);
            periodName = 'Q3 (Oct-Dec)';
        } else if (achieveView === 'monthly') {
            // October (Current Month)
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

        // Calculate based on period view - ALWAYS use totalCapacity for yearly
        const getValueByPeriod = (p: CommissioningProject) => {
            if (techMixView === 'yearly') return p.totalCapacity || 0;
            if (techMixView === 'half-yearly') return (p.q1 || 0) + (p.q2 || 0); // Shows H1
            if (techMixView === 'quarterly') return p.q3 || 0; // Shows current Q3
            if (techMixView === 'monthly') return p.oct || 0; // Shows current Oct
            return p.totalCapacity || 0;
        };

        const solar = projects.filter(p => p.category?.toLowerCase().includes('solar')).reduce((s, p) => s + getValueByPeriod(p), 0);
        const wind = projects.filter(p => p.category?.toLowerCase().includes('wind')).reduce((s, p) => s + getValueByPeriod(p), 0);

        return {
            data: [
                { name: 'Solar', value: solar, color: '#F97316' },
                { name: 'Wind', value: wind, color: '#06B6D4' },
            ].filter(d => d.value > 0),
            total: solar + wind
        };
    }, [allProjects, techMixProject, techMixStatus, techMixCategory, techMixView]);


    const modelSplitData = useMemo(() => {
        let projects = allProjects.filter(p => p.planActual === 'Plan' && p.includedInTotal);

        // If we are in the dedicated models tab, use those specific filters
        if (activeDashboard === 'models') {
            if (modelsTechnology !== 'All') {
                projects = projects.filter(p => p.category?.toLowerCase().includes(modelsTechnology.toLowerCase()));
            }
            projects = filterByCategory(projects, modelsCategory);
            if (modelsProject !== 'All Projects') {
                projects = projects.filter(p => p.projectName === modelsProject);
            }
        } else {
            // Otherwise use the overview ones
            projects = filterByCategory(projects, bizModelCategory);
            if (bizModelProject !== 'All Projects') {
                projects = projects.filter(p => p.projectName === bizModelProject);
            }
        }

        // Use totalCapacity for yearly view, NOT capacity
        const getValueByPeriod = (p: CommissioningProject) => {
            if (bizModelView === 'yearly') return p.totalCapacity || 0;
            if (bizModelView === 'half-yearly') return (p.q1 || 0) + (p.q2 || 0);
            if (bizModelView === 'quarterly') return p.q3 || 0;
            if (bizModelView === 'monthly') return p.oct || 0;
            return p.totalCapacity || 0;
        };

        const metric = activeDashboard === 'models' ? modelMetric : 'Capacity Share';

        return [
            { name: 'PPA', value: projects.filter(p => p.projectType === 'PPA').reduce((s, p) => s + (metric === 'Project Count' ? 1 : getValueByPeriod(p)), 0), color: '#8B5CF6' },
            { name: 'Merchant', value: projects.filter(p => p.projectType === 'Merchant').reduce((s, p) => s + (metric === 'Project Count' ? 1 : getValueByPeriod(p)), 0), color: '#EC4899' },
            { name: 'Group', value: projects.filter(p => p.projectType === 'Group').reduce((s, p) => s + (metric === 'Project Count' ? 1 : getValueByPeriod(p)), 0), color: '#14B8A6' },
        ].filter(d => d.value > 0);
    }, [allProjects, bizModelCategory, bizModelProject, bizModelView, modelsTechnology, modelsCategory, modelsProject, activeDashboard, modelMetric]);

    const cumulativeData = useMemo(() => {
        let cumPlan = 0;
        let cumActual = 0;
        return monthlyData.map(m => {
            cumPlan += m['Target Plan'];
            cumActual += m['Actual Commissioning'];
            return {
                name: m.name,
                'Target Plan': cumPlan,
                'Actual Commissioning': cumActual,
            };
        });
    }, [monthlyData]);

    const solarData = useMemo(() => {
        let solarProjects = allProjects.filter(p => p.includedInTotal && p.category && p.category.toLowerCase().includes('solar'));
        solarProjects = filterByCategory(solarProjects, solarCategory);
        if (solarBusinessModel !== 'All Models') {
            solarProjects = solarProjects.filter(p => p.projectType === solarBusinessModel);
        }
        if (!selectedSections.includes('all')) {
            solarProjects = solarProjects.filter(p => selectedSections.includes(p.category));
        }

        const planProjects = solarProjects.filter(p => p.planActual === 'Plan');
        const actualProjects = solarProjects.filter(p => p.planActual === 'Actual');
        // Use totalCapacity (sum of months) for correct totals
        const totalPlan = planProjects.reduce((s, p) => s + (p.totalCapacity || 0), 0);
        const totalActual = actualProjects.reduce((s, p) => s + (p.totalCapacity || 0), 0);

        const quarterlyAbs = ['Q1', 'Q2', 'Q3', 'Q4'].map((q, idx) => {
            const key = `q${idx + 1}` as 'q1' | 'q2' | 'q3' | 'q4';
            return {
                name: q,
                'Target Plan': planProjects.reduce((s, p) => s + ((p as any)[key] || 0), 0),
                'Actual Commissioning': actualProjects.reduce((s, p) => s + ((p as any)[key] || 0), 0),
            };
        });

        const monthlyAbs = monthKeys.map((key, idx) => ({
            name: monthLabels[idx],
            'Target Plan': planProjects.reduce((s, p) => s + ((p as any)[key] || 0), 0),
            'Actual Commissioning': actualProjects.reduce((s, p) => s + ((p as any)[key] || 0), 0),
        }));

        // Cumulative transforms
        let cPQ = 0, cAQ = 0;
        const quarterlyCum = quarterlyAbs.map(d => ({
            name: d.name,
            'Target Plan': (cPQ += d['Target Plan']),
            'Actual Commissioning': (cAQ += d['Actual Commissioning'])
        }));

        let cPM = 0, cAM = 0;
        const monthlyCum = monthlyAbs.map(d => ({
            name: d.name,
            'Target Plan': (cPM += d['Target Plan']),
            'Actual Commissioning': (cAM += d['Actual Commissioning'])
        }));

        return {
            totalPlan, totalActual,
            quarterly: solarQMode === 'Absolute' ? quarterlyAbs : quarterlyCum,
            monthly: solarMMode === 'Monthly' ? monthlyAbs : monthlyCum,
            projectCount: new Set(planProjects.map(p => p.projectName)).size
        };
    }, [allProjects, solarCategory, solarBusinessModel, selectedSections, solarQMode, solarMMode]);

    const windData = useMemo(() => {
        let windProjects = allProjects.filter(p => p.includedInTotal && p.category && p.category.toLowerCase().includes('wind'));
        windProjects = filterByCategory(windProjects, windCategory);
        if (windBusinessModel !== 'All Models') {
            windProjects = windProjects.filter(p => p.projectType === windBusinessModel);
        }
        if (!selectedSections.includes('all')) {
            windProjects = windProjects.filter(p => selectedSections.includes(p.section));
        }

        const planProjects = windProjects.filter(p => p.planActual === 'Plan');
        const actualProjects = windProjects.filter(p => p.planActual === 'Actual');
        const totalPlan = planProjects.reduce((s, p) => s + (p.capacity || 0), 0);
        const totalActual = actualProjects.reduce((s, p) => s + (p.totalCapacity || 0), 0);

        const quarterlyAbs = ['Q1', 'Q2', 'Q3', 'Q4'].map((q, idx) => {
            const key = `q${idx + 1}` as 'q1' | 'q2' | 'q3' | 'q4';
            return {
                name: q,
                'Target Plan': planProjects.reduce((s, p) => s + ((p as any)[key] || 0), 0),
                'Actual Commissioning': actualProjects.reduce((s, p) => s + ((p as any)[key] || 0), 0),
            };
        });

        const monthlyAbs = monthKeys.map((key, idx) => ({
            name: monthLabels[idx],
            'Target Plan': planProjects.reduce((s, p) => s + ((p as any)[key] || 0), 0),
            'Actual Commissioning': actualProjects.reduce((s, p) => s + ((p as any)[key] || 0), 0),
        }));

        // Cumulative transforms
        let cPQ = 0, cAQ = 0;
        const quarterlyCum = quarterlyAbs.map(d => ({
            name: d.name,
            'Target Plan': (cPQ += d['Target Plan']),
            'Actual Commissioning': (cAQ += d['Actual Commissioning'])
        }));

        let cPM = 0, cAM = 0;
        const monthlyCum = monthlyAbs.map(d => ({
            name: d.name,
            'Target Plan': (cPM += d['Target Plan']),
            'Actual Commissioning': (cAM += d['Actual Commissioning'])
        }));

        return {
            totalPlan, totalActual,
            quarterly: windQMode === 'Absolute' ? quarterlyAbs : quarterlyCum,
            monthly: windMMode === 'Monthly' ? monthlyAbs : monthlyCum,
            projectCount: new Set(planProjects.map(p => p.projectName)).size
        };
    }, [allProjects, windCategory, windBusinessModel, selectedSections, windQMode, windMMode]);

    const deviationChartData = useMemo(() => {
        let projects = allProjects;

        // Apply Global Category Slicer (Solar/Wind)
        if (categoryFilter !== 'all') {
            projects = projects.filter(p => p.category?.toLowerCase().includes(categoryFilter));
        }

        // Apply Timeline specific filters
        projects = filterByCategory(projects, timelineCategory);
        projects = filterByBusinessModel(projects, timelineBusinessModel);

        const planProjects = projects.filter(p => p.planActual === 'Plan' && p.includedInTotal);
        const actualProjects = projects.filter(p => p.planActual === 'Actual' && p.includedInTotal);

        const getSourceData = () => {
            if (deviationView === 'monthly') {
                return monthKeys.map((key, idx) => ({
                    name: monthLabels[idx],
                    'Target Plan': planProjects.reduce((s, p) => s + ((p as any)[key] || 0), 0),
                    'Actual Commissioning': actualProjects.reduce((s, p) => s + ((p as any)[key] || 0), 0),
                }));
            }
            if (deviationView === 'half-yearly') {
                return ['H1', 'H2'].map((h, idx) => {
                    const keys = idx === 0 ? ['q1', 'q2'] : ['q3', 'q4'];
                    return {
                        name: h,
                        'Target Plan': planProjects.reduce((s, p) => s + ((p as any)[keys[0]] || 0) + ((p as any)[keys[1]] || 0), 0),
                        'Actual Commissioning': actualProjects.reduce((s, p) => s + ((p as any)[keys[0]] || 0) + ((p as any)[keys[1]] || 0), 0),
                    };
                });
            }
            return ['Q1', 'Q2', 'Q3', 'Q4'].map((q, idx) => {
                const key = `q${idx + 1}` as 'q1' | 'q2' | 'q3' | 'q4';
                return {
                    name: q,
                    'Target Plan': planProjects.reduce((s, p) => s + ((p as any)[key] || 0), 0),
                    'Actual Commissioning': actualProjects.reduce((s, p) => s + ((p as any)[key] || 0), 0),
                };
            });
        }

        return getSourceData().map(q => ({
            name: q.name,
            Deviation: (q as any)['Actual Commissioning'] - (q as any)['Target Plan'],
        }));
    }, [allProjects, categoryFilter, timelineCategory, timelineBusinessModel, deviationView]);

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
                                Commissioning Tracker
                            </h1>
                            <div className="flex items-center gap-2 px-2 py-1 dark:bg-gray-800 rounded-md h-8">
                                <span className="text-xs font-medium text-[#4B5563] dark:text-gray-400 whitespace-nowrap pt-[2px]">FY</span>
                                <CardSelect
                                    label=""
                                    options={['2024-25', '2025-26', '2026-27']}
                                    value={selectedFY}
                                    onChange={setSelectedFY}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right: Global Filters Group */}
                    <div className="flex items-center gap-3">
                        {/* Plan/Rephase/Actual Toggle - Primary Status Filter */}
                        <div className="flex items-center h-8 bg-[#F3F4F6] dark:bg-gray-800 p-1 rounded-lg border border-[#D1D5DB] dark:border-gray-700">
                            {(['Plan', 'Rephase', 'Actual'] as const).map((opt) => (
                                <button
                                    key={opt}
                                    onClick={() => setSelectedStatusType(opt)}
                                    className={`h-full px-3 rounded-md text-[10px] sm:text-xs font-semibold transition-all ${selectedStatusType === opt
                                        ? opt === 'Plan' ? 'bg-[#0B74B0] text-white shadow-sm'
                                            : opt === 'Rephase' ? 'bg-[#F59E0B] text-white shadow-sm'
                                                : 'bg-[#10B981] text-white shadow-sm'
                                        : 'text-[#4B5563] dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700'
                                        }`}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>

                        {/* Category Filter - Horizontal Toggle */}
                        <div className="flex items-center h-8 bg-[#F3F4F6] dark:bg-gray-800 p-1 rounded-lg border border-[#D1D5DB] dark:border-gray-700">
                            {['All', 'Solar', 'Wind'].map((option) => (
                                <button
                                    key={option}
                                    onClick={() => setCategoryFilter(option.toLowerCase() as 'all' | 'solar' | 'wind')}
                                    className={`h-full px-4 rounded-md text-xs font-semibold transition-all ${categoryFilter === option.toLowerCase()
                                        ? 'bg-[#0B74B0] text-white shadow-sm'
                                        : 'text-[#4B5563] dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700'
                                        }`}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs - Clean aligned style */}
                <div className="mt-3 pt-3 border-t border-[#D1D5DB] dark:border-gray-700">
                    <nav className="flex items-center gap-1 bg-[#F5F7FA] dark:bg-gray-800 p-1 rounded-lg border border-[#D1D5DB] dark:border-gray-700 w-fit overflow-x-auto max-w-full">
                        {[
                            { id: 'overview', label: 'Overview' },
                            { id: 'solar', label: 'Solar' },
                            { id: 'wind', label: 'Wind' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    setActiveDashboard(tab.id as any);
                                    // Also update categoryFilter to match the tab
                                    if (tab.id === 'solar') setCategoryFilter('solar');
                                    else if (tab.id === 'wind') setCategoryFilter('wind');
                                    else if (tab.id === 'overview') setCategoryFilter('all');
                                }}
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

            {/* KPI Section - Shows data based on selected Status Type (Plan/Rephase/Actual) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-4">
                <KPICard
                    label={`${selectedStatusType.toUpperCase()} CAPACITY`}
                    value={kpi1.selectedValue}
                    unit="MW"
                    trend={`Base: ${kpi1.projectsCount} Project Segments`}
                    gradient={selectedStatusType === 'Plan' ? 'from-blue-600 to-indigo-700' : selectedStatusType === 'Rephase' ? 'from-amber-500 to-orange-600' : 'from-emerald-500 to-teal-600'}
                />
                <KPICard
                    label="ACTUAL COMMISSIONING"
                    value={kpi2.actual}
                    unit="MW"
                    trend={`Actual vs ${selectedStatusType} Target`}
                    gradient="from-emerald-500 to-teal-600"
                />
                <KPICard
                    label="STATUS PERFORMANCE"
                    value={kpi3.achievement.toFixed(2)}
                    unit="%"
                    trend={`Actual / ${selectedStatusType} Target (FY)`}
                    gradient="from-indigo-500 to-purple-600"
                />
            </div>


            {/* AGEL OVERALL EXECUTIVE SUMMARY TABLE - (1 + 2) */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="w-full"
            >
                <SummaryTable
                    title={`AGEL OVERALL FY 2025-26 (1 + 2)`}
                    projects={allProjects.filter(p => p.includedInTotal)}
                    monthColumns={monthKeys}
                    monthLabels={['APR-25', 'MAY-25', 'JUN-25', 'JUL-25', 'AUG-25', 'SEP-25', 'OCT-25', 'NOV-25', 'DEC-25', 'JAN-26', 'FEB-26', 'MAR-26']}
                    formatNumber={(val: number | null | undefined) => {
                        if (val === null || val === undefined) return '-';
                        return val.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
                    }}
                />
            </motion.div>

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
                    <div className="space-y-4 w-full">
                        {/* Row 1: Three Pie Charts */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Pie Chart 1: Achievement Gauge */}
                            <ChartContainer
                                title={`${achieveCategory === 'All Categories' ? 'Overall' : achieveCategory} Achievement`}
                                controls={
                                    <div className="flex flex-col gap-1.5 items-end relative z-[60]">
                                        <div className="flex items-center gap-1">
                                            <CardSelect label="" options={categoryOptions} value={achieveCategory} onChange={setAchieveCategory} />
                                            <CardSelect label="" options={projectOptions} value={achieveProject} onChange={setAchieveProject} />
                                        </div>
                                        <ViewPivot active={achieveView} onChange={setAchieveView} label="" />
                                    </div>
                                }
                            >
                                <div className="mb-2 text-center">
                                    <span className="text-[10px] font-bold text-[#0B74B0] dark:text-blue-400 uppercase tracking-widest bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full border border-blue-100 dark:border-blue-800 shadow-sm inline-block">
                                        {gaugeData.periodName} Target: {gaugeData.plan.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} MW
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
                                                {gaugeData.achievement.toFixed(1)}
                                                <span className="text-sm ml-0.5 font-bold text-gray-400">%</span>
                                            </span>
                                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mt-0.5">Achievement</span>
                                        </div>
                                        <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-800 w-24 flex flex-col items-center">
                                            <span className="text-[12px] font-bold text-[#10B981]">{gaugeData.actual.toLocaleString(undefined, { maximumFractionDigits: 1 })} MW</span>
                                            <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Achieved</span>
                                        </div>
                                    </div>
                                </div>
                            </ChartContainer>

                            {/* Pie Chart 2: Technology Mix (Solar vs Wind) */}
                            <ChartContainer
                                title="Technology Mix"
                                controls={
                                    <div className="flex flex-col gap-1.5 items-end relative z-[60]">
                                        <div className="flex items-center gap-1">
                                            <CardSelect label="" options={categoryOptions} value={techMixCategory} onChange={setTechMixCategory} />
                                            <CardSelect label="" options={projectOptions} value={techMixProject} onChange={setTechMixProject} />
                                        </div>
                                        <ViewPivot active={techMixView} onChange={setTechMixView} label="" />
                                    </div>
                                }
                            >
                                <div className="h-[180px] relative">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={techSplitData.data}
                                                innerRadius={55}
                                                outerRadius={75}
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
                                            {(techMixHovered ? techMixHovered.value : techSplitData.total).toLocaleString(undefined, { maximumFractionDigits: 1 })}
                                        </span>
                                        <span className="text-[8px] font-semibold text-gray-400 uppercase mt-0.5">
                                            {techMixHovered ? techMixHovered.name : "Total MW"}
                                        </span>
                                    </div>
                                </div>
                                {/* Legend */}
                                <div className="flex justify-center gap-6 mt-2">
                                    {techSplitData.data.map(d => {
                                        const perc = techSplitData.total > 0 ? (d.value / techSplitData.total) * 100 : 0;
                                        return (
                                            <div key={d.name} className={`flex flex-col items-center transition-all ${techMixHovered && techMixHovered.name !== d.name ? 'opacity-30' : 'opacity-100'}`}>
                                                <div className="flex items-center gap-1 mb-0.5">
                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                                                    <span className="text-[9px] font-semibold text-gray-500 uppercase">{d.name}</span>
                                                </div>
                                                <span className="text-xs font-bold text-gray-900 dark:text-white">{perc.toFixed(1)}%</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </ChartContainer>

                            {/* Pie Chart 3: Business Model Split (PPA / Merchant / Group) */}
                            <ChartContainer
                                title="Business Model Split"
                                controls={
                                    <div className="flex flex-col gap-1.5 items-end relative z-[60]">
                                        <div className="flex items-center gap-1">
                                            <CardSelect label="" options={categoryOptions} value={bizModelCategory} onChange={setBizModelCategory} />
                                            <CardSelect label="" options={projectOptions} value={bizModelProject} onChange={setBizModelProject} />
                                        </div>
                                    </div>
                                }
                            >
                                <div className="h-[180px] relative">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={modelSplitData}
                                                innerRadius={55}
                                                outerRadius={75}
                                                dataKey="value"
                                                stroke="none"
                                                animationBegin={0}
                                                animationDuration={800}
                                            >
                                                {modelSplitData.map((e, i) => (
                                                    <Cell key={i} fill={e.color} style={{ filter: 'url(#shadow)' }} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(v: any) => `${v.toLocaleString(undefined, { maximumFractionDigits: 1 })} MW`} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                        <span className="text-xl font-bold text-gray-800 dark:text-white leading-none">
                                            {modelSplitData.reduce((s, d) => s + d.value, 0).toLocaleString(undefined, { maximumFractionDigits: 1 })}
                                        </span>
                                        <span className="text-[8px] font-semibold text-gray-400 uppercase mt-0.5">Total MW</span>
                                    </div>
                                </div>
                                {/* Legend */}
                                <div className="flex justify-center gap-4 mt-2">
                                    {modelSplitData.map(d => {
                                        const total = modelSplitData.reduce((s, x) => s + x.value, 0);
                                        const perc = total > 0 ? (d.value / total) * 100 : 0;
                                        return (
                                            <div key={d.name} className="flex flex-col items-center">
                                                <div className="flex items-center gap-1 mb-0.5">
                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                                                    <span className="text-[9px] font-semibold text-gray-500 uppercase">{d.name}</span>
                                                </div>
                                                <span className="text-xs font-bold text-gray-900 dark:text-white">{perc.toFixed(1)}%</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </ChartContainer>
                        </div>

                        {/* Row 2: Quarterly Performance + Deviation Side by Side */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {/* Quarterly Performance Bar Chart */}
                            <ChartContainer
                                title={timelineView === 'monthly' ? "Monthly Timeline" : timelineView === 'quarterly' ? "Quarterly Performance" : timelineView === 'half-yearly' ? "Half-Yearly View" : "Annual Summary"}
                                controls={
                                    <div className="flex flex-wrap items-center gap-1">
                                        <CardSelect label="" options={categoryOptions} value={timelineCategory} onChange={setTimelineCategory} />
                                        <CardSelect label="" options={businessModelOptions} value={timelineBusinessModel} onChange={setTimelineBusinessModel} />
                                        <ViewPivot active={timelineView} onChange={setTimelineView} label="" />
                                    </div>
                                }
                            >
                                <ResponsiveContainer width="100%" height={240}>
                                    <BarChart data={timelineView === 'monthly' ? monthlyData : timelineView === 'half-yearly' ? halfYearlyData : quarterlyData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                                        {GRADIENTS}
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} width={40} />
                                        <Tooltip
                                            cursor={{ fill: '#f1f5f9' }}
                                            content={({ active, payload, label }) => {
                                                if (active && payload && payload.length) {
                                                    return (
                                                        <div className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 min-w-[180px]">
                                                            <p className="font-bold text-sm mb-1">{label}</p>
                                                            {payload.map((p: any) => (
                                                                <div key={p.name} className="flex justify-between items-center py-0.5 text-xs">
                                                                    <span className="text-gray-500 flex items-center gap-1">
                                                                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }}></span>
                                                                        {p.name}:
                                                                    </span>
                                                                    <span className="font-bold text-gray-900 dark:text-white">{p.value.toLocaleString()} MW</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Legend iconType="rect" verticalAlign="top" align="right" wrapperStyle={{ fontSize: '10px' }} />
                                        <Bar dataKey="PPA Plan" name="Plan" fill="url(#gradientPlan)" radius={[3, 3, 0, 0]} barSize={24} />
                                        <Bar dataKey="Actual Commissioning" name="Actual" fill="url(#gradientActual)" radius={[3, 3, 0, 0]} barSize={24} />
                                        <Bar dataKey="Rephase Strategy" name="Rephase" fill="url(#gradientRephase)" radius={[3, 3, 0, 0]} barSize={24} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </ChartContainer>

                            {/* Deviation Chart */}
                            <ChartContainer
                                title="Deviation Analysis (Actual − Plan)"
                                controls={
                                    <ViewPivot active={deviationView} onChange={setDeviationView} label="" />
                                }
                            >
                                <ResponsiveContainer width="100%" height={240}>
                                    <BarChart data={deviationChartData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} width={40} />
                                        <Tooltip
                                            cursor={{ fill: '#fef2f2' }}
                                            content={({ active, payload, label }) => {
                                                if (active && payload && payload.length) {
                                                    const val = payload[0].value as number;
                                                    return (
                                                        <div className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-xl border-2" style={{ borderColor: val >= 0 ? '#10B981' : '#F43F5E' }}>
                                                            <p className="font-bold text-sm">{label}</p>
                                                            <p className={`text-lg font-black ${val >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                                {val >= 0 ? '+' : ''}{val.toLocaleString()} MW
                                                            </p>
                                                            <p className="text-[9px] font-bold text-gray-400 uppercase">
                                                                {val >= 0 ? 'Ahead' : 'Behind'}
                                                            </p>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }} />
                                        <Bar dataKey="Deviation" radius={[4, 4, 0, 0]} barSize={28}>
                                            {deviationChartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.Deviation >= 0 ? '#10B981' : '#F43F5E'} fillOpacity={0.85} />
                                            ))}
                                        </Bar>
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
                                title={`Solar - Quarterly ${solarQMode}`}
                                controls={<CardSelect label="VIEW MODE" options={['Absolute', 'Cumulative']} value={solarQMode} onChange={setSolarQMode} />}
                            >
                                <ResponsiveContainer width="100%" height={250}>
                                    <BarChart data={solarData.quarterly}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                        <YAxis axisLine={false} tickLine={false} />
                                        <Tooltip formatter={(v: any) => `${v.toLocaleString(undefined, { maximumFractionDigits: 4 })} MW`} />
                                        <Bar dataKey="Target Plan" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={20} />
                                        <Bar dataKey="Actual Commissioning" fill="#10B981" radius={[4, 4, 0, 0]} barSize={20} />
                                        <Bar dataKey="Rephase Strategy" fill="#F97316" radius={[4, 4, 0, 0]} barSize={20} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </ChartContainer>
                            <ChartContainer
                                title={`Solar - Monthly ${solarMMode}`}
                                controls={<CardSelect label="VIEW MODE" options={['Monthly', 'Cumulative']} value={solarMMode} onChange={setSolarMMode} />}
                            >
                                <ResponsiveContainer width="100%" height={250}>
                                    <AreaChart data={solarData.monthly}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                        <YAxis axisLine={false} tickLine={false} />
                                        <Tooltip formatter={(v: any) => `${v.toLocaleString(undefined, { maximumFractionDigits: 4 })} MW`} />
                                        <Area type="monotone" dataKey="Target Plan" stroke="#3B82F6" fill="url(#colorPlanH)" />
                                        <Area type="monotone" dataKey="Actual Commissioning" stroke="#10B981" fill="url(#colorActualH)" strokeWidth={3} />
                                        <Area type="monotone" dataKey="Rephase Strategy" stroke="#F97316" fill="url(#colorRephaseH)" />
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
                                title={`Wind - Quarterly ${windQMode}`}
                                controls={<CardSelect label="VIEW MODE" options={['Absolute', 'Cumulative']} value={windQMode} onChange={setWindQMode} />}
                            >
                                <ResponsiveContainer width="100%" height={250}>
                                    <BarChart data={windData.quarterly}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                        <YAxis axisLine={false} tickLine={false} />
                                        <Tooltip formatter={(v: any) => `${v.toLocaleString(undefined, { maximumFractionDigits: 4 })} MW`} />
                                        <Bar dataKey="Target Plan" fill="#06B6D4" radius={[6, 6, 0, 0]} barSize={32} />
                                        <Bar dataKey="Actual Commissioning" fill="#10B981" radius={[6, 6, 0, 0]} barSize={32} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </ChartContainer>
                            <ChartContainer
                                title={`Wind - Monthly ${windMMode}`}
                                controls={<CardSelect label="VIEW MODE" options={['Monthly', 'Cumulative']} value={windMMode} onChange={setWindMMode} />}
                            >
                                <ResponsiveContainer width="100%" height={250}>
                                    <AreaChart data={windData.monthly}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                        <YAxis axisLine={false} tickLine={false} />
                                        <Tooltip formatter={(v: any) => `${v.toLocaleString(undefined, { maximumFractionDigits: 4 })} MW`} />
                                        <Area type="monotone" dataKey="Target Plan" stroke="#06B6D4" fill="#A5F3FC" strokeWidth={3} />
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
                                <div className="flex flex-wrap gap-2 relative z-[60]">
                                    <GlobalSlicer label="Technology" options={['All', 'Solar', 'Wind']} value={modelsTechnology} onChange={setModelsTechnology} />
                                    <CardSelect label="Category" options={categoryOptions} value={modelsCategory} onChange={setModelsCategory} />
                                    <CardSelect label="Project" options={projectOptions} value={modelsProject} onChange={setModelsProject} />
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
                                    <div className="h-[300px] overflow-y-auto custom-scrollbar">
                                        {modelDrill === 'Project Drill-down' ? (
                                            <div className="space-y-4 pr-2">
                                                {allProjects.filter(p => p.planActual === 'Plan' && p.includedInTotal && (modelsProject === 'All Projects' || p.projectName === modelsProject) && (modelsTechnology === 'All' || p.category?.toLowerCase().includes(modelsTechnology.toLowerCase()))).slice(0, 10).map(p => (
                                                    <div key={p.projectName} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-700">
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-black text-gray-800 dark:text-gray-200 uppercase">{p.projectName}</span>
                                                            <span className="text-[10px] font-bold text-gray-400 uppercase">{p.projectType} • {p.category}</span>
                                                        </div>
                                                        <div className="text-right flex flex-col items-end">
                                                            <span className="text-sm font-black text-[#0B74B0]">{p.capacity} MW</span>
                                                            <div className="w-20 h-1 bg-gray-200 dark:bg-gray-700 rounded-full mt-1 overflow-hidden">
                                                                <div className="h-full bg-[#0B74B0]" style={{ width: '100%' }} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 h-full">
                                                {modelSplitData.map(m => (
                                                    <div key={m.name} className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-[2rem] flex flex-col justify-center items-center shadow-inner hover:shadow-md transition-all border border-transparent hover:border-gray-200 dark:hover:border-gray-700 group">
                                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{m.name}</span>
                                                        <span className="text-3xl font-black group-hover:scale-110 transition-transform" style={{ color: m.color }}>{m.value.toLocaleString()} MW</span>
                                                        <div className="mt-4 w-full h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                                                            <motion.div initial={{ width: 0 }} animate={{ width: `${(m.value / (overallKpi.plan || 1)) * 100}%` }} className="h-full" style={{ backgroundColor: m.color }} />
                                                        </div>
                                                        <span className="mt-2 text-[10px] font-bold text-gray-500 uppercase tracking-tighter">{((m.value / (overallKpi.plan || 1)) * 100).toFixed(1)}% of total</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </ChartContainer>
                            </div>
                        </div>
                    </div>
                )}

                {activeDashboard === 'deviation' && (
                    <div className="space-y-4 w-full">
                        {/* Deviation Dashboard Header with Summary Stats */}
                        <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
                            <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                    <span className="w-1 h-5 bg-rose-500 rounded-sm" />
                                    Deviation Analysis
                                </h3>
                                <div className="flex flex-wrap gap-2 relative z-[60]">
                                    <GlobalSlicer label="" options={['All', 'Solar', 'Wind']} value={categoryFilter === 'all' ? 'All' : categoryFilter === 'solar' ? 'Solar' : 'Wind'} onChange={(v: string) => setCategoryFilter(v.toLowerCase() as any)} />
                                    <CardSelect label="" options={businessModelOptions} value={timelineBusinessModel} onChange={setTimelineBusinessModel} />
                                    <CardSelect label="" options={categoryOptions} value={timelineCategory} onChange={setTimelineCategory} />
                                </div>
                            </div>

                            {/* Deviation Summary Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
                                    <p className="text-[10px] font-medium text-gray-500 uppercase">Total Deviation</p>
                                    <p className={`text-lg font-bold ${(overallKpi.actual - overallKpi.plan) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {(overallKpi.actual - overallKpi.plan) >= 0 ? '+' : ''}{(overallKpi.actual - overallKpi.plan).toLocaleString()} <span className="text-xs">MW</span>
                                    </p>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
                                    <p className="text-[10px] font-medium text-gray-500 uppercase">Periods Behind</p>
                                    <p className="text-lg font-bold text-rose-600">{deviationChartData.filter(d => d.Deviation < 0).length}</p>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
                                    <p className="text-[10px] font-medium text-gray-500 uppercase">Periods Ahead</p>
                                    <p className="text-lg font-bold text-emerald-600">{deviationChartData.filter(d => d.Deviation >= 0).length}</p>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
                                    <p className="text-[10px] font-medium text-gray-500 uppercase">Achievement %</p>
                                    <p className="text-lg font-bold text-blue-600">{overallKpi.achievement.toFixed(1)}%</p>
                                </div>
                            </div>
                        </div>

                        {/* Single Deviation Chart */}
                        <ChartContainer
                            title="Deviation by Period (Actual − Plan)"
                            controls={
                                <ViewPivot active={deviationView} onChange={setDeviationView} />
                            }
                        >
                            <ResponsiveContainer width="100%" height={400}>
                                <BarChart data={deviationChartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
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
                                    <Bar dataKey="Deviation" radius={[6, 6, 0, 0]} barSize={50}>
                                        {deviationChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.Deviation >= 0 ? '#10B981' : '#F43F5E'} fillOpacity={0.85} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartContainer>
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
                className="flex items-center gap-2 bg-[#F5F7FA] dark:bg-gray-800 hover:bg-white dark:hover:bg-gray-700 border border-[#D1D5DB] dark:border-gray-600 rounded-md px-3 py-1.5 text-xs font-medium text-[#1F2937] dark:text-gray-200 transition-colors cursor-pointer"
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
                className="h-8 flex items-center justify-between gap-2 bg-white dark:bg-gray-800 hover:bg-[#F9FAFB] dark:hover:bg-gray-700 border border-[#D1D5DB] dark:border-gray-600 rounded-md px-3 text-xs font-medium text-[#1F2937] dark:text-gray-200 transition-colors min-w-[100px] cursor-pointer"
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
                className={`${buttonClass} cursor-pointer`}
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
                                {typeof value === 'number' ? value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : value}
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
                    <div className="flex flex-wrap items-center justify-end gap-2 flex-grow sm:flex-grow-0 relative z-[60]">
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