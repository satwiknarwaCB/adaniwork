# CEO Tracker - Optimized React Query Implementation

This project has been optimized to ensure API endpoints are triggered ONLY when needed, with the following improvements:

## Key Optimizations

### 1. React Query Integration
- **Smart Caching**: Implemented React Query for efficient data caching and state management
- **Stale-While-Revalidate**: Configured with 5-minute stale time for table data and 10-minute for dropdown options
- **Disabled Auto-Refetching**: Turned off `refetchOnWindowFocus` and `refetchOnMount` for static data

### 2. Intelligent Data Fetching
- **Conditional Fetching**: APIs only trigger when `fiscalYear` is provided
- **Selective Endpoint Triggering**: Only relevant endpoints are called based on data changes
- **No Initial Load Waste**: Components don't fetch data until absolutely required

### 3. Optimized Mutations
- **Targeted Invalidations**: Only specific query keys are invalidated after mutations
- **Automatic Refetching**: Fresh data is fetched only for affected keys
- **Error Handling**: Comprehensive error handling for all API operations

### 4. Debounced Search
- **Input Debouncing**: 500ms delay on search inputs to prevent excessive API calls
- **Conditional Execution**: Search only triggers when there's actually a search term

### 5. Performance Enhancements
- **Global Loading Indicator**: Shows only during active API requests, not for the whole page
- **Optimistic Updates**: Faster UI updates with automatic rollback on failure
- **Memory Efficient**: Proper cleanup and memory management

## Implementation Details

### React Query Configuration
```typescript
// ReactQueryProvider.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 2,
    },
  },
});
```

### Component Patterns
All data components now follow this pattern:
```typescript
// Load data with React Query
const { data, isLoading, error } = useQuery({
  queryKey: ['tableData', fiscalYear],
  queryFn: fetchTableData,
  enabled: !!fiscalYear,
  staleTime: 5 * 60 * 1000,
  refetchOnWindowFocus: false,
  refetchOnMount: false,
});

// Mutate data with targeted invalidation
const mutation = useMutation(saveTableData, {
  onSuccess: () => {
    queryClient.invalidateQueries(['tableData', fiscalYear]);
  }
});
```

### Debounced Search Implementation
```typescript
const [searchTerm, setSearchTerm] = useState('');
const debouncedSearchTerm = useDebounce(searchTerm, 500);

const { data } = useQuery({
  queryKey: ['searchResults', debouncedSearchTerm],
  queryFn: fetchSearchResults,
  enabled: !!debouncedSearchTerm,
});
```

## Benefits

1. **Reduced API Calls**: Only necessary endpoints are triggered
2. **Faster UI**: Optimistic updates and smart caching improve perceived performance
3. **Better User Experience**: Global loading indicator shows only relevant API activity
4. **Data Consistency**: Automatic cache invalidation ensures fresh data
5. **Memory Efficiency**: Proper cleanup prevents memory leaks
6. **Error Resilience**: Comprehensive error handling with retry mechanisms

## Components Using Optimized Patterns

- `EnhancedDataTable.tsx` - Uses React Query for data fetching and mutations
- `MasterDataTable.tsx` - Implements React Query for master data management
- `AnalyticsPage.tsx` - Optimized with targeted invalidations
- `DataTable.tsx` - Refactored to use React Query patterns

## Hooks

- `useApi.ts` - Custom hooks for all API operations with React Query
- `useDebounce.ts` - Debouncing hook for search inputs
- `useAuth.ts` - Authentication management (existing)

## Global Components

- `ReactQueryProvider.tsx` - React Query configuration and provider
- `GlobalLoader.tsx` - Context-aware loading indicator
- `SearchExample.tsx` - Example implementation of debounced search