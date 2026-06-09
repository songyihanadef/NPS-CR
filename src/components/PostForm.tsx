import React, { useState, useEffect } from 'react';
import { CATEGORIES, type Category, type NPSItem, type NPSFormData } from '../types';

interface PostFormProps {
  initialData?: NPSItem;
  defaultCategory?: Category;
  onSubmit: (data: NPSFormData) => Promise<void>;
  onCancel: () => void;
}

const emptyForm: NPSFormData = {
  category: '제작 시 참고사항',
  title: '',
  description: '',
  content: '',
  link: '',
  author: '',
};

export const PostForm: React.FC<PostFormProps> = ({
  initialData,
  defaultCategory,
  onSubmit,
  onCancel,
}) => {
  const [form, setForm] = useState<NPSFormData>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setForm({
        category: initialData.category,
        title: initialData.title,
        description: initialData.description ?? '',
        content: initialData.content ?? '',
        link: initialData.link ?? '',
        author: initialData.author ?? '',
      });
    } else if (defaultCategory) {
      setForm((f) => ({ ...f, category: defaultCategory }));
    }
  }, [initialData, defaultCategory]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('제목을 입력해주세요.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await onSubmit(form);
    } catch {
      setError('저장 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{initialData ? '글 수정' : '새 글 등록'}</h2>
          <button className="btn-icon" onClick={onCancel} aria-label="닫기">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="post-form">
          <label className="field">
            <span>카테고리</span>
            <select name="category" value={form.category} onChange={handleChange}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>제목 <em>*</em></span>
            <input
              name="title"
              type="text"
              value={form.title}
              onChange={handleChange}
              placeholder="글 제목을 입력하세요"
            />
          </label>
          <label className="field">
            <span>한 줄 설명</span>
            <input
              name="description"
              type="text"
              value={form.description}
              onChange={handleChange}
              placeholder="짧은 설명 (목록에서 미리보기로 노출됩니다)"
            />
          </label>
          <label className="field">
            <span>상세 내용</span>
            <textarea
              name="content"
              value={form.content}
              onChange={handleChange}
              placeholder="상세 내용을 입력하세요"
              rows={7}
            />
          </label>
          <label className="field">
            <span>관련 링크</span>
            <input
              name="link"
              type="url"
              value={form.link}
              onChange={handleChange}
              placeholder="https://..."
            />
          </label>
          <label className="field">
            <span>작성자</span>
            <input
              name="author"
              type="text"
              value={form.author}
              onChange={handleChange}
              placeholder="이름 또는 닉네임"
            />
          </label>

          {error && <p className="form-error">{error}</p>}

          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={onCancel}>취소</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? '저장 중...' : initialData ? '수정 완료' : '등록하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
