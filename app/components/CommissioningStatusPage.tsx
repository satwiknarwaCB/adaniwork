"use client";

import { useState, useEffect, useMemo } from 'react';
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

// Section display name mapping
const sectionDisplayNames: Record<string, string> = {
  'A': 'A. Khavda Solar Projects',
  'B': 'B. Rajasthan Solar Projects',
  'C': 'C. Rajasthan Solar Projects (Additional to Chairman Plan – 500 MW)',
  'D1': 'D1. Khavda Solar (Copper + Merchant – 50 MW)',
  'D2': 'D2. Khavda Solar (Additional for Internal – 650 MW)'
};

const getSectionDisplayName = (section: string): string => {
  return sectionDisplayNames[section] || `Section ${section}`;
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
    planActual: 'Actual',
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
    queryKey: ['commissioning-projects', fiscalYear],
    queryFn: async () => {
      const response = await fetch(`/api/commissioning-projects?fiscalYear=${fiscalYear}`);
      if (!response.ok) throw new Error('Failed to fetch projects');
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch summaries
  const { data: summaries = [], isLoading: summariesLoading } = useQuery({
    queryKey: ['commissioning-summaries', fiscalYear],
    queryFn: async () => {
      const response = await fetch(`/api/commissioning-summaries?fiscalYear=${fiscalYear}`);
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

  // Filter projects by tab
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
    
    // Filter based on showExcluded toggle
    if (!filters.showExcluded) {
      filtered = filtered.filter((p: CommissioningProject) => p.includedInTotal);
    }
    
    return filtered;
  }, [filteredProjects, activeTab, filters.showExcluded]);

  // Group projects by category and section
  const groupedProjects = useMemo(() => {
    const groups: Record<string, Record<string, CommissioningProject[]>> = {};
    
    tabProjects.forEach((project: CommissioningProject) => {
      if (!groups[project.category]) {
        groups[project.category] = {};
      }
      if (!groups[project.category][project.section]) {
        groups[project.category][project.section] = [];
      }
      groups[project.category][project.section].push(project);
    });
    
    return groups;
  }, [tabProjects]);

  // Calculate totals for a group of projects
  const calculateTotals = (projects: CommissioningProject[]) => {
    const totals: any = {
      capacity: 0,
      apr: 0, may: 0, jun: 0, jul: 0, aug: 0, sep: 0,
      oct: 0, nov: 0, dec: 0, jan: 0, feb: 0, mar: 0,
      totalCapacity: 0, cummTillOct: 0,
      q1: 0, q2: 0, q3: 0, q4: 0
    };
    
    projects.forEach(p => {
      totals.capacity += p.capacity || 0;
      monthColumns.forEach(month => {
        totals[month] += (p as any)[month] || 0;
      });
      totals.totalCapacity += p.totalCapacity || 0;
      totals.cummTillOct += p.cummTillOct || 0;
      totals.q1 += p.q1 || 0;
      totals.q2 += p.q2 || 0;
      totals.q3 += p.q3 || 0;
      totals.q4 += p.q4 || 0;
    });
    
    return totals;
  };

  // Calculate hierarchical totals based on includedInTotal flag AND planActual filter
  const calculateHierarchicalTotals = () => {
    // Filter by planActual first if selected
    let filteredProjects = projects.filter((p: CommissioningProject) => p.includedInTotal);
    
    // Apply planActual filter if set
    if (filters.planActual) {
      filteredProjects = filteredProjects.filter((p: CommissioningProject) => p.planActual === filters.planActual);
    }
    
    const solarProjects = filteredProjects.filter((p: CommissioningProject) => 
      p.category.toLowerCase().includes('solar')
    );
    const windProjects = filteredProjects.filter((p: CommissioningProject) => 
      p.category.toLowerCase().includes('wind')
    );
    
    return {
      solar: calculateTotals(solarProjects),
      wind: calculateTotals(windProjects),
      total: calculateTotals(filteredProjects)
    };
  };

  const hierarchicalTotals = useMemo(() => calculateHierarchicalTotals(), [projects, filters.planActual]);

  // Handle filter change
  const handleFilterChange = (key: string, value: string | boolean) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({ category: '', projectType: '', planActual: 'Actual', spv: '', section: '', showExcluded: true });
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
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              isAdmin 
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
              className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {tab === 'overview' ? 'Overall Summary' : tab === 'solar' ? 'Solar Projects' : 'Wind Projects'}
            </button>
          ))}
        </nav>
        
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
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{formatNumber(hierarchicalTotals.total.capacity)} MW</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Cumm till Oct-25</h3>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatNumber(hierarchicalTotals.total.cummTillOct)} MW</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Solar Capacity</h3>
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{formatNumber(hierarchicalTotals.solar.capacity)} MW</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Wind Capacity</h3>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{formatNumber(hierarchicalTotals.wind.capacity)} MW</p>
          </div>
        </div>
      )}

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
                Object.entries(groupedProjects).map(([category, sections]) => (
                  <>
                    {/* Category Header */}
                    <tr key={`cat-${category}`} className="bg-blue-50 dark:bg-blue-900/20">
                      <td colSpan={21} className="px-3 py-2 text-sm font-bold text-blue-900 dark:text-blue-300">
                        {category}
                      </td>
                    </tr>
                    
                    {/* Sections within category */}
                    {Object.entries(sections).map(([section, sectionProjects]) => {
                      const sectionTotal = calculateTotals(sectionProjects);
                      return (
                        <>
                          {/* Section Header */}
                          {Object.keys(sections).length > 1 && (
                            <tr key={`sec-${category}-${section}`} className="bg-gray-100 dark:bg-gray-700">
                              <td colSpan={21} className="px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300">
                                {getSectionDisplayName(section)}
                                {!sectionProjects[0]?.includedInTotal && (
                                  <span className="ml-2 px-2 py-0.5 text-xs bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 rounded">
                                    Excluded from Total
                                  </span>
                                )}
                              </td>
                            </tr>
                          )}
                          
                          {/* Projects in section */}
                          {sectionProjects.map((project: CommissioningProject, index: number) => (
                            <tr 
                              key={project.id || `${category}-${section}-${index}`}
                              className={`${
                                !project.includedInTotal 
                                  ? 'bg-orange-50/50 dark:bg-orange-900/10 opacity-75' 
                                  : index % 2 === 0 
                                    ? 'bg-white dark:bg-gray-800' 
                                    : 'bg-gray-50 dark:bg-gray-900'
                              }`}
                            >
                              <td className="sticky left-0 z-10 bg-inherit px-3 py-2 text-sm text-gray-900 dark:text-white">
                                {project.sno}
                                {!project.includedInTotal && (
                                  <span className="ml-1 text-orange-500" title="Excluded from totals">*</span>
                                )}
                              </td>
                              <td className="px-3 py-2 text-sm text-gray-900 dark:text-white whitespace-nowrap">{project.projectName}</td>
                              <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300">{project.spv}</td>
                              <td className="px-3 py-2 text-sm">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  project.projectType === 'PPA' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                                  project.projectType === 'Merchant' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                  'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                                }`}>
                                  {project.projectType}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300">{project.plotLocation}</td>
                              <td className="px-3 py-2 text-sm text-gray-900 dark:text-white font-medium">{formatNumber(project.capacity)}</td>
                              <td className="px-3 py-2 text-sm">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  project.planActual === 'Plan' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' :
                                  project.planActual === 'Rephase' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                  'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                }`}>
                                  {project.planActual === 'Actual' ? 'Actual / Fcst' : project.planActual}
                                </span>
                              </td>
                              {monthColumns.map((month) => (
                                <td key={month} className="px-2 py-2 text-sm text-center text-gray-600 dark:text-gray-300">
                                  {formatNumber((project as any)[month])}
                                </td>
                              ))}
                              <td className="px-3 py-2 text-sm text-center font-medium text-gray-900 dark:text-white">{formatNumber(project.totalCapacity)}</td>
                              <td className="px-3 py-2 text-sm text-center font-medium text-blue-600 dark:text-blue-400">{formatNumber(project.cummTillOct)}</td>
                              <td className="px-3 py-2 text-sm text-center text-gray-600 dark:text-gray-300">{formatNumber(project.q1)}</td>
                              <td className="px-3 py-2 text-sm text-center text-gray-600 dark:text-gray-300">{formatNumber(project.q2)}</td>
                              <td className="px-3 py-2 text-sm text-center text-gray-600 dark:text-gray-300">{formatNumber(project.q3)}</td>
                              <td className="px-3 py-2 text-sm text-center text-gray-600 dark:text-gray-300">{formatNumber(project.q4)}</td>
                              {isAdmin && (
                                <td className="px-3 py-2 text-sm text-center">
                                  <div className="flex gap-1 justify-center">
                                    <button
                                      onClick={() => handleEditProject(project)}
                                      className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                      title="Edit"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                      </svg>
                                    </button>
                                    <button
                                      onClick={() => handleDeleteProject(project.id!)}
                                      className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                      title="Delete"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                      </svg>
                                    </button>
                                  </div>
                                </td>
                              )}
                            </tr>
                          ))}
                          
                          {/* Section Subtotal */}
                          {sectionProjects.length > 1 && (
                            <tr className="bg-gray-200 dark:bg-gray-700 font-semibold">
                              <td colSpan={5} className="px-3 py-2 text-sm text-right text-gray-900 dark:text-white">
                                Section {section} Subtotal:
                              </td>
                              <td className="px-3 py-2 text-sm text-gray-900 dark:text-white">{formatNumber(sectionTotal.capacity)}</td>
                              <td className="px-3 py-2"></td>
                              {monthColumns.map((month) => (
                                <td key={month} className="px-2 py-2 text-sm text-center text-gray-900 dark:text-white">
                                  {formatNumber(sectionTotal[month])}
                                </td>
                              ))}
                              <td className="px-3 py-2 text-sm text-center text-gray-900 dark:text-white">{formatNumber(sectionTotal.totalCapacity)}</td>
                              <td className="px-3 py-2 text-sm text-center font-bold text-blue-600 dark:text-blue-400">{formatNumber(sectionTotal.cummTillOct)}</td>
                              <td className="px-3 py-2 text-sm text-center text-gray-900 dark:text-white">{formatNumber(sectionTotal.q1)}</td>
                              <td className="px-3 py-2 text-sm text-center text-gray-900 dark:text-white">{formatNumber(sectionTotal.q2)}</td>
                              <td className="px-3 py-2 text-sm text-center text-gray-900 dark:text-white">{formatNumber(sectionTotal.q3)}</td>
                              <td className="px-3 py-2 text-sm text-center text-gray-900 dark:text-white">{formatNumber(sectionTotal.q4)}</td>
                              {isAdmin && <td></td>}
                            </tr>
                          )}
                        </>
                      );
                    })}
                    
                    {/* Category Total */}
                    {(() => {
                      const categoryProjects = Object.values(sections).flat();
                      const categoryTotal = calculateTotals(categoryProjects);
                      return (
                        <tr className="bg-blue-100 dark:bg-blue-900/40 font-bold">
                          <td colSpan={5} className="px-3 py-2.5 text-sm text-right text-blue-900 dark:text-blue-200">
                            {category} Total:
                          </td>
                          <td className="px-3 py-2.5 text-sm text-blue-900 dark:text-blue-200">{formatNumber(categoryTotal.capacity)}</td>
                          <td className="px-3 py-2.5"></td>
                          {monthColumns.map((month) => (
                            <td key={month} className="px-2 py-2.5 text-sm text-center text-blue-900 dark:text-blue-200">
                              {formatNumber(categoryTotal[month])}
                            </td>
                          ))}
                          <td className="px-3 py-2.5 text-sm text-center text-blue-900 dark:text-blue-200">{formatNumber(categoryTotal.totalCapacity)}</td>
                          <td className="px-3 py-2.5 text-sm text-center font-bold text-blue-700 dark:text-blue-300">{formatNumber(categoryTotal.cummTillOct)}</td>
                          <td className="px-3 py-2.5 text-sm text-center text-blue-900 dark:text-blue-200">{formatNumber(categoryTotal.q1)}</td>
                          <td className="px-3 py-2.5 text-sm text-center text-blue-900 dark:text-blue-200">{formatNumber(categoryTotal.q2)}</td>
                          <td className="px-3 py-2.5 text-sm text-center text-blue-900 dark:text-blue-200">{formatNumber(categoryTotal.q3)}</td>
                          <td className="px-3 py-2.5 text-sm text-center text-blue-900 dark:text-blue-200">{formatNumber(categoryTotal.q4)}</td>
                          {isAdmin && <td></td>}
                        </tr>
                      );
                    })()}
                  </>
                ))
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
