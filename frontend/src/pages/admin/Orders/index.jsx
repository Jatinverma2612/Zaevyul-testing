import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Trash2, Download, Eye, FileText } from 'lucide-react';
import { formatCurrency, formatDate, ORDER_STATUS } from '../../../lib/mockData';
import PageHeader from '../../../components/PageHeader';
import DataTable from '../../../components/DataTable';
import StatusBadge from '../../../components/StatusBadge';
import { DeleteDialog } from '../../../components/Modal';
import { useToast } from '../../../context/ToastContext';
import { api } from '../../../lib/api';
import InvoiceModal from './InvoiceModal';

export default function Orders() {
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState([]);
  const [previewOrder, setPreviewOrder] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await api.orders.list();
      setOrders(data || []);
    } catch (err) {
      toast('Failed to load orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filtered = useMemo(() => orders.filter(o => {
    const q = search.toLowerCase();
    if (q && !o.orderNumber.toLowerCase().includes(q) && !o.customerName.toLowerCase().includes(q)) return false;
    if (statusFilter && o.status !== statusFilter) return false;
    return true;
  }), [orders, search, statusFilter]);

  const handleBulkDelete = async () => {
    setDeleteLoading(true);
    try {
      await api.orders.bulkDelete(selected);
      setOrders(ps => ps.filter(o => !selected.includes(o._id || o.id)));
      toast(`${selected.length} orders deleted`, 'success');
    } catch (err) {
      toast('Failed to delete selected orders', 'error');
    } finally {
      setSelected([]);
      setBulkDeleteConfirm(false);
      setDeleteLoading(false);
    }
  };

  const handleDownloadInvoice = async (targetOrder) => {
    const ord = targetOrder || previewOrder;
    if (!ord) return;
    const rowId = ord._id || ord.id;
    const invName = ord.invoice?.invoiceNumber || `invoice-${ord.orderNumber || rowId}`;
    setDownloading(true);
    try {
      await api.orders.downloadInvoice(rowId, `${invName}.pdf`);
    } catch (err) {
      toast(err.message || 'Failed to download invoice', 'error');
    } finally {
      setDownloading(false);
    }
  };

  const activeRowKey = orders[0]?._id ? "_id" : "id";

  const COLUMNS = [
    {
      key: 'orderNumber', label: 'Order', sortable: true,
      render: (val, row) => (
        <Link to={`/admin/orders/${row._id || row.id}`} style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-walnut)', textDecoration: 'none' }}>
          {val}
        </Link>
      )
    },
    { key: 'customerName', label: 'Customer', sortable: true, render: v => <span style={{ fontSize: 13 }}>{v}</span> },
    {
      key: 'items', label: 'Items',
      render: v => <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{v ? v.length : 0} item{v?.length !== 1 ? 's' : ''}</span>
    },
    {
      key: 'total', label: 'Total', sortable: true,
      render: v => <span style={{ fontSize: 13, fontWeight: 500 }}>{formatCurrency(v)}</span>
    },
    { key: 'paymentStatus', label: 'Payment', render: v => <StatusBadge status={v} /> },
    { key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> },
    {
      key: 'createdAt', label: 'Date', sortable: true,
      render: v => <span style={{ fontSize: 12, color: 'var(--color-text-caption)' }}>{formatDate(v)}</span>
    },
    {
      key: 'id', label: 'Actions',
      render: (val, row) => {
        const rowId = row._id || row.id;
        return (
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <Link to={`/admin/orders/${rowId}`} className="btn btn-ghost btn-sm">View</Link>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              title="Open Invoice in New Tab"
              onClick={(e) => {
                e.stopPropagation();
                api.orders.viewInvoiceInNewTab(rowId).catch(err => toast(err.message, 'error'));
              }}
              style={{ padding: '4px 6px', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <FileText size={14} className="text-[#B58A5B]" />
              <span style={{ fontSize: 11 }}>Invoice</span>
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

  const pendingCount = orders.filter(o => o.status === 'pending').length;

  return (
    <div className="page page-enter">
      <PageHeader
        title="Orders"
        subtitle={`${orders.length} total · ${pendingCount} pending`}
        crumbs={[{ label: 'Orders' }]}
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
            <input className="field-input" style={{ paddingLeft: 30, height: 32 }} placeholder="Order number or customer…"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="field-select" style={{ width: 160, height: 32 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            {Object.entries(ORDER_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
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
          rowKey={activeRowKey}
          emptyTitle="No orders found"
          emptyDesc="Try adjusting your filters"
        />
      </div>

      {/* Invoice Preview Modal */}
      <InvoiceModal
        order={previewOrder}
        isOpen={!!previewOrder}
        onClose={() => setPreviewOrder(null)}
        onDownload={() => handleDownloadInvoice(previewOrder)}
        downloading={downloading}
      />

      <DeleteDialog
        open={bulkDeleteConfirm}
        onClose={() => setBulkDeleteConfirm(false)}
        onConfirm={handleBulkDelete}
        loading={deleteLoading}
        title="Delete selected orders"
        desc={`Are you sure you want to delete ${selected.length} selected order(s)? This action cannot be undone.`}
      />
    </div>
  );
}
