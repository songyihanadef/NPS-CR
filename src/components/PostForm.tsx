import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  CATEGORIES, type Category, type NPSItem, type NPSFormData, type PendingImageUpload,
} from '../types';

interface PostFormProps {
  initialData?: NPSItem;
  defaultCategory?: Category;
  onSubmit: (data: NPSFormData, pendingImages: PendingImageUpload[]) => Promise<void>;
  onCancel: () => void;
}

const emptyForm: NPSFormData = {
  category: '제작 시 참고사항',
  title: '',
  description: '',
  content: '',
  link: '',
  author: '',
  image_urls: [],
  is_pinned: false,
};

function isAllowedImage(file: File) {
  return ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function hasHtmlTag(value: string) {
  return /<[^>]+>/.test(value);
}

function plainTextToHtml(value: string) {
  return escapeHtml(value).replace(/\n/g, '<br>');
}

function contentHasImageUrl(content: string, url: string) {
  return content.includes(url);
}

function buildInitialContent(item?: NPSItem) {
  if (!item) return '';
  let content = item.content ?? '';
  if (content && !hasHtmlTag(content)) content = plainTextToHtml(content);

  const imageUrls = item.image_urls ?? [];
  const missingImages = imageUrls.filter((url) => !contentHasImageUrl(content, url));
  if (missingImages.length > 0) {
    const imageHtml = missingImages
      .map((url) => `<p><img src="${url}" alt="첨부 이미지" class="content-inline-image"></p>`)
      .join('');
    content = `${content}${content ? '<br>' : ''}${imageHtml}`;
  }
  return content;
}

function insertHtmlAtCursor(html: string) {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return false;
  const range = selection.getRangeAt(0);
  range.deleteContents();

  const template = document.createElement('template');
  template.innerHTML = html;
  const fragment = template.content;
  const lastNode = fragment.lastChild;
  range.insertNode(fragment);

  if (lastNode) {
    const newRange = document.createRange();
    newRange.setStartAfter(lastNode);
    newRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(newRange);
  }
  return true;
}

export const PostForm: React.FC<PostFormProps> = ({
  initialData,
  defaultCategory,
  onSubmit,
  onCancel,
}) => {
  const [form, setForm] = useState<NPSFormData>(emptyForm);
  const [pendingImages, setPendingImages] = useState<PendingImageUpload[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editorFocus, setEditorFocus] = useState(false);
  const [editorFlash, setEditorFlash] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initialContent = buildInitialContent(initialData);
    if (initialData) {
      setForm({
        category: initialData.category,
        title: initialData.title,
        description: initialData.description ?? '',
        content: initialContent,
        link: initialData.link ?? '',
        author: initialData.author ?? '',
        image_urls: initialData.image_urls ?? [],
        is_pinned: initialData.is_pinned ?? false,
      });
    } else {
      setForm({
        ...emptyForm,
        category: defaultCategory ?? emptyForm.category,
      });
    }
  }, [initialData, defaultCategory]);

  useEffect(() => () => {
    pendingImages.forEach((item) => URL.revokeObjectURL(item.localUrl));
  }, [pendingImages]);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== form.content) {
      editorRef.current.innerHTML = form.content;
    }
  }, [form.content]);

  const updateContentFromEditor = useCallback(() => {
    const html = editorRef.current?.innerHTML ?? '';
    setForm((prev) => ({ ...prev, content: html }));
  }, []);

  const focusEditor = () => {
    editorRef.current?.focus();
  };

  const addImageFiles = useCallback((files: File[]) => {
    const imageFiles = files.filter(isAllowedImage);
    if (!imageFiles.length) {
      setError('jpg, jpeg, png, webp 이미지 파일만 추가할 수 있습니다.');
      return;
    }

    setError('');
    focusEditor();

    const newPending: PendingImageUpload[] = [];
    imageFiles.forEach((file) => {
      const localUrl = URL.createObjectURL(file);
      newPending.push({ file, localUrl });
      const imgHtml = `<p><img src="${localUrl}" alt="첨부 이미지" class="content-inline-image"></p><p><br></p>`;
      const inserted = insertHtmlAtCursor(imgHtml);
      if (!inserted && editorRef.current) {
        editorRef.current.insertAdjacentHTML('beforeend', imgHtml);
      }
    });

    setPendingImages((prev) => [...prev, ...newPending]);
    updateContentFromEditor();
    setEditorFlash(true);
    setTimeout(() => setEditorFlash(false), 600);
  }, [updateContentFromEditor]);

  const handleEditorPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const files = Array.from(e.clipboardData.items)
      .filter((item) => item.type.startsWith('image/'))
      .map((item) => item.getAsFile())
      .filter(Boolean) as File[];
    if (!files.length) return;
    e.preventDefault();
    addImageFiles(files);
  };

  const handleEditorDrop = (e: React.DragEvent<HTMLDivElement>) => {
    const files = Array.from(e.dataTransfer.files ?? []);
    if (!files.length) return;
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    addImageFiles(files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
  };

  const runFormat = (command: string, value?: string) => {
    focusEditor();
    document.execCommand(command, false, value);
    updateContentFromEditor();
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    updateContentFromEditor();
    const currentContent = editorRef.current?.innerHTML ?? form.content;
    if (!form.title.trim()) { setError('제목을 입력해주세요.'); return; }

    setLoading(true);
    setError('');
    try {
      const activePendingImages = pendingImages.filter((item) => currentContent.includes(item.localUrl));
      const existingImageUrls = Array.from(currentContent.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi))
        .map((match) => match[1])
        .filter((url) => /^https?:\/\//i.test(url));

      await onSubmit({ ...form, content: currentContent, image_urls: existingImageUrls }, activePendingImages);
      activePendingImages.forEach((item) => URL.revokeObjectURL(item.localUrl));
    } catch {
      setError('저장 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const newFilesCount = pendingImages.filter((item) => form.content.includes(item.localUrl)).length;

  return (
    <div className="modal-overlay">
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{initialData ? '글 수정' : '새 글 등록'}</h2>
          <button className="btn-icon" onClick={onCancel} aria-label="닫기">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="post-form">
          <label className="field">
            <span>카테고리</span>
            <select name="category" value={form.category} onChange={handleChange}>
              {CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
          </label>

          <label className="field">
            <span>제목 <em>*</em></span>
            <input
              name="title" type="text" value={form.title} onChange={handleChange}
              placeholder="글 제목을 입력하세요"
            />
          </label>

          <label className="field">
            <span>한 줄 설명</span>
            <input
              name="description" type="text" value={form.description} onChange={handleChange}
              placeholder="짧은 설명 (목록에서 미리보기로 노출됩니다)"
            />
          </label>

          <div className="field">
            <span>상세 내용</span>
            <div className="editor-toolbar" onMouseDown={(e) => e.preventDefault()}>
              <button type="button" onClick={() => runFormat('bold')}>B</button>
              <button type="button" className="toolbar-red" onClick={() => runFormat('foreColor', '#EF4444')}>빨강</button>
              <button type="button" className="toolbar-blue" onClick={() => runFormat('foreColor', '#2563EB')}>파랑</button>
              <button type="button" className="toolbar-highlight" onClick={() => runFormat('backColor', '#FEF08A')}>형광펜</button>
              <button type="button" onClick={() => runFormat('removeFormat')}>효과 지우기</button>
            </div>
            <div
              ref={editorRef}
              className={`rich-editor ${editorFocus ? 'focused' : ''} ${editorFlash ? 'flash' : ''} ${dragOver ? 'drag-over' : ''}`}
              contentEditable
              suppressContentEditableWarning
              role="textbox"
              aria-label="상세 내용 입력"
              data-placeholder="상세 내용을 입력하세요. 이미지도 원하는 위치에 Ctrl+V 또는 드래그앤드롭으로 넣을 수 있습니다."
              onInput={updateContentFromEditor}
              onFocus={() => setEditorFocus(true)}
              onBlur={() => { setEditorFocus(false); updateContentFromEditor(); }}
              onPaste={handleEditorPaste}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleEditorDrop}
            />
            <p className="editor-help">글을 쓰는 중 원하는 위치에 이미지를 Ctrl+V로 붙여넣거나 드래그해서 넣을 수 있습니다.</p>
            {newFilesCount > 0 && (
              <p className="paste-count">새 이미지 {newFilesCount}장이 추가되었습니다 (저장 시 업로드됩니다)</p>
            )}
          </div>

          <label className="field">
            <span>관련 링크</span>
            <input
              name="link" type="text" value={form.link} onChange={handleChange}
              placeholder="관련 링크, Figma 경로, 메모 등을 입력하세요"
            />
          </label>

          <label className="field">
            <span>작성자</span>
            <input
              name="author" type="text" value={form.author} onChange={handleChange}
              placeholder="이름 또는 닉네임"
            />
          </label>

          <label className="field-checkbox">
            <input
              type="checkbox"
              name="is_pinned"
              checked={form.is_pinned}
              onChange={handleCheckbox}
              className="checkbox-input"
            />
            <span className="checkbox-label">
              <span className="pin-icon-sm">📌</span>
              이 글을 최상단에 고정
            </span>
          </label>

          {error && <p className="form-error">{error}</p>}

          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={onCancel}>취소</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading
                ? (newFilesCount > 0 ? '이미지 업로드 중...' : '저장 중...')
                : initialData ? '수정 완료' : '등록하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
