export type Category =
  | '제작 시 참고사항'
  | '피그마 꿀팁'
  | '플러그인 - CR팀 내부개발'
  | '플러그인 - 커뮤니티';

export const CATEGORIES: Category[] = [
  '제작 시 참고사항',
  '피그마 꿀팁',
  '플러그인 - CR팀 내부개발',
  '플러그인 - 커뮤니티',
];

export const CATEGORY_META: Record<Category, { description: string; icon: string; color: string }> = {
  '제작 시 참고사항': {
    description: '광고주 선호/비선호 기준, 소재 제작 시 유의사항',
    icon: '📋',
    color: '#4F7FFA',
  },
  '피그마 꿀팁': {
    description: '반복 작업, 텍스트 변경, 내보내기 등 피그마 실무 팁',
    icon: '✏️',
    color: '#F59E0B',
  },
  '플러그인 - CR팀 내부개발': {
    description: 'CR팀에서 직접 개발한 네플스 업무용 플러그인',
    icon: '🔧',
    color: '#10B981',
  },
  '플러그인 - 커뮤니티': {
    description: '피그마 커뮤니티에서 받을 수 있는 추천 플러그인',
    icon: '🌐',
    color: '#8B5CF6',
  },
};

export interface NPSItem {
  id: number;
  category: Category;
  title: string;
  description: string | null;
  content: string | null;
  link: string | null;
  author: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface NPSFormData {
  category: Category;
  title: string;
  description: string;
  content: string;
  link: string;
  author: string;
}
