import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Printer, CheckCircle, Download, RotateCw, Eye, FileText } from 'lucide-react';
import { formatCurrency, formatDate, ORDER_STATUS } from '../../../lib/mockData';
import PageHeader from '../../../components/PageHeader';
import StatusBadge from '../../../components/StatusBadge';
import { useToast } from '../../../context/ToastContext';
import { api } from '../../../lib/api';
import InvoiceModal from './InvoiceModal';

const STATUS_FLOW = ['pending', 'processing', 'packed', 'shipped', 'delivered'];

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [trackingInput, setTrackingInput] = useState('');
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);
  const [regeneratingInvoice, setRegeneratingInvoice] = useState(false);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);

  const handleViewInvoice = async () => {
    if (!order?._id && !order?.id) return;
    try {
      const orderId = order._id || order.id;
      await api.orders.viewInvoiceInNewTab(orderId);
    } catch (err) {
      toast(err.message || 'Failed to open invoice', 'error');
    }
  };

  const handleDownloadInvoice = async () => {
    if (!order?._id && !order?.id) return;
    setDownloadingInvoice(true);
    try {
      const orderId = order._id || order.id;
      const invName = order.invoice?.invoiceNumber || `invoice-${order.orderNumber}`;
      await api.orders.downloadInvoice(orderId, `${invName}.pdf`);
    } catch (err) {
      toast(err.message || 'Failed to download invoice', 'error');
    } finally {
      setDownloadingInvoice(false);
    }
  };

  const handleRegenerateInvoice = async () => {
    if (!order?._id && !order?.id) return;
    setRegeneratingInvoice(true);
    try {
      const orderId = order._id || order.id;
      const res = await api.orders.regenerateInvoice(orderId);
      if (res.order) setOrder(res.order);
      toast('Invoice regenerated successfully', 'success');
    } catch (err) {
      toast(err.message || 'Failed to regenerate invoice', 'error');
    } finally {
      setRegeneratingInvoice(false);
    }
  };

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const data = await api.orders.get(id);
      setOrder(data);
      if (data) {
        setTrackingInput(data.trackingNumber || '');
      }
    } catch (err) {
      toast('Failed to load order details', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const updateStatus = async (newStatus) => {
    try {
      const updated = await api.orders.updateStatus(id, { status: newStatus });
      setOrder(updated);
      toast(`Order marked as ${ORDER_STATUS[newStatus]?.label}`, 'success');
    } catch (err) {
      toast(err.message || 'Failed to update status', 'error');
    }
  };

  const handleAddNote = async () => {
    if (!note) return;
    try {
      const updated = await api.orders.addNote(id, note);
      setOrder(updated);
      toast('Note added to order', 'success');
      setNote('');
    } catch (err) {
      toast('Failed to add note', 'error');
    }
  };

  const handleSaveTracking = async () => {
    try {
      const updated = await api.orders.updateStatus(id, { trackingNumber: trackingInput });
      setOrder(updated);
      toast('Tracking number updated', 'success');
    } catch (err) {
      toast('Failed to update tracking number', 'error');
    }
  };

  if (loading) {
    return (
      <div className="page flex-center py-20">
        <div className="spinner" />
      </div>
    );
  }

  if (!order) return (
    <div className="page">
      <p style={{ color: 'var(--color-text-secondary)' }}>Order not found. <Link to="/admin/orders" style={{ color: 'var(--color-walnut)' }}>Back to Orders</Link></p>
    </div>
  );

  const customer = typeof order.customer === 'object' ? order.customer : null;
  const customerId = customer?._id || order.customer;
  const currentStep = STATUS_FLOW.indexOf(order.status);

  // Exact Order Summary Math Calculation
  const subtotal = order.subtotal || 0;
  const shipping = order.shipping || 0;
  const discount = order.discount || 0;
  const total = order.total || 0;
  const calculatedTax = order.taxAmount ?? Math.max(0, total - (subtotal + shipping - discount));
  const taxLabel = order.taxName
    ? `${order.taxName}${order.taxRate ? ` (${order.taxRate}%)` : ''}`
    : order.taxRate
    ? `GST / Tax (${order.taxRate}%)`
    : 'GST / Tax';

  const summaryRows = [
    ['Subtotal', formatCurrency(subtotal)],
    discount > 0 ? ['Discount', `−${formatCurrency(discount)}`] : null,
    calculatedTax > 0 ? [taxLabel, formatCurrency(calculatedTax)] : null,
    ['Shipping', shipping > 0 ? formatCurrency(shipping) : 'Free'],
  ].filter(Boolean);

  return (
    <div className="page page-enter">
      <PageHeader
        crumbs={[{ label: 'Orders', to: '/admin/orders' }, { label: order.orderNumber }]}
        title={order.orderNumber}
        subtitle={`Placed ${formatDate(order.createdAt)}`}
        actions={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleViewInvoice}
              style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
            >
              <Eye size={14} />
              View Invoice
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              disabled={downloadingInvoice}
              onClick={handleDownloadInvoice}
              style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
            >
              <Download size={14} />
              {downloadingInvoice ? 'Downloading...' : 'Download Invoice'}
            </button>
            {order.invoice?.status === 'failed' && (
              <button
                type="button"
                className="btn btn-outline btn-sm"
                disabled={regeneratingInvoice}
                onClick={handleRegenerateInvoice}
                style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: 'var(--color-terracotta)' }}
              >
                <RotateCw size={14} className={regeneratingInvoice ? 'spin' : ''} />
                Regenerate Invoice
              </button>
            )}
            <StatusBadge status={order.status} />
            <select
              className="field-select"
              style={{ width: 160, height: 32 }}
              value={order.status}
              onChange={e => updateStatus(e.target.value)}
              disabled={['delivered', 'cancelled', 'refunded'].includes(order.status)}
            >
              {Object.entries(ORDER_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Status Timeline */}
          {!['cancelled', 'refunded'].includes(order.status) && (
            <div className="card">
              <div className="card-header"><span className="card-title">Fulfilment Status</span></div>
              <div className="card-body">
                <div style={{ display: 'flex', gap: 0, alignItems: 'flex-start', overflowX: 'auto', paddingBottom: 4 }}>
                  {STATUS_FLOW.map((s, i) => {
                    const done = i <= currentStep;
                    const current = i === currentStep;
                    return (
                      <div key={s} style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 80 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: 1 }}>
                          <div style={{
                            width: 28, height: 28, borderRadius: '50%', border: `2px solid ${done ? 'var(--color-walnut)' : 'var(--color-border)'}`,
                            background: done ? 'var(--color-walnut)' : 'var(--color-surface)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            position: 'relative',
                          }}>
                            {done && <CheckCircle size={14} color="white" />}
                          </div>
                          <span style={{ fontSize: 10, fontWeight: current ? 600 : 400, color: done ? 'var(--color-text-primary)' : 'var(--color-text-caption)', textAlign: 'center', textTransform: 'capitalize' }}>
                            {ORDER_STATUS[s]?.label}
                          </span>
                        </div>
                        {i < STATUS_FLOW.length - 1 && (
                          <div style={{ flex: 1, height: 2, background: i < currentStep ? 'var(--color-walnut)' : 'var(--color-border)', marginBottom: 24, marginTop: -2 }} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Order Items */}
          <div className="card">
            <div className="card-header"><span className="card-title">Items</span></div>
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, i) => (
                  <tr key={i}>
                    <td style={{ fontSize: 13, fontWeight: 500 }}>
                      {item.name}
                      {(item.color || item.size) && (
                        <span style={{ display: 'block', fontSize: 11, color: 'var(--color-text-caption)', marginTop: 2 }}>
                          {item.color ? `Color: ${item.color}` : ''} {item.size ? `| Size: ${item.size}` : ''}
                        </span>
                      )}
                    </td>
                    <td style={{ fontSize: 13 }}>{item.qty}</td>
                    <td style={{ fontSize: 13 }}>{formatCurrency(item.price)}</td>
                    <td style={{ fontSize: 13, fontWeight: 500 }}>{formatCurrency(item.price * item.qty)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals Breakdown — Mathematically Exact with Tax Row */}
            <div style={{ padding: '16px 20px', borderTop: '1px solid var(--color-border)' }}>
              {summaryRows.map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                  <span>{k}</span>
                  <span style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>{v}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700, marginTop: 10, paddingTop: 10, borderTop: '2px solid var(--color-border)', color: 'var(--color-text-primary)' }}>
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="card">
            <div className="card-header"><span className="card-title">Order Notes</span></div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {order.notes && (
                <div style={{ background: 'var(--color-surface-2)', borderRadius: 6, padding: '10px 12px', fontSize: 12, color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
                  "{order.notes}"
                </div>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="field-input" style={{ flex: 1 }} placeholder="Add a note…" value={note} onChange={e => setNote(e.target.value)} />
                <button className="btn btn-secondary" onClick={handleAddNote}>Add</button>
              </div>
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Customer */}
          <div className="card">
            <div className="card-header"><span className="card-title">Customer</span></div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <Link to={`/admin/customers/${customerId}`} style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-walnut)', textDecoration: 'none' }}>
                {order.customerName}
              </Link>
              {customer && (
                <>
                  <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{customer.email}</p>
                  <p style={{ fontSize: 11, color: 'var(--color-text-caption)' }}>{customer.orderCount} orders · {formatCurrency(customer.totalSpent)} spent</p>
                </>
              )}
            </div>
          </div>

          {/* Shipping */}
          <div className="card">
            <div className="card-header"><span className="card-title">Shipping</span></div>
            <div className="card-body" style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
              <p>{order.shippingAddress.line1}</p>
              <p>{order.shippingAddress.city}, {order.shippingAddress.zip}</p>
              <p>{order.shippingAddress.country}</p>
              {order.trackingNumber && (
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--color-border)' }}>
                  <p style={{ fontSize: 11, color: 'var(--color-text-caption)', marginBottom: 2 }}>Tracking number</p>
                  <p style={{ fontFamily: 'monospace', fontWeight: 500, color: 'var(--color-text-primary)' }}>{order.trackingNumber}</p>
                </div>
              )}
              {order.status !== 'pending' && (
                <div style={{ marginTop: 10, display: 'flex', gap: 6 }}>
                  <input
                    className="field-input"
                    placeholder="Tracking number…"
                    style={{ fontSize: 12, flex: 1 }}
                    value={trackingInput}
                    onChange={e => setTrackingInput(e.target.value)}
                  />
                  <button className="btn btn-secondary btn-sm" style={{ height: '32px' }} onClick={handleSaveTracking}>Save</button>
                </div>
              )}
            </div>
          </div>

          {/* Payment */}
          <div className="card">
            <div className="card-header"><span className="card-title">Payment</span></div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
              {[
                ['Method', order.paymentMethod],
                ['Status', null],
                ['Amount', formatCurrency(order.total)],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--color-text-caption)' }}>{k}</span>
                  {v ? <span style={{ fontWeight: 500 }}>{v}</span> : <StatusBadge status={order.paymentStatus} />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Preview Modal */}
      <InvoiceModal
        order={order}
        isOpen={invoiceModalOpen}
        onClose={() => setInvoiceModalOpen(false)}
        onDownload={handleDownloadInvoice}
        downloading={downloadingInvoice}
      />
    </div>
  );
}
