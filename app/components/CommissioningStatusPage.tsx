"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

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

interface CommissioningSummary {
  id?: number;
  category: string;
  summaryType: string;
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
  total: number | null;
  cummTillOct: number | null;
  q1: number | null;
  q2: number | null;
  q3: number | null;
  q4: number | null;
}

// Month columns for table headers
const monthColumns = ['apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec', 'jan', 'feb', 'mar'];
const monthLabels = ['Apr-25', 'May-25', 'Jun-25', 'Jul-25', 'Aug-25', 'Sep-25', 'Oct-25', 'Nov-25', 'Dec-25', 'Jan-26', 'Feb-26', 'Mar-26'];

// Section display name mapping with inclusion/exclusion info
const sectionDisplayNames: Record<string, string> = {
  'A': 'A. Khavda Solar Projects',
  'B': 'B. Rajasthan Solar Projects',
  'C': 'C. Rajasthan Solar Additional 500MW',
  'D1': 'D1. Khavda Solar Copper + Merchant 50MW',
  'D2': 'D2. Khavda Solar Internal 650MW'
};

// Section inclusion/exclusion rules for calculations
const SECTION_INCLUSION_RULES: Record<string, boolean> = {
  'A. Khavda Solar Projects': true,
  'B. Rajasthan Solar Projects': true,
  'C. Rajasthan Solar Additional 500MW': true,
  'A. Khavda Wind Projects': true,
  'C. Mundra Wind 76MW': true,
  'D1. Khavda Solar Copper + Merchant 50MW': false,
  'D2. Khavda Solar Internal 650MW': false,
  'B. Khavda Wind Internal 421MW': false,
  'D. Mundra Wind Internal 224.4MW': false,
};

const getSectionDisplayName = (section: string): string => {
  return sectionDisplayNames[section] || `Section ${section}`;
};

// Hierarchy Definition
const HIERARCHY = {
  SOLAR: {
    title: 'AGEL Overall Solar FY 2025–26 (A + B + C)',
    key: 'Solar',
    sections: ['A', 'B', 'C', 'D1', 'D2']
  },
  WIND: {
    title: 'AGEL Overall Wind FY 2025–26 (A + C)',
    key: 'Wind',
    sections: ['A', 'C', 'D', 'B'] // Including B just in case it appears in Wind
  }
};

export default function CommissioningStatusPage() {
  const queryClient = useQueryClient();
  const { user, isAdmin, logout } = useAuth();
  const [fiscalYear] = useState('FY_25-26');
  const [activeTab, setActiveTab] = useState<'overview' | 'solar' | 'wind'>('overview');

  // Filter states
  const [filters, setFilters] = useState({
    category: '',
    projectType: '',
    planActual: 'Plan',  // Default to Plan view
    spv: '',
    section: '',
    showExcluded: true, // Show items excluded from totals
  });

  // Editing state
  const [editingProject, setEditingProject] = useState<CommissioningProject | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ success?: number; failed?: number; errors?: string[] } | null>(null);

  // Fetch projects
  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['commissioning-projects', fiscalYear, filters.planActual],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('fiscalYear', fiscalYear);
      if (filters.planActual) {
        params.append('plan_actual', filters.planActual);
      }
      const response = await fetch(`/api/commissioning-projects?${params}`);
      if (!response.ok) throw new Error('Failed to fetch projects');
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch summaries
  const { data: summaries = [], isLoading: summariesLoading } = useQuery({
    queryKey: ['commissioning-summaries', fiscalYear, filters.planActual],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('fiscalYear', fiscalYear);
      if (filters.planActual) {
        params.append('plan_actual', filters.planActual);
      }
      const response = await fetch(`/api/commissioning-summaries?${params}`);
      if (!response.ok) throw new Error('Failed to fetch summaries');
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  // Save projects mutation
  const saveProjectsMutation = useMutation({
    mutationFn: async (updatedProjects: CommissioningProject[]) => {
      const response = await fetch(`/api/commissioning-projects?fiscalYear=${fiscalYear}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProjects),
      });
      if (!response.ok) throw new Error('Failed to save projects');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commissioning-projects', fiscalYear] });
    },
  });

  // Get unique values for filters
  const filterOptions = useMemo(() => {
    const categories = [...new Set(projects.map((p: CommissioningProject) => p.category))] as string[];
    const projectTypes = [...new Set(projects.map((p: CommissioningProject) => p.projectType))] as string[];
    const planActuals = [...new Set(projects.map((p: CommissioningProject) => p.planActual))] as string[];
    const spvs = [...new Set(projects.map((p: CommissioningProject) => p.spv))] as string[];

    // Get unique sections and sort in proper order (A, B, C, D1, D2)
    const sectionsSet = new Set(projects.map((p: CommissioningProject) => p.section));
    const sectionOrder = ['A', 'B', 'C', 'D1', 'D2'];
    const sections = sectionOrder.filter(s => sectionsSet.has(s));

    return { categories, projectTypes, planActuals, spvs, sections };
  }, [projects]);

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return projects.filter((p: CommissioningProject) => {
      if (filters.category && p.category !== filters.category) return false;
      if (filters.projectType && p.projectType !== filters.projectType) return false;
      if (filters.planActual && p.planActual !== filters.planActual) return false;
      if (filters.spv && p.spv !== filters.spv) return false;
      if (filters.section && p.section !== filters.section) return false;
      return true;
    });
  }, [projects, filters]);

  // Filter projects by tab - RESPECTS CAPACITY TYPE EXCLUSIVITY FROM BACKEND
  const tabProjects = useMemo(() => {
    let filtered = filteredProjects;
    if (activeTab === 'solar') {
      filtered = filteredProjects.filter((p: CommissioningProject) =>
        p.category.toLowerCase().includes('solar')
      );
    } else if (activeTab === 'wind') {
      filtered = filteredProjects.filter((p: CommissioningProject) =>
        p.category.toLowerCase().includes('wind')
      );
    }

    // Backend already filtered by planActual, so capacity type is exclusive
    // Apply showExcluded toggle to respect section inclusion/exclusion
    if (!filters.showExcluded) {
      filtered = filtered.filter((p: CommissioningProject) => p.includedInTotal);
    }

    return filtered;
  }, [filteredProjects, activeTab, filters.showExcluded]);

  // Group projects by category and section
  const groupedProjects = useMemo(() => {
    // Instead of dynamic categories, we force bucket into Solar and Wind based on the hierarchy
    const solarProjects = tabProjects.filter((p: CommissioningProject) => p.category.toLowerCase().includes('solar'));
    const windProjects = tabProjects.filter((p: CommissioningProject) => p.category.toLowerCase().includes('wind'));

    // Further group by section
    const bySection = (projs: CommissioningProject[]) => {
      const groups: Record<string, CommissioningProject[]> = {};
      projs.forEach(p => {
        if (!groups[p.section]) groups[p.section] = [];
        groups[p.section].push(p);
      });
      return groups;
    };

    return {
      Solar: bySection(solarProjects),
      Wind: bySection(windProjects)
    };
  }, [tabProjects]);

  // Calculate totals for a group of projects - ENFORCES RULES
  const calculateTotals = (projectsToSum: CommissioningProject[]) => {
    const totals: any = {
      capacity: 0,
      apr: 0, may: 0, jun: 0, jul: 0, aug: 0, sep: 0,
      oct: 0, nov: 0, dec: 0, jan: 0, feb: 0, mar: 0,
      totalCapacity: 0, cummTillOct: 0,
      q1: 0, q2: 0, q3: 0, q4: 0
    };

    projectsToSum.forEach(p => {
      // CRITICAL: Only include projects marked as included_in_total
      if (!p.includedInTotal) return;

      totals.capacity += p.capacity || 0;
      monthColumns.forEach(month => {
        totals[month] += (p as any)[month] || 0;
      });
      // Backend already provides deterministic derived values
      totals.totalCapacity += p.totalCapacity || 0;
      totals.cummTillOct += p.cummTillOct || 0;
      totals.q1 += p.q1 || 0;
      totals.q2 += p.q2 || 0;
      totals.q3 += p.q3 || 0;
      totals.q4 += p.q4 || 0;
    });

    return totals;
  };

  // Calculate hierarchical totals - ENFORCES CAPACITY TYPE EXCLUSIVITY
  const calculateHierarchicalTotals = () => {
    // Backend already filters by planActual, so projects here are already capacity-type exclusive
    // Filter to only included projects
    const includedProjects = projects.filter((p: CommissioningProject) => p.includedInTotal);

    const solarProjects = includedProjects.filter((p: CommissioningProject) =>
      p.category.toLowerCase().includes('solar')
    );
    const windProjects = includedProjects.filter((p: CommissioningProject) =>
      p.category.toLowerCase().includes('wind')
    );

    return {
      solar: calculateTotals(solarProjects),
      wind: calculateTotals(windProjects),
      total: calculateTotals(includedProjects)
    };
  };

  const hierarchicalTotals = useMemo(() => calculateHierarchicalTotals(), [projects]);

  // Handle filter change
  const handleFilterChange = (key: string, value: string | boolean) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({ category: '', projectType: '', planActual: 'Plan', spv: '', section: '', showExcluded: true });
  };

  // Handle edit project
  const handleEditProject = (project: CommissioningProject) => {
    if (!isAdmin) {
      alert('Only admin users can edit projects.');
      return;
    }
    setEditingProject({ ...project });
  };

  // Handle save edit
  const handleSaveEdit = () => {
    if (!editingProject) return;

    const updatedProjects = projects.map((p: CommissioningProject) =>
      p.id === editingProject.id ? editingProject : p
    );

    saveProjectsMutation.mutate(updatedProjects);
    setEditingProject(null);
  };

  // Handle delete project
  const handleDeleteProject = (projectId: number) => {
    if (!isAdmin) {
      alert('Only admin users can delete projects.');
      return;
    }

    if (!confirm('Are you sure you want to delete this project?')) return;

    const updatedProjects = projects.filter((p: CommissioningProject) => p.id !== projectId);
    saveProjectsMutation.mutate(updatedProjects);
  };

  // Format number for display
  const formatNumber = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return '–';
    return value.toFixed(0);
  };

  // Handle Excel upload
  const handleExcelUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fiscalYear', fiscalYear);

      const response = await fetch('/api/upload-commissioning-data', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setUploadResult({
          failed: data.failed || 0,
          errors: data.errors || ['Upload failed']
        });
      } else {
        setUploadResult({
          success: data.success || 0,
          failed: data.failed || 0,
          errors: data.errors || []
        });
        // Refresh data
        queryClient.invalidateQueries({ queryKey: ['commissioning-projects', fiscalYear] });
      }
    } catch (error: any) {
      setUploadResult({
        failed: 0,
        errors: [error.message || 'Upload failed']
      });
    } finally {
      setUploading(false);
    }
  };

  // Loading state
  if (projectsLoading || summariesLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600 dark:text-gray-300">Loading commissioning data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            AGEL FY 25-26 Commissioning Status Update
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            For Chairman – Budget Purpose @ 6.5 GW + 535 MW Carryover | As on: 31-Oct-25
          </p>
        </div>
        <div className="flex items-center gap-2">
          {user && (
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${isAdmin
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
              }`}>
              {isAdmin ? 'Admin' : 'Viewer'}
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <nav className="flex gap-4">
          {['overview', 'solar', 'wind'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === tab
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
            >
              {tab === 'overview' ? 'Overall Summary' : tab === 'solar' ? 'Solar Projects' : 'Wind Projects'}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {/* Upload Excel Button - Admin Only */}
          {isAdmin && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M3 17a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2zm6-7a3 3 0 11-6 0 3 3 0 016 0zm4-5a1 1 0 11-2 0 1 1 0 012 0zm-1.464 3.536a1 1 0 001.414-1.414L9.172 6.05a1 1 0 10-1.414 1.414l2.121 2.122zM2.464 14.536a1 1 0 001.414 1.414l2.121-2.122a1 1 0 10-1.414-1.414l-2.121 2.122zm13.071-7.071a1 1 0 10-1.414-1.414l-2.121 2.121a1 1 0 101.414 1.414l2.121-2.121zM10 4a1 1 0 011-1h4a1 1 0 110 2h-4a1 1 0 01-1-1z" />
              </svg>
              Upload Excel
            </button>
          )}

          {/* Reset Data Button - Admin Only */}
          {isAdmin && (
            <button
              onClick={async () => {
                if (confirm('Are you sure you want to RESET all commissioning data? This will clear all monthly values and cannot be undone.')) {
                  try {
                    const res = await fetch('/api/reset-commissioning-data', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ fiscalYear })
                    });
                    if (res.ok) {
                      alert('Data reset successfully.');
                      queryClient.invalidateQueries({ queryKey: ['commissioning-projects', fiscalYear] });
                    } else {
                      alert('Failed to reset data.');
                    }
                  } catch (e) {
                    alert('Error resetting data.');
                  }
                }
              }}
              className="flex items-center gap-2 px-4 py-2 text-sm border border-red-300 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              title="Clear all uploaded data"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Reset Data
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Categories</option>
              {filterOptions.categories.map((cat: string) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Section</label>
            <select
              value={filters.section}
              onChange={(e) => handleFilterChange('section', e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Sections</option>
              {filterOptions.sections.map((sec: string) => (
                <option key={sec} value={sec}>{getSectionDisplayName(sec)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
            <select
              value={filters.projectType}
              onChange={(e) => handleFilterChange('projectType', e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Types</option>
              {filterOptions.projectTypes.map((type: string) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Capacity Type</label>
            <select
              value={filters.planActual}
              onChange={(e) => handleFilterChange('planActual', e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {filterOptions.planActuals.map((pa: string) => (
                <option key={pa} value={pa}>{pa === 'Actual' ? 'Actual / Fcst' : pa}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">SPV</label>
            <select
              value={filters.spv}
              onChange={(e) => handleFilterChange('spv', e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All SPVs</option>
              {filterOptions.spvs.map((spv: string) => (
                <option key={spv} value={spv}>{spv}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.showExcluded}
                onChange={(e) => handleFilterChange('showExcluded', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-xs text-gray-700 dark:text-gray-300">Show Excluded</span>
            </label>
          </div>
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-lg"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Capacity (Included)</h3>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{formatNumber(hierarchicalTotals.total.totalCapacity)} MW</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Cumm till Oct-25</h3>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatNumber(hierarchicalTotals.total.cummTillOct)} MW</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Solar Capacity</h3>
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{formatNumber(hierarchicalTotals.solar.totalCapacity)} MW</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Wind Capacity</h3>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{formatNumber(hierarchicalTotals.wind.totalCapacity)} MW</p>
          </div>
        </div>
      )}

      {/* PDF-Style Summary Tables */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* AGEL Overall Solar Summary */}
          <SummaryTable
            title="1. AGEL Overall Solar FY 2025-26 (A + B + C)"
            projects={projects.filter((p: CommissioningProject) =>
              p.category.toLowerCase().includes('solar') && p.includedInTotal
            )}
            monthColumns={monthColumns}
            monthLabels={monthLabels}
            formatNumber={formatNumber}
          />

          {/* AGEL Overall Wind Summary */}
          <SummaryTable
            title="2. AGEL Overall Wind FY 2025-26 (A + C)"
            projects={projects.filter((p: CommissioningProject) =>
              p.category.toLowerCase().includes('wind') && p.includedInTotal
            )}
            monthColumns={monthColumns}
            monthLabels={monthLabels}
            formatNumber={formatNumber}
          />

          {/* AGEL Overall FY Summary (Solar + Wind) */}
          <SummaryTable
            title="AGEL Overall FY 2025-26 (1 + 2)"
            projects={projects.filter((p: CommissioningProject) => p.includedInTotal)}
            monthColumns={monthColumns}
            monthLabels={monthLabels}
            formatNumber={formatNumber}
          />
        </div>
      )}

      {/* Hierarchy Breadcrumb */}
      <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm text-blue-800 dark:text-blue-300 font-medium">
        <span>AGEL Overall FY 2025–26</span>
        {filters.category && (
          <>
            <span className="mx-2">→</span>
            <span>{filters.category.includes('Solar') ? 'Solar' : filters.category.includes('Wind') ? 'Wind' : filters.category}</span>
          </>
        )}
        {filters.section && (
          <>
            <span className="mx-2">→</span>
            <span>Section {filters.section}</span>
          </>
        )}
      </div>

      {/* Projects Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {activeTab === 'overview' ? 'All Projects' : activeTab === 'solar' ? 'Solar Projects' : 'Wind Projects'}
          </h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Showing {tabProjects.length} project(s)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="sticky left-0 z-10 bg-gray-50 dark:bg-gray-900 px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">S.No</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Project Name</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">SPV</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Type</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Location/PSS</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Capacity</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Capacity Type</th>
                {monthLabels.map((month, idx) => (
                  <th key={idx} className="px-2 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{month}</th>
                ))}
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Cumm till Oct</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Q1</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Q2</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Q3</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Q4</th>
                {isAdmin && <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {tabProjects.length === 0 ? (
                <tr>
                  <td colSpan={20} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    No projects found matching the current filters.
                  </td>
                </tr>
              ) : (
                (['Solar', 'Wind'] as const).map(groupKey => {
                  const groupConfig = groupKey === 'Solar' ? HIERARCHY.SOLAR : HIERARCHY.WIND;
                  const projectsBySection = groupedProjects[groupKey];

                  // Only render group if there are projects or if we're in overview/respective tab
                  const hasProjects = Object.values(projectsBySection).some(arr => arr.length > 0);
                  if (!hasProjects) return null;

                  // Calculate group totals (Solar/Wind Total)
                  const allGroupProjects = Object.values(projectsBySection).flat();
                  const groupTotal = calculateTotals(allGroupProjects);

                  return (
                    <React.Fragment key={`group-${groupKey}`}>
                      {/* Major Group Header (e.g. Overall Solar) */}
                      <tr className="bg-amber-100 dark:bg-amber-900/30 border-y-2 border-amber-200 dark:border-amber-800">
                        <td colSpan={21} className="px-4 py-3 text-base font-bold text-amber-900 dark:text-amber-100 uppercase tracking-wide">
                          {groupConfig.title}
                        </td>
                      </tr>

                      {/* Iterate Sections in predefined order */}
                      {groupConfig.sections.map(section => {
                        const sectionProjects = projectsBySection[section] || [];
                        if (sectionProjects.length === 0) return null;

                        const sectionTotal = calculateTotals(sectionProjects);
                        const isExcludedSection = !SECTION_INCLUSION_RULES[getSectionDisplayName(section)]; // Simple check based on section map assumption or project flag
                        // Actually, trusting project's includedInTotal is safer, but user layout implies sections like D1/D2 are fixed excluded
                        const anyIncluded = sectionProjects.some(p => p.includedInTotal);

                        return (
                          <React.Fragment key={`sec-${groupKey}-${section}`}>
                            {/* Section Header */}
                            <tr className="bg-gray-100 dark:bg-gray-700/50">
                              <td colSpan={21} className="px-4 py-2 text-sm font-bold text-gray-800 dark:text-gray-200">
                                {getSectionDisplayName(section)}
                                {!anyIncluded && (
                                  <span className="ml-3 px-2 py-0.5 text-xs bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300 rounded border border-gray-300 dark:border-gray-500 uppercase tracking-wider">
                                    Excluded (Display Only)
                                  </span>
                                )}
                                {anyIncluded && (
                                  <span className="ml-3 px-2 py-0.5 text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 rounded border border-green-200 dark:border-green-800 uppercase tracking-wider">
                                    Included
                                  </span>
                                )}
                              </td>
                            </tr>

                            {/* Projects */}
                            {sectionProjects.map((project, idx) => (
                              <tr
                                key={project.id || `${groupKey}-${section}-${idx}`}
                                className={`
                                  ${!project.includedInTotal ? 'bg-gray-50 text-gray-500' : 'bg-white text-gray-900'}
                                  dark:bg-gray-800 dark:text-gray-100
                                  border-b border-gray-100 dark:border-gray-700
                                `}
                              >
                                <td className="sticky left-0 z-10 bg-inherit px-3 py-2 text-sm">
                                  {project.sno}
                                </td>
                                <td className="px-3 py-2 text-sm whitespace-nowrap">{project.projectName}</td>
                                <td className="px-3 py-2 text-sm">{project.spv}</td>
                                <td className="px-3 py-2 text-sm">
                                  {/* Type Badges */}
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${project.projectType === 'PPA' ? 'bg-blue-100 text-blue-800' :
                                    project.projectType === 'Merchant' ? 'bg-green-100 text-green-800' :
                                      'bg-purple-100 text-purple-800'
                                    }`}>
                                    {project.projectType}
                                  </span>
                                </td>
                                <td className="px-3 py-2 text-sm">{project.plotLocation}</td>
                                {/* Highlighting Capacity and Total for visual scan */}
                                <td className="px-3 py-2 text-sm font-semibold">{formatNumber(project.capacity)}</td>
                                <td className="px-3 py-2 text-sm">
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${project.planActual === 'Plan' ? 'bg-gray-100 text-gray-800' :
                                    project.planActual === 'Rephase' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-green-100 text-green-800'
                                    }`}>
                                    {project.planActual === 'Actual' ? 'Actual / Fcst' : project.planActual}
                                  </span>
                                </td>
                                {monthColumns.map(m => (
                                  <td key={m} className={`px-2 py-2 text-sm text-center ${!project.includedInTotal ? 'opacity-50' : ''}`}>
                                    {formatNumber((project as any)[m])}
                                  </td>
                                ))}
                                <td className="px-3 py-2 text-sm text-center font-bold bg-gray-50 dark:bg-gray-900/50">{formatNumber(project.totalCapacity)}</td>
                                <td className="px-3 py-2 text-sm text-center font-semibold text-blue-600 dark:text-blue-400">{formatNumber(project.cummTillOct)}</td>
                                {/* Quarters */}
                                <td className="px-3 py-2 text-sm text-center">{formatNumber(project.q1)}</td>
                                <td className="px-3 py-2 text-sm text-center">{formatNumber(project.q2)}</td>
                                <td className="px-3 py-2 text-sm text-center">{formatNumber(project.q3)}</td>
                                <td className="px-3 py-2 text-sm text-center">{formatNumber(project.q4)}</td>

                                {isAdmin && (
                                  <td className="px-3 py-2 text-sm text-center">
                                    <div className="flex gap-1 justify-center">
                                      <button onClick={() => handleEditProject(project)} className="text-blue-600 hover:underline">Edit</button>
                                      <button onClick={() => handleDeleteProject(project.id!)} className="text-red-600 hover:underline ml-2">Del</button>
                                    </div>
                                  </td>
                                )}
                              </tr>
                            ))}

                            {/* SECTION SUB-TOTAL */}
                            {anyIncluded && (
                              <tr className="bg-gray-100 dark:bg-gray-700 border-t border-gray-300 dark:border-gray-600 font-semibold text-sm">
                                <td colSpan={5} className="px-3 py-2 text-right">Section {section} Subtotal:</td>
                                <td className="px-3 py-2">{formatNumber(sectionTotal.capacity)}</td>
                                <td></td>
                                {monthColumns.map(m => <td key={m} className="px-2 py-2 text-center">{formatNumber(sectionTotal[m])}</td>)}
                                <td className="px-3 py-2 text-center">{formatNumber(sectionTotal.totalCapacity)}</td>
                                <td className="px-3 py-2 text-center text-blue-700 dark:text-blue-300">{formatNumber(sectionTotal.cummTillOct)}</td>
                                <td className="px-3 py-2 text-center">{formatNumber(sectionTotal.q1)}</td>
                                <td className="px-3 py-2 text-center">{formatNumber(sectionTotal.q2)}</td>
                                <td className="px-3 py-2 text-center">{formatNumber(sectionTotal.q3)}</td>
                                <td className="px-3 py-2 text-center">{formatNumber(sectionTotal.q4)}</td>
                                {isAdmin && <td></td>}
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}

                      {/* GROUP TOTAL (Solar/Wind) */}
                      <tr className="bg-amber-50 dark:bg-amber-900/20 border-t-2 border-amber-300 dark:border-amber-700 font-bold text-sm">
                        <td colSpan={5} className="px-3 py-3 text-right text-amber-900 dark:text-amber-100 uppercase">
                          Total {groupKey} (Included):
                        </td>
                        <td className="px-3 py-3">{formatNumber(groupTotal.capacity)}</td>
                        <td></td>
                        {monthColumns.map(m => <td key={m} className="px-2 py-3 text-center">{formatNumber(groupTotal[m])}</td>)}
                        <td className="px-3 py-3 text-center">{formatNumber(groupTotal.totalCapacity)}</td>
                        <td className="px-3 py-3 text-center text-blue-700 dark:text-blue-300">{formatNumber(groupTotal.cummTillOct)}</td>
                        <td className="px-3 py-3 text-center">{formatNumber(groupTotal.q1)}</td>
                        <td className="px-3 py-3 text-center">{formatNumber(groupTotal.q2)}</td>
                        <td className="px-3 py-3 text-center">{formatNumber(groupTotal.q3)}</td>
                        <td className="px-3 py-3 text-center">{formatNumber(groupTotal.q4)}</td>
                        {isAdmin && <td></td>}
                      </tr>
                    </React.Fragment>
                  );
                })
              )}

              {/* GRAND TOTAL ROW */}
              {(tabProjects.length > 0) && (
                (() => {
                  const grandTotal = calculateTotals(tabProjects.filter((p: { includedInTotal: any; }) => p.includedInTotal));
                  return (
                    <tr className="bg-gray-800 text-white border-t-4 border-gray-900 font-bold text-base shadow-lg">
                      <td colSpan={5} className="px-3 py-4 text-right uppercase tracking-wider">
                        AGEL Overall FY 2025–26 Total:
                      </td>
                      <td className="px-3 py-4">{formatNumber(grandTotal.capacity)}</td>
                      <td></td>
                      {monthColumns.map(m => <td key={m} className="px-2 py-4 text-center">{formatNumber(grandTotal[m])}</td>)}
                      <td className="px-3 py-4 text-center">{formatNumber(grandTotal.totalCapacity)}</td>
                      <td className="px-3 py-4 text-center text-blue-300">{formatNumber(grandTotal.cummTillOct)}</td>
                      <td className="px-3 py-4 text-center">{formatNumber(grandTotal.q1)}</td>
                      <td className="px-3 py-4 text-center">{formatNumber(grandTotal.q2)}</td>
                      <td className="px-3 py-4 text-center">{formatNumber(grandTotal.q3)}</td>
                      <td className="px-3 py-4 text-center">{formatNumber(grandTotal.q4)}</td>
                      {isAdmin && <td></td>}
                    </tr>
                  );
                })()
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Project</h3>
              <button onClick={() => setEditingProject(null)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Project Name</label>
                  <input
                    type="text"
                    value={editingProject.projectName}
                    onChange={(e) => setEditingProject({ ...editingProject, projectName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SPV</label>
                  <input
                    type="text"
                    value={editingProject.spv}
                    onChange={(e) => setEditingProject({ ...editingProject, spv: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                  <select
                    value={editingProject.projectType}
                    onChange={(e) => setEditingProject({ ...editingProject, projectType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="PPA">PPA</option>
                    <option value="Merchant">Merchant</option>
                    <option value="Group">Group</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Capacity (MW)</label>
                  <input
                    type="number"
                    value={editingProject.capacity}
                    onChange={(e) => setEditingProject({ ...editingProject, capacity: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {monthColumns.map((month, idx) => (
                  <div key={month}>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{monthLabels[idx]}</label>
                    <input
                      type="number"
                      value={(editingProject as any)[month] || ''}
                      onChange={(e) => setEditingProject({ ...editingProject, [month]: parseFloat(e.target.value) || null })}
                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
              <button
                onClick={() => setEditingProject(null)}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Excel Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Upload Commissioning Excel</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Excel must follow the approved AGEL commissioning template.
              </p>
            </div>

            <div className="p-6 space-y-4">
              {!uploadResult ? (
                <>
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-500 transition-colors cursor-pointer">
                    <input
                      type="file"
                      accept=".xlsx"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (!file.name.endsWith('.xlsx')) {
                            alert('Only .xlsx files are accepted');
                            return;
                          }
                          handleExcelUpload(file);
                        }
                      }}
                      disabled={uploading}
                      className="hidden"
                      id="excel-upload"
                    />
                    <label htmlFor="excel-upload" className="cursor-pointer block">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                      </svg>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {uploading ? 'Uploading...' : 'Click to upload or drag and drop'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">(.xlsx files only)</p>
                    </label>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-xs text-gray-700 dark:text-gray-300">
                    <strong>Expected columns:</strong> Category, Section, Project Name, SPV, Type, Capacity Type, Apr-25, May-25, ... Mar-26
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  {uploadResult.success ? (
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                      <p className="text-sm font-medium text-green-800 dark:text-green-400">
                        ✓ Successfully updated {uploadResult.success} row(s)
                      </p>
                    </div>
                  ) : null}

                  {uploadResult && uploadResult.failed != null && uploadResult.failed > 0 && (
                    <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                      <p className="text-sm font-medium text-orange-800 dark:text-orange-400">
                        ⚠ {uploadResult.failed} row(s) failed
                      </p>
                      {uploadResult.errors && uploadResult.errors.length > 0 && (
                        <ul className="text-xs text-orange-700 dark:text-orange-300 mt-2 space-y-1">
                          {uploadResult.errors.slice(0, 5).map((err, idx) => (
                            <li key={idx}>• {err}</li>
                          ))}
                          {uploadResult.errors.length > 5 && <li>• ... and {uploadResult.errors.length - 5} more</li>}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadResult(null);
                }}
                disabled={uploading}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50"
              >
                {uploadResult ? 'Close' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Summary Table Component - Matches PDF format
interface SummaryTableProps {
  title: string;
  projects: CommissioningProject[];
  monthColumns: string[];
  monthLabels: string[];
  formatNumber: (value: number | null | undefined) => string;
}

function SummaryTable({ title, projects, monthColumns, monthLabels, formatNumber }: SummaryTableProps) {
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

    // Calculate total for this planActual
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
  const actualData = aggregateByType(projects, 'Actual');

  const renderRow = (label: string, data: any, bgClass: string = '') => (
    <tr className={bgClass}>
      <td className="px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">{label}</td>
      {monthColumns.map(m => (
        <td key={m} className="px-1 py-1 text-xs text-center text-gray-600 dark:text-gray-400">{formatNumber(data[m])}</td>
      ))}
      <td className="px-1 py-1 text-xs text-center font-semibold text-gray-800 dark:text-gray-200">{formatNumber(data.totalCapacity)}</td>
      <td className="px-1 py-1 text-xs text-center text-blue-600 dark:text-blue-400">{formatNumber(data.cummTillOct)}</td>
      <td className="px-1 py-1 text-xs text-center text-gray-600 dark:text-gray-400">{formatNumber(data.q1)}</td>
      <td className="px-1 py-1 text-xs text-center text-gray-600 dark:text-gray-400">{formatNumber(data.q2)}</td>
      <td className="px-1 py-1 text-xs text-center text-gray-600 dark:text-gray-400">{formatNumber(data.q3)}</td>
      <td className="px-1 py-1 text-xs text-center text-gray-600 dark:text-gray-400">{formatNumber(data.q4)}</td>
    </tr>
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div className="bg-purple-600 dark:bg-purple-800 px-4 py-2">
        <h3 className="text-sm font-bold text-white">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead className="bg-purple-100 dark:bg-purple-900/50">
            <tr>
              <th className="px-2 py-2 text-left text-xs font-semibold text-purple-800 dark:text-purple-200">Plan / Actual</th>
              {monthLabels.map((m, idx) => (
                <th key={idx} className="px-1 py-2 text-center text-xs font-semibold text-purple-800 dark:text-purple-200">{m}</th>
              ))}
              <th className="px-1 py-2 text-center text-xs font-semibold text-purple-800 dark:text-purple-200">Total Capacity</th>
              <th className="px-1 py-2 text-center text-xs font-semibold text-purple-800 dark:text-purple-200">Cumm till 31-Oct-25</th>
              <th className="px-1 py-2 text-center text-xs font-semibold text-purple-800 dark:text-purple-200">Q1</th>
              <th className="px-1 py-2 text-center text-xs font-semibold text-purple-800 dark:text-purple-200">Q2</th>
              <th className="px-1 py-2 text-center text-xs font-semibold text-purple-800 dark:text-purple-200">Q3</th>
              <th className="px-1 py-2 text-center text-xs font-semibold text-purple-800 dark:text-purple-200">Q4</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {/* Plan Section */}
            {renderRow('Plan', planData.total, 'bg-gray-50 dark:bg-gray-700/30 font-semibold')}
            {Object.entries(planData.byType).map(([type, data]) => renderRow(type, data))}

            {/* Rephase Section */}
            {renderRow('Rephase', rephaseData.total, 'bg-amber-50 dark:bg-amber-900/20 font-semibold')}
            {Object.entries(rephaseData.byType).map(([type, data]) => renderRow(type, data))}

            {/* Actual Section */}
            {renderRow('Actual / Fcst', actualData.total, 'bg-green-50 dark:bg-green-900/20 font-semibold')}
            {Object.entries(actualData.byType).map(([type, data]) => renderRow(type, data))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
