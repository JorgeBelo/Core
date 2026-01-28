import { useState, useRef, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Notification } from '../../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '../../contexts/AuthContext';
import {
  loadNotifications,
  markNotificationAsRead,
  checkAndCreateNotifications,
} from '../../services/notificationsService';

export const NotificationsDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (user?.id) {
      loadNotificationsData();
      // Verificar e criar notificações automáticas a cada minuto
      const interval = setInterval(() => {
        checkAndCreateNotifications(user.id).then(() => {
          loadNotificationsData();
        });
      }, 60000); // 1 minuto

      return () => clearInterval(interval);
    }
  }, [user]);

  const loadNotificationsData = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      // Verificar e criar notificações automáticas
      await checkAndCreateNotifications(user.id);
      // Carregar notificações
      const data = await loadNotifications(user.id);
      setNotifications(data);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (id: string) => {
    await markNotificationAsRead(id);
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'atraso':
        return 'border-primary bg-primary/10';
      case 'vencimento':
        return 'border-yellow-500 bg-yellow-500/10';
      case 'aniversario':
        return 'border-green-500 bg-green-500/10';
      default:
        return 'border-gray-dark bg-dark-soft';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-light hover:text-white transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute left-0 bottom-full mb-2 w-80 bg-dark-soft border border-gray-dark rounded-lg shadow-lg z-50 max-h-96 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-dark">
            <h3 className="text-lg font-sans font-semibold text-white">Notificações</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-light hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="overflow-y-auto scrollbar-dark flex-1">
            {loading ? (
              <div className="p-4 text-center text-gray-light">
                Carregando...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-light">
                Nenhuma notificação
              </div>
            ) : (
              <div className="divide-y divide-gray-dark">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-dark transition-colors cursor-pointer border-l-4 ${
                      !notification.read ? getNotificationColor(notification.type) : 'border-transparent'
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-white font-medium text-sm">{notification.title}</p>
                        <p className="text-gray-light text-xs mt-1">{notification.message}</p>
                        <p className="text-gray-light text-xs mt-2">
                          {format(new Date(notification.created_at), "d 'de' MMM 'às' HH:mm", {
                            locale: ptBR,
                          })}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-primary rounded-full mt-1 flex-shrink-0"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-dark">
              <button
                onClick={() => {
                  navigate('/notificacoes');
                  setIsOpen(false);
                }}
                className="text-primary text-sm hover:text-primary-light transition-colors w-full text-center"
              >
                Ver todas as notificações
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
