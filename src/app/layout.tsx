'use client';

import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ClerkProvider signInFallbackRedirectUrl="/dashboard" signUpFallbackRedirectUrl="/dashboard">
          <QueryClientProvider client={queryClient}>
{children}
            <Toaster />
          </QueryClientProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}