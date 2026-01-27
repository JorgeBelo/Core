import { Bell, User } from 'lucide-react';
import { Logo } from '../common/Logo';

export const Header = () => {
  return (
    <header className="bg-dark border-b border-gray-dark px-6 py-2 flex items-center justify-between fixed top-0 left-0 right-0 z-50 h-20">
      <div className="flex items-center gap-4">
        <Logo variant="full" size="small" />
      </div>
      
      <div className="flex items-center gap-4">
        <button className="relative p-2 text-gray-light hover:text-white transition-colors">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"></span>
        </button>
        
        <button className="flex items-center gap-2 text-gray-light hover:text-white transition-colors">
          <User size={20} />
          <span className="hidden md:block">Perfil</span>
        </button>
      </div>
    </header>
  );
};
