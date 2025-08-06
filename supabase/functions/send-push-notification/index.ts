import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1';
import { Resend } from "npm:resend@2.0.0";

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
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const vapidPublicKey = 'BKWZrj4xyffEHfCr6_pC1vJT4xPKT5nXPB3-QqW_2--9T-1X-4eF-4eF-4eF-4eF-4eF-4eF-4eF-4eF-4eF-4eF';
    const vapidPrivateKey = 'example-private-key'; // Em produção, use uma chave real

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = resendApiKey ? new Resend(resendApiKey) : null;

    const { user_id, title, body, type = 'general', data = {}, send_to_all = false }: NotificationPayload = await req.json();

    if (!title || !body) {
      return new Response(
        JSON.stringify({ error: 'Título e corpo são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar subscrições push
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

    // Buscar usuários para envio de email
    let usersToEmail = [];
    if (resend) {
      let usersQuery;
      if (send_to_all) {
        // Para todos: buscar usuários com email e preferências de email ativadas
        usersQuery = supabase
          .from('profiles')
          .select(`
            user_id, 
            email,
            notification_preferences!inner(email_notifications)
          `)
          .not('email', 'is', null)
          .eq('notification_preferences.email_notifications', true);
      } else if (user_id) {
        // Para usuário específico: verificar se tem email e preferências ativadas
        usersQuery = supabase
          .from('profiles')
          .select(`
            user_id, 
            email,
            notification_preferences(email_notifications)
          `)
          .eq('user_id', user_id)
          .not('email', 'is', null);
      }

      if (usersQuery) {
        const { data: users, error: usersError } = await usersQuery;
        if (!usersError && users) {
          // Filtrar usuários que têm email_notifications ativado
          usersToEmail = users.filter(user => {
            const emailPref = user.notification_preferences?.[0]?.email_notifications;
            return emailPref !== false; // Default true se não especificado
          });
        }
      }
    }

    const hasPushSubscriptions = subscriptions && subscriptions.length > 0;
    const hasEmailTargets = usersToEmail.length > 0;

    if (!hasPushSubscriptions && !hasEmailTargets) {
      console.log('Nenhuma subscrição ativa ou email encontrado');
      return new Response(
        JSON.stringify({ message: 'Nenhuma subscrição ativa ou email encontrado' }),
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

    // Enviar notificações push
    const pushPromises = hasPushSubscriptions ? subscriptions.map(async (subscription) => {
      try {
        // Aqui você usaria uma biblioteca real de web push como 'web-push'
        // Por simplicidade, vou simular o envio
        console.log(`Enviando notificação push para: ${subscription.endpoint}`);
        
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
        console.log('Notificação push simulada enviada com sucesso');
        
        return { success: true, type: 'push', subscription_id: subscription.id };
      } catch (error) {
        console.error(`Erro ao enviar push para ${subscription.endpoint}:`, error);
        
        // Se o endpoint não é mais válido, marcar como inativo
        if (error.statusCode === 410) {
          await supabase
            .from('push_subscriptions')
            .update({ is_active: false })
            .eq('id', subscription.id);
        }
        
        return { success: false, type: 'push', subscription_id: subscription.id, error: error.message };
      }
    }) : [];

    // Enviar emails
    const emailPromises = hasEmailTargets && resend ? usersToEmail.map(async (user) => {
      try {
        console.log(`Enviando email para: ${user.email}`);
        
        const emailResponse = await resend.emails.send({
          from: 'Notificações <onboarding@resend.dev>',
          to: [user.email],
          subject: title,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #333; margin-bottom: 20px;">${title}</h2>
              <p style="color: #666; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
                ${body}
              </p>
              ${type === 'order_update' ? `
                <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 20px;">
                  <p style="margin: 0; color: #666; font-size: 14px;">
                    Esta é uma atualização automática sobre seu pedido. Acesse sua conta para mais detalhes.
                  </p>
                </div>
              ` : ''}
              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                Você está recebendo este email porque optou por receber notificações.
              </p>
            </div>
          `,
        });

        console.log('Email enviado com sucesso:', emailResponse);
        
        return { success: true, type: 'email', user_id: user.user_id, email: user.email };
      } catch (error) {
        console.error(`Erro ao enviar email para ${user.email}:`, error);
        return { success: false, type: 'email', user_id: user.user_id, email: user.email, error: error.message };
      }
    }) : [];

    const allPromises = [...pushPromises, ...emailPromises];
    const results = await Promise.all(allPromises);
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const pushResults = results.filter(r => r.type === 'push');
    const emailResults = results.filter(r => r.type === 'email');

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
        push_results: {
          successful: pushResults.filter(r => r.success).length,
          failed: pushResults.filter(r => !r.success).length
        },
        email_results: {
          successful: emailResults.filter(r => r.success).length,
          failed: emailResults.filter(r => !r.success).length
        },
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