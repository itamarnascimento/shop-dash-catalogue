-- Adicionar coluna sizes à tabela products para armazenar os tamanhos disponíveis
ALTER TABLE public.products 
ADD COLUMN sizes jsonb DEFAULT '[]'::jsonb;

-- Adicionar coluna selected_size à tabela cart_items para armazenar o tamanho selecionado
ALTER TABLE public.cart_items 
ADD COLUMN selected_size text;

-- Adicionar coluna selected_size à tabela order_items para histórico de pedidos
ALTER TABLE public.order_items 
ADD COLUMN selected_size text;

-- Adicionar coluna desired_delivery_date à tabela orders para a data desejada
ALTER TABLE public.orders 
ADD COLUMN desired_delivery_date date;