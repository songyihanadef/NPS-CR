import { createClient } from '@supabase/supabase-js';
import type { NPSItem } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase 환경변수가 설정되지 않았습니다. .env 파일을 확인해주세요.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function fetchItems(category?: string, search?: string): Promise<NPSItem[]> {
  let query = supabase.from('NPS').select('*').order('created_at', { ascending: false });

  if (category) query = query.eq('category', category);
  if (search) {
    query = query.or(
      `title.ilike.%${search}%,description.ilike.%${search}%,content.ilike.%${search}%`
    );
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data as NPSItem[]) ?? [];
}

export async function createItem(
  item: Omit<NPSItem, 'id' | 'created_at' | 'updated_at'>
): Promise<NPSItem> {
  const { data, error } = await supabase
    .from('NPS')
    .insert([item])
    .select()
    .single();
  if (error) throw error;
  return data as NPSItem;
}

export async function updateItem(
  id: number,
  item: Partial<Omit<NPSItem, 'id' | 'created_at'>>
): Promise<NPSItem> {
  const { data, error } = await supabase
    .from('NPS')
    .update({ ...item, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as NPSItem;
}

export async function deleteItem(id: number): Promise<void> {
  const { error } = await supabase.from('NPS').delete().eq('id', id);
  if (error) throw error;
}
