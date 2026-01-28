import { Bell, Check } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import type { Notification } from '../../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  loadNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  checkAndCreateNotifications,
} from '../../services/notificationsService';

const getNotificationColor = (type: string) => {
  switch (type) {
    case 'atraso':
      return 'border-l-primary bg-primary/10';
    case 'vencimento':
      return 'border-l-yellow-500 bg-yellow-500/10';
    case 'aniversario':
      return 'border-l-green-500 bg-green-500/10';
    default:
      return 'border-l-gray-dark bg-dark-soft';
  }
};

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'atraso':
      return '🔴';
    case 'vencimento':
      return '⚠️';
    case 'aniversario':
      return '🎉';
    case 'aula':
      return '📅';
    default:
      return 'ℹ️';
  }
};

export const Notificacoes = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadNotificationsData();
      // Verificar e criar notificações automáticas ao carregar
      checkAndCreateNotifications(user.id).then(() => {
        loadNotificationsData();
      });
    }
  }, [user]);

  const loadNotificationsData = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const data = await loadNotifications(user.id);
      setNotifications(data);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    await markNotificationAsRead(id);
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = async () => {
    if (!user?.id) return;
    await markAllNotificationsAsRead(user.id);
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-sans font-semibold text-white mb-2">Notificações</h1>
          <p className="text-gray-light">
            {unreadCount > 0
              ? `${unreadCount} notificação${unreadCount !== 1 ? 'ões' : ''} não lida${unreadCount !== 1 ? 's' : ''}`
              : 'Todas as notificações foram lidas'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="secondary"
            onClick={markAllAsRead}
            className="flex items-center gap-2"
          >
            <Check size={20} />
            Marcar todas como lidas
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {loading ? (
          <Card>
            <div className="text-center py-12">
              <p className="text-gray-light">Carregando notificações...</p>
            </div>
          </Card>
        ) : notifications.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <Bell size={48} className="mx-auto text-gray-light mb-4" />
              <p className="text-gray-light">Nenhuma notificação</p>
            </div>
          </Card>
        ) : (
          notifications.map((notification) => (
            <Card
              key={notification.id}
              className={`border-l-4 transition-all ${
                !notification.read ? getNotificationColor(notification.type) : 'border-l-gray-dark'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="text-2xl">{getNotificationIcon(notification.type)}</div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-sans font-semibold text-white mb-1">
                        {notification.title}
                      </h3>
                      <p className="text-gray-light mb-2">{notification.message}</p>
                      <p className="text-gray-light text-sm">
                        {format(new Date(notification.created_at), "d 'de' MMMM 'de' yyyy 'às' HH:mm", {
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                    {!notification.read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="text-primary hover:text-primary-light transition-colors flex items-center gap-2 text-sm"
                      >
                        <Check size={16} />
                        Marcar como lida
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
