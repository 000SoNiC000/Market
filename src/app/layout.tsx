import './globals.css';
import type { Metadata } from 'next';
import Providers from '@/components/Providers';
import 'react-toastify/dist/ReactToastify.css';

export const metadata: Metadata = {
  title: 'MAKEPAY - інтернет магазин',
  description: 'MAKEPAY - Магазин з товарами для дому, окулярами, інструментами та дитячими товарами',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="font-sans">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
} 