'use client';

import { ReactNode } from 'react';
import { CartProvider } from '@/hooks/useCart';
import { ToastContainer } from 'react-toastify';

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <CartProvider>
      {children}
      <ToastContainer position="bottom-right" />
    </CartProvider>
  );
} 