import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationPayload {
  user_id?: string;
  title: string;
  body: string;
  type?: string;
  data?: any;
  send_to_all?: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const vapidPublicKey = 'BKWZrj4xyffEHfCr6_pC1vJT4xPKT5nXPB3-QqW_2--9T-1X-4eF-4eF-4eF-4eF-4eF-4eF-4eF-4eF-4eF-4eF';
    const vapidPrivateKey = 'example-private-key'; // Em produção, use uma chave real

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { user_id, title, body, type = 'general', data = {}, send_to_all = false }: NotificationPayload = await req.json();

    if (!title || !body) {
      return new Response(
        JSON.stringify({ error: 'Título e corpo são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar subscrições
    let subscriptionsQuery = supabase
      .from('push_subscriptions')
      .select('*')
      .eq('is_active', true);

    if (!send_to_all && user_id) {
      subscriptionsQuery = subscriptionsQuery.eq('user_id', user_id);
    }

    const { data: subscriptions, error: subscriptionsError } = await subscriptionsQuery;

    if (subscriptionsError) {
      throw subscriptionsError;
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('Nenhuma subscrição ativa encontrada');
      return new Response(
        JSON.stringify({ message: 'Nenhuma subscrição ativa encontrada' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Preparar payload da notificação
    const notificationPayload = {
      title,
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      data: {
        type,
        ...data,
        timestamp: new Date().toISOString(),
      },
      actions: type === 'order_update' ? [
        {
          action: 'view_order',
          title: 'Ver Pedido'
        }
      ] : [],
    };

    // Enviar notificações para cada subscrição
    const promises = subscriptions.map(async (subscription) => {
      try {
        // Aqui você usaria uma biblioteca real de web push como 'web-push'
        // Por simplicidade, vou simular o envio
        console.log(`Enviando notificação para: ${subscription.endpoint}`);
        
        // Em produção, você usaria:
        // const result = await webpush.sendNotification(
        //   {
        //     endpoint: subscription.endpoint,
        //     keys: {
        //       p256dh: subscription.p256dh,
        //       auth: subscription.auth,
        //     }
        //   },
        //   JSON.stringify(notificationPayload),
        //   {
        //     vapidDetails: {
        //       subject: 'mailto:your-email@example.com',
        //       publicKey: vapidPublicKey,
        //       privateKey: vapidPrivateKey,
        //     }
        //   }
        // );

        // Por enquanto, apenas logamos
        console.log('Notificação simulada enviada com sucesso');
        
        return { success: true, subscription_id: subscription.id };
      } catch (error) {
        console.error(`Erro ao enviar para ${subscription.endpoint}:`, error);
        
        // Se o endpoint não é mais válido, marcar como inativo
        if (error.statusCode === 410) {
          await supabase
            .from('push_subscriptions')
            .update({ is_active: false })
            .eq('id', subscription.id);
        }
        
        return { success: false, subscription_id: subscription.id, error: error.message };
      }
    });

    const results = await Promise.all(promises);
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    // Salvar notificação no histórico se for para usuário específico
    if (user_id && !send_to_all) {
      await supabase
        .from('notifications')
        .insert({
          user_id,
          title,
          body,
          type,
          data,
          sent_at: new Date().toISOString(),
        });
    }

    return new Response(
      JSON.stringify({
        message: 'Notificações processadas',
        successful,
        failed,
        details: results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro na função send-push-notification:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});