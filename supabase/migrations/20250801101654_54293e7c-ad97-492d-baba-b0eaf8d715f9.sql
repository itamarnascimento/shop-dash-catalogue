-- Allow users to update their own orders status
CREATE POLICY "Usuários podem atualizar status dos próprios pedidos" 
ON public.orders 
FOR UPDATE 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);