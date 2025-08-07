import React, { useState, useEffect } from 'react';
import { Bell, Save, Smartphone, Mail } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PushNotificationButton } from '@/components/PushNotificationButton';
import { useAuth } from '@/context/AuthContext';
import CartDrawer from '@/components/CartDrawer';
import Header from '@/components/Header';

interface NotificationPreferences {
  order_updates: boolean;
  promotions: boolean;
  general: boolean;
  email_notifications: boolean;
}

const NotificationPreferences: React.FC = () => {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    order_updates: true,
    promotions: true,
    general: true,
    email_notifications: true,
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadPreferences();
    }
  }, [user]);

  const loadPreferences = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setPreferences({
          order_updates: data.order_updates,
          promotions: data.promotions,
          general: data.general,
          email_notifications: data.email_notifications ?? true,
        });
      }
    } catch (error) {
      console.error('Erro ao carregar preferências:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar suas preferências.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user.id,
          ...preferences,
        });

      if (error) throw error;

      toast({
        title: 'Preferências Salvas',
        description: 'Suas preferências de notificação foram atualizadas.',
      });
    } catch (error) {
      console.error('Erro ao salvar preferências:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar suas preferências.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = (key: keyof NotificationPreferences, value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const testNotification = async () => {
    try {
      const { error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          user_id: user?.id,
          title: 'Notificação de Teste',
          body: 'Esta é uma notificação de teste para verificar se tudo está funcionando!',
          type: 'general',
        },
      });

      if (error) throw error;

      toast({
        title: 'Teste Enviado',
        description: 'Uma notificação de teste foi enviada!',
      });
    } catch (error) {
      console.error('Erro ao enviar notificação de teste:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar a notificação de teste.',
        variant: 'destructive',
      });
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">
              Você precisa estar logado para gerenciar suas preferências de notificação.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header
        onCartClick={() => setIsCartOpen(true)}
      />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Preferências de Notificação</h1>
            <p className="text-muted-foreground mt-2">
              Configure como e quando você deseja receber notificações.
            </p>
          </div>

          {/* Push Notifications */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5" />
                <CardTitle>Push Notifications</CardTitle>
              </div>
              <CardDescription>
                Receba notificações diretamente no seu navegador, mesmo quando o site estiver fechado.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Ativar Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Permite que o site envie notificações para seu dispositivo.
                  </p>
                </div>
                <PushNotificationButton />
              </div>

              <Button
                variant="outline"
                onClick={testNotification}
                className="w-full"
              >
                Enviar Notificação de Teste
              </Button>
            </CardContent>
          </Card>

          {/* Email Notifications */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                <CardTitle>Notificações por Email</CardTitle>
              </div>
              <CardDescription>
                Receba notificações diretamente no seu email.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Ativar Notificações por Email</Label>
                  <p className="text-sm text-muted-foreground">
                    Permite que você receba notificações por email além das notificações push.
                  </p>
                </div>
                <Switch
                  checked={preferences.email_notifications}
                  onCheckedChange={(checked) => updatePreference('email_notifications', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Notification Types */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                <CardTitle>Tipos de Notificação</CardTitle>
              </div>
              <CardDescription>
                Escolha quais tipos de notificação você deseja receber.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-base font-medium">Atualizações de Pedidos</Label>
                      <p className="text-sm text-muted-foreground">
                        Notificações sobre mudanças no status dos seus pedidos.
                      </p>
                    </div>
                    <Switch
                      checked={preferences.order_updates}
                      onCheckedChange={(checked) => updatePreference('order_updates', checked)}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-base font-medium">Promoções e Ofertas</Label>
                      <p className="text-sm text-muted-foreground">
                        Notificações sobre cupons, descontos e ofertas especiais.
                      </p>
                    </div>
                    <Switch
                      checked={preferences.promotions}
                      onCheckedChange={(checked) => updatePreference('promotions', checked)}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-base font-medium">Notificações Gerais</Label>
                      <p className="text-sm text-muted-foreground">
                        Notificações sobre novidades e informações importantes.
                      </p>
                    </div>
                    <Switch
                      checked={preferences.general}
                      onCheckedChange={(checked) => updatePreference('general', checked)}
                    />
                  </div>

                  <div className="pt-4">
                    <Button
                      onClick={savePreferences}
                      disabled={saving}
                      className="w-full"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {saving ? 'Salvando...' : 'Salvar Preferências'}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Information */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground space-y-2">
                <p>
                  <strong>Sobre as notificações:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>As notificações push funcionam apenas em navegadores modernos que suportam Service Workers.</li>
                  <li>Você pode desativar as notificações a qualquer momento nas configurações do seu navegador.</li>
                  <li>As preferências são salvas automaticamente quando você faz alterações.</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />
    </div>
  );
};

export default NotificationPreferences;