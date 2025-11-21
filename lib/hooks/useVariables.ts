import { useState, useEffect } from 'react';

interface Variable {
  key: string;
  value: any;
}

export function useVariables() {
  const [variables, setVariables] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all variables
  const fetchVariables = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/variables');
      const data = await response.json();
      
      if (response.ok) {
        setVariables(data.variables);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch variables');
      }
    } catch (err) {
      setError('Network error');
      console.error('Error fetching variables:', err);
    } finally {
      setLoading(false);
    }
  };

  // Get a specific variable
  const getVariable = (key: string) => {
    return variables[key];
  };

  // Set a variable
  const setVariable = async (key: string, value: any) => {
    try {
      const response = await fetch('/api/variables', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key, value }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Update local state
        setVariables(prev => ({ ...prev, [key]: value }));
        return { success: true, data };
      } else {
        throw new Error(data.error || 'Failed to set variable');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
      console.error('Error setting variable:', err);
      return { success: false, error: err.message };
    }
  };

  // Delete a variable
  const deleteVariable = async (key: string) => {
    try {
      const response = await fetch(`/api/variables?key=${encodeURIComponent(key)}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Update local state
        setVariables(prev => {
          const newVariables = { ...prev };
          delete newVariables[key];
          return newVariables;
        });
        return { success: true, data };
      } else {
        throw new Error(data.error || 'Failed to delete variable');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
      console.error('Error deleting variable:', err);
      return { success: false, error: err.message };
    }
  };

  // Load variables on mount
  useEffect(() => {
    fetchVariables();
  }, []);

  return {
    variables,
    loading,
    error,
    getVariable,
    setVariable,
    deleteVariable,
    refresh: fetchVariables,
  };
}