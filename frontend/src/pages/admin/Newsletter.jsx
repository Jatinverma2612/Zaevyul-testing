import { useState, useMemo, useEffect } from 'react';
import { Search, Download, Trash2, ArrowUpDown } from 'lucide-react';
import { formatDate } from '../../lib/mockData';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import Pagination from '../../components/Pagination';
import { DeleteDialog } from '../../components/Modal';
import { useToast } from '../../context/ToastContext';
import { api } from '../../lib/api';

export default function Newsletter() {
  const toast = useToast();
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchSubscribers = async () => {
    setLoading(true);
    try {
      const data = await api.newsletter.list();
      setSubs((data || []).map(s => ({ ...s, id: s._id || s.id })));
    } catch (err) {
      toast('Failed to load newsletter subscribers', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const filtered = useMemo(() => {
    setSelected([]);
    setPage(1);
    const q = search.toLowerCase();
    return subs.filter(s => !q || (s.email && s.email.toLowerCase().includes(q)) || (s.name && s.name.toLowerCase().includes(q)));
  }, [subs, search]);

  const sorted = useMemo(() => {
    const data = [...filtered];
    data.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.subscribedAt || b.createdAt) - new Date(a.subscribedAt || a.createdAt);
      }
      if (sortBy === 'oldest') {
        return new Date(a.subscribedAt || a.createdAt) - new Date(b.subscribedAt || b.createdAt);
      }
      if (sortBy === 'name-asc') {
        return (a.name || '').localeCompare(b.name || '');
      }
      if (sortBy === 'name-desc') {
        return (b.name || '').localeCompare(a.name || '');
      }
      if (sortBy === 'email-asc') {
        return (a.email || '').localeCompare(b.email || '');
      }
      if (sortBy === 'email-desc') {
        return (b.email || '').localeCompare(a.email || '');
      }
      return 0;
    });
    return data;
  }, [filtered, sortBy]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  const getItemId = s => s._id || s.id;

  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);

  const allOnPageSelected = paginated.length > 0 && paginated.every(s => selected.includes(getItemId(s)));
  const toggleAll = () => {
    if (allOnPageSelected) setSelected(s => s.filter(id => !paginated.some(item => getItemId(item) === id)));
    else setSelected(s => [...new Set([...s, ...paginated.map(item => getItemId(item))])]);
  };
  const toggleRow = (id) => setSelected(sel => sel.includes(id) ? sel.filter(x => x !== id) : [...sel, id]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await api.newsletter.delete(deleteTarget);
      setSubs(ss => ss.filter(s => getItemId(s) !== deleteTarget));
      setSelected(sel => sel.filter(id => id !== deleteTarget));
      toast('Subscriber removed', 'success');
    } catch (err) {
      toast('Failed to delete subscriber', 'error');
    } finally {
      setDeleteTarget(null);
      setDeleteLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    setDeleteLoading(true);
    try {
      await api.newsletter.bulkDelete(selected);
      setSubs(ss => ss.filter(s => !selected.includes(getItemId(s))));
      toast(`${selected.length} subscribers removed`, 'success');
    } catch (err) {
      toast('Failed to delete selected subscribers', 'error');
    } finally {
      setSelected([]);
      setBulkDeleteConfirm(false);
      setDeleteLoading(false);
    }
  };

  const exportCSV = () => {
    const rows = [['Name', 'Email', 'Status', 'Subscribed'], ...sorted.map(s => [s.name, s.email, s.status, formatDate(s.subscribedAt)])];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'subscribers.csv'; a.click();
    toast('CSV exported', 'success');
  };

  const activeCount = subs.filter(s => s.status === 'active').length;

  return (
    <div className="page page-enter" style={{ background: "#FAF8F5", minHeight: "100%" }}>
      <PageHeader
        title="Newsletter"
        subtitle={`${activeCount} active subscribers`}
        crumbs={[{ label: 'Newsletter' }]}
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" onClick={exportCSV}><Download size={13} /> Export CSV</button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid-cols-3" style={{ marginBottom: 24 }}>
        {[
          { label: 'Total Subscribers', value: subs.length },
          { label: 'Active', value: activeCount },
          { label: 'Unsubscribed', value: subs.length - activeCount },
        ].map(s => (
          <div key={s.label} className="metric-card" style={{ padding: "20px 24px" }}>
            <p className="metric-label" style={{ fontSize: 10, letterSpacing: '0.08em', color: 'var(--color-text-caption)', textTransform: 'uppercase', marginBottom: 12 }}>{s.label}</p>
            <p className="metric-value">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Bulk action bar */}
      {selected.length > 0 && (
        <div className="bulk-bar">
          <span>{selected.length} selected</span>
          <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', marginLeft: 'auto' }} onClick={() => setBulkDeleteConfirm(true)}>
            <Trash2 size={12} /> Remove
          </button>
          <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }} onClick={() => setSelected([])}>Clear</button>
        </div>
      )}

      <div className="card">
        <div className="table-toolbar" style={{ padding: "16px 24px", borderBottom: "1px solid var(--color-border)" }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 280 }}>
            <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-caption)' }} />
            <input className="field-input" style={{ paddingLeft: 30, height: 32 }} placeholder="Name or email…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: 'var(--color-text-caption)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Sort By:</span>
            <select
              className="field-select"
              style={{ width: 160, height: 32, fontSize: 12, background: 'white' }}
              value={sortBy}
              onChange={e => { setSortBy(e.target.value); setPage(1); }}
            >
              <option value="newest">Newest Subscribed</option>
              <option value="oldest">Oldest Subscribed</option>
              <option value="name-asc">Name: A to Z</option>
              <option value="name-desc">Name: Z to A</option>
              <option value="email-asc">Email: A to Z</option>
              <option value="email-desc">Email: Z to A</option>
            </select>
          </div>

          {(search || sortBy !== 'newest') && (
            <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setSortBy('newest'); }}>Clear Filters</button>
          )}
          
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--color-text-caption)' }}>{filtered.length} subscribers</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th style={{ width: 40, paddingLeft: 16 }}>
                  <input type="checkbox" className="table-checkbox" checked={allOnPageSelected} onChange={toggleAll} />
                </th>
                <th>Name</th>
                <th>Email</th>
                <th>Status</th>
                <th>Subscribed</th>
                <th style={{ width: 40 }}></th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(s => (
                <tr key={s.id}>
                  <td style={{ paddingLeft: 16 }}>
                    <input type="checkbox" className="table-checkbox" checked={selected.includes(s.id)} onChange={() => toggleRow(s.id)} />
                  </td>
                  <td style={{ fontSize: 13, fontWeight: 500 }}>{s.name}</td>
                  <td style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{s.email}</td>
                  <td><StatusBadge status={s.status} /></td>
                  <td style={{ fontSize: 12, color: 'var(--color-text-caption)' }}>{formatDate(s.subscribedAt)}</td>
                  <td>
                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-error)' }} onClick={() => setDeleteTarget(s.id)}>
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr><td colSpan={6} style={{ padding: '32px', textAlign: 'center', fontSize: 13, color: 'var(--color-text-caption)' }}>No subscribers found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {sorted.length > 0 && (
          <Pagination
            page={safePage}
            totalPages={totalPages}
            total={sorted.length}
            pageSize={pageSize}
            onPage={setPage}
            pageSizeOptions={[10, 25, 50, 100]}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setPage(1);
            }}
          />
        )}
      </div>

      <DeleteDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        loading={deleteLoading} title="Remove subscriber" desc="This subscriber will be permanently removed from the list." />

      <DeleteDialog open={bulkDeleteConfirm} onClose={() => setBulkDeleteConfirm(false)} onConfirm={handleBulkDelete}
        loading={deleteLoading} title="Remove selected subscribers" desc={`Are you sure you want to remove ${selected.length} selected subscriber(s) from the list?`} />
    </div>
  );
}
