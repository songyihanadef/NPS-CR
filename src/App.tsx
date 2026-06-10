import React, { useState, useEffect, useCallback } from 'react';
import {
  fetchItems, createItem, updateItem, deleteItem, uploadPastedImages,
} from './lib/supabase';
import {
  CATEGORIES, CATEGORY_META, type Category, type NPSItem, type NPSFormData, type PendingImageUpload,
} from './types';
import { PostCard } from './components/PostCard';
import { PostForm } from './components/PostForm';
import { SearchBar } from './components/SearchBar';
import './app.css';

type View = 'home' | 'category' | 'search';

function replaceAllLiteral(source: string, search: string, replacement: string) {
  return source.split(search).join(replacement);
}

function extractImageUrlsFromHtml(html: string) {
  const matches = Array.from(html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi));
  return matches
    .map((match) => match[1])
    .filter((url) => /^https?:\/\//i.test(url));
}

function App() {
  const [view, setView] = useState<View>('home');
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [items, setItems] = useState<NPSItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<NPSItem | null>(null);

  const loadItems = useCallback(async (category?: Category, query?: string) => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchItems(category, query);
      setItems(data);
    } catch {
      setError('데이터를 불러오지 못했습니다. Supabase 연결을 확인해주세요.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (view === 'category' && activeCategory) {
      loadItems(activeCategory, searchQuery || undefined);
    } else if (view === 'search' && searchQuery) {
      loadItems(undefined, searchQuery);
    }
  }, [view, activeCategory, searchQuery, loadItems]);

  const handleCategoryClick = (cat: Category) => {
    setActiveCategory(cat);
    setSearchQuery('');
    setView('category');
  };

  const handleHomeSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) setView('search');
    else setView('home');
  };

  const handleCategorySearch = (query: string) => setSearchQuery(query);

  const handleGoHome = () => {
    setView('home');
    setActiveCategory(null);
    setSearchQuery('');
    setItems([]);
  };

  const handleSubmit = async (data: NPSFormData, pendingImages: PendingImageUpload[]) => {
    let content = data.content;
    let uploadedUrls: string[] = [];

    if (pendingImages.length > 0) {
      uploadedUrls = await uploadPastedImages(pendingImages.map((item) => item.file));
      pendingImages.forEach((item, index) => {
        const uploadedUrl = uploadedUrls[index];
        if (uploadedUrl) content = replaceAllLiteral(content, item.localUrl, uploadedUrl);
      });
    }

    const inlineImageUrls = extractImageUrlsFromHtml(content);
    const finalImageUrls = Array.from(new Set([...data.image_urls, ...uploadedUrls, ...inlineImageUrls]));
    const payload = { ...data, content, image_urls: finalImageUrls };

    if (editingItem) {
      await updateItem(editingItem.id, payload);
    } else {
      await createItem(payload);
    }

    setShowForm(false);
    setEditingItem(null);

    if (view === 'category' && activeCategory) {
      loadItems(activeCategory, searchQuery || undefined);
    } else if (view === 'search') {
      loadItems(undefined, searchQuery);
    }
  };

  const handleEdit = (item: NPSItem) => { setEditingItem(item); setShowForm(true); };

  const handleDelete = async (id: number) => {
    try {
      await deleteItem(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch {
      setError('삭제 중 오류가 발생했습니다.');
    }
  };

  const handleNewPost = () => { setEditingItem(null); setShowForm(true); };

  return (
    <div className="app">
      {view === 'home' && (
        <main className="home">
          <div className="home-hero">
            <h1 className="home-title">무엇을 찾으세요?</h1>
            <p className="home-subtitle">
              네플스 소재 제작에 필요한 기준과 피그마 작업 팁,<br />
              플러그인 사용법을 카테고리별로 확인하세요.
            </p>
            <SearchBar placeholder="전체 가이드 검색..." onSearch={handleHomeSearch} size="large" />
          </div>

          <div className="category-grid">
            {CATEGORIES.map((cat) => {
              const meta = CATEGORY_META[cat];
              return (
                <button
                  key={cat}
                  className="category-card"
                  onClick={() => handleCategoryClick(cat)}
                  style={{ '--accent': meta.color } as React.CSSProperties}
                >
                  <span className="cat-icon">{meta.icon}</span>
                  <div className="cat-text">
                    <strong>{cat}</strong>
                    <span>{meta.description}</span>
                  </div>
                  <span className="cat-arrow">›</span>
                </button>
              );
            })}
          </div>
        </main>
      )}

      {view === 'category' && activeCategory && (
        <main className="detail-view">
          <div className="detail-header">
            <button className="btn btn-ghost back-btn" onClick={handleGoHome}>← 홈으로</button>
            <div className="detail-title-row">
              <span className="detail-icon">{CATEGORY_META[activeCategory].icon}</span>
              <div>
                <h1>{activeCategory}</h1>
                <p className="detail-subtitle">{CATEGORY_META[activeCategory].description}</p>
              </div>
            </div>
            <div className="detail-toolbar">
              <SearchBar
                placeholder={`"${activeCategory}" 내 검색...`}
                onSearch={handleCategorySearch}
              />
              <button className="btn btn-primary" onClick={handleNewPost}>+ 새 글 등록</button>
            </div>
          </div>

          <div className="post-list">
            {loading && <div className="state-msg">불러오는 중...</div>}
            {error && <div className="state-msg error">{error}</div>}
            {!loading && !error && items.length === 0 && (
              <div className="state-msg empty">
                {searchQuery
                  ? `"${searchQuery}"에 대한 검색 결과가 없습니다.`
                  : '아직 등록된 글이 없습니다. 첫 번째 글을 작성해보세요!'}
              </div>
            )}
            {items.map((item) => (
              <PostCard key={item.id} item={item} onEdit={handleEdit} onDelete={handleDelete} />
            ))}
          </div>
        </main>
      )}

      {view === 'search' && (
        <main className="detail-view">
          <div className="detail-header">
            <button className="btn btn-ghost back-btn" onClick={handleGoHome}>← 홈으로</button>
            <div className="detail-title-row">
              <div>
                <h1>검색 결과</h1>
                <p className="detail-subtitle">"{searchQuery}" — 전체 카테고리</p>
              </div>
            </div>
            <div className="detail-toolbar">
              <SearchBar placeholder="전체 가이드 검색..." onSearch={handleHomeSearch} />
            </div>
          </div>

          <div className="post-list">
            {loading && <div className="state-msg">검색 중...</div>}
            {error && <div className="state-msg error">{error}</div>}
            {!loading && !error && items.length === 0 && (
              <div className="state-msg empty">
                "{searchQuery}"에 대한 검색 결과가 없습니다.
              </div>
            )}
            {items.map((item) => (
              <div key={item.id}>
                <div
                  className="result-category-badge"
                  style={{ '--accent': CATEGORY_META[item.category].color } as React.CSSProperties}
                >
                  {CATEGORY_META[item.category].icon} {item.category}
                </div>
                <PostCard item={item} onEdit={handleEdit} onDelete={handleDelete} />
              </div>
            ))}
          </div>
        </main>
      )}

      {showForm && (
        <PostForm
          initialData={editingItem ?? undefined}
          defaultCategory={activeCategory ?? undefined}
          onSubmit={handleSubmit}
          onCancel={() => { setShowForm(false); setEditingItem(null); }}
        />
      )}
    </div>
  );
}

export default App;
