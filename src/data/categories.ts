import { supabase } from "@/integrations/supabase/client";

export const loadCategories = async () => {

  const { data, error } = await supabase
    .from('categories')
    .select('id, name, created_at, updated_at')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data || [];

}