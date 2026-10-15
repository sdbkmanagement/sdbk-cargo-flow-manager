import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type AppelRegistre = Database['public']['Tables']['registre_appels']['Row'];
export type AppelRegistreInsert = Database['public']['Tables']['registre_appels']['Insert'];
export type AppelRegistreUpdate = Database['public']['Tables']['registre_appels']['Update'];

export const appelsService = {
  async getAll(): Promise<AppelRegistre[]> {
    const pageSize = 1000;
    const all: AppelRegistre[] = [];
    let from = 0;
    while (true) {
      const { data, error } = await supabase
        .from('registre_appels')
        .select('*')
        .order('date_appel', { ascending: false })
        .order('created_at', { ascending: false })
        .range(from, from + pageSize - 1);
      if (error) throw error;
      if (!data || data.length === 0) break;
      all.push(...data);
      if (data.length < pageSize) break;
      from += pageSize;
    }
    return all;
  },

  async create(payload: AppelRegistreInsert): Promise<AppelRegistre> {
    const { data, error } = await supabase
      .from('registre_appels')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, payload: AppelRegistreUpdate): Promise<AppelRegistre> {
    const { data, error } = await supabase
      .from('registre_appels')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('registre_appels').delete().eq('id', id);
    if (error) throw error;
  },
};
