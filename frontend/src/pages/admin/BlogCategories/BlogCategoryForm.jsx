import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, Trash2 } from 'lucide-react';
import PageHeader from '../../../components/PageHeader';
import { DeleteDialog } from '../../../components/Modal';
import { useToast } from '../../../context/ToastContext';
import { api } from '../../../lib/api';

const BLANK = {
  name: '',
};

export default function BlogCategoryForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const isNew = !id || id === 'new';

  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    const loadCategory = async () => {
      if (!isNew) {
        try {
          const category = await api.blogCategories.get(id);
          if (category) {
            setForm({
              name: category.name || '',
            });
          } else {
            toast('Blog category not found', 'error');
            navigate('/admin/blog-categories');
          }
        } catch {
          toast('Error loading blog category details', 'error');
        }
      }
    };
    loadCategory();
  }, [id, isNew, navigate, toast]);

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast('Category name is required', 'error');
      return;
    }
    setSaving(true);

    try {
      if (isNew) {
        await api.blogCategories.create({ name: form.name.trim() });
      } else {
        await api.blogCategories.update(id, { name: form.name.trim() });
      }
      toast(isNew ? 'Blog category created' : 'Changes saved', 'success');
      navigate('/admin/blog-categories');
    } catch (err) {
      toast(err.message || 'Failed to save blog category', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.blogCategories.delete(id);
      toast('Blog category deleted', 'success');
      navigate('/admin/blog-categories');
    } catch {
      toast('Failed to delete blog category', 'error');
    }
  };

  return (
    <div className="page page-enter">
      <PageHeader
        title={isNew ? 'New Blog Category' : form.name || 'Edit Blog Category'}
        crumbs={[
          { label: 'Blog Categories', to: '/admin/blog-categories' },
          { label: isNew ? 'New' : 'Edit' },
        ]}
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            {!isNew && (
              <button className="btn btn-secondary" onClick={() => setDeleteOpen(true)}>
                <Trash2 size={13} /> Delete
              </button>
            )}
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              <Save size={13} /> {saving ? 'Saving…' : isNew ? 'Create' : 'Save'}
            </button>
          </div>
        }
      />

      <div style={{ maxWidth: 600 }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">Category Details</span>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="field-group">
              <label className="field-label">Category Name *</label>
              <input
                className="field-input"
                value={form.name}
                onChange={e => set('name', e.target.value)}
                placeholder="e.g. Heritage, Guides, News"
                required
              />
              <span className="field-hint">Specify a clear and unique name for the category.</span>
            </div>
          </div>
        </div>
      </div>

      <DeleteDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete blog category"
        desc="Are you sure you want to delete this category? Any blog posts assigned to this category will become uncategorised."
      />
    </div>
  );
}
