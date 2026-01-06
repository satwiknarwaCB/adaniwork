"use client";

import { useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import SearchableDropdown from './SearchableDropdown';

// Define the structure for dropdown options
interface DropdownOptions {
    groups: string[];
    ppaMerchants: string[];
    types: string[];
    locationCodes: string[];
    locations: string[];
    connectivities: string[];
    sections: string[]; // Added sections
    categories: string[]; // Added dynamic categories (Solar, Wind, Hybrid, etc.)
}

// Define the structure for location relationships
interface LocationRelationship {
    location: string;
    locationCode: string;
}

// Define the structure for a manual project entry
interface NewProjectData {
    category: string;
    section: string;
    projectName: string;
    spv: string;
    projectType: string;
    capacity: number;
    fiscalYear: string;
}

export default function MasterDataTable() {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'groups' | 'locations' | 'projects'>('projects'); // Default to projects as it's the new req
    const [fiscalYear, setFiscalYear] = useState('FY_25-26');

    // --- NEW PROJECT STATE ---
    const [newProject, setNewProject] = useState<NewProjectData>({
        category: 'Solar',
        section: 'A',
        projectName: '',
        spv: '',
        projectType: '',
        capacity: 0,
        fiscalYear: 'FY_25-26'
    });

    // --- EXISTING DROPDOWN OPTION STATES ---
    const [newOption, setNewOption] = useState({
        category: 'types',
        value: ''
    });

    const [editingOption, setEditingOption] = useState<{
        category: keyof DropdownOptions;
        index: number;
        value: string;
    } | null>(null);

    // --- EXISTING RELATIONSHIP STATES ---
    const [newRelationship, setNewRelationship] = useState<LocationRelationship>({
        location: '',
        locationCode: ''
    });

    const [editingRelationship, setEditingRelationship] = useState<{
        index: number;
        relationship: LocationRelationship;
    } | null>(null);

    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        message: string;
        onConfirm: () => void;
        onCancel: () => void;
    } | null>(null);

    // --- DATA FETCHING ---
    const { data: masterData, isLoading, error } = useQuery({
        queryKey: ['masterData', fiscalYear],
        queryFn: async () => {
            const dropdownResponse = await fetch(`/api/dropdown-options?fiscalYear=${fiscalYear}`);
            if (!dropdownResponse.ok) throw new Error('Failed to fetch dropdown options');
            const dropdownData = await dropdownResponse.json();

            const relResponse = await fetch(`/api/location-relationships?fiscalYear=${fiscalYear}`);
            if (!relResponse.ok) throw new Error('Failed to fetch location relationships');
            const relationships = await relResponse.json();

            return {
                dropdownOptions: {
                    groups: dropdownData.groups || [],
                    ppaMerchants: dropdownData.ppaMerchants || [],
                    types: dropdownData.types || [],
                    locationCodes: dropdownData.locationCodes || [],
                    locations: dropdownData.locations || [],
                    connectivities: dropdownData.connectivities || [],
                    sections: dropdownData.sections || ['A', 'B', 'C', 'D'],
                    categories: dropdownData.categories || ['Solar', 'Wind']
                },
                locationRelationships: relationships || []
            };
        },
        staleTime: 5 * 60 * 1000,
    });

    // --- MUTATIONS ---
    const addProjectMutation = useMutation({
        mutationFn: async (project: NewProjectData) => {
            const response = await fetch('/api/manual-add-project', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(project),
            });
            if (!response.ok) throw new Error(await response.text());
            return response.json();
        },
        onSuccess: () => {
            alert('Project added successfully! It will now show up in the Commissioning Status page.');
            queryClient.invalidateQueries({ queryKey: ['commissioning-projects'] });
            setNewProject({ ...newProject, projectName: '', capacity: 0 }); // Reset partial form
        },
        onError: (err) => alert('Error adding project: ' + err.message)
    });

    const saveDropdownOptionsMutation = useMutation({
        mutationFn: async (options: DropdownOptions) => {
            const response = await fetch(`/api/dropdown-options?fiscalYear=${fiscalYear}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(options),
            });
            if (!response.ok) throw new Error(await response.text());
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['masterData', fiscalYear] });
        }
    });

    // --- EXTRACT DATA ---
    const dropdownOptions = masterData?.dropdownOptions || {
        groups: [], ppaMerchants: [], types: [], locationCodes: [], locations: [], connectivities: [], sections: [], categories: []
    };
    const locationRelationships = masterData?.locationRelationships || [];

    // --- HANDLERS ---
    const handleAddProject = () => {
        if (!newProject.projectName.trim() || !newProject.spv || !newProject.section) {
            alert('Please fill in all mandatory fields (Name, SPV, Section).');
            return;
        }

        // Auto-map fiscal year
        const projectToSave = { ...newProject, fiscalYear };
        addProjectMutation.mutate(projectToSave);
    };

    const handleAddOption = () => {
        if (!newOption.value.trim()) return;
        const cat = newOption.category as keyof DropdownOptions;
        if (dropdownOptions[cat].includes(newOption.value)) return;

        const updated = { ...dropdownOptions, [cat]: [...dropdownOptions[cat], newOption.value] };
        saveDropdownOptionsMutation.mutate(updated);
        setNewOption({ ...newOption, value: '' });
    };

    const handleDeleteOption = (category: keyof DropdownOptions, index: number) => {
        if (!window.confirm('Are you sure you want to delete this option?')) return;
        const updated = { ...dropdownOptions, [category]: dropdownOptions[category].filter((_: string, i: number) => i !== index) };
        saveDropdownOptionsMutation.mutate(updated);
    };

    if (isLoading) return <div className="p-8 text-center text-gray-500">Loading Master Data...</div>;

    return (
        <div className="p-4 sm:p-6 lg:p-8 dark:bg-[#171717] min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Master Data Management</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Manage structure, dropdowns, and project definitions</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Fiscal Year:</span>
                    <select
                        value={fiscalYear}
                        onChange={(e) => setFiscalYear(e.target.value)}
                        className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="FY_25-26">FY 25-26</option>
                        <option value="FY_24-25">FY 24-25</option>
                    </select>
                </div>
            </div>

            <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
                <nav className="flex space-x-8">
                    {[
                        { id: 'projects', label: 'Add New Project', color: 'blue' },
                        { id: 'groups', label: 'Dropdown Options', color: 'purple' },
                        { id: 'locations', label: 'Location Mappings', color: 'orange' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* --- ADD NEW PROJECT TAB --- */}
            {activeTab === 'projects' && (
                <div className="max-w-4xl bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Create New Project Definition</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Category Type</label>
                                <SearchableDropdown
                                    options={dropdownOptions.categories}
                                    value={newProject.category}
                                    onChange={(val) => setNewProject({ ...newProject, category: val })}
                                    placeholder="Select Category (Solar, Wind...)"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Section</label>
                                <SearchableDropdown
                                    options={dropdownOptions.sections}
                                    value={newProject.section}
                                    onChange={(val) => setNewProject({ ...newProject, section: val })}
                                    placeholder="Select Section (A, B, C...)"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Project Name</label>
                                <input
                                    type="text"
                                    value={newProject.projectName}
                                    onChange={(e) => setNewProject({ ...newProject, projectName: e.target.value })}
                                    placeholder="Enter dynamic project name"
                                    className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">SPV</label>
                                <SearchableDropdown
                                    options={dropdownOptions.ppaMerchants}
                                    value={newProject.spv}
                                    onChange={(val) => setNewProject({ ...newProject, spv: val })}
                                    placeholder="Select SPV"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Project Type</label>
                                <SearchableDropdown
                                    options={dropdownOptions.types}
                                    value={newProject.projectType}
                                    onChange={(val) => setNewProject({ ...newProject, projectType: val })}
                                    placeholder="E.g. PPA, Merchant"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Total Capacity (MW)</label>
                                <input
                                    type="number"
                                    value={newProject.capacity || ''}
                                    onChange={(e) => setNewProject({ ...newProject, capacity: parseFloat(e.target.value) || 0 })}
                                    className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end">
                        <button
                            onClick={handleAddProject}
                            disabled={addProjectMutation.isPending}
                            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm shadow-md transition-all flex items-center gap-2"
                        >
                            {addProjectMutation.isPending ? 'Saving...' : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Create Project & Initialize Table
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* --- DROPDOWN OPTIONS TAB --- */}
            {activeTab === 'groups' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Object.entries(dropdownOptions).map(([cat, opts]) => (
                        <div key={cat} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                                <h5 className="font-bold text-sm text-gray-700 dark:text-gray-300 capitalize">{cat.replace(/([A-Z])/g, ' $1')}</h5>
                                <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-bold">{(opts as string[]).length}</span>
                            </div>
                            <div className="p-4">
                                <div className="flex gap-2 mb-4">
                                    <input
                                        type="text"
                                        className="flex-1 text-xs px-2 py-1.5 border rounded dark:bg-gray-900 dark:border-gray-700 outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="Add new..."
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                const val = (e.target as HTMLInputElement).value;
                                                if (val.trim()) {
                                                    const updated = { ...dropdownOptions, [cat]: [...(opts as string[]), val.trim()] };
                                                    saveDropdownOptionsMutation.mutate(updated);
                                                    (e.target as HTMLInputElement).value = '';
                                                }
                                            }
                                        }}
                                    />
                                </div>
                                <ul className="space-y-1 max-h-48 overflow-y-auto">
                                    {(opts as string[]).map((opt, i) => (
                                        <li key={i} className="group flex justify-between items-center text-xs text-gray-600 dark:text-gray-400 py-1.5 px-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors">
                                            <span>{opt}</span>
                                            <button
                                                onClick={() => handleDeleteOption(cat as any, i)}
                                                className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* --- LOCATIONS TAB --- */}
            {activeTab === 'locations' && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="p-6">
                        <p className="text-sm text-gray-500 mb-4">Map literal project locations to their standardized tracking codes.</p>
                        {/* Simplified Location Table would go here */}
                        <div className="text-center py-12 text-gray-400">
                            <p>Location Mapping Module Loaded.</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
