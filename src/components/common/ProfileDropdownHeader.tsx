import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Settings, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useUserProfile } from '../../hooks/useUserProfile';

export const ProfileDropdownHeader = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { logout } = useAuth();
  const { userProfile } = useUserProfile();
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-dark-soft transition-colors text-gray-light hover:text-white"
      >
        {userProfile?.avatar_url ? (
          <img
            src={userProfile.avatar_url}
            alt={userProfile.name || 'Avatar'}
            className="w-10 h-10 rounded-full object-cover border-2 border-gray-dark"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-dark-soft flex items-center justify-center border-2 border-gray-dark">
            <span className="text-white font-semibold text-sm">
              {(userProfile?.name || 'P')[0].toUpperCase()}
            </span>
          </div>
        )}
        <div className="hidden md:block text-left">
          <p className="text-sm font-medium text-white">{userProfile?.name || 'Personal Trainer'}</p>
          <p className="text-xs text-gray-light">{userProfile?.email || 'email@example.com'}</p>
        </div>
        <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-56 bg-dark-soft border border-gray-dark rounded-lg shadow-lg z-50 overflow-hidden">
          <div className="p-2">
            <button
              onClick={() => {
                navigate('/perfil');
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-dark transition-colors text-gray-light hover:text-white text-left"
            >
              <User size={18} />
              <span>Meu Perfil</span>
            </button>
            <button
              onClick={() => {
                navigate('/perfil');
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-dark transition-colors text-gray-light hover:text-white text-left"
            >
              <Settings size={18} />
              <span>Configurações</span>
            </button>
            <div className="border-t border-gray-dark my-1"></div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-primary/20 transition-colors text-primary hover:text-primary-light text-left"
            >
              <LogOut size={18} />
              <span>Sair</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
