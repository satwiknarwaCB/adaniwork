"use client";

import { useState, useEffect } from 'react';
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
}

// Define the structure for location relationships
interface LocationRelationship {
  location: string;
  locationCode: string;
}

export default function MasterDataTable() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'groups' | 'locations'>('groups');
  const [searchTerm, setSearchTerm] = useState('');
  const [fiscalYear, setFiscalYear] = useState('FY_23');

  // State for adding new dropdown options
  const [newOption, setNewOption] = useState({
    category: 'groups',
    value: ''
  });

  // State for editing dropdown options
  const [editingOption, setEditingOption] = useState<{
    category: keyof DropdownOptions;
    index: number;
    value: string;
  } | null>(null);

  // State for adding new location relationships
  const [newRelationship, setNewRelationship] = useState<LocationRelationship>({
    location: '',
    locationCode: ''
  });

  // State for editing location relationships
  const [editingRelationship, setEditingRelationship] = useState<{
    index: number;
    relationship: LocationRelationship;
  } | null>(null);

  // State for confirmation dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
  } | null>(null);

  // Load dropdown options and location relationships with React Query
  const { data: masterData, isLoading, error } = useQuery({
    queryKey: ['masterData', fiscalYear],
    queryFn: async () => {
      // Load all dropdown options at once with fiscalYear parameter
      const dropdownResponse = await fetch(`/api/dropdown-options?fiscalYear=${fiscalYear}`);
      if (!dropdownResponse.ok) {
        throw new Error('Failed to fetch dropdown options');
      }
      const dropdownData = await dropdownResponse.json();

      // Load location relationships with fiscalYear parameter
      const relResponse = await fetch(`/api/location-relationships?fiscalYear=${fiscalYear}`);
      if (!relResponse.ok) {
        throw new Error('Failed to fetch location relationships');
      }
      const relationships = await relResponse.json();

      return {
        dropdownOptions: {
          groups: Array.isArray(dropdownData.groups) ? dropdownData.groups : [],
          ppaMerchants: Array.isArray(dropdownData.ppaMerchants) ? dropdownData.ppaMerchants : [],
          types: Array.isArray(dropdownData.types) ? dropdownData.types : [],
          locationCodes: Array.isArray(dropdownData.locationCodes) ? dropdownData.locationCodes : [],
          locations: Array.isArray(dropdownData.locations) ? dropdownData.locations : [],
          connectivities: Array.isArray(dropdownData.connectivities) ? dropdownData.connectivities : []
        },
        locationRelationships: Array.isArray(relationships) ? relationships : []
      };
    },
    enabled: !!fiscalYear, // Only fetch when fiscalYear is provided
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Mutation for saving dropdown options
  const saveDropdownOptionsMutation = useMutation({
    mutationFn: async (options: DropdownOptions) => {
      console.log('Saving dropdown options:', options);
      const response = await fetch(`/api/dropdown-options?fiscalYear=${fiscalYear}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to save dropdown options: ${response.status} ${response.statusText} ${errorText}`);
      }

      const result = await response.json();
      console.log('Dropdown options saved successfully:', result);
      return result;
    },
    onSuccess: () => {
      // Invalidate and refetch master data
      console.log('Invalidating master data query');
      queryClient.invalidateQueries({ queryKey: ['masterData', fiscalYear] });
      // Also refetch immediately to ensure UI updates
      queryClient.refetchQueries({ queryKey: ['masterData', fiscalYear] });
    },
    onError: (error) => {
      console.error('Error saving dropdown options:', error);
      alert('Error saving dropdown options: ' + error.message);
    },
  });

  // Mutation for saving location relationships
  const saveLocationRelationshipsMutation = useMutation({
    mutationFn: async (relationships: LocationRelationship[]) => {
      console.log('Saving location relationships:', relationships);
      const response = await fetch(`/api/location-relationships?fiscalYear=${fiscalYear}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(relationships),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to save location relationships: ${response.status} ${response.statusText} ${errorText}`);
      }

      const result = await response.json();
      console.log('Location relationships saved successfully:', result);
      return result;
    },
    onSuccess: () => {
      // Invalidate and refetch master data
      console.log('Invalidating master data query');
      queryClient.invalidateQueries({ queryKey: ['masterData', fiscalYear] });
      // Also refetch immediately to ensure UI updates
      queryClient.refetchQueries({ queryKey: ['masterData', fiscalYear] });
    },
    onError: (error) => {
      console.error('Error saving location relationships:', error);
      alert('Error saving location relationships: ' + error.message);
    },
  });

  // Extract data with defaults
  const dropdownOptions = masterData?.dropdownOptions || {
    groups: [],
    ppaMerchants: [],
    types: [],
    locationCodes: [],
    locations: [],
    connectivities: []
  };
  
  const locationRelationships = masterData?.locationRelationships || [];

  const handleAddOption = () => {
    if (!user) {
      alert('You need to be authenticated to add new options.');
      return;
    }

    if (!newOption.value.trim()) {
      alert('Please enter a value.');
      return;
    }

    // Check if option already exists
    if (dropdownOptions[newOption.category as keyof DropdownOptions].includes(newOption.value)) {
      alert('This option already exists.');
      return;
    }

    const updatedOptions = {
      ...dropdownOptions,
      [newOption.category]: [...dropdownOptions[newOption.category as keyof DropdownOptions], newOption.value]
    };

    console.log('Adding new option:', newOption.category, newOption.value);
    console.log('Updated options to be saved:', updatedOptions);

    // Save using mutation
    saveDropdownOptionsMutation.mutate(updatedOptions);

    // Reset form
    setNewOption({
      category: 'groups',
      value: ''
    });
  };

  const handleEditOption = () => {
    if (!user || !editingOption) {
      alert('You need to be authenticated to edit options.');
      return;
    }

    if (!editingOption.value.trim()) {
      alert('Please enter a value.');
      return;
    }

    const updatedOptions = {
      ...dropdownOptions,
      [editingOption.category]: dropdownOptions[editingOption.category].map((item: string, index: number) => 
        index === editingOption.index ? editingOption.value : item
      )
    };

    console.log('Editing option:', editingOption);
    console.log('Updated options to be saved:', updatedOptions);

    // Save using mutation
    saveDropdownOptionsMutation.mutate(updatedOptions);

    setEditingOption(null);
  };

  const handleDeleteOption = (category: keyof DropdownOptions, index: number) => {
    if (!user) {
      alert('You need to be authenticated to delete options.');
      return;
    }

    if (dropdownOptions[category].length <= 1) {
      alert('You must have at least one option in each category.');
      return;
    }

    const updatedOptions = {
      ...dropdownOptions,
      [category]: dropdownOptions[category].filter((_: string, i: number) => i !== index)
    };

    console.log('Deleting option at index:', index, 'from category:', category);
    console.log('Updated options to be saved:', updatedOptions);

    // Save using mutation
    saveDropdownOptionsMutation.mutate(updatedOptions);
  };

  const handleAddRelationship = () => {
    if (!user) {
      alert('You need to be authenticated to add new relationships.');
      return;
    }

    if (!newRelationship.location.trim() || !newRelationship.locationCode.trim()) {
      alert('Please enter both location and location code.');
      return;
    }

    // Check if relationship already exists
    if (locationRelationships.some(rel =>
      rel.location === newRelationship.location && rel.locationCode === newRelationship.locationCode)) {
      alert('This relationship already exists.');
      return;
    }

    // Check if location and location code exist in dropdown options
    const locationExists = dropdownOptions.locations.includes(newRelationship.location);
    const locationCodeExists = dropdownOptions.locationCodes.includes(newRelationship.locationCode);

    // If either doesn't exist, show confirmation dialog
    if (!locationExists || !locationCodeExists) {
      const missingItems = [];
      if (!locationExists) missingItems.push(`location "${newRelationship.location}"`);
      if (!locationCodeExists) missingItems.push(`location code "${newRelationship.locationCode}"`);
      
      const message = `The following items will be added to the dropdown options:
- ${missingItems.join('\n- ')}

Do you want to proceed?`;
      
      setConfirmDialog({
        isOpen: true,
        message,
        onConfirm: async () => {
          // Add missing items to dropdown options if needed
          let updatedOptions = { ...dropdownOptions };
          let shouldUpdateOptions = false;
          
          if (!locationExists) {
            updatedOptions.locations = [...updatedOptions.locations, newRelationship.location];
            shouldUpdateOptions = true;
          }
          
          if (!locationCodeExists) {
            updatedOptions.locationCodes = [...updatedOptions.locationCodes, newRelationship.locationCode];
            shouldUpdateOptions = true;
          }
          
          // If we need to update dropdown options first
          if (shouldUpdateOptions) {
            console.log('Updating dropdown options with new items:', updatedOptions);
            await saveDropdownOptionsMutation.mutateAsync(updatedOptions);
          }
          
          // Then add the relationship
          const updatedRelationships = [...locationRelationships, newRelationship];
          console.log('Adding new relationship:', newRelationship);
          console.log('Updated relationships to be saved:', updatedRelationships);
          saveLocationRelationshipsMutation.mutate(updatedRelationships);
          
          // Close dialog
          setConfirmDialog(null);
          
          // Reset form
          setNewRelationship({
            location: '',
            locationCode: ''
          });
        },
        onCancel: () => {
          setConfirmDialog(null);
        }
      });
    } else {
      // Both exist, just add the relationship
      const updatedRelationships = [...locationRelationships, newRelationship];
      console.log('Adding new relationship:', newRelationship);
      console.log('Updated relationships to be saved:', updatedRelationships);
      saveLocationRelationshipsMutation.mutate(updatedRelationships);
      
      // Reset form
      setNewRelationship({
        location: '',
        locationCode: ''
      });
    }
  };

  const handleEditRelationship = () => {
    if (!user || !editingRelationship) {
      alert('You need to be authenticated to edit relationships.');
      return;
    }

    // Check if relationship already exists (excluding the one being edited)
    if (locationRelationships.some((rel, index) =>
      index !== editingRelationship.index &&
      rel.location === editingRelationship.relationship.location && 
      rel.locationCode === editingRelationship.relationship.locationCode)) {
      alert('This relationship already exists.');
      return;
    }

    const updatedRelationships = locationRelationships.map((rel, index) => 
      index === editingRelationship.index ? editingRelationship.relationship : rel
    );

    console.log('Editing relationship:', editingRelationship);
    console.log('Updated relationships to be saved:', updatedRelationships);

    // Save using mutation
    saveLocationRelationshipsMutation.mutate(updatedRelationships);

    setEditingRelationship(null);
  };

  const handleDeleteRelationship = (index: number) => {
    if (!user) {
      alert('You need to be authenticated to delete relationships.');
      return;
    }

    const updatedRelationships = locationRelationships.filter((_: LocationRelationship, i: number) => i !== index);

    console.log('Deleting relationship at index:', index);
    console.log('Updated relationships to be saved:', updatedRelationships);

    // Save using mutation
    saveLocationRelationshipsMutation.mutate(updatedRelationships);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-3">Loading data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error! </strong>
        <span className="block sm:inline">{error instanceof Error ? error.message : 'An error occurred'}</span>
      </div>
    );
  }

  return (
    <div className="dark:bg-[#171717]">
      {/* Debug info */}
      <div className="hidden">
        {/* This is for debugging purposes only - will not be visible */}
        <pre>{JSON.stringify(dropdownOptions, null, 2)}</pre>
        <pre>{JSON.stringify(locationRelationships, null, 2)}</pre>
      </div>
      
      {/* Confirmation Dialog */}
      {confirmDialog && confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Confirm Action</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6 whitespace-pre-line">{confirmDialog.message}</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={confirmDialog.onCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Tab Navigation */}
      <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('groups')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'groups'
              ? 'border-[#0B74B0] text-[#0B74B0] dark:text-[#75479C] dark:border-[#75479C]'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
          >
            Group Management
          </button>
          <button
            onClick={() => setActiveTab('locations')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'locations'
              ? 'border-[#0B74B0] text-[#0B74B0] dark:text-[#75479C] dark:border-[#75479C]'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
          >
            Location Relationships
          </button>
        </nav>
      </div>

      {/* Group Management Tab */}
      {activeTab === 'groups' && (
        <div>
          {/* Add new option form - only visible when authenticated */}
          {user ? (
            <div className="mb-6 p-4 bg-[#0B74B0]/10 dark:bg-[#0B74B0]/20 rounded-lg">
              <h4 className="text-md font-semibold text-[#0B74B0] dark:text-[#75479C] mb-3">Add New Dropdown Option</h4>
              <div className="flex gap-2">
                <select
                  value={newOption.category}
                  onChange={(e) => setNewOption(prev => ({ ...prev, category: e.target.value }))}
                  className="px-3 py-2 rounded-md border border-input-border dark:border-gray-600 bg-input-background dark:bg-[#171717] text-foreground dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0B74B0]"
                >
                  <option value="groups">Group</option>
                  <option value="ppaMerchants">PPA/Merchant</option>
                  <option value="types">Type</option>
                  <option value="locationCodes">Location Code</option>
                  <option value="locations">Location</option>
                  <option value="connectivities">Connectivity</option>
                </select>
                <input
                  type="text"
                  value={newOption.value}
                  onChange={(e) => setNewOption(prev => ({ ...prev, value: e.target.value }))}
                  placeholder="Enter new option"
                  className="flex-1 px-3 py-2 rounded-md border border-input-border dark:border-gray-600 bg-input-background dark:bg-[#171717] text-foreground dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0B74B0]"
                />
                <button
                  onClick={handleAddOption}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#0B74B0] hover:bg-[#0B74B0]/90 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0B74B0] transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
          ) : (
            <div className="mb-6 p-4 bg-[#0B74B0]/10 dark:bg-[#0B74B0]/20 rounded-lg">
              <h4 className="text-md font-semibold text-[#0B74B0] dark:text-[#75479C] mb-3">Add New Dropdown Option</h4>
              <div className="text-center py-4">
                <p className="text-gray-600 dark:text-gray-300 mb-4">Please login to add new dropdown options</p>
                <button
                  onClick={() => router.push('/login?redirect=/application#masterdata')}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#0B74B0] hover:bg-[#0B74B0]/90 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0B74B0] transition-colors"
                >
                  Login to Add Options
                </button>
              </div>
            </div>
          )}

          {/* Dropdown options management */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xl font-semibold text-foreground dark:text-white">Dropdown Options Management</h4>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {user ? "Click edit/delete to modify options" : "Login to edit options"}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {Object.entries(dropdownOptions).map(([category, options]) => (
                <div key={category} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-200 hover:shadow-md">
                  <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-700 border-b border-gray-200 dark:border-gray-600">
                    <h5 className="font-semibold text-foreground dark:text-white capitalize flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l-1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                      </svg>
                      {category.replace(/([A-Z])/g, ' $1').trim()}
                    </h5>
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Options ({(options as string[]).length})
                      </span>
                    </div>
                    {(options as string[]).length > 0 ? (
                      <ul className="space-y-2 max-h-60 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800">
                        {(options as string[]).map((option: string, index: number) => (
                          <li key={index} className="flex items-center justify-between group py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            {editingOption?.category === category && editingOption?.index === index ? (
                              <div className="flex items-center gap-2 flex-1">
                                <input
                                  type="text"
                                  value={editingOption.value}
                                  onChange={(e) => setEditingOption && setEditingOption({ ...editingOption, value: e.target.value })}
                                  className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-input-border dark:border-gray-600 bg-input-background dark:bg-[#171717] text-foreground dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  autoFocus
                                />
                                <div className="flex gap-1">
                                  <button
                                    onClick={handleEditOption}
                                    className="px-2.5 py-1.5 text-xs bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center"
                                    title="Save"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => setEditingOption && setEditingOption(null)}
                                    className="px-2.5 py-1.5 text-xs bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center"
                                    title="Cancel"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L8 12.586l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414z" clipRule="evenodd" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center">
                                  <span className="text-foreground dark:text-gray-300 text-sm font-medium truncate max-w-[180px]">{option}</span>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                  {user ? (
                                    <>
                                      <button
                                        onClick={() => setEditingOption && setEditingOption({ category: category as keyof DropdownOptions, index, value: option })}
                                        className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex items-center"
                                        title="Edit"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                        </svg>
                                      </button>
                                      <button
                                        onClick={() => handleDeleteOption && handleDeleteOption(category as keyof DropdownOptions, index)}
                                        className={`px-2 py-1 text-xs text-white rounded hover:bg-red-600 transition-colors flex items-center ${(options as string[]).length <= 1
                                          ? 'bg-gray-400 cursor-not-allowed'
                                          : 'bg-red-500'
                                          }`}
                                        title="Delete"
                                        disabled={(options as string[]).length <= 1}
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                      </button>
                                    </>
                                  ) : (
                                    <span className="text-xs text-gray-400 dark:text-gray-500 italic">Login to edit</span>
                                  )}
                                </div>
                              </>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-center py-6 text-gray-500 dark:text-gray-400 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto mb-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                        </svg>
                        <p className="text-sm">No options available</p>
                        {user && (
                          <p className="text-xs mt-1 text-gray-400">Add options using the form above</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Location Relationships Tab */}
      {activeTab === 'locations' && (
        <div>
          {/* Location Relationships Management - only visible when authenticated */}
          {user ? (
            <div className="mb-6 p-4 bg-[#75479C]/10 dark:bg-[#75479C]/20 rounded-lg">
              <h4 className="text-md font-semibold text-[#75479C] dark:text-[#75479C] mb-3">Add New Location & Location Code Relationship</h4>
              <div className="flex gap-2 mb-4">
                <SearchableDropdown
                  options={dropdownOptions.locations}
                  value={newRelationship.location}
                  onChange={(value: string) => setNewRelationship(prev => ({ ...prev, location: value }))}
                  onAddNew={(value: string) => {
                    // Show confirmation dialog before adding new location
                    const message = `The location "${value}" will be added to the dropdown options.\n\nDo you want to proceed?`;
                    setConfirmDialog({
                      isOpen: true,
                      message,
                      onConfirm: () => {
                        // Add new location to dropdown options
                        const updatedOptions = {
                          ...dropdownOptions,
                          locations: [...dropdownOptions.locations, value]
                        };
                        
                        // Save updated options
                        saveDropdownOptionsMutation.mutate(updatedOptions);
                        
                        setNewRelationship(prev => ({ ...prev, location: value }));
                        // Close dialog
                        setConfirmDialog(null);
                      },
                      onCancel: () => {
                        setConfirmDialog(null);
                      }
                    });
                  }}
                  placeholder="Location"
                  className="flex-1 px-3 py-2 rounded-md border border-input-border dark:border-gray-600 bg-input-background dark:bg-[#171717] text-foreground dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0B74B0]"
                />
                <SearchableDropdown
                  options={dropdownOptions.locationCodes}
                  value={newRelationship.locationCode}
                  onChange={(value: string) => setNewRelationship(prev => ({ ...prev, locationCode: value }))}
                  onAddNew={(value: string) => {
                    // Show confirmation dialog before adding new location code
                    const message = `The location code "${value}" will be added to the dropdown options.\n\nDo you want to proceed?`;
                    setConfirmDialog({
                      isOpen: true,
                      message,
                      onConfirm: () => {
                        // Add new location code to dropdown options
                        const updatedOptions = {
                          ...dropdownOptions,
                          locationCodes: [...dropdownOptions.locationCodes, value]
                        };
                        
                        // Save updated options
                        saveDropdownOptionsMutation.mutate(updatedOptions);
                        
                        setNewRelationship(prev => ({ ...prev, locationCode: value }));
                        // Close dialog
                        setConfirmDialog(null);
                      },
                      onCancel: () => {
                        setConfirmDialog(null);
                      }
                    });
                  }}
                  placeholder="Location Code"
                  className="px-3 py-2 rounded-md border border-input-border dark:border-gray-600 bg-input-background dark:bg-[#171717] text-foreground dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0B74B0]"
                />
                <button
                  onClick={handleAddRelationship}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#75479C] hover:bg-[#75479C]/90 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#75479C] transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
          ) : (
            <div className="mb-6 p-4 bg-[#75479C]/10 dark:bg-[#75479C]/20 rounded-lg">
              <h4 className="text-md font-semibold text-[#75479C] dark:text-[#75479C] mb-3">Add New Location & Location Code Relationship</h4>
              <div className="text-center py-4">
                <p className="text-gray-600 dark:text-gray-300 mb-4">Please login to add new location relationships</p>
                <button
                  onClick={() => router.push('/login?redirect=/application#masterdata')}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#75479C] hover:bg-[#75479C]/90 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#75479C] transition-colors"
                >
                  Login to Add Relationships
                </button>
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Location</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Location Code</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {locationRelationships.map((relationship, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    {editingRelationship?.index === index ? (
                      <>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <input
                            type="text"
                            value={editingRelationship.relationship.location}
                            onChange={(e) => setEditingRelationship({
                              ...editingRelationship,
                              relationship: {
                                ...editingRelationship.relationship,
                                location: e.target.value
                              }
                            })}
                            className="w-full px-2 py-1 text-sm rounded border border-input-border dark:border-gray-600 bg-input-background dark:bg-[#171717] text-foreground dark:text-white"
                          />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <select
                            value={editingRelationship.relationship.locationCode}
                            onChange={(e) => setEditingRelationship({
                              ...editingRelationship,
                              relationship: {
                                ...editingRelationship.relationship,
                                locationCode: e.target.value
                              }
                            })}
                            className="w-full px-2 py-1 text-sm rounded border border-input-border dark:border-gray-600 bg-input-background dark:bg-[#171717] text-foreground dark:text-white"
                          >
                            <option value="">Select Location Code</option>
                            {dropdownOptions.locationCodes.map((code: string) => (
                              <option key={code} value={code}>{code}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={handleEditRelationship}
                            className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 mr-2"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingRelationship(null)}
                            className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                          >
                            Cancel
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-foreground dark:text-gray-300">
                          {relationship.location}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-foreground dark:text-gray-300">
                          {relationship.locationCode}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                          {user ? (
                            <>
                              <button
                                onClick={() => setEditingRelationship({ index, relationship })}
                                className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 mr-2"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteRelationship(index)}
                                className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                              >
                                Delete
                              </button>
                            </>
                          ) : (
                            <span className="text-xs text-gray-400 dark:text-gray-500 italic">Login to edit</span>
                          )}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Removed the table display as requested */}
    </div>
  );
}