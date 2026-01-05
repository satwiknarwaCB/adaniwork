"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import CommissioningStatusPage from '@/app/components/CommissioningStatusPage';
import CommissioningDashboard from '@/app/components/CommissioningDashboard';
import ChatbotPanel from '@/app/components/ChatbotPanel';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';

const ApplicationPage = () => {
  const [activePage, setActivePage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
    // Redirect to home page (login)
    window.location.href = '/';
  };

  // Format date and time
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
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
      href: '/'
    },
    {
      id: 'dashboard',
      name: 'Dashboard',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
        </svg>
      ),
      href: undefined
    },
    {
      id: 'commissioning',
      name: 'Commissioning Status',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      ),
      href: undefined
    },
  ];

  // Define page content based on active page
  const renderPageContent = () => {
    if (activePage === 'dashboard') {
      return <CommissioningDashboard />;
    }
    return <CommissioningStatusPage />;
  };

  return (
    <div className="h-screen bg-gray-50 dark:bg-[#171717] flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-white dark:bg-[#171717] shadow-sm p-2 sm:p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="flex items-center gap-2">
          {/* Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <img
            src="/adani-re.png"
            alt="Adani Logo"
            className="h-8 sm:h-12 lg:h-14 ml-1 sm:ml-4 object-contain"
          />
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {/* Date/Time - hidden on very small screens */}
          <div className="hidden sm:block text-right">
            <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white" suppressHydrationWarning>{formatDate(currentTime)}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400" suppressHydrationWarning>{formatTime(currentTime)}</div>
          </div>

          {user ? (
            <button
              onClick={handleLogout}
              className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
              aria-label="Logout"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
              </svg>
            </button>
          ) : (
            <button
              onClick={() => router.push('/login?redirect=/application')}
              className="px-3 py-1.5 sm:px-4 sm:py-2 bg-[#0B74B0] text-white rounded-lg hover:bg-[#095a87] font-medium text-xs sm:text-sm"
            >
              Login
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
                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div className={`
          fixed lg:static inset-y-0 left-0 z-50
          ${sidebarCollapsed ? 'w-20 lg:w-20' : 'w-64'} bg-white dark:bg-[#171717] shadow-lg lg:shadow-md
          transform transition-all duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col border-r border-gray-200 dark:border-gray-700
        `}>
          {/* Mobile close button */}
          <div className="lg:hidden flex justify-end p-2">
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-4 flex flex-col flex-1">
            <nav className="flex-1">
              <ul className="space-y-1">
                {sidebarItems.map((item) => (
                  <li key={item.id}>
                    {item.href ? (
                      // Use Link for navigation to main page
                      <Link
                        href={item.href}
                        className={`w-full text-left px-4 py-3 rounded-lg flex items-center ${activePage === item.id
                          ? 'bg-[#0B74B0]/10 text-[#0B74B0] dark:text-[#4DA8D8] font-medium'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                          }`}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <span className="flex items-center justify-center group-hover:scale-110 transition-transform">
                          {item.icon}
                        </span>
                        {!sidebarCollapsed && (
                          <span className="ml-3 transition-opacity duration-200">{item.name}</span>
                        )}
                      </Link>
                    ) : (
                      // Use button for internal page changes
                      <button
                        onClick={() => {
                          setActivePage(item.id);
                          setSidebarOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 rounded-lg flex items-center ${activePage === item.id
                          ? 'bg-[#0B74B0]/10 text-[#0B74B0] dark:text-[#4DA8D8] font-medium'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                          }`}
                      >
                        <span className="flex items-center justify-center group-hover:scale-110 transition-transform">
                          {item.icon}
                        </span>
                        {!sidebarCollapsed && (
                          <span className="ml-3 transition-opacity duration-200">{item.name}</span>
                        )}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </nav>

            {/* Collapse Toggle Button (Desktop) */}
            <div className="hidden lg:flex border-t border-gray-200 dark:border-gray-700 pt-4 mt-auto">
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="w-full flex items-center justify-center p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              >
                {sidebarCollapsed ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                ) : (
                  <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                    </svg>
                    <span className="text-sm font-medium">Collapse Sidebar</span>
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="p-3 sm:p-4 lg:p-6">
            {renderPageContent()}
          </div>
        </div>
      </div>
      <ChatbotPanel />
    </div>
  );
};

export default ApplicationPage;