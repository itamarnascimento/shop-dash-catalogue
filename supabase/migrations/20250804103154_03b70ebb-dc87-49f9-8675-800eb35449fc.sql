-- Criar tabela de cupons
CREATE TABLE public.coupons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC NOT NULL CHECK (discount_value > 0),
  minimum_order_value NUMERIC DEFAULT 0,
  max_uses INTEGER,
  current_uses INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Políticas para cupons
CREATE POLICY "Cupons ativos são públicos para leitura" 
ON public.coupons 
FOR SELECT 
USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

CREATE POLICY "Admins podem gerenciar cupons" 
ON public.coupons 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_coupons_updated_at
BEFORE UPDATE ON public.coupons
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir alguns cupons de exemplo
INSERT INTO public.coupons (code, description, discount_type, discount_value, minimum_order_value, max_uses) VALUES
('WELCOME10', 'Desconto de boas-vindas', 'percentage', 10, 50, 100),
('SAVE20', 'Desconto de R$ 20', 'fixed', 20, 100, 50),
('FREESHIP', 'Frete grátis', 'percentage', 100, 0, NULL);