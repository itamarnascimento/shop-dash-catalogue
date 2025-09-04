-- Atualizar a constraint única da tabela cart_items para incluir selected_size
-- Primeiro remover a constraint existente
ALTER TABLE public.cart_items DROP CONSTRAINT IF EXISTS cart_items_user_id_product_id_key;

-- Criar nova constraint composta incluindo selected_size
ALTER TABLE public.cart_items ADD CONSTRAINT cart_items_user_id_product_id_size_key 
UNIQUE (user_id, product_id, selected_size);