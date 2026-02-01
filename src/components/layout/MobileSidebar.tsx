import { useState } from 'react';
import { X, Menu } from 'lucide-react';
import { Users, Calendar, DollarSign, User as UserIcon } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { Logo } from '../common/Logo';
import { ProfileDropdown } from '../common/ProfileDropdown';

type MenuItem = {
  path: string;
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  children?: { path: string; label: string }[];
};

const menuItems: MenuItem[] = [
  { path: '/alunos', icon: Users, label: 'Alunos' },
  { path: '/financeiro', icon: DollarSign, label: 'Financeiro' },
  { path: '/agenda', icon: Calendar, label: 'Agenda Semanal' },
  { path: '/perfil', icon: UserIcon, label: 'Perfil' },
];

export const MobileSidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  // Fechar drawer quando navegar
  const handleNavClick = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-dark-soft border border-gray-dark rounded-lg p-3 text-white hover:bg-dark transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
        aria-label="Abrir menu"
      >
        <Menu size={24} />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer */}
      <aside
        className={`lg:hidden fixed top-0 left-0 h-full w-64 bg-dark-soft border-r border-gray-dark z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="px-6 py-6 mb-4 flex items-center justify-between border-b border-gray-dark">
            <Logo variant="full" size="small" />
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-light hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Fechar menu"
            >
              <X size={24} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 overflow-y-auto scrollbar-dark">
            <ul className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                const hasChildActive = item.children?.some((c) => location.pathname === c.path);
                
                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      onClick={handleNavClick}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors min-h-[44px] ${
                        isActive && !item.children
                          ? 'bg-primary text-white' 
                          : hasChildActive ? 'bg-dark text-white' : 'text-gray-light hover:bg-dark hover:text-white'
                      }`}
                    >
                      <Icon size={20} />
                      <span className="font-medium">{item.label}</span>
                    </NavLink>
                    {item.children?.map((child) => (
                      <NavLink
                        key={child.path}
                        to={child.path}
                        onClick={handleNavClick}
                        className={`flex items-center gap-3 pl-10 pr-4 py-2.5 rounded-lg transition-colors text-sm min-h-[44px] ${
                          location.pathname === child.path ? 'bg-primary text-white' : 'text-gray-light hover:bg-dark hover:text-white'
                        }`}
                      >
                        {child.label}
                      </NavLink>
                    ))}
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-dark space-y-3">
            <ProfileDropdown />
          </div>
        </div>
      </aside>
    </>
  );
};
