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

export const PostCard: React.FC<PostCardProps> = ({ item, onEdit, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

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
    <div className={`post-card ${expanded ? 'expanded' : ''}`}>
      <div className="post-card-top" onClick={() => setExpanded((v) => !v)}>
        <div className="post-card-info">
          <h3 className="post-title">{item.title}</h3>
          {item.description && <p className="post-desc">{item.description}</p>}
          <div className="post-meta">
            {item.author && <span>{item.author}</span>}
            <span>{formatDate(item.created_at)}</span>
          </div>
        </div>
        <span className={`expand-icon ${expanded ? 'open' : ''}`}>›</span>
      </div>

      {expanded && (
        <div className="post-card-body">
          {item.content && (
            <div className="post-content">
              {item.content.split('\n').map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          )}
          {item.link && (
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="post-link"
              onClick={(e) => e.stopPropagation()}
            >
              🔗 관련 링크 바로가기
            </a>
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
  );
};
