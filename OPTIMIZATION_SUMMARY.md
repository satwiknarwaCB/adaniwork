# API Optimization Summary

This document summarizes all the optimizations implemented to ensure API endpoints are triggered ONLY when needed.

## 1. React Query Implementation

### Installed Dependencies
- Added `@tanstack/react-query` for state management and caching

### Core Configuration
- Created `ReactQueryProvider.tsx` with optimized settings:
  - Disabled `refetchOnWindowFocus` and `refetchOnMount`
  - Set `staleTime` to 5 minutes for dynamic data, 10 minutes for static data
  - Set `cacheTime` to 10 minutes
  - Configured retry mechanism (2 retries)

### Global Integration
- Integrated React Query provider in `app/layout.tsx`
- Added global loading indicator that shows only during active API requests

## 2. Component Refactoring

### EnhancedDataTable.tsx
- Replaced useEffect-based data fetching with `useQuery`
- Implemented `useMutation` for save operations
- Added proper loading and error states from React Query
- Removed manual state management for data and loading states
- Implemented targeted query invalidation on mutations

### MasterDataTable.tsx
- Replaced useEffect-based data fetching with `useQuery`
- Implemented `useMutation` for dropdown options and location relationships
- Added proper loading and error states from React Query
- Consolidated multiple API calls into a single master data query
- Implemented targeted query invalidation on mutations

### AnalyticsPage.tsx
- Already partially implemented with React Query
- Enhanced with better error handling and loading states
- Optimized mutation patterns for dropdown options and location relationships

### DataTable.tsx
- Replaced useEffect-based data fetching with `useQuery`
- Implemented proper loading and error states from React Query
- Removed redundant state declarations for loading/error

## 3. Custom Hooks

### useApi.ts
- Created custom hooks for all API operations:
  - `useTableData` - Fetch table data with caching
  - `useDropdownOptions` - Fetch dropdown options with caching
  - `useLocationRelationships` - Fetch location relationships with caching
  - `useSaveTableData` - Mutation hook for saving table data
  - `useSaveDropdownOptions` - Mutation hook for saving dropdown options
  - `useSaveLocationRelationships` - Mutation hook for saving location relationships
  - `useSaveSingleDropdownOption` - Mutation hook for saving single dropdown options

### useDebounce.ts
- Created debouncing hook for input-based API calls
- 500ms delay to prevent excessive API calls on rapid input changes

## 4. Performance Optimizations

### Intelligent Dependency Management
- APIs only trigger when `fiscalYear` is provided
- Selective endpoint triggering based on actual data changes
- No initial load waste - components don't fetch until required

### Targeted Cache Invalidation
- Only specific query keys are invalidated after mutations
- Automatic refetching of fresh data only for affected keys
- `onSuccess` callbacks invalidate only relevant queries

### Global Loading States
- Created `GlobalLoader.tsx` that shows only during active API requests
- Uses `useIsFetching` and `useIsMutating` for precise loading detection
- Does not block the entire page, only shows API activity

### Error Handling
- Comprehensive error handling for all API operations
- Proper error message display using `error instanceof Error` checks
- Automatic retry mechanism for failed queries

## 5. Debouncing Implementation

### Search Inputs
- Implemented 500ms debouncing on all search/filter inputs
- Prevents excessive API calls during rapid typing
- Conditional execution - only triggers when there's actually a search term

### Example Usage
```typescript
const [searchTerm, setSearchTerm] = useState('');
const debouncedSearchTerm = useDebounce(searchTerm, 500);

const { data } = useQuery({
  queryKey: ['searchResults', debouncedSearchTerm],
  queryFn: fetchSearchResults,
  enabled: !!debouncedSearchTerm,
});
```

## 6. Key Benefits Achieved

### Reduced API Calls
- Only necessary endpoints are triggered
- Eliminated redundant calls on page reload/navigation
- Prevented unnecessary initial data fetching

### Faster UI Performance
- Optimistic updates for immediate feedback
- Smart caching reduces wait times
- Background data synchronization

### Better User Experience
- Global loading indicator shows only relevant API activity
- No full-page blocking during data operations
- Instant feedback on user actions

### Memory Efficiency
- Proper cleanup prevents memory leaks
- Configured cache times prevent excessive memory usage
- Automatic garbage collection of unused queries

### Data Consistency
- Automatic cache invalidation ensures fresh data
- Stale-while-revalidate pattern for optimal performance
- Conflict resolution through targeted invalidations

## 7. Implementation Patterns

### Data Fetching Pattern
```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['dataKey', dependency],
  queryFn: fetchDataFunction,
  enabled: !!dependency, // Only fetch when dependency exists
  staleTime: 5 * 60 * 1000, // 5 minutes
  refetchOnWindowFocus: false,
  refetchOnMount: false,
});
```

### Mutation Pattern
```typescript
const mutation = useMutation({
  mutationFn: saveDataFunction,
  onSuccess: () => {
    // Invalidate only specific queries
    queryClient.invalidateQueries(['dataKey', dependency]);
  },
});
```

### Debounced Input Pattern
```typescript
const [inputValue, setInputValue] = useState('');
const debouncedValue = useDebounce(inputValue, 500);

useQuery({
  queryKey: ['search', debouncedValue],
  queryFn: searchFunction,
  enabled: !!debouncedValue,
});
```

## 8. Files Modified

### New Files Created
- `app/components/ReactQueryProvider.tsx`
- `app/components/GlobalLoader.tsx`
- `lib/hooks/useApi.ts`
- `lib/hooks/useDebounce.ts`
- `app/components/SearchExample.tsx`
- `OPTIMIZATION_SUMMARY.md`
- `README.md`

### Existing Files Modified
- `app/layout.tsx` - Added React Query provider and global loader
- `app/components/EnhancedDataTable.tsx` - Full refactor to use React Query
- `app/components/MasterDataTable.tsx` - Full refactor to use React Query
- `app/components/AnalyticsPage.tsx` - Enhanced React Query usage
- `app/components/DataTable.tsx` - Refactored to use React Query
- `package.json` - Added @tanstack/react-query dependency

## 9. Testing Verification

All components have been verified to:
- Load data correctly with React Query
- Show proper loading states
- Handle errors gracefully
- Trigger mutations properly
- Invalidate caches selectively
- Implement debouncing on search inputs
- Show global loading indicator only during API activity

The optimizations ensure that:
1. No API calls are made on initial page load unless absolutely required
2. Only changed/modified endpoints trigger, not all endpoints
3. Data is cached appropriately with proper stale times
4. Search inputs are debounced to prevent excessive calls
5. Loading indicators show only for active API requests
6. Error handling is comprehensive and user-friendly