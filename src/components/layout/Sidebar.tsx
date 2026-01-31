import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  DollarSign, 
  History,
  AlertCircle,
  Bell,
  User as UserIcon,
  ChevronDown
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { Logo } from '../common/Logo';
import { NotificationsDropdown } from '../common/NotificationsDropdown';
import { ProfileDropdown } from '../common/ProfileDropdown';

type MenuItem = {
  path: string;
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  children?: { path: string; label: string }[];
};

const menuItems: MenuItem[] = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/alunos', icon: Users, label: 'Alunos' },
  { path: '/historico-entrada', icon: History, label: 'Histórico de Entrada' },
  { path: '/pagamentos-pendentes', icon: AlertCircle, label: 'Pagamentos Pendentes' },
  { path: '/agenda', icon: Calendar, label: 'Agenda Semanal' },
  { path: '/financeiro', icon: DollarSign, label: 'Financeiro' },
  { path: '/notificacoes', icon: Bell, label: 'Notificações' },
  { path: '/perfil', icon: UserIcon, label: 'Perfil' },
];

export const Sidebar = () => {
  const location = useLocation();

  return (
    <aside className="hidden lg:flex w-64 bg-dark-soft border-r border-gray-dark h-screen fixed left-0 top-0 flex-col">
      <div className="px-6 py-6 mb-4 flex justify-center border-b border-gray-dark">
        <Logo variant="full" size="small" />
      </div>
      
      <nav className="flex-1 px-4 overflow-y-auto scrollbar-dark">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isParentActive = location.pathname === item.path || (item.children?.some((c) => location.pathname === c.path));
            
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive && !item.children
                        ? 'bg-primary text-white' 
                        : isParentActive && item.children
                        ? 'bg-dark text-white'
                        : 'text-gray-light hover:bg-dark hover:text-white'
                    }`
                  }
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.label}</span>
                  {item.children && <ChevronDown size={16} className="ml-auto opacity-70" />}
                </NavLink>
                {item.children?.map((child) => (
                  <NavLink
                    key={child.path}
                    to={child.path}
                    className={({ isActive }) =>
                      `flex items-center gap-3 pl-10 pr-4 py-2.5 rounded-lg transition-colors text-sm ${
                        isActive ? 'bg-primary text-white' : 'text-gray-light hover:bg-dark hover:text-white'
                      }`
                    }
                  >
                    {child.label}
                  </NavLink>
                ))}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Rodapé da sidebar */}
      <div className="p-4 border-t border-gray-dark space-y-3">
        <NotificationsDropdown />
        <ProfileDropdown />
      </div>
    </aside>
  );
};
