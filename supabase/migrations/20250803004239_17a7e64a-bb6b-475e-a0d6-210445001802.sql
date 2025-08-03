-- Create carousel_images table
CREATE TABLE public.carousel_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL,
  alt_text TEXT NOT NULL,
  title TEXT,
  order_position INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.carousel_images ENABLE ROW LEVEL SECURITY;

-- Create policies for carousel images
CREATE POLICY "Carousel images are public for reading" 
ON public.carousel_images 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage carousel images" 
ON public.carousel_images 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_carousel_images_updated_at
BEFORE UPDATE ON public.carousel_images
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default carousel images
INSERT INTO public.carousel_images (url, alt_text, title, order_position) VALUES 
('https://images.unsplash.com/photo-1649972904349-6e44c42644a7?auto=format&fit=crop&w=800&q=80', 'Mulher usando laptop - tecnologia no dia a dia', 'Tecnologia no Dia a Dia', 1),
('https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=800&q=80', 'Laptop moderno - produtividade e inovação', 'Produtividade e Inovação', 2),
('https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?auto=format&fit=crop&w=800&q=80', 'Código colorido - desenvolvimento e tecnologia', 'Desenvolvimento e Tecnologia', 3);