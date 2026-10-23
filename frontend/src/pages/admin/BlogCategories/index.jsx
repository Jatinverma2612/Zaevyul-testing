import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Trash2, Pencil } from 'lucide-react';
import PageHeader from '../../../components/PageHeader';
import DataTable from '../../../components/DataTable';
import { DeleteDialog } from '../../../components/Modal';
import { useToast } from '../../../context/ToastContext';
import { api } from '../../../lib/api';

export default function BlogCategoriesList() {
  const toast = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const catList = await api.blogCategories.list();
        setCategories(catList);
      } catch {
        toast('Failed to load blog categories', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, [toast]);

  const filtered = useMemo(() => {
    return categories.filter(c => {
      const q = search.toLowerCase();
      if (q && !c.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [categories, search]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await api.blogCategories.delete(deleteTarget);
      setCategories(cs => cs.filter(c => (c._id || c.id) !== deleteTarget));
      setSelected(s => s.filter(id => id !== deleteTarget));
      toast('Blog category deleted', 'success');
    } catch {
      toast('Failed to delete blog category', 'error');
    } finally {
      setDeleteTarget(null);
      setDeleteLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    setDeleteLoading(true);
    try {
      await Promise.all(selected.map(id => api.blogCategories.delete(id)));
      setCategories(cs => cs.filter(c => !selected.includes(c._id || c.id)));
      toast(`${selected.length} categories deleted`, 'success');
    } catch {
      toast('Failed to delete selected categories', 'error');
    } finally {
      setSelected([]);
      setBulkDeleteConfirm(false);
      setDeleteLoading(false);
    }
  };

  const COLUMNS = [
    {
      key: 'name', label: 'Category Name', sortable: true,
      render: (val, row) => {
        const itemId = row._id || row.id;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Link to={`/admin/blog-categories/${itemId}`} style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', textDecoration: 'none' }}
              onMouseOver={e => e.target.style.color = 'var(--color-walnut)'}
              onMouseOut={e => e.target.style.color = 'var(--color-text-primary)'}
            >{val}</Link>
          </div>
        );
      }
    },
    {
      key: 'blogCount', label: 'Associated Blogs', sortable: true,
      render: val => <span style={{ fontSize: 13, fontWeight: 500 }}>{val || 0}</span>
    },
    {
      key: 'id', label: '',
      render: (val, row) => {
        const itemId = row._id || row.id;
        return (
          <div style={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Link to={`/admin/blog-categories/${itemId}`} className="btn btn-ghost btn-sm" title="Edit">
              <Pencil size={13} />
            </Link>
            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-error)' }} onClick={() => setDeleteTarget(itemId)} title="Delete">
              <Trash2 size={13} />
            </button>
          </div>
        );
      }
    },
  ];

  const activeRowKey = categories[0]?._id ? "_id" : "id";

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
        title="Blog Categories"
        subtitle={`${categories.length} total`}
        crumbs={[{ label: 'Blog Categories' }]}
        actions={
          <Link to="/admin/blog-categories/new" className="btn btn-primary">
            <Plus size={14} /> New Category
          </Link>
        }
      />

      {/* Bulk action bar */}
      {selected.length > 0 && (
        <div className="bulk-bar">
          <span>{selected.length} selected</span>
          <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', marginLeft: 'auto' }} onClick={() => setBulkDeleteConfirm(true)}>
            <Trash2 size={12} /> Delete
          </button>
          <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }} onClick={() => setSelected([])}>
            Clear
          </button>
        </div>
      )}

      {/* Table & Filters */}
      <div className="table-wrap">
        <div className="table-toolbar">
          <div style={{ position: 'relative', flex: 1, maxWidth: 280 }}>
            <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-caption)' }} />
            <input
              className="field-input"
              style={{ paddingLeft: 30, height: 32 }}
              placeholder="Search category name…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          {search && (
            <button className="btn btn-ghost btn-sm" onClick={() => setSearch('')}>
              Clear
            </button>
          )}
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--color-text-caption)' }}>
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
        <DataTable
          columns={COLUMNS}
          data={filtered}
          selectable
          selected={selected}
          onSelect={setSelected}
          pageSize={12}
          rowKey={activeRowKey}
          emptyTitle="No blog categories found"
          emptyDesc="Try adjusting your search or filters"
        />
      </div>

      <DeleteDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Delete blog category"
        desc="This blog category will be permanently removed. Blogs associated with this category will be updated to be uncategorised."
      />

      <DeleteDialog
        open={bulkDeleteConfirm}
        onClose={() => setBulkDeleteConfirm(false)}
        onConfirm={handleBulkDelete}
        loading={deleteLoading}
        title="Delete selected blog categories"
        desc={`Are you sure you want to delete ${selected.length} selected blog category(ies)? This action cannot be undone.`}
      />
    </div>
  );
}
