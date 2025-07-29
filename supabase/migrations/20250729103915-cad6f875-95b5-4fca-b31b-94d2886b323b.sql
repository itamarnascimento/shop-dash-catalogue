-- Allow users to update their own orders status from 'shipped' to 'delivered'
CREATE POLICY "Usuários podem marcar pedidos como entregue" 
ON public.orders 
FOR UPDATE 
USING (
  auth.uid() = user_id 
  AND status = 'shipped'
) 
WITH CHECK (
  auth.uid() = user_id 
  AND status = 'delivered'
  AND OLD.status = 'shipped'
);