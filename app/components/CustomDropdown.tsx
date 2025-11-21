"use client";

import { useState, useRef, useEffect } from 'react';

interface CustomDropdownProps {
  label?: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  onAddNew?: (newValue: string) => void;
  className?: string;
}

export default function CustomDropdown({
  label,
  options,
  value,
  onChange,
  placeholder = "Select an option",
  disabled = false,
  onAddNew,
  className = ""
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter options based on search term
  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle selecting an option
  const handleSelect = (option: string) => {
    onChange(option);
    setIsOpen(false);
    setSearchTerm("");
  };

  // Handle adding a new option
  const handleAddNew = () => {
    if (searchTerm.trim() && onAddNew) {
      onAddNew(searchTerm.trim());
      handleSelect(searchTerm.trim());
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (filteredOptions.length > 0) {
        handleSelect(filteredOptions[0]);
      } else if (searchTerm.trim() && onAddNew) {
        handleAddNew();
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
      )}
      
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`w-full px-4 py-2 text-left bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0B74B0] focus:border-[#0B74B0] ${
            disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
          }`}
        >
          <span className={value ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400"}>
            {value || placeholder}
          </span>
          <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <svg
              className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </span>
        </button>

        {isOpen && (
          <div className="absolute z-10 mt-1 w-full rounded-md bg-white dark:bg-gray-800 shadow-lg">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search or type to add new..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-t-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0B74B0] focus:border-[#0B74B0]"
                autoFocus
              />
            </div>
            
            <ul className="max-h-60 overflow-auto py-1 text-base ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
              {filteredOptions.map((option) => (
                <li
                  key={option}
                  onClick={() => handleSelect(option)}
                  className={`cursor-pointer select-none relative py-2 pl-4 pr-9 hover:bg-[#0B74B0]/10 dark:hover:bg-[#75479C]/20 ${
                    value === option ? "bg-[#0B74B0]/10 dark:bg-[#75479C]/20" : ""
                  }`}
                >
                  <span className={`block truncate ${value === option ? "font-semibold" : "font-normal"}`}>
                    {option}
                  </span>
                  {value === option && (
                    <span className="text-[#0B74B0] dark:text-[#75479C] absolute inset-y-0 right-0 flex items-center pr-4">
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </span>
                  )}
                </li>
              ))}
              
              {searchTerm && !filteredOptions.includes(searchTerm.trim()) && onAddNew && (
                <li
                  onClick={handleAddNew}
                  className="cursor-pointer select-none relative py-2 pl-4 pr-9 text-[#0B74B0] dark:text-[#75479C] hover:bg-[#0B74B0]/10 dark:hover:bg-[#75479C]/20"
                >
                  <span className="block truncate font-semibold">
                    Add "{searchTerm}"
                  </span>
                </li>
              )}
              
              {filteredOptions.length === 0 && (!searchTerm || !onAddNew) && (
                <li className="cursor-default select-none relative py-2 pl-4 pr-9 text-gray-500 dark:text-gray-400">
                  <span className="block truncate">No options found</span>
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}