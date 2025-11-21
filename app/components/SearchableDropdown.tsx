import { useState, useRef, useEffect, KeyboardEvent } from 'react';

interface SearchableDropdownProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  onAddNew: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function SearchableDropdown({
  options,
  value,
  onChange,
  onAddNew,
  placeholder = "Select or type...",
  className = ""
}: SearchableDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value);
  const [filteredOptions, setFilteredOptions] = useState<string[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update filtered options when searchTerm or options change
  useEffect(() => {
    const filtered = options.filter(option => 
      option.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // If searchTerm doesn't match any existing options and is not empty, show "Add" option
    if (searchTerm && !options.includes(searchTerm)) {
      setFilteredOptions([searchTerm, ...filtered]);
    } else {
      setFilteredOptions(filtered);
    }
    
    setHighlightedIndex(-1);
  }, [searchTerm, options]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    setIsOpen(true);
  };

  // Handle option selection
  const handleSelect = (option: string) => {
    // If the selected option is the search term and it's not in the existing options, add it
    if (option === searchTerm && !options.includes(option)) {
      onAddNew(option);
    }
    
    onChange(option);
    setSearchTerm(option);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown') {
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0) {
          handleSelect(filteredOptions[highlightedIndex]);
        } else if (searchTerm) {
          handleSelect(searchTerm);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  // Focus input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${className}`}
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 shadow-lg rounded-md overflow-hidden">
          <ul className="max-h-60 overflow-auto">
            {filteredOptions.length === 0 ? (
              <li className="px-4 py-2 text-gray-500 dark:text-gray-400">No options found</li>
            ) : (
              filteredOptions.map((option, index) => {
                const isAddOption = option === searchTerm && !options.includes(option);
                const isHighlighted = index === highlightedIndex;
                
                return (
                  <li
                    key={index}
                    onClick={() => handleSelect(option)}
                    className={`px-4 py-2 cursor-pointer transition-colors ${
                      isHighlighted 
                        ? 'bg-blue-100 dark:bg-gray-700' 
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    } ${
                      value === option 
                        ? 'bg-blue-50 dark:bg-gray-700 font-medium' 
                        : ''
                    }`}
                  >
                    {isAddOption ? (
                      <div className="flex items-center">
                        <span className="text-green-600 dark:text-green-400 font-medium">+ Add "{option}"</span>
                      </div>
                    ) : (
                      <span>{option}</span>
                    )}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}