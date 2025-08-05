import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PushSubscriptionData {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export const usePushNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Verificar se push notifications são suportadas
    const supported = 'serviceWorker' in navigator && 'PushManager' in window;
    setIsSupported(supported);

    if (supported) {
      registerServiceWorker();
      checkSubscriptionStatus();
    }
  }, []);

  const registerServiceWorker = async () => {
    try {
      await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered successfully');
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  };

  const checkSubscriptionStatus = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error('Error checking subscription status:', error);
    }
  };

  const urlB64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const subscribe = async () => {
    if (!isSupported) {
      toast({
        title: 'Não Suportado',
        description: 'Seu navegador não suporta push notifications.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Solicitar permissão
      const permission = await Notification.requestPermission();
      
      if (permission !== 'granted') {
        toast({
          title: 'Permissão Negada',
          description: 'É necessário permitir notificações para receber atualizações.',
          variant: 'destructive',
        });
        return;
      }

      // Obter subscription
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlB64ToUint8Array(
          'BKWZrj4xyffEHfCr6_pC1vJT4xPKT5nXPB3-QqW_2--9T-1X-4eF-4eF-4eF-4eF-4eF-4eF-4eF-4eF-4eF-4eF'
        )
      });

      // Salvar subscription no banco de dados
      const subscriptionData: PushSubscriptionData = {
        endpoint: subscription.endpoint,
        p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))),
        auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!))),
      };

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Verificar se já existe uma subscription para este usuário
      const { data: existing } = await supabase
        .from('push_subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .eq('endpoint', subscriptionData.endpoint)
        .maybeSingle();

      if (!existing) {
        const { error } = await supabase
          .from('push_subscriptions')
          .insert({
            user_id: user.id,
            ...subscriptionData,
            user_agent: navigator.userAgent,
          });

        if (error) throw error;
      }

      setIsSubscribed(true);
      toast({
        title: 'Notificações Ativadas',
        description: 'Você receberá notificações sobre seus pedidos e promoções!',
      });

    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível ativar as notificações. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const unsubscribe = async () => {
    setLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();

        // Remover do banco de dados
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('user_id', user.id)
            .eq('endpoint', subscription.endpoint);
        }
      }

      setIsSubscribed(false);
      toast({
        title: 'Notificações Desativadas',
        description: 'Você não receberá mais notificações push.',
      });

    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível desativar as notificações.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    isSupported,
    isSubscribed,
    loading,
    subscribe,
    unsubscribe,
  };
};