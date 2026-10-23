import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save } from 'lucide-react';
import { formatDate } from '../../../lib/mockData';
import PageHeader from '../../../components/PageHeader';
import ImageUploader from '../../../components/ImageUploader';
import { useToast } from '../../../context/ToastContext';
import { api } from '../../../lib/api';

const BLANK = {
  title: '', slug: '', excerpt: '', content: '',
  status: 'draft',
  category: '',
  seo: { title: '', description: '' },
  mainImage: null,
  bannerImage: null
};

export default function BlogForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const isNew = !id || id === 'new';

  const [form, setForm] = useState(BLANK);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('content');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const catList = await api.blogCategories.list();
        setCategories(catList);

        if (!isNew) {
          const post = await api.blogs.get(id);
          if (post) {
            setForm({
              ...BLANK,
              ...post,
              mainImage: post.mainImage || null,
              bannerImage: post.bannerImage || null,
              category: post.category || ''
            });
          } else {
            toast('Post not found', 'error');
            navigate('/admin/blogs');
          }
        }
      } catch {
        toast('Error loading details', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id, isNew, navigate, toast]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setSeo = (k, v) => setForm(f => ({ ...f, seo: { ...f.seo, [k]: v } }));

  const genSlug = n => n.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const handleSave = async (status = form.status) => {
    if (!form.title) { toast('Title is required', 'error'); return; }
    setSaving(true);

    const postData = {
      ...form,
      status,
      publishedAt: status === 'published' && !form.publishedAt ? new Date().toISOString() : form.publishedAt
    };

    try {
      if (isNew) {
        await api.blogs.create(postData);
      } else {
        await api.blogs.update(id, postData);
      }
      toast(isNew ? 'Post created' : 'Changes saved', 'success');
      navigate('/admin/blogs');
    } catch (err) {
      toast(err.message || 'Failed to save post', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page flex-center py-20">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="page page-enter">
      <PageHeader
        title={isNew ? 'New Post' : form.title || 'Edit Post'}
        crumbs={[{ label: 'Blog', to: '/admin/blogs' }, { label: isNew ? 'New' : 'Edit' }]}
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" onClick={() => handleSave('draft')} disabled={saving}>Save draft</button>
            <button className="btn btn-primary" onClick={() => handleSave('published')} disabled={saving}>
              <Save size={13} /> {saving ? 'Saving…' : 'Publish'}
            </button>
          </div>
        }
      />

      <div className="tabs" style={{ marginBottom: 20 }}>
        {['content', 'media', 'seo'].map(t => (
          <button key={t} className={`tab ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)} style={{ background: 'none', border: 'none', cursor: 'pointer', textTransform: 'capitalize' }}>
            {t}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 16, alignItems: 'start' }}>
        <div>
          {activeTab === 'content' && (
            <div className="card">
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="field-group">
                  <label className="field-label">Title *</label>
                  <input className="field-input" style={{ fontSize: 15, fontFamily: 'var(--font-serif)', height: 42 }} value={form.title}
                    placeholder="Post title"
                    onChange={e => { set('title', e.target.value); if (!form.slug) set('slug', genSlug(e.target.value)); }} />
                </div>
                <div className="field-group">
                  <label className="field-label">Excerpt</label>
                  <textarea className="field-textarea" rows={2} value={form.excerpt} placeholder="Short summary shown in listings…"
                    onChange={e => set('excerpt', e.target.value)} />
                </div>
                <div className="field-group">
                  <label className="field-label">Content</label>
                  <textarea
                    className="field-textarea"
                    rows={18}
                    value={form.content}
                    placeholder="Write your post content here. HTML is supported."
                    onChange={e => set('content', e.target.value)}
                    style={{ fontFamily: 'var(--font-sans)', lineHeight: 1.7, fontSize: 13 }}
                  />
                  <span className="field-hint">Basic HTML supported: &lt;p&gt;, &lt;strong&gt;, &lt;em&gt;, &lt;h2&gt;, &lt;ul&gt;, &lt;li&gt;</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'media' && (
            <div className="card">
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <p className="form-section-title" style={{ marginBottom: 6 }}>Main Image</p>
                  <ImageUploader
                    images={form.mainImage ? [form.mainImage] : []}
                    onChange={imgs => set('mainImage', imgs.length > 0 ? imgs[0] : null)}
                    max={1}
                    label="main image"
                  />
                </div>
                <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '8px 0' }} />
                <div>
                  <p className="form-section-title" style={{ marginBottom: 6 }}>Banner Image</p>
                  <ImageUploader
                    images={form.bannerImage ? [form.bannerImage] : []}
                    onChange={imgs => set('bannerImage', imgs.length > 0 ? imgs[0] : null)}
                    max={1}
                    label="banner image"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'seo' && (
            <div className="card">
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <p className="form-section-title">SEO</p>
                <div className="field-group">
                  <label className="field-label">Meta Title</label>
                  <input className="field-input" value={form.seo.title} placeholder="SEO title (50-60 chars)"
                    onChange={e => setSeo('title', e.target.value)} />
                  <span className="field-hint">{form.seo.title.length}/60</span>
                </div>
                <div className="field-group">
                  <label className="field-label">Meta Description</label>
                  <textarea className="field-textarea" rows={3} value={form.seo.description}
                    placeholder="SEO description (150-160 chars)"
                    onChange={e => setSeo('description', e.target.value)} />
                  <span className="field-hint">{form.seo.description.length}/160</span>
                </div>
                <div className="field-group">
                  <label className="field-label">URL Slug</label>
                  <input className="field-input" value={form.slug}
                    onChange={e => set('slug', e.target.value)} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div className="card-header"><span className="card-title">Status</span></div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <select className="field-select" value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
              {!isNew && form.publishedAt && (
                <p style={{ fontSize: 11, color: 'var(--color-text-caption)' }}>Published {formatDate(form.publishedAt)}</p>
              )}
              <button className="btn btn-primary" style={{ justifyContent: 'center' }} onClick={() => handleSave()} disabled={saving}>
                <Save size={13} /> {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><span className="card-title">Category</span></div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <select className="field-select" value={form.category} onChange={e => set('category', e.target.value)}>
                <option value="">Uncategorised</option>
                {categories.map(c => (
                  <option key={c._id || c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
