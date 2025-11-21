"use client";

import { useState } from 'react';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { useQuery } from '@tanstack/react-query';

export default function SearchExample() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500); // 500ms delay

  // Example of using debounced search with React Query
  const { data, isLoading, error } = useQuery({
    queryKey: ['searchResults', debouncedSearchTerm],
    queryFn: async () => {
      // This would be your actual API call
      // For demo purposes, we're just returning the search term
      if (!debouncedSearchTerm) return [];
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Mock search results
      return [
        `Result 1 for "${debouncedSearchTerm}"`,
        `Result 2 for "${debouncedSearchTerm}"`,
        `Result 3 for "${debouncedSearchTerm}"`
      ];
    },
    enabled: !!debouncedSearchTerm, // Only fetch when there's a search term
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Debounced Search Example</h2>
      
      <div className="mb-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Type to search (debounced)..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      
      {isLoading && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2">Searching...</p>
        </div>
      )}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <strong className="font-bold">Error! </strong>
          <span className="block sm:inline">Failed to perform search</span>
        </div>
      )}
      
      {data && data.length > 0 && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Search Results:</h3>
          <ul className="space-y-2">
            {data.map((result: string, index: number) => (
              <li key={index} className="p-3 bg-gray-50 rounded-lg">
                {result}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {debouncedSearchTerm && data && data.length === 0 && (
        <div className="mt-4 text-center py-4 text-gray-500">
          No results found for "{debouncedSearchTerm}"
        </div>
      )}
    </div>
  );
}