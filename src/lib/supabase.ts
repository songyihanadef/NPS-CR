import { createClient } from '@supabase/supabase-js';
import type { NPSItem } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase 환경변수가 설정되지 않았습니다. .env 파일을 확인해주세요.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ─── 데이터 조회 ──────────────────────────────────────────────────────────────
// 정렬: is_pinned(true 우선) → created_at(최신순)
// Supabase JS v2는 다중 컬럼 정렬을 체이닝으로 지원합니다.
export async function fetchItems(category?: string, search?: string): Promise<NPSItem[]> {
  let query = supabase
    .from('NPS')
    .select('*')
    .order('is_pinned', { ascending: false })   // true(1) → false(0)
    .order('created_at', { ascending: false });  // 최신순

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

// ─── 이미지 업로드 ────────────────────────────────────────────────────────────
const BUCKET = 'nps-images';

function getImageExtension(file: File) {
  if (file.type === 'image/jpeg') return 'jpg';
  if (file.type === 'image/png') return 'png';
  if (file.type === 'image/webp') return 'webp';
  return 'png';
}

export async function uploadPastedImages(files: File[]): Promise<string[]> {
  const urls: string[] = [];

  for (const file of files) {
    const randomSuffix = Math.random().toString(36).slice(2, 8);
    const extension = getImageExtension(file);
    const fileName = `post-images/${Date.now()}-${randomSuffix}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(fileName, file, { contentType: file.type || 'image/png', upsert: false });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
    urls.push(data.publicUrl);
  }

  return urls;
}

// ─── 데이터 생성 ──────────────────────────────────────────────────────────────
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

// ─── 데이터 수정 ──────────────────────────────────────────────────────────────
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

// ─── 데이터 삭제 ──────────────────────────────────────────────────────────────
export async function deleteItem(id: number): Promise<void> {
  const { error } = await supabase.from('NPS').delete().eq('id', id);
  if (error) throw error;
}
