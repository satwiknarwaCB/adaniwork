"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import MasterDataTable from '@/app/components/MasterDataTable';
import AnalyticsPage from '@/app/components/AnalyticsPage';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';

const ApplicationPage = () => {
  const [activePage, setActivePage] = useState('analytics');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useState('light');
  const [currentTime, setCurrentTime] = useState(new Date());
  const { user, logout } = useAuth();
  const router = useRouter();

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Theme management
  useEffect(() => {
    // Check system preference or saved theme
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme) {
      setTheme(savedTheme);
    } else if (systemPrefersDark) {
      setTheme('dark');
    }
    
    // Apply theme to document
    if (theme === 'dark' || (!savedTheme && systemPrefersDark)) {
      document.documentElement.classList.add('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleLogout = () => {
    logout();
    // Don't redirect to login page, just refresh the page to show logged out state
    window.location.reload();
  };

  // Format date and time
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Define sidebar items with icons
  const sidebarItems = [
    { 
      id: 'home', 
      name: 'Home', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
        </svg>
      ),
      href: '/'  // Add href for navigation to main page
    },
    { 
      id: 'analytics', 
      name: 'Analytics', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1v-12a1 1 0 011-1h2z" />
        </svg>
      )
    },
    { 
      id: 'master-data', 
      name: 'Master Data', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H9a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
        </svg>
      )
    },
  ];

  // Define page content based on active page
  const renderPageContent = () => {
    switch (activePage) {
      case 'home':
        return (
          <div>
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Dashboard</h2>
            <p className="text-gray-600 dark:text-gray-300">Welcome to your dashboard. Here you can view key metrics and insights.</p>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-[#171717] p-4 rounded-lg shadow">
                <h3 className="font-semibold text-gray-900 dark:text-white">Total Capacity</h3>
                <p className="text-2xl font-bold text-[#0B74B0]">1,250 MW</p>
              </div>
              <div className="bg-white dark:bg-[#171717] p-4 rounded-lg shadow">
                <h3 className="font-semibold text-gray-900 dark:text-white">Active Projects</h3>
                <p className="text-2xl font-bold text-[#75479C]">24</p>
              </div>
              <div className="bg-white dark:bg-[#171717] p-4 rounded-lg shadow">
                <h3 className="font-semibold text-gray-900 dark:text-white">Efficiency</h3>
                <p className="text-2xl font-bold text-[#BD3861]">94%</p>
              </div>
            </div>
          </div>
        );
      case 'analytics':
        return <AnalyticsPage />;
      case 'master-data':
        return (
          <div>
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Master Data</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">View and Edit Master Data.</p>
            <MasterDataTable />
          </div>
        );
      default:
        return <AnalyticsPage />;
    }
  };

  return (
    <div className="h-screen bg-gray-50 dark:bg-[#171717] flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-[#171717] shadow-md p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="flex items-center">
          <div className="flex items-center">
            <img 
              src="/adani-re.png" 
              alt="Adani Logo" 
              className="h-16 ml-4 object-contain"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-sm font-medium text-gray-900 dark:text-white">{formatDate(currentTime)}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{formatTime(currentTime)}</div>
          </div>
          
          {user && (
            <button
              onClick={handleLogout}
              className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
              aria-label="Logout"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
              </svg>
            </button>
          )}
          
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM4 11a1 1 0 100-2H3a1 1 0 000 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707a1 1 0 011.414 0zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className={`${sidebarCollapsed ? 'w-20' : 'w-64'} bg-white dark:border-r dark:bg-[#171717] shadow-md flex flex-col`}>
          <div className="p-4 flex flex-col h-full">
            <nav className="flex-1">
              <ul className="space-y-2">
                {sidebarItems.map((item) => (
                  <li key={item.id}>
                    {item.href ? (
                      // Use Link for navigation to main page
                      <Link 
                        href={item.href}
                        className={`w-full text-left px-4 py-3 rounded-lg flex items-center ${
                          activePage === item.id
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium'
                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        <span className="flex items-center justify-center">
                          {item.icon}
                        </span>
                        {!sidebarCollapsed && (
                          <span className="ml-3">{item.name}</span>
                        )}
                      </Link>
                    ) : (
                      // Use button for internal page changes
                      <button
                        onClick={() => setActivePage(item.id)}
                        className={`w-full text-left px-4 py-3 rounded-lg flex items-center ${
                          activePage === item.id
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium'
                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        <span className="flex items-center justify-center">
                          {item.icon}
                        </span>
                        {!sidebarCollapsed && (
                          <span className="ml-3">{item.name}</span>
                        )}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          </div>
          
          {/* Collapse/Expand button at the bottom */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <button 
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="w-full text-left text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg p-2 flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                {sidebarCollapsed ? (
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                ) : (
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                )}
              </svg>
              {!sidebarCollapsed && (
                <span className="ml-3">{sidebarCollapsed ? 'Expand' : 'Collapse'}</span>
              )}
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-8">
            {renderPageContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationPage;