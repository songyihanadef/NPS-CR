import React, { useState } from 'react';
import type { NPSItem } from '../types';

interface PostCardProps {
  item: NPSItem;
  onEdit: (item: NPSItem) => void;
  onDelete: (id: number) => void;
}

function formatDate(str: string) {
  const d = new Date(str);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

function isHttpUrl(value: string) {
  return /^https?:\/\//i.test(value.trim());
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

function contentToHtml(content: string) {
  if (hasHtmlTag(content)) return content;
  return escapeHtml(content).replace(/\n/g, '<br>');
}

export const PostCard: React.FC<PostCardProps> = ({ item, onEdit, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);

  const images = item.image_urls?.filter(Boolean) ?? [];
  const isPinned = item.is_pinned === true;
  const content = item.content ?? '';
  const contentHasInlineImage = /<img[^>]+src=/i.test(content);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirmDelete) {
      onDelete(item.id);
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  return (
    <>
      <div className={`post-card ${expanded ? 'expanded' : ''} ${isPinned ? 'pinned' : ''}`}>
        <div className="post-card-top" onClick={() => setExpanded((v) => !v)}>
          <div className="post-card-info">
            <div className="post-title-row">
              {isPinned && <span className="pin-badge">고정</span>}
              <h3 className="post-title">{item.title}</h3>
            </div>
            {item.description && <p className="post-desc">{item.description}</p>}
            <div className="post-meta">
              {item.author && <span>{item.author}</span>}
              <span>{formatDate(item.created_at)}</span>
              {images.length > 0 && (
                <span className="meta-image-badge">🖼 {images.length}</span>
              )}
            </div>
          </div>
          <span className={`expand-icon ${expanded ? 'open' : ''}`}>›</span>
        </div>

        {expanded && (
          <div className="post-card-body">
            {content && (
              <div
                className="post-content rich-content"
                dangerouslySetInnerHTML={{ __html: contentToHtml(content) }}
              />
            )}

            {images.length > 0 && !contentHasInlineImage && (
              <div className="post-images">
                {images.map((url, idx) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="post-image-wrap"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setLightbox(url);
                    }}
                    title={`이미지 ${idx + 1} — 클릭해서 원본 열기`}
                  >
                    <img src={url} alt={`첨부 이미지 ${idx + 1}`} loading="lazy" />
                  </a>
                ))}
              </div>
            )}

            {item.link && (
              isHttpUrl(item.link) ? (
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="post-link"
                  onClick={(e) => e.stopPropagation()}
                >
                  🔗 관련 링크 바로가기
                </a>
              ) : (
                <div className="post-link-text" onClick={(e) => e.stopPropagation()}>
                  <span className="post-link-label">관련 링크</span>
                  <span>{item.link}</span>
                </div>
              )
            )}

            <div className="post-card-actions">
              <button
                className="btn btn-sm btn-ghost"
                onClick={(e) => { e.stopPropagation(); onEdit(item); }}
              >
                수정
              </button>
              <button
                className={`btn btn-sm ${confirmDelete ? 'btn-danger' : 'btn-ghost-danger'}`}
                onClick={handleDelete}
              >
                {confirmDelete ? '정말 삭제할까요?' : '삭제'}
              </button>
            </div>
          </div>
        )}
      </div>

      {lightbox && (
        <div className="lightbox-overlay" onClick={() => setLightbox(null)}>
          <button className="lightbox-close" onClick={() => setLightbox(null)} aria-label="닫기">✕</button>
          <img
            src={lightbox} alt="원본 이미지" className="lightbox-img"
            onClick={(e) => e.stopPropagation()}
          />
          <a
            href={lightbox} target="_blank" rel="noopener noreferrer"
            className="lightbox-open-btn" onClick={(e) => e.stopPropagation()}
          >
            새 탭에서 열기 ↗
          </a>
        </div>
      )}
    </>
  );
};
