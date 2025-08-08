import { supabase } from '@/integrations/supabase/client';

export const loadProducts = async () => {
  const { data, error } = await supabase
    .from('products')
    .select('*, categories(name)')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};
