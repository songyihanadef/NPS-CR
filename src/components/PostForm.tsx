import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CATEGORIES, type Category, type NPSItem, type NPSFormData } from '../types';

interface PostFormProps {
  initialData?: NPSItem;
  defaultCategory?: Category;
  onSubmit: (data: NPSFormData, newImageFiles: File[]) => Promise<void>;
  onCancel: () => void;
}

/** 클립보드 또는 File에서 미리보기 objectURL을 생성 */
interface PreviewImage {
  /** 고유 key (objectURL 또는 기존 URL) */
  key: string;
  /** img src에 사용할 URL */
  src: string;
  /** 새로 붙여넣은 파일 (기존 이미지면 undefined) */
  file?: File;
  /** 기존 저장된 URL (기존 이미지면 있음) */
  savedUrl?: string;
}

const emptyForm: NPSFormData = {
  category: '제작 시 참고사항',
  title: '',
  description: '',
  content: '',
  link: '',
  author: '',
  image_urls: [],
};

export const PostForm: React.FC<PostFormProps> = ({
  initialData,
  defaultCategory,
  onSubmit,
  onCancel,
}) => {
  const [form, setForm] = useState<NPSFormData>(emptyForm);
  const [previews, setPreviews] = useState<PreviewImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pasteFocus, setPasteFocus] = useState(false);
  const [pasteFlash, setPasteFlash] = useState(false);

  const pasteZoneRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── 초기값 세팅 ─────────────────────────────────────────
  useEffect(() => {
    if (initialData) {
      setForm({
        category: initialData.category,
        title: initialData.title,
        description: initialData.description ?? '',
        content: initialData.content ?? '',
        link: initialData.link ?? '',
        author: initialData.author ?? '',
        image_urls: initialData.image_urls ?? [],
      });
      // 기존 이미지를 미리보기로 변환
      const existing: PreviewImage[] = (initialData.image_urls ?? []).map((url) => ({
        key: url,
        src: url,
        savedUrl: url,
      }));
      setPreviews(existing);
    } else if (defaultCategory) {
      setForm((f) => ({ ...f, category: defaultCategory }));
    }
    return () => {
      // 언마운트 시 objectURL 해제
      setPreviews((prev) => {
        prev.forEach((p) => { if (p.file) URL.revokeObjectURL(p.src); });
        return [];
      });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 이미지 추가 헬퍼 ────────────────────────────────────
  const addImageFiles = useCallback((files: File[]) => {
    const imageFiles = files.filter((f) => f.type.startsWith('image/'));
    if (!imageFiles.length) return;

    const newPreviews: PreviewImage[] = imageFiles.map((file) => {
      const src = URL.createObjectURL(file);
      return { key: src, src, file };
    });

    setPreviews((prev) => [...prev, ...newPreviews]);

    // 플래시 효과
    setPasteFlash(true);
    setTimeout(() => setPasteFlash(false), 600);
  }, []);

  // ── 전역 paste 이벤트 (모달 열린 동안 항상 감지) ────────
  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      const items = Array.from(e.clipboardData?.items ?? []);
      const imageItems = items.filter((it) => it.type.startsWith('image/'));
      if (!imageItems.length) return;
      e.preventDefault();
      const files = imageItems.map((it) => it.getAsFile()).filter(Boolean) as File[];
      addImageFiles(files);
    };

    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, [addImageFiles]);

  // ── 파일 선택 (보조) ────────────────────────────────────
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    addImageFiles(files);
    e.target.value = '';
  };

  // ── 이미지 삭제 ─────────────────────────────────────────
  const removeImage = (key: string) => {
    setPreviews((prev) => {
      const target = prev.find((p) => p.key === key);
      if (target?.file) URL.revokeObjectURL(target.src);
      return prev.filter((p) => p.key !== key);
    });
  };

  // ── 폼 필드 변경 ────────────────────────────────────────
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  // ── 저장 ────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { setError('제목을 입력해주세요.'); return; }

    setLoading(true);
    setError('');

    try {
      // 유지할 기존 이미지 URL
      const keptUrls = previews.filter((p) => p.savedUrl).map((p) => p.savedUrl as string);
      // 새로 붙여넣은 File 목록
      const newFiles = previews.filter((p) => p.file).map((p) => p.file as File);

      await onSubmit({ ...form, image_urls: keptUrls }, newFiles);
    } catch {
      setError('저장 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const newFilesCount = previews.filter((p) => p.file).length;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{initialData ? '글 수정' : '새 글 등록'}</h2>
          <button className="btn-icon" onClick={onCancel} aria-label="닫기">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="post-form">
          {/* 카테고리 */}
          <label className="field">
            <span>카테고리</span>
            <select name="category" value={form.category} onChange={handleChange}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>

          {/* 제목 */}
          <label className="field">
            <span>제목 <em>*</em></span>
            <input
              name="title" type="text" value={form.title} onChange={handleChange}
              placeholder="글 제목을 입력하세요"
            />
          </label>

          {/* 한 줄 설명 */}
          <label className="field">
            <span>한 줄 설명</span>
            <input
              name="description" type="text" value={form.description} onChange={handleChange}
              placeholder="짧은 설명 (목록에서 미리보기로 노출됩니다)"
            />
          </label>

          {/* 상세 내용 */}
          <label className="field">
            <span>상세 내용</span>
            <textarea
              name="content" value={form.content} onChange={handleChange}
              placeholder="상세 내용을 입력하세요" rows={6}
            />
          </label>

          {/* ── 이미지 붙여넣기 영역 ───────────────────── */}
          <div className="field">
            <span>이미지</span>

            {/* 붙여넣기 존 */}
            <div
              ref={pasteZoneRef}
              className={`paste-zone ${pasteFocus ? 'focused' : ''} ${pasteFlash ? 'flash' : ''}`}
              tabIndex={0}
              onFocus={() => setPasteFocus(true)}
              onBlur={() => setPasteFocus(false)}
              aria-label="이미지 붙여넣기 영역"
            >
              {previews.length === 0 ? (
                <div className="paste-zone-empty">
                  <span className="paste-icon">📋</span>
                  <p>캡처 이미지는 이 영역에 <strong>Ctrl+V</strong>로 붙여넣을 수 있습니다.</p>
                  <p className="paste-hint">폼이 열려 있는 동안 어디서든 Ctrl+V가 동작합니다</p>
                </div>
              ) : (
                <div className="paste-preview-grid">
                  {previews.map((p) => (
                    <div key={p.key} className="paste-preview-item">
                      <img src={p.src} alt="미리보기" />
                      {p.file && <span className="preview-badge new">NEW</span>}
                      <button
                        type="button"
                        className="preview-remove"
                        onClick={() => removeImage(p.key)}
                        aria-label="이미지 삭제"
                      >✕</button>
                    </div>
                  ))}
                  {/* 빈 슬롯 – 클릭해서 파일 추가 */}
                  <div
                    className="paste-preview-add"
                    onClick={() => fileInputRef.current?.click()}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
                    aria-label="이미지 추가"
                  >
                    <span>+</span>
                  </div>
                </div>
              )}
            </div>

            {/* 보조 파일 선택 */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: 'none' }}
              onChange={handleFileInput}
            />
            {newFilesCount > 0 && (
              <p className="paste-count">
                새 이미지 {newFilesCount}장이 추가되었습니다 (저장 시 업로드됩니다)
              </p>
            )}
          </div>

          {/* 링크 */}
          <label className="field">
            <span>관련 링크</span>
            <input
              name="link" type="url" value={form.link} onChange={handleChange}
              placeholder="https://..."
            />
          </label>

          {/* 작성자 */}
          <label className="field">
            <span>작성자</span>
            <input
              name="author" type="text" value={form.author} onChange={handleChange}
              placeholder="이름 또는 닉네임"
            />
          </label>

          {error && <p className="form-error">{error}</p>}

          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={onCancel}>취소</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading
                ? (newFilesCount > 0 ? `이미지 업로드 중...` : '저장 중...')
                : initialData ? '수정 완료' : '등록하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
