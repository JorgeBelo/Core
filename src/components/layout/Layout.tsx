import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { MobileSidebar } from './MobileSidebar';
import { MobileNavigation } from './MobileNavigation';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-dark">
      {/* Desktop Sidebar */}
      <Sidebar />
      
      {/* Mobile Sidebar (Hamburger Menu) */}
      <MobileSidebar />
      
      {/* Main Content */}
      <main className="lg:ml-64 pb-20 lg:pb-6 pt-16 lg:pt-6 px-4 sm:px-6">
        {children}
      </main>
      
      {/* Mobile Bottom Navigation */}
      <MobileNavigation />
    </div>
  );
};
