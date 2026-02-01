import { NavLink } from 'react-router-dom';
import { Users, Calendar, DollarSign, Bell, User as UserIcon } from 'lucide-react';

const menuItems = [
  { path: '/alunos', icon: Users, label: 'Alunos' },
  { path: '/financeiro', icon: DollarSign, label: 'Financeiro' },
  { path: '/agenda', icon: Calendar, label: 'Agenda' },
  { path: '/notificacoes', icon: Bell, label: 'Notificações' },
  { path: '/perfil', icon: UserIcon, label: 'Perfil' },
];

export const MobileNavigation = () => {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-dark-soft border-t border-gray-dark z-50">
      <div className="grid grid-cols-5 h-16">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 transition-colors ${
                  isActive 
                    ? 'text-primary' 
                    : 'text-gray-light'
                }`
              }
            >
              <Icon size={20} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
