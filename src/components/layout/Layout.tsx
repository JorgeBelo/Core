import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { MobileSidebar } from './MobileSidebar';
import { MobileNavigation } from './MobileNavigation';
import { useUserProfile } from '../../hooks/useUserProfile';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userProfile, loading } = useUserProfile();

  // Primeiro acesso: perfil incompleto (Nome vazio ou padrão) → redireciona para Perfil
  useEffect(() => {
    if (loading || location.pathname === '/perfil') return;
    const name = userProfile?.name?.trim();
    const incomplete = !name || name === 'Personal Trainer';
    if (incomplete) navigate('/perfil', { replace: true });
  }, [loading, location.pathname, userProfile?.name, navigate]);

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
