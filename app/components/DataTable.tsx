"use client";

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import CustomDropdown from './CustomDropdown';

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

// Define the props interface
interface DataTableProps {
  fiscalYear?: string;
}

export default function DataTable({ fiscalYear = 'FY_25' }: DataTableProps) {
  const [data, setData] = useState<TableRow[]>([]);
  const [filteredData, setFilteredData] = useState<TableRow[]>([]);
  // Remove the old loading and error state declarations since we're using React Query now

  // State for dropdown options
  const [groups, setGroups] = useState<string[]>(['AGEL', 'ACL']);
  const [ppaMerchants, setPpaMerchants] = useState<string[]>(['PPA', 'Merchant']);
  const [types, setTypes] = useState<string[]>(['Solar', 'Wind', 'Hybrid']);
  const [locationCodes, setLocationCodes] = useState<string[]>(['Khavda', 'RJ', 'Others']);
  const [locations, setLocations] = useState<string[]>(['Khavda', 'Baap', 'Essel', 'Kamuthi']);
  const [connectivities, setConnectivities] = useState<string[]>(['CTU', 'STU']);

  // State for filters
  const [filters, setFilters] = useState({
    group: '',
    ppaMerchant: '',
    type: '',
    locationCode: '',
    location: '',
    connectivity: ''
  });

  // Load dropdown options with React Query
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

  // Load data based on fiscal year with React Query
  const { data: tableData, isLoading: tableLoading, error: tableError } = useQuery({
    queryKey: ['tableData', fiscalYear],
    queryFn: async () => {
      const response = await fetch(`/api/table-data?fiscalYear=${fiscalYear}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to load data: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('API response data:', result);

      // Use database data with correct field mapping
      return result.data.map((row: any, index: number) => ({
        id: row.id || index + 1,
        sno: row.sno || index + 1,
        capacity: typeof row.capacity === 'number' ? row.capacity : null,
        group: row.group || '',
        ppaMerchant: row.ppaMerchant || '',
        type: row.type || '',
        solar: typeof row.solar === 'number' ? row.solar : null,
        wind: typeof row.wind === 'number' ? row.wind : null,
        spv: row.spv || '',
        locationCode: row.locationCode || '',
        location: row.location || '',
        pss: row.pss || '',
        connectivity: row.connectivity || ''
      }));
    },
    enabled: !!fiscalYear, // Only fetch when fiscalYear is provided
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Update dropdown options when data changes
  useEffect(() => {
    if (dropdownData) {
      setGroups(Array.isArray(dropdownData.groups) ? dropdownData.groups : ['AGEL', 'ACL']);
      setPpaMerchants(Array.isArray(dropdownData.ppaMerchants) ? dropdownData.ppaMerchants : ['PPA', 'Merchant']);
      setTypes(Array.isArray(dropdownData.types) ? dropdownData.types : ['Solar', 'Wind', 'Hybrid']);
      setLocationCodes(Array.isArray(dropdownData.locationCodes) ? dropdownData.locationCodes : ['Khavda', 'RJ', 'Others']);
      setLocations(Array.isArray(dropdownData.locations) ? dropdownData.locations : ['Khavda', 'Baap', 'Essel', 'Kamuthi']);
      setConnectivities(Array.isArray(dropdownData.connectivities) ? dropdownData.connectivities : ['CTU', 'STU']);
    }
  }, [dropdownData]);

  // Update data and filtered data when table data changes
  useEffect(() => {
    if (tableData) {
      setData(tableData);
      setFilteredData(tableData);
    }
  }, [tableData]);

  // Apply filters whenever data or filters change
  useEffect(() => {
    console.log('Applying filters:', filters);
    console.log('Data to filter:', data);

    const filtered = data.filter(row => {
      return (
        (filters.group === '' || row.group === filters.group) &&
        (filters.ppaMerchant === '' || row.ppaMerchant === filters.ppaMerchant) &&
        (filters.type === '' || row.type === filters.type) &&
        (filters.locationCode === '' || row.locationCode === filters.locationCode) &&
        (filters.location === '' || row.location === filters.location) &&
        (filters.connectivity === '' || row.connectivity === filters.connectivity)
      );
    });

    console.log('Filtered data:', filtered);
    setFilteredData(filtered);
  }, [data, filters]);

  // Handle filter changes
  const handleFilterChange = (field: keyof typeof filters, value: string) => {
    console.log('Filter change:', field, value);
    setFilters({
      ...filters,
      [field]: value
    });
  };

  // Calculate sums for numeric columns
  const calculateSums = () => {
    return filteredData.reduce((acc, row) => {
      acc.capacity += row.capacity || 0;
      acc.solar += row.solar || 0;
      acc.wind += row.wind || 0;
      return acc;
    }, { capacity: 0, solar: 0, wind: 0 });
  };

  const sums = calculateSums();

  const loading = dropdownLoading || tableLoading;
  const error = dropdownError || tableError;

  if (loading) {
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
    <div className="mt-8 overflow-x-auto">
      <div className="inline-block min-w-full align-middle">
        {/* Filter Section */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground dark:text-white mb-1">Group</label>
            <CustomDropdown
              options={['', ...groups]}
              value={filters.group}
              onChange={(value) => handleFilterChange('group', value)}
              placeholder="All Groups"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground dark:text-white mb-1">PPA/Merchant</label>
            <CustomDropdown
              options={['', ...ppaMerchants]}
              value={filters.ppaMerchant}
              onChange={(value) => handleFilterChange('ppaMerchant', value)}
              placeholder="All PPA/Merchant"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground dark:text-white mb-1">Type</label>
            <CustomDropdown
              options={['', ...types]}
              value={filters.type}
              onChange={(value) => handleFilterChange('type', value)}
              placeholder="All Types"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground dark:text-white mb-1">Location Code</label>
            <CustomDropdown
              options={['', ...locationCodes]}
              value={filters.locationCode}
              onChange={(value) => handleFilterChange('locationCode', value)}
              placeholder="All Location Codes"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground dark:text-white mb-1">Location</label>
            <CustomDropdown
              options={['', ...locations]}
              value={filters.location}
              onChange={(value) => handleFilterChange('location', value)}
              placeholder="All Locations"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground dark:text-white mb-1">Connectivity</label>
            <CustomDropdown
              options={['', ...connectivities]}
              value={filters.connectivity}
              onChange={(value) => handleFilterChange('connectivity', value)}
              placeholder="All Connectivities"
            />
          </div>
        </div>

        {/* Data Summary */}
        <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-sm text-foreground dark:text-white">
            Showing <span className="font-semibold">{filteredData.length}</span> of <span className="font-semibold">{data.length}</span> records
          </p>
          <p className="text-sm text-foreground dark:text-white">
            Fiscal Year: <span className="font-semibold">{fiscalYear}</span>
          </p>
        </div>

        {/* Data Table */}
        <table className="min-w-full border-separate border-spacing-0">
          <thead>
            <tr>
              <th scope="col" className="sticky top-0 z-10 border-b border-table-border dark:border-gray-700 bg-table-header dark:bg-[#171717] py-3.5 pr-3 pl-4 text-left text-sm font-semibold text-foreground dark:text-white backdrop-blur-sm backdrop-filter sm:pl-6 lg:pl-8">
                S.No
              </th>
              <th scope="col" className="sticky top-0 z-10 border-b border-table-border dark:border-gray-700 bg-table-header dark:bg-[#171717] px-3 py-3.5 text-left text-sm font-semibold text-foreground dark:text-white backdrop-blur-sm backdrop-filter">
                Capacity
              </th>
              <th scope="col" className="sticky top-0 z-10 border-b border-table-border dark:border-gray-700 bg-table-header dark:bg-[#171717] px-3 py-3.5 text-left text-sm font-semibold text-foreground dark:text-white backdrop-blur-sm backdrop-filter">
                Group
              </th>
              <th scope="col" className="sticky top-0 z-10 border-b border-table-border dark:border-gray-700 bg-table-header dark:bg-[#171717] px-3 py-3.5 text-left text-sm font-semibold text-foreground dark:text-white backdrop-blur-sm backdrop-filter">
                PPA/Merchant
              </th>
              <th scope="col" className="sticky top-0 z-10 border-b border-table-border dark:border-gray-700 bg-table-header dark:bg-[#171717] px-3 py-3.5 text-left text-sm font-semibold text-foreground dark:text-white backdrop-blur-sm backdrop-filter">
                Type
              </th>
              <th scope="col" className="sticky top-0 z-10 border-b border-table-border dark:border-gray-700 bg-table-header dark:bg-[#171717] px-3 py-3.5 text-left text-sm font-semibold text-foreground dark:text-white backdrop-blur-sm backdrop-filter">
                Solar
              </th>
              <th scope="col" className="sticky top-0 z-10 border-b border-table-border dark:border-gray-700 bg-table-header dark:bg-[#171717] px-3 py-3.5 text-left text-sm font-semibold text-foreground dark:text-white backdrop-blur-sm backdrop-filter">
                Wind
              </th>
              <th scope="col" className="sticky top-0 z-10 border-b border-table-border dark:border-gray-700 bg-table-header dark:bg-[#171717] px-3 py-3.5 text-left text-sm font-semibold text-foreground dark:text-white backdrop-blur-sm backdrop-filter">
                SPV
              </th>
              <th scope="col" className="sticky top-0 z-10 border-b border-table-border dark:border-gray-700 bg-table-header dark:bg-[#171717] px-3 py-3.5 text-left text-sm font-semibold text-foreground dark:text-white backdrop-blur-sm backdrop-filter">
                Location Code
              </th>
              <th scope="col" className="sticky top-0 z-10 border-b border-table-border dark:border-gray-700 bg-table-header dark:bg-[#171717] px-3 py-3.5 text-left text-sm font-semibold text-foreground dark:text-white backdrop-blur-sm backdrop-filter">
                Location
              </th>
              <th scope="col" className="sticky top-0 z-10 border-b border-table-border dark:border-gray-700 bg-table-header dark:bg-[#171717] px-3 py-3.5 text-left text-sm font-semibold text-foreground dark:text-white backdrop-blur-sm backdrop-filter">
                PSS
              </th>
              <th scope="col" className="sticky top-0 z-10 border-b border-table-border dark:border-gray-700 bg-table-header dark:bg-[#171717] px-3 py-3.5 text-left text-sm font-semibold text-foreground dark:text-white backdrop-blur-sm backdrop-filter">
                Connectivity
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-table-border dark:divide-gray-700 bg-card-background dark:bg-[#171717]">
            {filteredData.map((row, index) => (
              <tr
                key={row.id}
                className={index % 2 === 0 ? 'bg-card-background dark:bg-[#171717]' : 'bg-table-row-hover dark:bg-gray-800'}
              >
                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-foreground dark:text-white sm:pl-6 lg:pl-8">
                  {row.sno}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-foreground dark:text-white">
                  {row.capacity?.toFixed(2)}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-foreground dark:text-white">
                  {row.group}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-foreground dark:text-white">
                  {row.ppaMerchant}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-foreground dark:text-white">
                  {row.type}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-foreground dark:text-white">
                  {row.solar?.toFixed(2)}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-foreground dark:text-white">
                  {row.wind?.toFixed(2)}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-foreground dark:text-white">
                  {row.spv}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-foreground dark:text-white">
                  {row.locationCode}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-foreground dark:text-white">
                  {row.location}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-foreground dark:text-white">
                  {row.pss}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-foreground dark:text-white">
                  {row.connectivity}
                </td>
              </tr>
            ))}

            {/* Total row */}
            {filteredData.length > 0 && (
              <tr className="bg-table-header dark:bg-[#171717] font-semibold">
                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-foreground dark:text-white sm:pl-6 lg:pl-8">
                  TOTAL
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-foreground dark:text-white">
                  {sums.capacity.toFixed(2)}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-foreground dark:text-white"></td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-foreground dark:text-white"></td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-foreground dark:text-white"></td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-foreground dark:text-white">
                  {sums.solar.toFixed(2)}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-foreground dark:text-white">
                  {sums.wind.toFixed(2)}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-foreground dark:text-white"></td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-foreground dark:text-white"></td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-foreground dark:text-white"></td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-foreground dark:text-white"></td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-foreground dark:text-white"></td>
              </tr>
            )}
          </tbody>
        </table>

        {filteredData.length === 0 && (
          <div className="text-center py-10">
            <p className="text-foreground dark:text-white">No data found matching the current filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}