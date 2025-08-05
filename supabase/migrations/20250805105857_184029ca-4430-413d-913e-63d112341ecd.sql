-- Corrigir funções para usar search_path seguro
CREATE OR REPLACE FUNCTION public.notify_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Verificar se o status realmente mudou
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Inserir notificação
    INSERT INTO public.notifications (user_id, title, body, type, data)
    VALUES (
      NEW.user_id,
      'Status do Pedido Atualizado',
      CASE NEW.status
        WHEN 'confirmed' THEN 'Seu pedido foi confirmado!'
        WHEN 'preparing' THEN 'Seu pedido está sendo preparado.'
        WHEN 'shipped' THEN 'Seu pedido foi enviado!'
        WHEN 'delivered' THEN 'Seu pedido foi entregue.'
        WHEN 'cancelled' THEN 'Seu pedido foi cancelado.'
        ELSE 'Status do seu pedido foi atualizado.'
      END,
      'order_update',
      jsonb_build_object(
        'order_id', NEW.id,
        'old_status', OLD.status,
        'new_status', NEW.status,
        'total_amount', NEW.total_amount
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '';