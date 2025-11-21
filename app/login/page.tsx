"use client";

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Dynamically import the LoginPage component with ssr disabled
const LoginPage = dynamic(() => import('@/app/components/LoginPage'), {
  ssr: false,
  loading: () => <div className="min-h-screen flex items-center justify-center">Loading...</div>
});

export default function Login() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginPage />
    </Suspense>
  );
}