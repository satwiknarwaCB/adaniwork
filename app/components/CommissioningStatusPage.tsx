"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
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

// Section display name mapping - comprehensive for both Solar and Wind
const sectionDisplayNames: Record<string, string> = {
  // Solar Sections
  'A': 'A. Khavda Solar Projects',
  'B': 'B. Rajasthan Solar Projects',
  'C': 'C. Rajasthan Solar Additional 500MW',
  'D1': 'D1. Khavda Solar Copper + Merchant 50MW (Excluded)',
  'D2': 'D2. Khavda Solar Internal 650MW (Excluded)',
  // Wind Sections  
  'A_Wind': 'A. Khavda Wind Projects',
  'B_Wind': 'B. Khavda Wind Internal 421MW (Excluded)',
  'C_Wind': 'C. Mundra Wind 76MW',
  'D_Wind': 'D. Mundra Wind Internal 224.4MW (Excluded)',
};

// Category display name mapping for cleaner dropdown labels WITH section prefixes
const categoryDisplayNames: Record<string, string> = {
  // Solar Categories - A, B, C, D1, D2 prefixes
  'Khavda Solar Projects': 'A. Khavda Solar Projects',
  'Rajasthan Solar Projects': 'B. Rajasthan Solar Projects',
  'Rajasthan Solar Additional 500MW': 'C. Rajasthan Solar Additional 500MW',
  'Khavda Solar Copper + Merchant 50MW': 'D1. Khavda Solar Copper (Excluded)',
  'Khavda Solar Internal 650MW': 'D2. Khavda Solar Internal (Excluded)',
  // Wind Categories - A, B, C, D prefixes
  'Khavda Wind Projects': 'A. Khavda Wind Projects',
  'Khavda Wind Internal 421MW': 'B. Khavda Wind Internal (Excluded)',
  'Mundra Wind 76MW': 'C. Mundra Wind 76MW',
  'Mundra Wind Internal 224.4MW': 'D. Mundra Wind Internal (Excluded)',
};

const getCategoryDisplayName = (category: string): string => {
  return categoryDisplayNames[category] || category;
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
    title: '● AGEL Overall Solar FY 2025–26 (A + B + C)',
    key: 'Solar',
    color: 'from-orange-500 to-amber-500',
    bgLight: 'bg-orange-50 dark:bg-orange-900/20',
    borderColor: 'border-orange-200 dark:border-orange-800',
    textColor: 'text-orange-900 dark:text-orange-100',
    sections: ['A', 'B', 'C', 'D1', 'D2']
  },
  WIND: {
    title: '◆ AGEL Overall Wind FY 2025–26 (A + C)',
    key: 'Wind',
    color: 'from-cyan-500 to-teal-500',
    bgLight: 'bg-cyan-50 dark:bg-cyan-900/20',
    borderColor: 'border-cyan-200 dark:border-cyan-800',
    textColor: 'text-cyan-900 dark:text-cyan-100',
    sections: ['A', 'C', 'D', 'B']
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
    planActual: 'Plan',  // Back to Plan default
    spv: '',
    section: '',
    showExcluded: true, // Show items excluded from totals
  });

  // Editing state
  const [editingCell, setEditingCell] = useState<{ projectId: number, field: string } | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    success?: number;
    failed?: number;
    errors?: string[];
    sheets_found?: string[];
    sheet_count?: number;
  } | null>(null);

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

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  // Toggle section expansion
  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  // Expand all sections by default on load or when search changes
  useEffect(() => {
    if (projects.length > 0) {
      const allSections: Record<string, boolean> = {};
      Object.keys(sectionDisplayNames).forEach(k => {
        allSections[k] = true;
      });
      // Also handle section values from projects if they don't match keys exactly
      projects.forEach((p: { section: string | number; }) => {
        allSections[`Solar-${p.section}`] = true;
        allSections[`Wind-${p.section}`] = true;
        allSections[p.section] = true;
      });
      setExpandedSections(allSections);
    }
  }, [projects.length]);

  // Get unique values for filters
  const filterOptions = useMemo(() => {
    const projectTypes = [...new Set(projects.map((p: CommissioningProject) => p.projectType))] as string[];
    const planActuals = [...new Set(projects.map((p: CommissioningProject) => p.planActual))] as string[];
    const spvs = [...new Set(projects.map((p: CommissioningProject) => p.spv))] as string[];

    // Get all unique categories (original full names)
    const allCategories = [...new Set(projects.map((p: CommissioningProject) => p.category))] as string[];

    // Define order for Solar sections (A, B, C, D1, D2)
    const solarOrder = [
      'Khavda Solar Projects',           // A
      'Rajasthan Solar Projects',         // B
      'Rajasthan Solar Additional 500MW', // C
      'Khavda Solar Copper + Merchant 50MW', // D1
      'Khavda Solar Internal 650MW'       // D2
    ];

    // Define order for Wind sections (A, B, C, D)
    const windOrder = [
      'Khavda Wind Projects',            // A
      'Khavda Wind Internal 421MW',      // B
      'Mundra Wind 76MW',                // C
      'Mundra Wind Internal 224.4MW'     // D
    ];

    // Sort categories by predefined order
    const sortByOrder = (categories: string[], order: string[]) => {
      return order.filter(item => categories.includes(item));
    };

    // Group and sort categories by Solar/Wind
    const solarCategories = sortByOrder(allCategories.filter(c => c.toLowerCase().includes('solar')), solarOrder);
    const windCategories = sortByOrder(allCategories.filter(c => c.toLowerCase().includes('wind')), windOrder);

    // Filter categories based on selected category type (already sorted)
    let filteredCategories = [...solarCategories, ...windCategories]; // All in order
    if (filters.category === 'solar') {
      filteredCategories = solarCategories;
    } else if (filters.category === 'wind') {
      filteredCategories = windCategories;
    }

    return {
      projectTypes,
      planActuals,
      spvs,
      solarCategories,
      windCategories,
      filteredCategories // Sections to show based on category type (SORTED)
    };
  }, [projects, filters.category]);

  // Reset section when category type changes and section doesn't match
  const handleCategoryTypeChange = (newCategoryType: string) => {
    setFilters(prev => {
      // If section is selected and doesn't match new category type, clear it
      if (prev.section) {
        const sectionCategory = filterOptions.filteredCategories.find(c =>
          c === prev.section || c.includes(prev.section)
        );
        if (newCategoryType === 'solar' && sectionCategory && !sectionCategory.toLowerCase().includes('solar')) {
          return { ...prev, category: newCategoryType, section: '' };
        }
        if (newCategoryType === 'wind' && sectionCategory && !sectionCategory.toLowerCase().includes('wind')) {
          return { ...prev, category: newCategoryType, section: '' };
        }
      }
      return { ...prev, category: newCategoryType };
    });
  };

  // Filtered projects - now filters by category TYPE (solar/wind) instead of exact match
  const filteredProjects = useMemo(() => {
    return projects.filter((p: CommissioningProject) => {
      // Filter by category TYPE (solar/wind)
      if (filters.category === 'solar' && !p.category.toLowerCase().includes('solar')) return false;
      if (filters.category === 'wind' && !p.category.toLowerCase().includes('wind')) return false;
      if (filters.projectType && p.projectType !== filters.projectType) return false;
      if (filters.planActual && p.planActual !== filters.planActual) return false;
      if (filters.spv && p.spv !== filters.spv) return false;
      // Filter by section (exact category match)
      if (filters.section && p.category !== filters.section) return false;
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

  // Handle inline cell save
  const handleCellSave = (project: CommissioningProject, field: string, value: number | null) => {
    const updatedProject = { ...project, [field]: value };
    const updatedProjects = projects.map((p: CommissioningProject) =>
      p.id === project.id ? updatedProject : p
    );

    saveProjectsMutation.mutate(updatedProjects);
    setEditingCell(null);
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

      // Use the new upload-excel endpoint that reads all sheets
      const response = await fetch('/api/upload-excel', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setUploadResult({
          failed: data.failed || 0,
          errors: data.errors || data.parse_errors || [data.detail || 'Upload failed']
        });
      } else {
        setUploadResult({
          success: data.projects_imported || 0,
          failed: 0,
          errors: data.parse_errors || [],
          sheets_found: data.sheets_found,
          sheet_count: data.sheet_count
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

      {/* Tabs - Enhanced with icons and color coding */}
      <div className="border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <nav className="flex gap-2">
          {[
            { key: 'overview', label: '▣ Overall Summary', color: 'blue' },
            { key: 'solar', label: '● Solar Projects', color: 'orange' },
            { key: 'wind', label: '◆ Wind Projects', color: 'cyan' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-3 px-5 text-sm font-bold border-b-3 transition-all rounded-t-lg ${activeTab === tab.key
                ? tab.color === 'orange'
                  ? 'border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400'
                  : tab.color === 'cyan'
                    ? 'border-cyan-500 bg-cyan-50 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-400'
                    : 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
            >
              {tab.label}
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

      {/* Filters - Responsive Grid */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 overflow-visible">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:flex xl:flex-wrap gap-6 items-end">
          <div className="flex-1 min-w-[140px]">
            <label className="block text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-2">Category Filter</label>
            <select
              value={filters.category}
              onChange={(e) => handleCategoryTypeChange(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">▣ All Categories</option>
              <option value="solar">● Solar</option>
              <option value="wind">◆ Wind</option>
            </select>
          </div>
          <div className="flex-2 min-w-[240px]">
            <label className="block text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-2">Project Section</label>
            <select
              value={filters.section}
              onChange={(e) => handleFilterChange('section', e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">▥ All Sections</option>
              {filterOptions.filteredCategories.map((cat: string) => (
                <option key={cat} value={cat}>{getCategoryDisplayName(cat)}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="block text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-2">Project Type</label>
            <select
              value={filters.projectType}
              onChange={(e) => handleFilterChange('projectType', e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">All Types</option>
              {filterOptions.projectTypes.map((type: string) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Capacity Point</label>
            <select
              value={filters.planActual}
              onChange={(e) => handleFilterChange('planActual', e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-sm font-semibold text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500/20 outline-none"
            >
              {filterOptions.planActuals.map((pa: string) => (
                <option key={pa} value={pa}>{pa === 'Actual' ? 'Actual / Fcst' : pa}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center pb-2">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  checked={filters.showExcluded}
                  onChange={(e) => handleFilterChange('showExcluded', e.target.checked)}
                  className="w-5 h-5 text-indigo-600 border-gray-300 rounded-lg focus:ring-indigo-500 cursor-pointer"
                />
              </div>
              <span className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wide group-hover:text-indigo-600 transition-colors">Show Excluded</span>
            </label>
          </div>
          <button
            onClick={clearFilters}
            className="px-6 py-2.5 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-rose-500 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-rose-200 transition-all active:scale-95"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Summary Cards - Minimalist Adani Style */}
      {activeTab === 'overview' && !filters.section && !filters.category && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
            <h3 className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Total Included Capacity</h3>
            <p className="text-2xl font-bold text-[#0B74B0] dark:text-blue-400">{formatNumber(hierarchicalTotals.total.totalCapacity)} <span className="text-sm font-normal text-gray-400">MW</span></p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
            <h3 className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Achieved till Oct-25</h3>
            <p className="text-2xl font-bold text-[#75479C] dark:text-purple-400">{formatNumber(hierarchicalTotals.total.cummTillOct)} <span className="text-sm font-normal text-gray-400">MW</span></p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm border-l-4 border-l-orange-500">
            <h3 className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Overall Solar Capacity</h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatNumber(hierarchicalTotals.solar.totalCapacity)} <span className="text-sm font-normal text-gray-400">MW</span></p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm border-l-4 border-l-cyan-500">
            <h3 className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Overall Wind Capacity</h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatNumber(hierarchicalTotals.wind.totalCapacity)} <span className="text-sm font-normal text-gray-400">MW</span></p>
          </div>
        </div>
      )}

      {/* PDF-Style Summary Tables - Only show when no specific section/category is selected */}
      {activeTab === 'overview' && !filters.section && !filters.category && (
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

      {/* Hierarchy Breadcrumb - Clean Style */}
      <div className={`rounded-lg p-3 text-xs font-semibold ${filters.section || filters.category
        ? 'bg-gray-100 dark:bg-gray-800 border-l-4 border-l-amber-500 text-gray-700 dark:text-gray-300'
        : 'bg-gray-100 dark:bg-gray-800 border-l-4 border-l-[#0B74B0] text-gray-700 dark:text-gray-300'
        }`}>
        <span className="opacity-60 uppercase tracking-wider">Commissioning Status</span>
        <span className="mx-2 text-gray-400">/</span>
        <span className="uppercase tracking-wider">AGEL Overall FY 2025–26</span>
        {filters.category && (
          <>
            <span className="mx-2 text-gray-400">/</span>
            <span className="text-[#0B74B0] dark:text-blue-400 uppercase tracking-wider font-bold">{filters.category}</span>
          </>
        )}
        {filters.section && (
          <>
            <span className="mx-2 text-gray-400">/</span>
            <span className="text-[#75479C] dark:text-purple-400 uppercase tracking-wider font-bold">{getCategoryDisplayName(filters.section)}</span>
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

        <div className="overflow-x-auto overflow-y-auto max-h-[800px] border dark:border-gray-700 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border-collapse">
            <thead className="bg-[#f8f9fa] dark:bg-gray-900 sticky top-0 z-30">
              <tr>
                <th className="sticky left-0 z-40 bg-[#f8f9fa] dark:bg-gray-900 px-3 py-2 text-left text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase border-b border-gray-200 dark:border-gray-800">S.No</th>
                <th className="sticky left-[52px] z-40 px-3 py-2 text-left text-[9px] font-bold text-gray-800 dark:text-white uppercase border-b border-gray-200 dark:border-gray-800 bg-[#f8f9fa] dark:bg-gray-900 whitespace-nowrap">Project Name</th>
                <th className="px-3 py-2 text-left text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase border-b border-gray-200 dark:border-gray-800 bg-[#f8f9fa] dark:bg-gray-900">SPV</th>
                <th className="px-3 py-2 text-left text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase border-b border-gray-200 dark:border-gray-800 bg-[#f8f9fa] dark:bg-gray-900">Type</th>
                <th className="px-3 py-2 text-left text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase border-b border-gray-200 dark:border-gray-800 bg-[#f8f9fa] dark:bg-gray-900">Location</th>
                <th className="px-3 py-2 text-left text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase border-b border-gray-200 dark:border-gray-800 bg-[#f8f9fa] dark:bg-gray-900">Capacity</th>
                {monthLabels.map((month, idx) => (
                  <th key={idx} className="px-2 py-2 text-center text-[9px] font-bold text-gray-600 dark:text-gray-400 uppercase border-b border-gray-200 dark:border-gray-800 min-w-[65px]">{month}</th>
                ))}
                <th className="px-3 py-2 text-center text-[9px] font-bold text-gray-600 dark:text-gray-400 uppercase border-b border-gray-200 dark:border-gray-800 bg-[#f8f9fa] dark:bg-gray-900">Total</th>
                <th className="px-3 py-2 text-center text-[9px] font-bold text-[#0B74B0] dark:text-blue-400 uppercase border-b border-gray-200 dark:border-gray-800 bg-[#f8f9fa] dark:bg-gray-900">Cumm Oct</th>
                <th className="px-3 py-2 text-center text-[9px] font-bold text-gray-600 dark:text-gray-400 uppercase border-b border-gray-200 dark:border-gray-800 bg-[#f8f9fa] dark:bg-gray-900">Q1</th>
                <th className="px-3 py-2 text-center text-[9px] font-bold text-gray-600 dark:text-gray-400 uppercase border-b border-gray-200 dark:border-gray-800 bg-[#f8f9fa] dark:bg-gray-900">Q2</th>
                <th className="px-3 py-2 text-center text-[9px] font-bold text-gray-600 dark:text-gray-400 uppercase border-b border-gray-200 dark:border-gray-800 bg-[#f8f9fa] dark:bg-gray-900">Q3</th>
                <th className="px-3 py-2 text-center text-[9px] font-bold text-gray-600 dark:text-gray-400 uppercase border-b border-gray-200 dark:border-gray-800 bg-[#f8f9fa] dark:bg-gray-900">Q4</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-850 divide-y divide-gray-100 dark:divide-gray-800">
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
                  const allGroupProjects = Object.values(projectsBySection).flat().filter(p => p.includedInTotal);
                  const groupTotal = calculateTotals(allGroupProjects);

                  return (
                    <React.Fragment key={`group-${groupKey}`}>
                      {/* Major Group Header - Minimal Style */}
                      <tr className="bg-gray-50 dark:bg-gray-800 border-y border-gray-200 dark:border-gray-700">
                        <td colSpan={24} className="px-4 py-2 text-xs font-bold text-gray-800 dark:text-white uppercase tracking-wider">
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
                            <tr
                              className={`${groupConfig.bgLight} ${groupConfig.borderColor} border-l-4 cursor-pointer hover:brightness-95 transition-all`}
                              onClick={() => toggleSection(`${groupKey}-${section}`)}
                            >
                              <td colSpan={24} className={`px-4 py-3 text-sm font-bold ${groupConfig.textColor}`}>
                                <div className="flex items-center justify-between w-full">
                                  <span className="flex items-center gap-3">
                                    <span className={`transition-transform duration-200 ${expandedSections[`${groupKey}-${section}`] ? 'rotate-90' : ''}`}>
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                                      </svg>
                                    </span>
                                    <span className={`w-2 h-2 rounded-full ${groupKey === 'Solar' ? 'bg-orange-500' : 'bg-cyan-500'}`}></span>
                                    {getSectionDisplayName(section)}
                                    {!anyIncluded && (
                                      <span className="px-2 py-0.5 text-xs bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300 rounded-full border border-gray-300 dark:border-gray-500 uppercase tracking-wider">
                                        Excluded (Display Only)
                                      </span>
                                    )}
                                    {anyIncluded && (
                                      <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 rounded-full border border-green-200 dark:border-green-800 uppercase tracking-wider">
                                        ✓ Included in Total
                                      </span>
                                    )}
                                  </span>
                                  <span className="text-xs uppercase opacity-60 font-medium">
                                    {expandedSections[`${groupKey}-${section}`] ? 'Collapse' : 'Expand'} ({sectionProjects.length} Projects)
                                  </span>
                                </div>
                              </td>
                            </tr>

                            {/* Projects - with zebra striping - Only show if expanded */}
                            {expandedSections[`${groupKey}-${section}`] && sectionProjects.map((project, idx) => (
                              <tr
                                key={project.id || `${groupKey}-${section}-${idx}`}
                                className={`
                                  ${!project.includedInTotal
                                    ? 'bg-gray-50/50 text-gray-400 dark:bg-gray-800/50 dark:text-gray-500'
                                    : idx % 2 === 0
                                      ? 'bg-white dark:bg-gray-800'
                                      : 'bg-gray-50 dark:bg-gray-850'}
                                  text-gray-900 dark:text-gray-100
                                  border-b border-gray-100 dark:border-gray-700
                                  hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors
                                `}
                              >
                                <td className="sticky left-0 z-10 bg-inherit px-3 py-2 text-xs font-bold text-gray-400 dark:text-gray-500 border-r border-gray-100 dark:border-gray-800 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                                  {project.sno}
                                </td>
                                <td className="sticky left-[52px] z-10 bg-inherit px-3 py-2 text-xs whitespace-nowrap shadow-[2px_0_5px_rgba(0,0,0,0.05)] border-r border-gray-100 dark:border-gray-700 font-bold">
                                  {project.projectName}
                                </td>
                                <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400">{project.spv}</td>
                                <td className="px-3 py-2 text-xs">
                                  <span className="font-medium text-gray-500">{project.projectType}</span>
                                </td>
                                <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400">{project.plotLocation}</td>
                                <td className="px-3 py-2 text-xs font-bold text-gray-900 dark:text-white">{formatNumber(project.capacity)}</td>
                                <td className="px-3 py-2 text-xs">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${project.planActual === 'Plan' ? 'bg-slate-100 text-slate-600' :
                                    project.planActual === 'Rephase' ? 'bg-amber-100 text-amber-700' :
                                      'bg-green-100 text-green-700'
                                    }`}>
                                    {project.planActual === 'Actual' ? 'Actual/Fcst' : project.planActual}
                                  </span>
                                </td>
                                {monthColumns.map(m => (
                                  <EditableCell
                                    key={m}
                                    project={project}
                                    field={m}
                                    value={(project as any)[m]}
                                    isEditing={editingCell?.projectId === project.id && editingCell?.field === m}
                                    onEdit={() => isAdmin && setEditingCell({ projectId: project.id!, field: m })}
                                    onSave={(val) => handleCellSave(project, m, val)}
                                    onCancel={() => setEditingCell(null)}
                                    formatNumber={formatNumber}
                                    disabled={!project.includedInTotal}
                                  />
                                ))}
                                <td className="px-3 py-2 text-xs text-center font-bold bg-gray-50 dark:bg-gray-900/50">{formatNumber(project.totalCapacity)}</td>
                                <td className="px-3 py-2 text-xs text-center font-bold text-[#0B74B0] dark:text-blue-400">{formatNumber(project.cummTillOct)}</td>
                                <td className="px-3 py-2 text-xs text-center text-gray-500">{formatNumber(project.q1)}</td>
                                <td className="px-3 py-2 text-xs text-center text-gray-500">{formatNumber(project.q2)}</td>
                                <td className="px-3 py-2 text-xs text-center text-gray-500">{formatNumber(project.q3)}</td>
                                <td className="px-3 py-2 text-xs text-center text-gray-500">{formatNumber(project.q4)}</td>
                              </tr>
                            ))
                            }

                            {/* SECTION SUB-TOTAL - Minimalist */}
                            {
                              expandedSections[`${groupKey}-${section}`] && anyIncluded && (
                                <tr className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 font-bold text-[11px]">
                                  <td colSpan={5} className="px-3 py-2 text-right text-gray-400">Section Subtotal:</td>
                                  <td className="px-3 py-2">{formatNumber(sectionTotal.capacity)}</td>
                                  {monthColumns.map(m => <td key={m} className="px-2 py-2 text-center">{formatNumber(sectionTotal[m])}</td>)}
                                  <td className="px-3 py-2 text-center">{formatNumber(sectionTotal.totalCapacity)}</td>
                                  <td className="px-3 py-2 text-center text-[#0B74B0] dark:text-blue-400">{formatNumber(sectionTotal.cummTillOct)}</td>
                                  <td className="px-3 py-2 text-center text-gray-500">{formatNumber(sectionTotal.q1)}</td>
                                  <td className="px-3 py-2 text-center text-gray-500">{formatNumber(sectionTotal.q2)}</td>
                                  <td className="px-3 py-2 text-center text-gray-500">{formatNumber(sectionTotal.q3)}</td>
                                  <td className="px-3 py-2 text-center text-gray-500">{formatNumber(sectionTotal.q4)}</td>
                                </tr>
                              )
                            }
                          </React.Fragment>
                        );
                      })}

                      {/* GROUP TOTAL - Minimalist Style */}
                      <tr className="bg-gray-100 dark:bg-gray-900 border-t border-gray-300 dark:border-gray-700 font-bold text-xs">
                        <td colSpan={5} className="px-3 py-2 text-right uppercase text-gray-500">
                          Total {groupKey}:
                        </td>
                        <td className="px-3 py-2 font-bold">{formatNumber(groupTotal.capacity)}</td>
                        {monthColumns.map(m => <td key={m} className="px-2 py-2 text-center">{formatNumber(groupTotal[m])}</td>)}
                        <td className="px-3 py-2 text-center font-bold">{formatNumber(groupTotal.totalCapacity)}</td>
                        <td className="px-3 py-2 text-center text-[#0B74B0] dark:text-blue-400 font-bold">{formatNumber(groupTotal.cummTillOct)}</td>
                        <td className="px-3 py-2 text-center">{formatNumber(groupTotal.q1)}</td>
                        <td className="px-3 py-2 text-center">{formatNumber(groupTotal.q2)}</td>
                        <td className="px-3 py-2 text-center">{formatNumber(groupTotal.q3)}</td>
                        <td className="px-3 py-2 text-center">{formatNumber(groupTotal.q4)}</td>
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
                    <tr className="sticky bottom-0 z-40 bg-gray-900 text-white font-bold text-xs">
                      <td colSpan={5} className="px-3 py-3 text-right uppercase tracking-wider">
                        AGEL Overall Total:
                      </td>
                      <td className="px-3 py-3 font-bold">{formatNumber(grandTotal.capacity)}</td>
                      {monthColumns.map(m => <td key={m} className="px-2 py-3 text-center">{formatNumber(grandTotal[m])}</td>)}
                      <td className="px-3 py-3 text-center font-bold">{formatNumber(grandTotal.totalCapacity)}</td>
                      <td className="px-3 py-3 text-center text-blue-400 font-bold">{formatNumber(grandTotal.cummTillOct)}</td>
                      <td className="px-3 py-3 text-center text-gray-400">{formatNumber(grandTotal.q1)}</td>
                      <td className="px-3 py-3 text-center text-gray-400">{formatNumber(grandTotal.q2)}</td>
                      <td colSpan={1} className="px-3 py-3 text-center text-gray-400">{formatNumber(grandTotal.q3)}</td>
                      <td className="px-3 py-3 text-center text-gray-400">{formatNumber(grandTotal.q4)}</td>
                    </tr>
                  );
                })()
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal removed in favor of inline editing */}

      {/* Upload Excel Modal */}
      {
        showUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Upload Commissioning Excel</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Supports consolidated Excel (.xlsx) or Summary CSV files.
                </p>
              </div>

              <div className="p-6 space-y-4">
                {uploading ? (
                  <div className="py-12 flex flex-col items-center justify-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 animate-pulse">
                      Processing your file, please wait...
                    </p>
                  </div>
                ) : !uploadResult ? (
                  <>
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all cursor-pointer group">
                      <input
                        type="file"
                        accept=".xlsx,.csv"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const ext = file.name.split('.').pop()?.toLowerCase();
                            if (ext !== 'xlsx' && ext !== 'csv') {
                              alert('Only .xlsx and .csv files are accepted');
                              return;
                            }
                            handleExcelUpload(file);
                          }
                        }}
                        className="hidden"
                        id="excel-upload"
                      />
                      <label htmlFor="excel-upload" className="cursor-pointer block">
                        <div className="bg-blue-100 dark:bg-blue-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                          </svg>
                        </div>
                        <p className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Supports .xlsx workbooks and .csv files
                        </p>
                      </label>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex items-start space-x-3">
                      <svg className="h-5 w-5 text-blue-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                        <strong>Pro Tip:</strong> You can upload the consolidated Excel file to update all data at once, or just the Summary CSV for project updates.
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    {/* Results Heading */}
                    <div className={uploadResult.success !== undefined && uploadResult.success > 0 ? "bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-100 dark:border-green-800" : "bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-100 dark:border-orange-800"}>
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${uploadResult.success !== undefined && uploadResult.success > 0 ? "bg-green-100 dark:bg-green-800" : "bg-orange-100 dark:bg-orange-800"}`}>
                          {uploadResult.success !== undefined && uploadResult.success > 0 ? (
                            <svg className="h-5 w-5 text-green-600 dark:text-green-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="h-5 w-5 text-orange-600 dark:text-orange-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <p className={`text-sm font-bold ${uploadResult.success !== undefined && uploadResult.success > 0 ? "text-green-800 dark:text-green-400" : "text-orange-800 dark:text-orange-400"}`}>
                            {uploadResult.success !== undefined && uploadResult.success > 0
                              ? `Import Successful`
                              : `No data imported`}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {uploadResult.success || 0} projects identified
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    {uploadResult.sheets_found && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700 text-center">
                          <p className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 mb-1">Files/Tabs</p>
                          <p className="text-lg font-bold text-gray-900 dark:text-white">{uploadResult.sheet_count || 0}</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700 text-center">
                          <p className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 mb-1">Summaries</p>
                          <p className="text-lg font-bold text-gray-900 dark:text-white">{(uploadResult as any).summaries_imported || 0}</p>
                        </div>
                      </div>
                    )}

                    {/* Errors if any */}
                    {uploadResult.errors && uploadResult.errors.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Issues Encountered:</p>
                        <div className="bg-red-50 dark:bg-red-900/10 p-3 rounded-lg border border-red-100 dark:border-red-900/30">
                          <ul className="text-[11px] text-red-700 dark:text-red-400 space-y-1">
                            {uploadResult.errors.slice(0, 3).map((err, idx) => (
                              <li key={idx} className="flex items-start">
                                <span className="mr-2">•</span>
                                <span>{err}</span>
                              </li>
                            ))}
                            {uploadResult.errors.length > 3 && (
                              <li className="font-medium text-[10px] mt-1 italic">
                                + {uploadResult.errors.length - 3} more technical issues...
                              </li>
                            )}
                          </ul>
                        </div>
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
        )
      }
    </div>
  );
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
      className={`px-2 py-2 text-xs text-center border-r border-gray-100 dark:border-gray-800 transition-colors cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 ${disabled ? 'opacity-30' : 'text-gray-700 dark:text-gray-300 font-medium'}`}
    >
      {formatNumber(value)}
    </td>
  );
}

// Summary Table Component - Matches PDF format
// (Rest of SummaryTable follows but updated for style)
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
              <th className="px-1 py-2 text-center text-[9px] font-bold text-gray-500 uppercase">Total</th>
              <th className="px-1 py-2 text-center text-[9px] font-bold text-[#0B74B0] uppercase">Cumm Oct</th>
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
            {renderRow('Actual', actualData.total, 'bg-green-50/30 dark:bg-green-900/10 font-bold')}
            {Object.entries(actualData.byType).map(([type, data]) => renderRow(type, data))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
