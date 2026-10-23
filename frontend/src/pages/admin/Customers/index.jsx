import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Trash2 } from 'lucide-react';
import { formatCurrency, formatDate } from '../../../lib/mockData';
import PageHeader from '../../../components/PageHeader';
import DataTable from '../../../components/DataTable';
import { DeleteDialog } from '../../../components/Modal';
import { useToast } from '../../../context/ToastContext';
import { api } from '../../../lib/api';
import StatusBadge from '../../../components/StatusBadge';

export default function Customers() {
  const toast = useToast();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const data = await api.customers.list();
      setCustomers((data || []).map(c => ({
        ...c,
        id: c._id || c.id,
        status: c.status || (c.emailVerified || c.phoneVerified ? 'active' : 'active')
      })));
    } catch (err) {
      toast('Failed to load customers', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filtered = useMemo(() => customers.filter(c => {
    const q = search.toLowerCase();
    const nameStr = c.name || '';
    const emailStr = c.email || '';
    if (q && !nameStr.toLowerCase().includes(q) && !emailStr.toLowerCase().includes(q)) return false;
    if (statusFilter && c.status !== statusFilter) return false;
    return true;
  }), [customers, search, statusFilter]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await api.customers.delete(deleteTarget);
      setCustomers(cs => cs.filter(c => (c._id || c.id) !== deleteTarget));
      setSelected(s => s.filter(id => id !== deleteTarget));
      toast('Customer deleted', 'success');
    } catch (err) {
      toast('Failed to delete customer', 'error');
    } finally {
      setDeleteTarget(null);
      setDeleteLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    setDeleteLoading(true);
    try {
      await api.customers.bulkDelete(selected);
      setCustomers(cs => cs.filter(c => !selected.includes(c._id || c.id)));
      toast(`${selected.length} customers deleted`, 'success');
    } catch (err) {
      toast('Failed to delete selected customers', 'error');
    } finally {
      setSelected([]);
      setBulkDeleteConfirm(false);
      setDeleteLoading(false);
    }
  };

  const COLUMNS = [
    {
      key: 'name', label: 'Customer', sortable: true,
      render: (v, row) => {
        const rowId = row._id || row.id;
        return (
          <div>
            <Link to={`/admin/customers/${rowId}`} style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', textDecoration: 'none' }}
              onMouseOver={e => e.target.style.color = 'var(--color-walnut)'}
              onMouseOut={e => e.target.style.color = 'var(--color-text-primary)'}
            >{v || 'Anonymous Customer'}</Link>
            <p style={{ fontSize: 11, color: 'var(--color-text-caption)', marginTop: 1 }}>{row.email || row.phone || 'No contact info'}</p>
          </div>
        );
      }
    },
    { key: 'city', label: 'Location', render: (v, row) => <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{v || row.city ? `${v || row.city}, ${row.country || 'India'}` : '—'}</span> },
    { key: 'orderCount', label: 'Orders', sortable: true, render: v => <span style={{ fontSize: 13 }}>{v || 0}</span> },
    {
      key: 'totalSpent', label: 'Total Spent', sortable: true,
      render: v => <span style={{ fontSize: 13, fontWeight: 500 }}>{v > 0 ? formatCurrency(v) : '—'}</span>
    },
    {
      key: 'lastOrder', label: 'Last Order',
      render: v => <span style={{ fontSize: 12, color: 'var(--color-text-caption)' }}>{v ? formatDate(v) : '—'}</span>
    },
    { key: 'status', label: 'Status', render: v => <StatusBadge status={v || 'active'} /> },
    {
      key: 'id', label: '',
      render: (v, row) => {
        const rowId = row._id || row.id;
        return (
          <div style={{ display: 'flex', gap: 4, alignItems: 'center', justifyContent: 'flex-end' }}>
            <Link to={`/admin/customers/${rowId}`} className="btn btn-ghost btn-sm">View</Link>
            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-error)' }} onClick={() => setDeleteTarget(rowId)} title="Delete">
              <Trash2 size={13} />
            </button>
          </div>
        );
      }
    },
  ];

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
        title="Customers"
        subtitle={`${customers.length} registered`}
        crumbs={[{ label: 'Customers' }]}
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
          <div style={{ position: 'relative', flex: 1, maxWidth: 280 }}>
            <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-caption)' }} />
            <input className="field-input" style={{ paddingLeft: 30, height: 32 }} placeholder="Name or email…"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="field-select" style={{ width: 140, height: 32 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          {(search || statusFilter) && (
            <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setStatusFilter(''); }}>Clear</button>
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
          emptyTitle="No customers found"
        />
      </div>

      <DeleteDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Delete customer"
        desc="This customer record will be permanently removed. Order history will remain intact."
      />

      <DeleteDialog
        open={bulkDeleteConfirm}
        onClose={() => setBulkDeleteConfirm(false)}
        onConfirm={handleBulkDelete}
        loading={deleteLoading}
        title="Delete selected customers"
        desc={`Are you sure you want to delete ${selected.length} selected customer(s)? This action cannot be undone.`}
      />
    </div>
  );
}
