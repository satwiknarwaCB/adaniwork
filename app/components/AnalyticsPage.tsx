"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import SearchableDropdown from './SearchableDropdown';
import * as XLSX from 'xlsx'; // Add this import for Excel export

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// Define the structure for table rows
interface TableRow {
  id: number;
  sno: number;
  capacity: number | null;
  group: string;
  ppaMerchant: string;
  type: string;
  solar: number | null;
  wind: number | null;
  spv: string;
  locationCode: string;
  location: string;
  pss: string;
  connectivity: string;
}

// Define the structure for location relationships
interface LocationRelationship {
  location: string;
  locationCode: string;
}

export default function AnalyticsPage() {
  const queryClient = useQueryClient();
  const [fiscalYear, setFiscalYear] = useState('FY_25');
  const [showTracker, setShowTracker] = useState(false);
  const { user, loading } = useAuth();
  const router = useRouter();
  const [tableData, setTableData] = useState<TableRow[]>([]); // State to hold data from API
  const [dataLoaded, setDataLoaded] = useState(false); // Add this to track if data has been loaded from database
  const [newRow, setNewRow] = useState<Omit<TableRow, 'id' | 'sno'>>({
    capacity: null,
    group: '',
    ppaMerchant: '',
    type: '',
    solar: null,
    wind: null,
    spv: '',
    locationCode: '',
    location: '',
    pss: '',
    connectivity: ''
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editRow, setEditRow] = useState<TableRow | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null); // Add this for 3-dot menu

  // State for recent suggestions
  const [recentSPVs, setRecentSPVs] = useState<string[]>([]);
  const [recentPSSs, setRecentPSSs] = useState<string[]>([]);

  // Load recent suggestions from localStorage on component mount
  useEffect(() => {
    const savedSPVs = localStorage.getItem('recentSPVs');
    const savedPSSs = localStorage.getItem('recentPSSs');
    
    if (savedSPVs) {
      try {
        setRecentSPVs(JSON.parse(savedSPVs));
      } catch (e) {
        console.error('Error parsing recent SPVs:', e);
      }
    }
    
    if (savedPSSs) {
      try {
        setRecentPSSs(JSON.parse(savedPSSs));
      } catch (e) {
        console.error('Error parsing recent PSSs:', e);
      }
    }
  }, []);

  // Save recent suggestions to localStorage when they change
  useEffect(() => {
    localStorage.setItem('recentSPVs', JSON.stringify(recentSPVs));
  }, [recentSPVs]);

  useEffect(() => {
    localStorage.setItem('recentPSSs', JSON.stringify(recentPSSs));
  }, [recentPSSs]);

  // Function to add a value to recent suggestions
  const addToRecentSuggestions = (type: 'spv' | 'pss', value: string) => {
    if (!value) return;
    
    if (type === 'spv') {
      setRecentSPVs(prev => {
        const newRecent = [value, ...prev.filter(item => item !== value)].slice(0, 5); // Keep only last 5 unique values
        return newRecent;
      });
    } else if (type === 'pss') {
      setRecentPSSs(prev => {
        const newRecent = [value, ...prev.filter(item => item !== value)].slice(0, 5); // Keep only last 5 unique values
        return newRecent;
      });
    }
  };

  // Function to clear recent suggestions
  const clearRecentSuggestions = (type: 'spv' | 'pss') => {
    if (type === 'spv') {
      setRecentSPVs([]);
    } else if (type === 'pss') {
      setRecentPSSs([]);
    }
  };

  // State for dropdown options
  const [groups, setGroups] = useState<string[]>([]);
  const [ppaMerchants, setPpaMerchants] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [locationCodes, setLocationCodes] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [connectivities, setConnectivities] = useState<string[]>([]);

  // State for table filters
  const [filters, setFilters] = useState({
    group: '',
    ppaMerchant: '',
    type: '',
    locationCode: '',
    location: '',
    connectivity: ''
  });

  // State for location relationships
  const [locationRelationships, setLocationRelationships] = useState<LocationRelationship[]>([]);

  // State to track if initial data has been loaded
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Use React Query to fetch dropdown options and location relationships
  const { data: dropdownData, isLoading: dropdownLoading, error: dropdownError } = useQuery({
    queryKey: ['dropdownOptions', fiscalYear],
    queryFn: async () => {
      const response = await fetch(`/api/dropdown-options?fiscalYear=${fiscalYear}`);
      if (!response.ok) {
        throw new Error('Failed to fetch dropdown options');
      }
      return response.json();
    },
    enabled: !!fiscalYear, // Only fetch when fiscalYear is provided
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Use React Query to fetch location relationships
  const { data: locationRelationshipsData, isLoading: locationRelationshipsLoading, error: locationRelationshipsError } = useQuery({
    queryKey: ['locationRelationships', fiscalYear],
    queryFn: async () => {
      const response = await fetch(`/api/location-relationships?fiscalYear=${fiscalYear}`);
      if (!response.ok) {
        throw new Error('Failed to fetch location relationships');
      }
      return response.json();
    },
    enabled: !!fiscalYear, // Only fetch when fiscalYear is provided
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Update state when dropdown data changes
  useEffect(() => {
    if (dropdownData) {
      if (Array.isArray(dropdownData.groups)) {
        setGroups(dropdownData.groups);
      }
      if (Array.isArray(dropdownData.ppaMerchants)) {
        setPpaMerchants(dropdownData.ppaMerchants);
      }
      if (Array.isArray(dropdownData.types)) {
        setTypes(dropdownData.types);
      }
      if (Array.isArray(dropdownData.locationCodes)) {
        setLocationCodes(dropdownData.locationCodes);
      }
      if (Array.isArray(dropdownData.locations)) {
        setLocations(dropdownData.locations);
      }
      if (Array.isArray(dropdownData.connectivities)) {
        setConnectivities(dropdownData.connectivities);
      }
    }
  }, [dropdownData]);

  // Update state when location relationships data changes
  useEffect(() => {
    if (locationRelationshipsData && Array.isArray(locationRelationshipsData)) {
      setLocationRelationships(locationRelationshipsData);
    }
  }, [locationRelationshipsData]);

  // Save dropdown options and location relationships to database when they change
  // Only trigger relevant endpoints when specific data changes
  useEffect(() => {
    const saveChangedData = async () => {
      try {
        // Save dropdown options
        await saveDropdownOptions();
      } catch (error: any) {
        console.error('Error saving dropdown options:', error.message || error);
      }
    };
    
    // Don't save on initial load
    if (!isInitialLoad && groups.length > 0 && ppaMerchants.length > 0 && types.length > 0) {
      saveChangedData();
    }
  }, [groups, ppaMerchants, types, locationCodes, locations, connectivities, isInitialLoad]);
  
  // Set initial load to false after first render
  useEffect(() => {
    setIsInitialLoad(false);
  }, []);

  // Function to save all dropdown options to API
  const saveDropdownOptions = async () => {
    try {
      // Save dropdown options separately for each type (without fiscalYear)
      const groupsResponse = await fetch(`/api/groups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(groups),
      });

      if (!groupsResponse.ok) {
        console.error('Failed to save groups:', groupsResponse.status, groupsResponse.statusText);
      }

      const ppaMerchantsResponse = await fetch(`/api/ppa-merchants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ppaMerchants),
      });

      if (!ppaMerchantsResponse.ok) {
        console.error('Failed to save ppa merchants:', ppaMerchantsResponse.status, ppaMerchantsResponse.statusText);
      }

      const typesResponse = await fetch(`/api/types`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(types),
      });

      if (!typesResponse.ok) {
        console.error('Failed to save types:', typesResponse.status, typesResponse.statusText);
      }

      const locationCodesResponse = await fetch(`/api/location-codes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(locationCodes),
      });

      if (!locationCodesResponse.ok) {
        console.error('Failed to save location codes:', locationCodesResponse.status, locationCodesResponse.statusText);
      }

      const locationsResponse = await fetch(`/api/locations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(locations),
      });

      if (!locationsResponse.ok) {
        console.error('Failed to save locations:', locationsResponse.status, locationsResponse.statusText);
      }

      const connectivitiesResponse = await fetch(`/api/connectivities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(connectivities),
      });

      if (!connectivitiesResponse.ok) {
        console.error('Failed to save connectivities:', connectivitiesResponse.status, connectivitiesResponse.statusText);
      }
    } catch (error: any) {
      console.error('Error saving dropdown options:', error.message || error);
      throw error;
    }
  };

  // Set initial load to false after first render
  useEffect(() => {
    setIsInitialLoad(false);
  }, []);

  // React Query mutation for saving dropdown options
  const saveDropdownOptionsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/dropdown-options?fiscalYear=${fiscalYear}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fiscalYear,
          groups,
          ppaMerchants,
          types,
          locationCodes,
          locations,
          connectivities
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to save dropdown options: ${response.status} ${response.statusText} ${errorText}`);
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate dropdown options query to refetch fresh data
      // queryClient.invalidateQueries({ queryKey: ['dropdownOptions', fiscalYear] });
    },
    onError: (error) => {
      console.error('Error saving dropdown options:', error);
    },
  });

  // React Query mutation for saving location relationships
  const saveLocationRelationshipsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/location-relationships?fiscalYear=${fiscalYear}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(locationRelationships)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to save location relationships: ${response.status} ${response.statusText} ${errorText}`);
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate location relationships query to refetch fresh data
      // queryClient.invalidateQueries({ queryKey: ['locationRelationships', fiscalYear] });
    },
    onError: (error) => {
      console.error('Error saving location relationships:', error);
    },
  });

  // React Query mutation for saving a single dropdown option
  const saveSingleDropdownOptionMutation = useMutation({
    mutationFn: async ({ optionType, value }: { optionType: string; value: string }) => {
      const response = await fetch(`/api/dropdown-option`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fiscalYear,
          optionType,
          optionValue: value
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save dropdown option');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate dropdown options query to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ['dropdownOptions', fiscalYear] });
    },
    onError: (error) => {
      console.error('Error saving single dropdown option:', error);
    },
  });

  // Save dropdown options and location relationships to database when they change
  // Only trigger relevant endpoints when specific data changes
  useEffect(() => {
    // Don't save on initial load
    if (!isInitialLoad && groups.length > 0 && ppaMerchants.length > 0 && types.length > 0) {
      saveDropdownOptionsMutation.mutate();
    }
  }, [groups, ppaMerchants, types, locationCodes, locations, connectivities, isInitialLoad]);
  
  useEffect(() => {
    // Don't save on initial load
    if (!isInitialLoad && locationRelationships.length > 0) {
      saveLocationRelationshipsMutation.mutate();
    }
  }, [locationRelationships, isInitialLoad]);

  // Function to handle filter changes
  const handleFilterChange = (filterName: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  // Function to save a single dropdown option and update the API
  const saveDropdownOption = async (optionType: string, value: string) => {
    // Check if the value already exists to prevent duplicates
    let alreadyExists = false;
    switch (optionType) {
      case 'groups':
        alreadyExists = groups.includes(value);
        break;
      case 'ppaMerchants':
        alreadyExists = ppaMerchants.includes(value);
        break;
      case 'types':
        alreadyExists = types.includes(value);
        break;
      case 'locationCodes':
        alreadyExists = locationCodes.includes(value);
        break;
      case 'locations':
        alreadyExists = locations.includes(value);
        break;
      case 'connectivities':
        alreadyExists = connectivities.includes(value);
        break;
      default:
        return;
    }
    
    // If the value already exists, don't add it again
    if (alreadyExists) {
      return;
    }
    
    // First update the local state
    switch (optionType) {
      case 'groups':
        setGroups(prev => [...prev, value]);
        break;
      case 'ppaMerchants':
        setPpaMerchants(prev => [...prev, value]);
        break;
      case 'types':
        setTypes(prev => [...prev, value]);
        break;
      case 'locationCodes':
        setLocationCodes(prev => [...prev, value]);
        break;
      case 'locations':
        setLocations(prev => [...prev, value]);
        break;
      case 'connectivities':
        setConnectivities(prev => [...prev, value]);
        break;
      default:
        return;
    }
    
    // Then save the individual option to the API using the dropdown-option endpoint
    saveSingleDropdownOptionMutation.mutate({ optionType, value });
  };

  // Handle edit row
  const handleEditRow = (row: TableRow) => {
    if (!user) {
      alert('You need to be authenticated to edit a row.');
      return;
    }

    setEditingId(row.id);
    setEditRow({ ...row });
    setOpenMenuId(null); // Close the menu when editing
  };

  // Handle delete row
  const handleDeleteRow = async (id: number) => {
    if (!user) {
      alert('You need to be authenticated to delete a row.');
      return;
    }

    // Confirm deletion with a dialog
    const confirmed = window.confirm('Are you sure you want to delete this row? This action cannot be undone.');
    if (!confirmed) {
      setOpenMenuId(null); // Close the menu
      return;
    }

    setOpenMenuId(null); // Close the menu

    // Update the data in state
    const updatedData = tableData.filter(row => row.id !== id);
    setTableData(updatedData);

    // Save to database
    // Only save to database if data has been loaded from the database
    // This prevents saving empty data on initial load
    if (dataLoaded) {
      try {
        const response = await fetch(`/api/table-data`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ fiscalYear, data: updatedData }),
        });
        
        if (!response.ok) {
          console.error('Failed to save data to database:', response.status, response.statusText);
          alert('Failed to delete row from database');
          // Revert the change in UI if database update failed
          const originalData = await fetch(`/api/table-data?fiscalYear=${fiscalYear}`).then(res => res.json());
          setTableData(originalData.data);
        }
      } catch (error) {
        console.error('Error saving table data to database:', error);
        alert('Error deleting row from database');
        // Revert the change in UI if database update failed
        const originalData = await fetch(`/api/table-data?fiscalYear=${fiscalYear}`).then(res => res.json());
        setTableData(originalData.data);
      }
    } else {
      console.log(`Skipping database save for ${ fiscalYear } - data not yet loaded from database`);
    }
  };

  // Handle save edit
  const handleSaveEdit = async () => {
    if (!user) {
      alert('You need to be authenticated to save changes.');
      return;
    }
    
    if (!editRow) return;
    
    // Validate required fields
    if (!editRow.capacity || !editRow.group || !editRow.ppaMerchant || !editRow.type || 
        !editRow.location || !editRow.locationCode || !editRow.pss || !editRow.connectivity) {
      alert('Please fill in all required fields');
      return;
    }
    
    // For Hybrid type, ensure only wind value is used
    const validatedEditRow = {
      ...editRow,
      ...(editRow.type === 'Hybrid' && { solar: null })
    };
    
    // Update the data in state
    const updatedData = tableData.map(row => row.id === editRow.id ? validatedEditRow : row);
    setTableData(updatedData);
    setEditingId(null);
    setEditRow(null);
    
    // Save to database
    // Only save to database if data has been loaded from the database
    // This prevents saving empty data on initial load
    if (dataLoaded) {
      try {
        const response = await fetch(`/api/table-data`, {
      method: 'POST',
        headers: {
        'Content-Type': 'application/json',
          },
      body: JSON.stringify({ fiscalYear, data: updatedData }),
        });

    if (!response.ok) {
      console.error('Failed to save data to database:', response.status, response.statusText);
      alert('Failed to save changes to database');
    }
  } catch (error) {
    console.error('Error saving table data to database:', error);
    alert('Error saving changes to database');
  }
} else {
  console.log(`Skipping database save for ${fiscalYear} - data not yet loaded from database`);
    }
  };

// Handle cancel edit
const handleCancelEdit = () => {
  setEditingId(null);
  setEditRow(null);
};

// Handle input change for edit row
const handleEditInputChange = (field: keyof TableRow, value: string | number | null) => {
  if (editRow) {
    // Clear solar when type is Wind and clear wind when type is Solar
    // For Hybrid, use only wind value
    if (field === 'type') {
      if (value === 'Wind') {
        setEditRow({
          ...editRow,
          type: value as string,
          solar: null
        });
      } else if (value === 'Solar') {
        setEditRow({
          ...editRow,
          type: value as string,
          wind: null
        });
      } else if (value === 'Hybrid') {
        setEditRow({
          ...editRow,
          type: value as string,
          solar: null  // Clear solar for Hybrid type
        });
      } else {
        setEditRow({
          ...editRow,
          type: value as string
        });
      }
    } else {
      setEditRow({
        ...editRow,
        [field]: value
      });
    }
  }
};

// Toggle menu for row actions
const toggleMenu = (id: number, e: React.MouseEvent) => {
  e.stopPropagation();
  setOpenMenuId(openMenuId === id ? null : id);
};

// Close menu when clicking outside
useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (openMenuId !== null) {
      setOpenMenuId(null);
    }
  };

  document.addEventListener('click', handleClickOutside);
  return () => {
    document.removeEventListener('click', handleClickOutside);
  };
}, [openMenuId]);

// Handle form submission
const handleFormSubmit = () => {
  setShowTracker(prev => !prev);
};

// Handle add new capacity button click
const handleAddNewCapacity = () => {
  if (user) {
    setShowTracker(true);
  } else {
    // Redirect to login page with proper redirect URL
    router.push('/login?redirect=/application#analytics');
  }
};

// Check if we should show the tracker after login
useEffect(() => {
  if (user && typeof window !== 'undefined') {
    const shouldShowTracker = localStorage.getItem('showTrackerAfterLogin');
    if (shouldShowTracker === 'true') {
      setShowTracker(true);
      localStorage.removeItem('showTrackerAfterLogin');
    }
  }
}, [user]);

// Also check on initial load
useEffect(() => {
  if (typeof window !== 'undefined') {
    const shouldShowTracker = localStorage.getItem('showTrackerAfterLogin');
    if (shouldShowTracker === 'true' && user) {
      setShowTracker(true);
      localStorage.removeItem('showTrackerAfterLogin');
    }
  }
}, []);

// Fetch table data from API when fiscal year changes
useEffect(() => {
  const fetchTableData = async () => {
    try {
      const response = await fetch(`/api/table-data?fiscalYear=${fiscalYear}`);
      if (response.ok) {
        const result = await response.json();
        setTableData(result.data || []);
      } else {
        console.error('Failed to fetch table data:', response.status, response.statusText);
        setTableData([]);
      }
    } catch (error) {
      console.error('Error fetching table data:', error);
      setTableData([]);
    } finally {
      // Mark data as loaded regardless of success or failure
      setDataLoaded(true);
    }
  };

  fetchTableData();
}, [fiscalYear]);

// Handle adding a new row
const handleAddRow = async () => {
  // Check if user is authenticated
  if (!user) {
    alert('You need to be authenticated to add a new row.');
    return;
  }

  // Validate required fields
  if (!newRow.capacity || !newRow.group || !newRow.ppaMerchant || !newRow.type ||
    !newRow.location || !newRow.locationCode || !newRow.pss || !newRow.connectivity) {
    alert('Please fill in all required fields');
    return;
  }

  // Add SPV and PSS values to recent suggestions
  if (newRow.spv) {
    addToRecentSuggestions('spv', newRow.spv);
  }
  if (newRow.pss) {
    addToRecentSuggestions('pss', newRow.pss);
  }

  // Create a new row with proper ID and S.No
  const nextId = tableData.length > 0 ? Math.max(...tableData.map(row => row.id)) + 1 : 1;
  const nextSno = tableData.length > 0 ? Math.max(...tableData.map(row => row.sno)) + 1 : 1;

  const rowToAdd: TableRow = {
    id: nextId,
    sno: nextSno,
    ...newRow,
    // If type is Hybrid, use only wind value and clear solar
    ...(newRow.type === 'Hybrid' && { solar: null })
  };

  // Add the new row to the table data
  const updatedData = [...tableData, rowToAdd];
  setTableData(updatedData);

  // Reset new row
  setNewRow({
    capacity: null,
    group: '',
    ppaMerchant: '',
    type: '',
    solar: null,
    wind: null,
    spv: '',
    locationCode: '',
    location: '',
    pss: '',
    connectivity: ''
  });

  // Save to database
  // Only save to database if data has been loaded from the database
  // This prevents saving empty data on initial load
  if (dataLoaded) {
    try {
      const response = await fetch(`/api/table-data`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ fiscalYear, data: updatedData }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Failed to save data to database:', response.status, response.statusText, errorText);
          alert(`Failed to save data to database: ${response.status} ${response.statusText}`);
        } else {
          const result = await response.json();
          console.log('Data saved successfully to database:', result);
        }
      } catch (error: any) {
        console.error('Error saving table data to database:', error);
        alert(`Error saving data to database: ${ error.message || 'Unknown error' }`);
      }
    } else {
      console.log(`Skipping database save for ${ fiscalYear } - data not yet loaded from database`);
    }

    // Close the form
    setShowTracker(false);
  };

  // Sample data for charts - now using data from API
  const getChartData = () => {
    // Use data from API instead of static JSON files
    let data = tableData;

    // Calculate statistics from the data
    let totalCapacity = 0;
    let totalSolar = 0;
    let totalWind = 0;
    let projectCount = data.length;
    
    // Group data by type and group for charts
    const typeData: Record<string, number> = {
      'Solar': 0,
      'Wind': 0,
      'Hybrid': 0
    };
    
    const groupData: Record<string, number> = {
      'AGEL': 0,
      'ACL': 0
    };
    
    // Group data by PPA/Merchant for charts
    const ppaMerchantData: Record<string, number> = {};
    

    
    // Process each data entry
    data.forEach(item => {
      const capacity = typeof item.capacity === 'number' ? item.capacity : 0;
      const solar = typeof item.solar === 'number' ? item.solar : 0;
      const wind = typeof item.wind === 'number' ? item.wind : 0;
      const type = item.type || 'Unknown';
      const group = item.group || 'Unknown';
      const ppaMerchant = item.ppaMerchant || 'Unknown';

      
      totalCapacity += capacity;
      totalSolar += solar;
      totalWind += wind;
      
      // Update type data
      if (typeData.hasOwnProperty(type)) {
        typeData[type] += capacity;
      }
      
      // Update group data
      if (groupData.hasOwnProperty(group)) {
        groupData[group] += 1;
      }
      
      // Update PPA/Merchant data
      if (!ppaMerchantData.hasOwnProperty(ppaMerchant)) {
        ppaMerchantData[ppaMerchant] = 0;
      }
      ppaMerchantData[ppaMerchant] += capacity;
      

    });
    
    // Prepare chart data for Bar chart (Capacity by Type)
    const typeChartData = {
      labels: Object.keys(typeData),
      datasets: [
        {
          label: 'Capacity (MW)',
          data: Object.values(typeData),
          backgroundColor: [
            'rgba(11, 116, 176, 0.8)', // Adani Blue (#0B74B0)
            'rgba(117, 71, 156, 0.8)',  // Adani Purple (#75479C)
            'rgba(189, 56, 97, 0.8)',   // Adani Pink (#BD3861)
          ],
          borderColor: [
            'rgba(11, 116, 176, 1)', // Adani Blue (#0B74B0)
            'rgba(117, 71, 156, 1)',  // Adani Purple (#75479C)
            'rgba(189, 56, 97, 1)',   // Adani Pink (#BD3861)
          ],
          borderWidth: 1,
        },
      ],
    };
    
    // Prepare chart data for Pie chart (Projects by Group)
    const groupChartData = {
      labels: Object.keys(groupData),
      datasets: [
        {
          label: 'Projects',
          data: Object.values(groupData),
          backgroundColor: [
            'rgba(11, 116, 176, 0.8)', // Adani Blue (#0B74B0)
            'rgba(189, 56, 97, 0.8)',   // Adani Pink (#BD3861)
          ],
          borderColor: [
            'rgba(11, 116, 176, 1)', // Adani Blue (#0B74B0)
            'rgba(189, 56, 97, 1)',   // Adani Pink (#BD3861)
          ],
          borderWidth: 1,
        },
      ],
    };
    
    // Prepare chart data for PPA/Merchant chart
    const ppaMerchantChartData = {
      labels: Object.keys(ppaMerchantData),
      datasets: [
        {
          label: 'Capacity (MW)',
          data: Object.values(ppaMerchantData),
          backgroundColor: [
            'rgba(11, 116, 176, 0.8)', // Adani Blue (#0B74B0)
            'rgba(117, 71, 156, 0.8)',  // Adani Purple (#75479C)
            'rgba(189, 56, 97, 0.8)',   // Adani Pink (#BD3861)
            'rgba(255, 176, 0, 0.8)',   // Yellow
            'rgba(0, 176, 117, 0.8)',   // Green
            'rgba(176, 0, 117, 0.8)',   // Magenta
          ],
          borderColor: [
            'rgba(11, 116, 176, 1)', // Adani Blue (#0B74B0)
            'rgba(117, 71, 156, 1)',  // Adani Purple (#75479C)
            'rgba(189, 56, 97, 1)',   // Adani Pink (#BD3861)
            'rgba(255, 176, 0, 1)',   // Yellow
            'rgba(0, 176, 117, 1)',   // Green
            'rgba(176, 0, 117, 1)',   // Magenta
          ],
          borderWidth: 1,
        },
      ],
    };
    
    // Remove specific naming from group chart labels
    const cleanGroupLabels = (labels: string[]) => {
      return labels.map(label => {
        // Remove 'AGEL', 'ACL' from group labels
        return label.replace(/AGEL/gi, '').replace(/ACL/gi, '').trim() || label;
      });
    };

    // Apply clean labels to group chart data only
    const cleanedGroupChartData = {
      ...groupChartData,
      labels: cleanGroupLabels(groupChartData.labels)
    };

    return {
      capacity: Math.round(totalCapacity),
      solar: Math.round(totalSolar),
      wind: Math.round(totalWind),
      projects: projectCount,
      typeData: typeChartData,
      groupData: cleanedGroupChartData,
      ppaMerchantData: ppaMerchantChartData,
    };
  };

  const chartData = getChartData();

  // Get filtered data
  const filteredData = tableData.filter(row => 
    (filters.group === '' || row.group === filters.group) &&
    (filters.ppaMerchant === '' || row.ppaMerchant === filters.ppaMerchant) &&
    (filters.type === '' || row.type === filters.type) &&
    (filters.locationCode === '' || row.locationCode === filters.locationCode) &&
    (filters.location === '' || row.location === filters.location) &&
    (filters.connectivity === '' || row.connectivity === filters.connectivity)
  );

  // Calculate sums for numeric columns based on filtered data
  const calculateSums = () => {
    return filteredData.reduce((acc, row) => {
      acc.capacity += row.capacity || 0;
      acc.solar += row.solar || 0;
      acc.wind += row.wind || 0;
      return acc;
    }, { capacity: 0, solar: 0, wind: 0 });
  };

  const sums = calculateSums();

  // Handle export to Excel
  const handleExportToExcel = () => {
    // Create the data array with headers
    const dataWithTotals = [
      ['S.No', 'Capacity', 'Group', 'PPA/Merchant', 'Type', 'Solar', 'Wind', 'SPV', 'Location Code', 'Location', 'PSS', 'Connectivity'],
      ...tableData.map(row => [
        row.sno,
        row.capacity,
        row.group,
        row.ppaMerchant,
        row.type,
        row.solar,
        row.wind,
        row.spv,
        row.locationCode,
        row.location,
        row.pss,
        row.connectivity
      ]),
      [], // Empty row
      ['TOTAL', sums.capacity.toFixed(2), '', '', '', sums.solar.toFixed(2), sums.wind.toFixed(2), '', '', '', '', '']
    ];
    
    // Create the data worksheet with totals
    const dataWorksheet = XLSX.utils.aoa_to_sheet(dataWithTotals);
    
    // Create summary data
    const summaryData = [
      ['SUMMARY REPORT'],
      [''],
      ['Metric', 'Value'],
      ['Total Capacity', sums.capacity.toFixed(2)],
      ['Total Solar', sums.solar.toFixed(2)],
      ['Total Wind', sums.wind.toFixed(2)],
      ['Total Projects', tableData.length]
    ];
    
    // Create summary worksheet
    const summaryWorksheet = XLSX.utils.aoa_to_sheet(summaryData);
    
    // Create workbook and add both worksheets
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, dataWorksheet, 'Table Data');
    XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Summary');
    
    // Export the workbook
    XLSX.writeFile(workbook, `table - data - ${ fiscalYear }.xlsx`);
  };

  return (
    <div className=" dark:bg-[#171717]">
      {/* Main Layout - Year Selection on Left, Charts on Right */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column - Year Selection and Summary Cards */}
        <div className="lg:w-1/4 flex items-center">
          {/* Fiscal Year Selection */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Analytics</h2>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">View and analyze data with the charts below.</p>
            
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Select Year
              </label>
              <select
                value={fiscalYear}
                onChange={(e) => setFiscalYear(e.target.value)}
                className="w-full pl-4 pr-10 py-2 rounded-md border border-input-border dark:border-gray-600 bg-input-background dark:bg-[#171717] text-foreground dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
              >
                <option value="FY_23">FY23</option>
                <option value="FY_24">FY24</option>
                <option value="FY_25">FY25</option>
                <option value="FY_26">FY26</option>
                <option value="FY_27">FY27</option>
              </select>
              <svg 
                className="absolute right-3 top-8 h-5 w-5 text-gray-400 dark:text-gray-300 pointer-events-none" 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
        
        {/* Right Column - Charts */}
        <div className="lg:w-3/4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <h3 className="text-lg font-medium text-center text-foreground dark:text-white mb-4">Capacity by Type in MW</h3>
              <div className="h-64">
                <Bar 
                  data={chartData.typeData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
                      },
                      title: {
                        display: false,
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          color: 'rgba(0, 0, 0, 0.7)'
                        },
                        grid: {
                          color: 'rgba(0, 0, 0, 0.1)'
                        }
                      },
                      x: {
                        ticks: {
                          color: 'rgba(0, 0, 0, 0.7)'
                        },
                        grid: {
                          color: 'rgba(0, 0, 0, 0.1)'
                        }
                      }
                    }
                  }} 
                />
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <h3 className="text-lg text-center font-medium text-foreground dark:text-white mb-4">Projects by Group</h3>
              <div className="h-64">
                <Pie 
                  data={chartData.groupData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
                      },
                      title: {
                        display: false,
                      },
                    },
                  }} 
                />
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <h3 className="text-lg text-center font-medium text-foreground dark:text-white mb-4">Capacity by PPA/Merchant in MW</h3>
              <div className="h-64">
                <Bar 
                  data={chartData.ppaMerchantData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
                      },
                      title: {
                        display: false,
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          color: 'rgba(0, 0, 0, 0.7)'
                        },
                        grid: {
                          color: 'rgba(0, 0, 0, 0.1)'
                        }
                      },
                      x: {
                        ticks: {
                          color: 'rgba(0, 0, 0, 0.7)'
                        },
                        grid: {
                          color: 'rgba(0, 0, 0, 0.1)'
                        }
                      }
                    }
                  }} 
                />
              </div>
            </div>
            

          </div>
        </div>
      </div>
      
      {/* Add New Capacity Button - Moved above the table */}
      <div className="mt-6 flex justify-between items-center">
        <div>
          {user ? (
            <button
              type="button"
              onClick={handleAddNewCapacity}
              className="rounded-md bg-button-primary hover:bg-button-primary-hover px-4 py-2 text-sm text-white shadow-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-button-primary transition-colors"
            >
              Add New Capacity
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                // Redirect to login page
                router.push('/login?redirect=/application#analytics');
              }}
              className="rounded-md bg-button-primary hover:bg-button-primary-hover px-4 py-2 text-sm text-white shadow-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-button-primary transition-colors"
            >
              Login to Add
            </button>
          )}
        </div>
        <div>
          <button
            type="button"
            onClick={handleExportToExcel}
            className="rounded-md bg-green-600 hover:bg-green-700 px-4 py-2 text-sm text-white shadow-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 transition-colors"
          >
            Export to Excel
          </button>
        </div>
      </div>
      
      {/* Tracker Form - Add New Capacity Entry */}
      {showTracker && user && (
        <div className="mt-6 overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <div className="rounded-xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 p-6 mb-6 border border-gray-200 dark:border-gray-700 shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add New Capacity Entry</h2>
                <button
                  onClick={() => setShowTracker(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Close"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Capacity
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <input
  type="number"
  step="0.01"
  value={newRow.capacity ?? ""}
  onChange={(e) => {
    let val = e.target.value;

    // Allow empty value
    if (val === "") {
      setNewRow({ ...newRow, capacity: null });
      return;
    }

    // Block negative values
    if (parseFloat(val) < 0) return;

    // Allow only 2 decimals
    if (/^\d+(\.\d{0,2})?$/.test(val)) {
      setNewRow({ ...newRow, capacity: parseFloat(val) });
    }
  }}
  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
  placeholder="Enter capacity"
/>

                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Group
                  </label>
                  <SearchableDropdown
                    options={groups}
                    value={newRow.group}
                    onChange={(value) => setNewRow({...newRow, group: value})}
                    onAddNew={(value) => {
                      saveDropdownOption('groups', value);
                      setNewRow({...newRow, group: value});
                    }}
                    placeholder="Select or type group..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    PPA/Merchant
                  </label>
                  <SearchableDropdown
                    options={ppaMerchants}
                    value={newRow.ppaMerchant}
                    onChange={(value) => setNewRow({...newRow, ppaMerchant: value})}
                    onAddNew={(value) => {
                      saveDropdownOption('ppaMerchants', value);
                      setNewRow({...newRow, ppaMerchant: value});
                    }}
                    placeholder="Select or type PPA/Merchant..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Type
                  </label>
                  <SearchableDropdown
                    options={types}
                    value={newRow.type}
                    onChange={(value) => {
                      // Create a new object with the updated type
                      const updatedRow = {
                        ...newRow,
                        type: value
                      };
                      
                      // Clear solar when type is Wind or Hybrid
                      if (value === 'Wind' || value === 'Hybrid') {
                        updatedRow.solar = null;
                      }
                      
                      // Clear wind when type is Solar
                      if (value === 'Solar') {
                        updatedRow.wind = null;
                      }
                      
                      setNewRow(updatedRow);
                    }}
                    onAddNew={(value) => {
                      saveDropdownOption('types', value);
                      // Create a new object with the updated type
                      const updatedRow = {
                        ...newRow,
                        type: value
                      };
                      
                      // Clear solar when type is Wind or Hybrid
                      if (value === 'Wind' || value === 'Hybrid') {
                        updatedRow.solar = null;
                      }
                      
                      // Clear wind when type is Solar
                      if (value === 'Solar') {
                        updatedRow.wind = null;
                      }
                      
                      setNewRow(updatedRow);
                    }}
                    placeholder="Select or type type..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Solar
                  </label>
                  <div className="relative">
                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <input
  type="number"
  step="0.01"
  value={newRow.solar ?? ""}
  onChange={(e) => {
    let val = e.target.value;

    // Allow empty value
    if (val === "") {
      setNewRow({ ...newRow, solar: null });
      return;
    }

    // Block negative values
    if (parseFloat(val) < 0) return;

    // Allow only 2 decimals
    if (/^\d+(\.\d{0,2})?$/.test(val)) {
      setNewRow({ ...newRow, solar: parseFloat(val) });
    }
  }}
  className={`w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg
              focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              dark:bg-gray-700 dark:border-gray-600 dark:text-white
              ${ newRow.type === 'Wind' || newRow.type === 'Hybrid' ? 'opacity-50 cursor-not-allowed' : '' } `}
  placeholder="Enter solar value"
  disabled={newRow.type === 'Wind' || newRow.type === 'Hybrid'}
/>

                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Wind
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                      </svg>
                    </div>
                 <input
  type="number"
  step="0.01"
  value={newRow.wind ?? ""}
  onChange={(e) => {
    let val = e.target.value;

    // Allow clearing the field
    if (val === "") {
      setNewRow({ ...newRow, wind: null });
      return;
    }

    // Block negative values
    if (parseFloat(val) < 0) return;

    // Allow only numbers with up to 2 decimal places
    if (/^\d+(\.\d{0,2})?$/.test(val)) {
      setNewRow({ ...newRow, wind: parseFloat(val) });
    }
  }}
  className={`w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg
              focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              dark:bg-gray-700 dark:border-gray-600 dark:text-white
              ${ newRow.type === 'Solar' ? 'opacity-50 cursor-not-allowed' : '' }`}
  placeholder="Enter wind value"
  disabled={newRow.type === 'Solar'}
/>

                  </div>
                </div>
                
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SPV</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={newRow.spv}
                      onChange={(e) => setNewRow({...newRow, spv: e.target.value.toUpperCase()})}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="Enter SPV"
                      style={{ textTransform: 'uppercase' }}
                    />
                  </div>
                  {/* Recent SPV suggestions - filtered based on input, limited to 2 items */}
                  {newRow.spv && recentSPVs.filter(spv => spv.toLowerCase().includes(newRow.spv.toLowerCase())).length > 0 && (
                    <div className="absolute z-10 mt-1 w-full rounded-md bg-white dark:bg-gray-800 shadow-lg max-h-32 overflow-y-auto">
                      <div className="py-1">
                        {recentSPVs
                          .filter(spv => spv.toLowerCase().includes(newRow.spv.toLowerCase()))
                          .slice(0, 2)
                          .map((spv, index) => (
                            <button
                              key={index}
                              type="button"
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                              onClick={() => setNewRow({...newRow, spv})}
                            >
                              {spv}
                            </button>
                          ))}
                        <button
                          type="button"
                          className="block w-full text-left px-4 py-2 text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border-t border-gray-200 dark:border-gray-700 mt-1"
                          onClick={() => clearRecentSuggestions('spv')}
                        >
                          Clear recent SPVs
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
                  <SearchableDropdown
                    options={locations}
                    value={newRow.location}
                    onChange={(value) => {
                      const location = value;
                      // Set location code based on location selection
                      let locationCode = '';
                      const relationship = locationRelationships.find(rel => rel.location === location);
                      locationCode = relationship ? relationship.locationCode : '';
                      setNewRow({...newRow, location, locationCode});
                    }}
                    onAddNew={(value) => {
                      // For new locations, set location code to the same value by default
                      saveDropdownOption('locations', value);
                      setNewRow({...newRow, location: value, locationCode: value});
                      // Also add to location relationships
                      const newRelationship = { location: value, locationCode: value };
                      setLocationRelationships(prev => [...prev, newRelationship]);
                      // Save location relationships to API
                      saveLocationRelationshipsMutation.mutate();
                    }}
                    placeholder="Select or type location..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location Code</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={newRow.locationCode}
                      readOnly
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white bg-gray-100 dark:bg-gray-800"
                      placeholder="Auto-filled from location selection"
                    />
                  </div>
                </div>
                
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">PSS</label>
                  <div className="relative">
                   <input
  type="text"
  value={newRow.pss}   // store ONLY the number/text
  onChange={(e) => setNewRow({ ...newRow, pss: e.target.value })}
  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
  placeholder="Enter number"
/>
                  </div>
                  {/* Recent PSS suggestions - filtered based on input, limited to 2 items */}
                  {newRow.pss && recentPSSs.filter(pss => pss.toLowerCase().includes(newRow.pss.toLowerCase())).length > 0 && (
                    <div className="absolute z-10 mt-1 w-full rounded-md bg-white dark:bg-gray-800 shadow-lg max-h-32 overflow-y-auto">
                      <div className="py-1">
                        {recentPSSs
                          .filter(pss => pss.toLowerCase().includes(newRow.pss.toLowerCase()))
                          .slice(0, 2)
                          .map((pss, index) => (
                            <button
                              key={index}
                              type="button"
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                              onClick={() => setNewRow({...newRow, pss})}
                            >
                              {pss}
                            </button>
                          ))}
                        <button
                          type="button"
                          className="block w-full text-left px-4 py-2 text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border-t border-gray-200 dark:border-gray-700 mt-1"
                          onClick={() => clearRecentSuggestions('pss')}
                        >
                          Clear recent PSSs
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Connectivity</label>
                  <SearchableDropdown
                    options={connectivities}
                    value={newRow.connectivity}
                    onChange={(value) => setNewRow({...newRow, connectivity: value})}
                    onAddNew={(value) => {
                      saveDropdownOption('connectivities', value);
                      setNewRow({...newRow, connectivity: value});
                    }}
                    placeholder="Select or type connectivity..."
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowTracker(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddRow}
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-md transition-all"
                >
                  Add Entry
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Data Table - Display data from database */}
      {tableData.length > 0 ? (
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <h3 className="text-lg font-medium text-foreground dark:text-white p-4 border-b border-gray-200 dark:border-gray-700">
            Data for {fiscalYear}
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-100 dark:bg-gray-800">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider align-top">S.No</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider align-top">Capacity</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider align-top w-32">
                    <div className="flex flex-col">
                      <span>Group</span>
                      <div className="mt-1">
                        <select
                          value={filters.group}
                          onChange={(e) => handleFilterChange('group', e.target.value)}
                          className="w-full text-xs rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-2 py-1"
                        >
                          <option value="">All</option>
                          {groups.map((group) => (
                            <option key={group} value={group}>
                              {group}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider align-top w-36">
                    <div className="flex flex-col">
                      <span>PPA/Merchant</span>
                      <div className="mt-1">
                        <select
                          value={filters.ppaMerchant}
                          onChange={(e) => handleFilterChange('ppaMerchant', e.target.value)}
                          className="w-full text-xs rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-2 py-1"
                        >
                          <option value="">All</option>
                          {ppaMerchants.map((ppaMerchant) => (
                            <option key={ppaMerchant} value={ppaMerchant}>
                              {ppaMerchant}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider align-top w-28">
                    <div className="flex flex-col">
                      <span>Type</span>
                      <div className="mt-1">
                        <select
                          value={filters.type}
                          onChange={(e) => handleFilterChange('type', e.target.value)}
                          className="w-full text-xs rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-2 py-1"
                        >
                          <option value="">All</option>
                          {types.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider align-top">Solar</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider align-top">Wind</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider align-top">SPV</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider align-top w-32">
                    <div className="flex flex-col">
                      <span>Location Code</span>
                      <div className="mt-1">
                        <select
                          value={filters.locationCode}
                          onChange={(e) => handleFilterChange('locationCode', e.target.value)}
                          className="w-full text-xs rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-2 py-1"
                        >
                          <option value="">All</option>
                          {locationCodes.map((locationCode) => (
                            <option key={locationCode} value={locationCode}>
                              {locationCode}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider align-top w-32">
                    <div className="flex flex-col">
                      <span>Location</span>
                      <div className="mt-1">
                        <select
                          value={filters.location}
                          onChange={(e) => handleFilterChange('location', e.target.value)}
                          className="w-full text-xs rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-2 py-1"
                        >
                          <option value="">All</option>
                          {locations.map((location) => (
                            <option key={location} value={location}>
                              {location}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider align-top">PSS</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider align-top w-32">
                    <div className="flex flex-col">
                      <span>Connectivity</span>
                      <div className="mt-1">
                        <select
                          value={filters.connectivity}
                          onChange={(e) => handleFilterChange('connectivity', e.target.value)}
                          className="w-full text-xs rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-2 py-1"
                        >
                          <option value="">All</option>
                          {connectivities.map((connectivity) => (
                            <option key={connectivity} value={connectivity}>
                              {connectivity}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider align-top">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredData.map((row, index) => (
                    <tr key={row.id || index} className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'}>
                      {editingId === row.id ? (
                        // Edit mode row
                        <>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 dark:text-gray-300">
                            {row.sno || index + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 dark:text-white">
                            <input
                              type="number"
                              step="0.01"
                              value={editRow?.capacity || ''}
                              onChange={(e) => handleEditInputChange('capacity', e.target.value ? parseFloat(e.target.value) : null)}
                              className="w-full rounded-md bg-input-background dark:bg-[#171717] text-foreground dark:text-white border border-input-border dark:border-gray-600 px-2 py-1 text-xs"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 dark:text-white">
                            <SearchableDropdown
                              options={groups}
                              value={editRow?.group || ''}
                              onChange={(value) => handleEditInputChange('group', value)}
                              onAddNew={(value) => {
                                saveDropdownOption('groups', value);
                                handleEditInputChange('group', value);
                              }}
                              placeholder="Select Group"
                              className="text-xs"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 dark:text-white">
                            <SearchableDropdown
                              options={ppaMerchants}
                              value={editRow?.ppaMerchant || ''}
                              onChange={(value) => handleEditInputChange('ppaMerchant', value)}
                              onAddNew={(value) => {
                                saveDropdownOption('ppaMerchants', value);
                                handleEditInputChange('ppaMerchant', value);
                              }}
                              placeholder="Select Option"
                              className="text-xs"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 dark:text-white">
                            <SearchableDropdown
                              options={types}
                              value={editRow?.type || ''}
                              onChange={(value) => handleEditInputChange('type', value)}
                              onAddNew={(value) => {
                                saveDropdownOption('types', value);
                                handleEditInputChange('type', value);
                              }}
                              placeholder="Select Type"
                              className="text-xs"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 dark:text-white">
                            <input
                              type="number"
                              value={editRow?.solar || ''}
                              onChange={(e) => handleEditInputChange('solar', e.target.value ? parseFloat(e.target.value) : null)}
                              className={`w-full rounded-md bg-input-background dark:bg-[#171717] text-foreground dark:text-white border border-input-border dark:border-gray-600 px-2 py-1 text-xs ${ editRow?.type === 'Wind' || editRow?.type === 'Hybrid' ? 'opacity-50 cursor-not-allowed' : '' } `}
                              disabled={editRow?.type === 'Wind' || editRow?.type === 'Hybrid'}
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 dark:text-white">
                            <input
                              type="number"
                              value={editRow?.wind || ''}
                              onChange={(e) => handleEditInputChange('wind', e.target.value ? parseFloat(e.target.value) : null)}
                              className={`w-full rounded-md bg-input-background dark:bg-[#171717] text-foreground dark:text-white border border-input-border dark:border-gray-600 px-2 py-1 text-xs ${ editRow?.type === 'Solar' ? 'opacity-50 cursor-not-allowed' : '' } `}
                              disabled={editRow?.type === 'Solar'}
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 dark:text-white relative">
                            <input
                              type="text"
                              value={editRow?.spv || ''}
                              onChange={(e) => handleEditInputChange('spv', e.target.value.toUpperCase())}
                              className="w-full rounded-md bg-input-background dark:bg-[#171717] text-foreground dark:text-white border border-input-border dark:border-gray-600 px-2 py-1 text-xs"
                              style={{ textTransform: 'uppercase' }}
                            />
                            {/* Recent SPV suggestions for edit row - filtered based on input, limited to 2 items */}
                            {editRow?.spv && recentSPVs.filter(spv => spv.toLowerCase().includes(editRow.spv.toLowerCase())).length > 0 && (
                              <div className="absolute z-10 mt-1 w-full rounded-md bg-white dark:bg-gray-800 shadow-lg max-h-32 overflow-y-auto">
                                <div className="py-1">
                                  {recentSPVs
                                    .filter(spv => spv.toLowerCase().includes(editRow.spv.toLowerCase()))
                                    .slice(0, 2)
                                    .map((spv, index) => (
                                      <button
                                        key={index}
                                        type="button"
                                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                        onClick={() => handleEditInputChange('spv', spv)}
                                      >
                                        {spv}
                                      </button>
                                    ))}
                                  <button
                                    type="button"
                                    className="block w-full text-left px-4 py-2 text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border-t border-gray-200 dark:border-gray-700 mt-1"
                                    onClick={() => clearRecentSuggestions('spv')}
                                  >
                                    Clear recent SPVs
                                  </button>
                                </div>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 dark:text-white">
                            <SearchableDropdown
                              options={locationCodes}
                              value={editRow?.locationCode || ''}
                              onChange={(value) => handleEditInputChange('locationCode', value)}
                              onAddNew={(value) => {
                                saveDropdownOption('locationCodes', value);
                                handleEditInputChange('locationCode', value);
                              }}
                              placeholder="Select Location Code"
                              className="text-xs"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 dark:text-white">
                            <SearchableDropdown
                              options={locations}
                              value={editRow?.location || ''}
                              onChange={(value) => handleEditInputChange('location', value)}
                              onAddNew={(value) => {
                                saveDropdownOption('locations', value);
                                handleEditInputChange('location', value);
                              }}
                              placeholder="Select Location"
                              className="text-xs"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 dark:text-white relative">
                            <input
                              type="text"
                              value={editRow?.pss?.replace('PSS - ', '') || ''}
                              onChange={(e) => handleEditInputChange('pss', `PSS - ${ e.target.value } `)}
                              className="w-full rounded-md bg-input-background dark:bg-[#171717] text-foreground dark:text-white border border-input-border dark:border-gray-600 px-2 py-1 text-xs"
                            />
                            {/* Recent PSS suggestions for edit row - filtered based on input, limited to 2 items */}
                            {editRow?.pss && recentPSSs.filter(pss => pss.toLowerCase().includes(editRow.pss.replace('PSS - ', '').toLowerCase())).length > 0 && (
                              <div className="absolute z-10 mt-1 w-full rounded-md bg-white dark:bg-gray-800 shadow-lg max-h-32 overflow-y-auto">
                                <div className="py-1">
                                  {recentPSSs
                                    .filter(pss => pss.toLowerCase().includes(editRow.pss.replace('PSS - ', '').toLowerCase()))
                                    .slice(0, 2)
                                    .map((pss, index) => (
                                      <button
                                        key={index}
                                        type="button"
                                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                        onClick={() => handleEditInputChange('pss', `PSS - ${ pss } `)}
                                      >
                                        {pss}
                                      </button>
                                    ))}
                                  <button
                                    type="button"
                                    className="block w-full text-left px-4 py-2 text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border-t border-gray-200 dark:border-gray-700 mt-1"
                                    onClick={() => clearRecentSuggestions('pss')}
                                  >
                                    Clear recent PSSs
                                  </button>
                                </div>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 dark:text-white">
                            <SearchableDropdown
                              options={connectivities}
                              value={editRow?.connectivity || ''}
                              onChange={(value) => handleEditInputChange('connectivity', value)}
                              onAddNew={(value) => {
                                saveDropdownOption('connectivities', value);
                                handleEditInputChange('connectivity', value);
                              }}
                              placeholder="Select Connectivity"
                              className="text-xs"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs font-medium">
                            <button
                              onClick={handleSaveEdit}
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-2 text-xs"
                            >
                              Save
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300 text-xs"
                            >
                              Cancel
                            </button>
                          </td>
                        </>
                      ) : (
                        // Display mode row
                        <>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 dark:text-gray-300">{row.sno || index + 1}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 dark:text-white">{row.capacity !== null ? row.capacity.toFixed(2) : ''}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 dark:text-white">{row.group || ''}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 dark:text-white">{row.ppaMerchant || ''}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 dark:text-white">{row.type || ''}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 dark:text-white">{row.solar !== null ? row.solar.toFixed(2) : ''}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 dark:text-white">{row.wind !== null ? row.wind.toFixed(2) : ''}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 dark:text-white">{row.spv || ''}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 dark:text-white">{row.locationCode || ''}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 dark:text-white">{row.location || ''}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 dark:text-white">{row.pss || ''}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 dark:text-white">{row.connectivity || ''}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs font-medium relative">
                            {user ? (
                              <div className="relative inline-block text-left">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleMenu(row.id, e);
                                  }}
                                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                  </svg>
                                </button>
                                {openMenuId === row.id && (
                                  <div 
                                    className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-[#171717] ring-1 ring-black ring-opacity-5 z-20"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                                      <button
                                        onClick={() => {
                                          handleEditRow(row);
                                          setOpenMenuId(null);
                                        }}
                                        className="block px-4 py-2 text-xs text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 w-full text-left"
                                        role="menuitem"
                                      >
                                        Edit
                                      </button>
                                      <button
                                        onClick={() => {
                                          handleDeleteRow(row.id);
                                          setOpenMenuId(null);
                                        }}
                                        className="block px-4 py-2 text-xs text-red-600 hover:bg-gray-100 dark:text-red-400 dark:hover:bg-gray-800 w-full text-left"
                                        role="menuitem"
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400 dark:text-gray-500 text-xs">Login required</span>
                            )}
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                }
                {filteredData.length === 0 && (
                  <tr>
                    <td colSpan={13} className="px-6 py-4 text-center text-xs text-gray-500 dark:text-gray-400">
                      No data matches the current filters
                    </td>
                  </tr>
                )}
                {/* Total row */}
                {filteredData.length > 0 && (
                  <tr className="bg-gray-100 dark:bg-gray-800 font-semibold">
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 dark:text-white">TOTAL</td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 dark:text-white">{sums.capacity.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 dark:text-white"></td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 dark:text-white"></td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 dark:text-white"></td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 dark:text-white">{sums.solar.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 dark:text-white">{sums.wind.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 dark:text-white"></td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 dark:text-white"></td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 dark:text-white"></td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 dark:text-white"></td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 dark:text-white"></td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 dark:text-white"></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
          <p className="text-gray-500 dark:text-gray-400">No data available for {fiscalYear}</p>
        </div>
      )}
    </div>
  );
}
