// Production-only configuration for AGEL CEO Tracker
// Frontend: https://agelceotracker.adani.com
// Backend API: https://agelceotracker.adani.com/api

// For client-side requests, use relative path
// For server-side requests, use absolute URL
export const API_BASE_URL = typeof window === 'undefined'
  ? process.env.INTERNAL_API_URL || 'http://localhost:8005'  // Server-side
  : '/api';  // Client-side