// API adapter to connect to the FastAPI backend
// This replaces the mock implementation with actual HTTP requests to the backend
import { API_BASE_URL } from '@/lib/config';

const isServer = typeof window === 'undefined';

// Helper function to make API requests
async function apiRequest(url: string, options: RequestInit = {}) {
  const fullUrl = `${API_BASE_URL}${url}`;
  const response = await fetch(fullUrl, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export async function connectToDatabase() {
  // This is a no-op for API-based implementation
  return {
    db: {
      collection: (name: string) => {
        return {
          // Find one document by query
          findOne: async (query: any) => {
            try {
              if (name === 'tableData') {
                const fiscalYear = query.fiscalYear;
                // Make actual HTTP request to backend
                const result = await apiRequest(`table-data?fiscalYear=${fiscalYear}`);
                return result;
              } else if (name === 'dropdownOptions') {
                const fiscalYear = query.fiscalYear;
                // Make actual HTTP request to backend
                const result = await apiRequest(`dropdown-options?fiscalYear=${fiscalYear}`);
                return result;
              } else if (name === 'locationRelationships') {
                const fiscalYear = query.fiscalYear;
                // Make actual HTTP request to backend
                const result = await apiRequest(`location-relationships?fiscalYear=${fiscalYear}`);
                return result;
              }
              return null;
            } catch (error) {
              console.error(`Error in findOne for ${name}:`, error);
              return null;
            }
          },

          // Update or insert a document
          updateOne: async (filter: any, update: any, options: any) => {
            try {
              if (name === 'tableData') {
                const fiscalYear = filter.fiscalYear;
                const data = update.$set.data;
               
                // Make actual HTTP request to backend
                const result = await apiRequest(`table-data`, {
                  method: 'POST',
                  body: JSON.stringify({ fiscalYear, data }),
                });
               
                return { modifiedCount: 1 };
              } else if (name === 'dropdownOptions') {
                const optionsData = update.$set;
                // Make actual HTTP request to backend
                const result = await apiRequest(`dropdown-options`, {
                  method: 'POST',
                  body: JSON.stringify(optionsData),
                });
                return { modifiedCount: 1 };
              } else if (name === 'locationRelationships') {
                const relationships = update.$set.relationships;
                const fiscalYear = update.$set.fiscalYear || 'FY_25';
                // Make actual HTTP request to backend
                const result = await apiRequest(`location-relationships?fiscalYear=${fiscalYear}`, {
                  method: 'POST',
                  body: JSON.stringify(relationships),
                });
                return { modifiedCount: relationships.length };
              }
              return { modifiedCount: 0 };
            } catch (error) {
              console.error(`Error in updateOne for ${name}:`, error);
              throw error;
            }
          },

          // Delete one document
          deleteOne: async (filter: any) => {
            try {
              if (name === 'tableData') {
                const fiscalYear = filter.fiscalYear;
                // Make actual HTTP request to backend
                await apiRequest(`table-data?fiscalYear=${fiscalYear}`, {
                  method: 'DELETE',
                });
                return { deletedCount: 1 };
              }
              return { deletedCount: 0 };
            } catch (error) {
              console.error(`Error in deleteOne for ${name}:`, error);
              return { deletedCount: 0 };
            }
          },

          // Insert one document
          insertOne: async (doc: any) => {
            // For now, we'll just return a mock result
            return { insertedId: null };
          }
        };
      }
    }
  };
}

// Mock disconnect function (API connections don't need explicit disconnection)
export async function disconnectFromDatabase() {
  // API connections are stateless
  return Promise.resolve();
}