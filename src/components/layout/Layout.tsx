import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-dark">
      <Sidebar />
      <main className="ml-64 p-6">
        {children}
      </main>
    </div>
  );
};
