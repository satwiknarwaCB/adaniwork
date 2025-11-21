"use client";

import { useState, useEffect } from 'react';
import { useVariables } from '@/lib/hooks/useVariables';
import { useAuth } from '@/lib/hooks/useAuth';

export default function VariableManager() {
  const { variables, loading, error, setVariable, deleteVariable, refresh } = useVariables();
  const { user, login, logout } = useAuth();
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSetVariable = async () => {
    if (!key) return;
    
    const result = await setVariable(key, value);
    if (result.success) {
      setKey('');
      setValue('');
    }
  };

  const handleDeleteVariable = async (variableKey: string) => {
    await deleteVariable(variableKey);
  };

  const handleLogin = async () => {
    const result = await login(email, password);
    if (result.success) {
      setEmail('');
      setPassword('');
    }
  };

  if (loading) {
    return <div>Loading variables...</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">SQLite Variable Manager</h2>
      
      {/* Auth Section */}
      <div className="mb-8 p-4 border rounded">
        <h3 className="text-lg font-semibold mb-2">Authentication</h3>
        {user ? (
          <div>
            <p>Logged in as: {user.username} ({user.email})</p>
            <button 
              onClick={logout}
              className="mt-2 px-4 py-2 bg-[#BD3861] text-white rounded hover:bg-[#BD3861]/90 transition-colors"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 border rounded mb-2"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
            <button 
              onClick={handleLogin}
              className="px-4 py-2 bg-[#0B74B0] text-white rounded hover:bg-[#0B74B0]/90 transition-colors"
            >
              Login
            </button>
          </div>
        )}
      </div>

      {/* Variables Section */}
      <div className="p-4 border rounded">
        <h3 className="text-lg font-semibold mb-2">Variables</h3>
        
        {error && <p className="text-[#BD3861] mb-2">Error: {error}</p>}
        
        <div className="mb-4">
          <input
            type="text"
            placeholder="Key"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            className="w-full p-2 border rounded mb-2"
          />
          <input
            type="text"
            placeholder="Value"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full p-2 border rounded mb-2"
          />
          <button 
            onClick={handleSetVariable}
            className="px-4 py-2 bg-[#0B74B0] text-white rounded hover:bg-[#0B74B0]/90 transition-colors"
          >
            Set Variable
          </button>
        </div>
        
        <button 
          onClick={refresh}
          className="mb-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
        >
          Refresh
        </button>
        
        <div>
          <h4 className="font-medium mb-2">Stored Variables:</h4>
          {Object.keys(variables).length === 0 ? (
            <p>No variables stored yet.</p>
          ) : (
            <ul className="space-y-2">
              {Object.entries(variables).map(([variableKey, variableValue]) => (
                <li key={variableKey} className="flex justify-between items-center p-2 border rounded">
                  <div>
                    <strong>{variableKey}:</strong> {JSON.stringify(variableValue)}
                  </div>
                  <button 
                    onClick={() => handleDeleteVariable(variableKey)}
                    className="px-2 py-1 bg-[#BD3861] text-white rounded text-sm hover:bg-[#BD3861]/90 transition-colors"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}