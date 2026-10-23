import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { formatDate } from '../../../lib/mockData';
import PageHeader from '../../../components/PageHeader';
import DataTable from '../../../components/DataTable';
import StatusBadge from '../../../components/StatusBadge';
import { DeleteDialog } from '../../../components/Modal';
import { useToast } from '../../../context/ToastContext';
import { api } from '../../../lib/api';

export default function Blogs() {
  const toast = useToast();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        setLoading(true);
        const data = await api.blogs.list();
        setBlogs(data);
      } catch {
        toast('Failed to load blog posts', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchBlogs();
  }, [toast]);

  const filtered = useMemo(() => {
    setSelected([]);
    return blogs.filter(b => !filter || b.status === filter);
  }, [blogs, filter]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await api.blogs.delete(deleteTarget);
      setBlogs(bs => bs.filter(b => (b._id || b.id) !== deleteTarget));
      setSelected(s => s.filter(id => id !== deleteTarget));
      toast('Post deleted', 'success');
    } catch {
      toast('Failed to delete post', 'error');
    } finally {
      setDeleteTarget(null);
      setDeleteLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    setDeleteLoading(true);
    try {
      await Promise.all(selected.map(id => api.blogs.delete(id)));
      setBlogs(bs => bs.filter(b => !selected.includes(b._id || b.id)));
      toast(`${selected.length} posts deleted`, 'success');
    } catch {
      toast('Failed to delete selected posts', 'error');
    } finally {
      setSelected([]);
      setBulkDeleteConfirm(false);
      setDeleteLoading(false);
    }
  };

  const COLUMNS = [
    {
      key: 'title', label: 'Title', sortable: true, maxWidth: 280,
      render: (val, row) => {
        const itemId = row._id || row.id;
        return (
          <div>
            <Link to={`/admin/blogs/${itemId}`} style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', textDecoration: 'none' }}
              onMouseOver={e => e.target.style.color = 'var(--color-walnut)'}
              onMouseOut={e => e.target.style.color = 'var(--color-text-primary)'}
            >{val}</Link>
            <p style={{ fontSize: 11, color: 'var(--color-text-caption)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 260 }}>
              {row.excerpt}
            </p>
          </div>
        );
      }
    },
    {
      key: 'category', label: 'Category', sortable: true,
      render: val => <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 500 }}>{val || <em style={{ color: 'var(--color-text-caption)' }}>Uncategorised</em>}</span>
    },
    { key: 'status', label: 'Status', render: val => <StatusBadge status={val} /> },
    {
      key: 'publishedAt', label: 'Published', sortable: true,
      render: val => <span style={{ fontSize: 12, color: 'var(--color-text-caption)' }}>{formatDate(val)}</span>
    },
    {
      key: 'id', label: '',
      render: (val, row) => {
        const itemId = row._id || row.id;
        return (
          <div style={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Link to={`/admin/blogs/${itemId}`} className="btn btn-ghost btn-sm"><Pencil size={13} /></Link>
            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-error)' }} onClick={() => setDeleteTarget(itemId)}><Trash2 size={13} /></button>
          </div>
        );
      }
    }
  ];

  if (loading) {
    return (
      <div className="page flex-center py-20">
        <div className="spinner" />
      </div>
    );
  }

  const activeRowKey = blogs[0]?._id ? "_id" : "id";

  return (
    <div className="page page-enter">
      <PageHeader
        title="Blog"
        subtitle={`${blogs.length} posts`}
        crumbs={[{ label: 'Blog' }]}
        actions={
          <Link to="/admin/blogs/new" className="btn btn-primary">
            <Plus size={14} /> New Post
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

      <div className="table-wrap">
        <div className="table-toolbar">
          {['', 'published', 'draft'].map(s => (
            <button
              key={s || 'all'}
              className={`tab ${filter === s ? 'active' : ''}`}
              style={{ border: 'none', background: 'none', cursor: 'pointer' }}
              onClick={() => setFilter(s)}
            >
              {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
              {' '}({s === '' ? blogs.length : blogs.filter(b => b.status === s).length})
            </button>
          ))}
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--color-text-caption)' }}>{filtered.length} posts</span>
        </div>

        <DataTable
          columns={COLUMNS}
          data={filtered}
          selectable
          selected={selected}
          onSelect={setSelected}
          pageSize={12}
          rowKey={activeRowKey}
          emptyTitle="No posts found"
        />
      </div>

      <DeleteDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Delete post"
        desc="This post will be permanently deleted. This cannot be undone."
      />

      <DeleteDialog
        open={bulkDeleteConfirm}
        onClose={() => setBulkDeleteConfirm(false)}
        onConfirm={handleBulkDelete}
        loading={deleteLoading}
        title="Delete selected posts"
        desc={`Are you sure you want to delete ${selected.length} selected post(s)? This action cannot be undone.`}
      />
    </div>
  );
}
