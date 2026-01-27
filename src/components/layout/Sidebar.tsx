import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  DollarSign, 
  Clock,
  Bell,
  User as UserIcon
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { Logo } from '../common/Logo';
import { NotificationsDropdown } from '../common/NotificationsDropdown';

const menuItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/alunos', icon: Users, label: 'Alunos' },
  { path: '/aulas', icon: Clock, label: 'Aulas' },
  { path: '/agenda', icon: Calendar, label: 'Agenda' },
  { path: '/financeiro', icon: DollarSign, label: 'Financeiro' },
  { path: '/notificacoes', icon: Bell, label: 'Notificações' },
  { path: '/perfil', icon: UserIcon, label: 'Perfil' },
];

export const Sidebar = () => {
  return (
    <aside className="w-64 bg-dark-soft border-r border-gray-dark h-screen fixed left-0 top-0 flex flex-col">
      <div className="px-6 py-6 mb-4 flex justify-center border-b border-gray-dark">
        <Logo variant="full" size="small" />
      </div>
      
      <nav className="flex-1 px-4 overflow-y-auto scrollbar-dark">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive 
                        ? 'bg-primary text-white' 
                        : 'text-gray-light hover:bg-dark hover:text-white'
                    }`
                  }
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Notificações no rodapé da sidebar */}
      <div className="p-4 border-t border-gray-dark">
        <NotificationsDropdown />
      </div>
    </aside>
  );
};
