import React from 'react';
import { Bell, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export const PushNotificationButton: React.FC = () => {
  const { isSupported, isSubscribed, loading, subscribe, unsubscribe } = usePushNotifications();

  if (!isSupported) {
    return null;
  }

  return (
    <Button
      variant={isSubscribed ? "secondary" : "default"}
      size="sm"
      onClick={isSubscribed ? unsubscribe : subscribe}
      disabled={loading}
      className="flex items-center gap-2"
    >
      {isSubscribed ? (
        <>
          <BellOff className="w-4 h-4" />
          {loading ? 'Desativando...' : 'Desativar Notificações'}
        </>
      ) : (
        <>
          <Bell className="w-4 h-4" />
          {loading ? 'Ativando...' : 'Ativar Notificações'}
        </>
      )}
    </Button>
  );
};