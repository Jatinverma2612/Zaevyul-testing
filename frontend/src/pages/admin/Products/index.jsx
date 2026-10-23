import { useState, useMemo, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Trash2, Copy, Archive, Eye, Pencil } from 'lucide-react';
import { formatCurrency, formatDate } from '../../../lib/mockData';
import PageHeader from '../../../components/PageHeader';
import DataTable from '../../../components/DataTable';
import StatusBadge from '../../../components/StatusBadge';
import { DeleteDialog } from '../../../components/Modal';
import { useToast } from '../../../context/ToastContext';
import { api } from '../../../lib/api';

export default function Products() {
  const toast = useToast();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [selected, setSelected] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  const fetchProductsAndCategories = async () => {
    try {
      setLoading(true);
      const [prodList, catList] = await Promise.all([
        api.products.list(),
        api.categories.list(),
      ]);
      setProducts(prodList);
      setCategories(catList);
    } catch (err) {
      toast('Failed to load products or categories', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductsAndCategories();
  }, []);

  const filtered = useMemo(() => products.filter(p => {
    const q = search.toLowerCase();
    if (q && !p.name.toLowerCase().includes(q) && !p.sku.toLowerCase().includes(q)) return false;
    if (statusFilter && p.status !== statusFilter) return false;
    if (categoryFilter) {
      const pCat = p.category;
      const pCatId = typeof pCat === 'string' ? pCat : pCat?._id || pCat?.id;
      if (String(pCatId) !== String(categoryFilter)) return false;
    }
    return true;
  }), [products, search, statusFilter, categoryFilter]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await api.products.delete(deleteTarget);
      setProducts(ps => ps.filter(p => (p._id || p.id) !== deleteTarget));
      setSelected(s => s.filter(id => id !== deleteTarget));
      toast('Product deleted', 'success');
    } catch (err) {
      toast('Failed to delete product', 'error');
    } finally {
      setDeleteTarget(null);
      setDeleteLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    setDeleteLoading(true);
    try {
      await api.products.bulkDelete(selected);
      setProducts(ps => ps.filter(p => !selected.includes(p._id || p.id)));
      toast(`${selected.length} products deleted`, 'success');
    } catch (err) {
      toast('Failed to delete selected products', 'error');
    } finally {
      setSelected([]);
      setBulkDeleteConfirm(false);
      setDeleteLoading(false);
    }
  };

  const handleDuplicate = async (product) => {
    try {
      const copied = await api.products.duplicate(product._id || product.id);
      setProducts(ps => [copied, ...ps]);
      toast('Product duplicated as draft', 'success');
    } catch (err) {
      toast('Failed to duplicate product', 'error');
    }
  };

  const handleToggleFeatured = useCallback(async (product) => {
    const id = product._id || product.id;
    const featuredCount = products.filter(p => p.featured).length;
    if (!product.featured && featuredCount >= 6) {
      toast('Maximum 6 products can be featured. Disable one first.', 'error');
      return;
    }
    setTogglingId(id);
    try {
      const updated = await api.products.toggleFeatured(id);
      setProducts(prev => {
        const next = prev.map(p => (p._id || p.id) === id ? { ...p, featured: updated.featured, featuredOrder: updated.featuredOrder } : p);
        const featured = next.filter(p => p.featured).sort((a, b) => a.featuredOrder - b.featuredOrder);
        featured.forEach((p, i) => { p.featuredOrder = i + 1; });
        return [...next];
      });
      toast(updated.featured ? `"${product.name}" featured at #${updated.featuredOrder}` : `"${product.name}" removed from homepage`, 'success');
    } catch (err) {
      toast(err.message || 'Failed to update homepage status', 'error');
    } finally {
      setTogglingId(null);
    }
  }, [products, toast]);

  const COLUMNS = [
    {
      key: 'name', label: 'Product', sortable: true, maxWidth: 280,
      render: (val, row) => {
        const img = row.mainImage || (row.images && row.images[0]);
        const imgUrl = img?.url || row.img;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
              {imgUrl ? (
                <img src={imgUrl} alt={val} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: 10, color: 'var(--color-text-caption)', fontFamily: 'var(--font-serif)' }}>Zae</span>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Link to={`/admin/products/${row._id || row.id}`} style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', textDecoration: 'none' }}
                onMouseOver={e => e.target.style.color = 'var(--color-walnut)'}
                onMouseOut={e => e.target.style.color = 'var(--color-text-primary)'}
              >{val}</Link>
              <span style={{ fontSize: 11, color: 'var(--color-text-caption)' }}>{row.sku}</span>
            </div>
          </div>
        );
      }
    },
    {
      key: 'category', label: 'Category',
      render: (val) => {
        const categoryId = typeof val === 'string' ? val : val?._id || val?.id;
        const cat = categories.find(c => String(c._id || c.id) === String(categoryId));
        return <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{cat?.name || '—'}</span>;
      }
    },
    {
      key: 'gender', label: 'Gender',
      render: (val) => {
        const g = (val || 'neutral').toLowerCase();
        const label = g === 'men' ? 'Men' : g === 'women' ? 'Women' : 'Neutral';
        return (
          <span style={{
            fontSize: 10,
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            padding: '2px 6px',
            background: g === 'men' ? 'rgba(42, 74, 106, 0.08)' : g === 'women' ? 'rgba(181, 138, 91, 0.1)' : 'var(--color-surface-2)',
            color: g === 'men' ? '#2A4A6A' : g === 'women' ? '#B58A5B' : 'var(--color-text-caption)',
            borderRadius: 4
          }}>
            {label}
          </span>
        );
      }
    },
    {
      key: 'basePrice', label: 'Price', sortable: true,
      render: (val, row) => (
        <div>
          <span style={{ fontSize: 13, fontWeight: 500 }}>{formatCurrency(row.discountPrice || val)}</span>
          {row.discountPrice && <span style={{ fontSize: 11, color: 'var(--color-text-caption)', textDecoration: 'line-through', marginLeft: 6 }}>{formatCurrency(val)}</span>}
        </div>
      )
    },
    {
      key: 'quantity', label: 'Stock', sortable: true,
      render: (val, row) => (
        <span style={{ fontSize: 13, fontWeight: 500, color: val <= row.lowStockThreshold ? 'var(--color-saffron)' : 'var(--color-text-primary)' }}>
          {val || 0}
          {val <= row.lowStockThreshold && ' ⚠'}
        </span>
      )
    },
    { key: 'status', label: 'Status', render: val => <StatusBadge status={val} /> },
    {
      key: 'featured', label: 'Homepage', sortable: false,
      render: (val, row) => {
        const id = row._id || row.id;
        const featuredCount = products.filter(p => p.featured).length;
        const isToggling = togglingId === id;
        const disabled = isToggling || (!row.featured && featuredCount >= 6);
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => handleToggleFeatured(row)}
              disabled={disabled}
              title={!row.featured && featuredCount >= 6 ? 'Max 6 homepage products - disable one first' : ''}
              style={{
                position: 'relative', width: 32, height: 18, borderRadius: 9,
                border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
                background: row.featured ? 'var(--color-walnut)' : 'var(--color-border)',
                opacity: disabled && !isToggling ? 0.45 : 1,
                flexShrink: 0, transition: 'background 0.2s',
              }}
            >
              <span style={{
                position: 'absolute', top: 2, left: row.featured ? 16 : 2,
                width: 14, height: 14, borderRadius: '50%', background: '#fff',
                transition: 'left 0.2s', display: 'block',
              }} />
            </button>
            {row.featured && row.featuredOrder && (
              <span style={{
                fontSize: 10, fontWeight: 700, lineHeight: 1,
                background: 'var(--color-walnut)', color: '#fff',
                borderRadius: 3, padding: '2px 6px',
              }}>
                #{row.featuredOrder}
              </span>
            )}
          </div>
        );
      }
    },
    {
      key: 'createdAt', label: 'Added', sortable: true,
      render: val => <span style={{ fontSize: 12, color: 'var(--color-text-caption)' }}>{formatDate(val)}</span>
    },
    {
      key: 'id', label: '',
      render: (val, row) => {
        const itemId = row._id || row.id;
        return (
          <div style={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Link to={`/admin/products/${itemId}`} className="btn btn-ghost btn-sm" title="Edit Product">
              <Pencil size={13} />
            </Link>
            <button className="btn btn-ghost btn-sm" onClick={() => handleDuplicate(row)} title="Duplicate">
              <Copy size={13} />
            </button>
            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-error)' }} onClick={() => setDeleteTarget(itemId)} title="Delete">
              <Trash2 size={13} />
            </button>
          </div>
        );
      }
    },
  ];

  const activeRowKey = products[0]?._id ? "_id" : "id";

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
        title="Products"
        subtitle={`${products.length} total`}
        crumbs={[{ label: 'Products' }]}
        actions={
          <Link to="/admin/products/new" className="btn btn-primary">
            <Plus size={14} /> New Product
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

      {/* Filters */}
      <div className="table-wrap">
        <div className="table-toolbar">
          <div style={{ position: 'relative', flex: 1, maxWidth: 280 }}>
            <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-caption)' }} />
            <input
              className="field-input"
              style={{ paddingLeft: 30, height: 32 }}
              placeholder="Search name or SKU…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select className="field-select" style={{ width: 140, height: 32 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
          <select className="field-select" style={{ width: 160, height: 32 }} value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
            <option value="">All categories</option>
            {categories.map(c => <option key={c._id || c.id} value={c._id || c.id}>{c.name}</option>)}
          </select>
          {(search || statusFilter || categoryFilter) && (
            <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setStatusFilter(''); setCategoryFilter(''); }}>
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
          emptyTitle="No products found"
          emptyDesc="Try adjusting your search or filters"
        />
      </div>

      <DeleteDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Delete product"
        desc="This product will be permanently removed. Any orders referencing it will retain the order history."
      />

      <DeleteDialog
        open={bulkDeleteConfirm}
        onClose={() => setBulkDeleteConfirm(false)}
        onConfirm={handleBulkDelete}
        loading={deleteLoading}
        title="Delete selected products"
        desc={`Are you sure you want to delete ${selected.length} selected product(s)? This action cannot be undone.`}
      />
    </div>
  );
}
