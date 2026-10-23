import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { formatCurrency, formatDate } from '../../../lib/mockData';
import PageHeader from '../../../components/PageHeader';
import StatusBadge from '../../../components/StatusBadge';
import { useToast } from '../../../context/ToastContext';
import { api } from '../../../lib/api';

export default function CustomerDetail() {
  const { id } = useParams();
  const toast = useToast();
  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [cData, oList] = await Promise.all([
          api.customers.get(id),
          api.orders.list(),
        ]);
        setCustomer(cData);
        // Filter orders for this customer by ID or customer ID
        const customerOrders = (oList || []).filter(o => {
          const custId = typeof o.customer === 'object' ? (o.customer?._id || o.customer?.id) : o.customer;
          return String(custId) === String(id) || String(o.customerUser) === String(id) || o.customerEmail === cData?.email;
        });
        setOrders(customerOrders);
      } catch (err) {
        toast('Failed to load customer details', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, toast]);

  if (loading) {
    return (
      <div className="page flex-center py-20">
        <div className="spinner" />
      </div>
    );
  }

  if (!customer) return (
    <div className="page">
      <p style={{ color: 'var(--color-text-secondary)' }}>Customer not found. <Link to="/admin/customers" style={{ color: 'var(--color-walnut)' }}>Back to Customers</Link></p>
    </div>
  );

  const totalSpent = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const orderCount = orders.length;
  const avgOrderValue = orderCount > 0 ? totalSpent / orderCount : 0;
  const lastOrderDate = orders[0]?.createdAt || customer.lastOrder;

  const STATS = [
    { label: 'Total Spent', value: formatCurrency(totalSpent) },
    { label: 'Orders', value: orderCount },
    { label: 'Avg. Order Value', value: formatCurrency(Math.round(avgOrderValue)) },
    { label: 'Status', value: <StatusBadge status={customer.status || 'active'} /> },
  ];

  const customerName = customer.name || 'Anonymous Customer';

  return (
    <div className="page page-enter">
      <PageHeader
        crumbs={[{ label: 'Customers', to: '/admin/customers' }, { label: customerName }]}
        title={customerName}
        subtitle={customer.email || customer.phone}
      />

      {/* Stats row */}
      <div className="grid-cols-4" style={{ marginBottom: 20 }}>
        {STATS.map(s => (
          <div key={s.label} className="metric-card">
            <p className="metric-label">{s.label}</p>
            <div className="metric-value" style={{ fontSize: 20 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 16 }}>
        {/* Order History */}
        <div className="card">
          <div className="card-header"><span className="card-title">Purchase History</span></div>
          {orders.length === 0 ? (
            <p style={{ padding: '24px', fontSize: 13, color: 'var(--color-text-caption)', textAlign: 'center' }}>No orders yet</p>
          ) : (
            <table>
              <thead><tr><th>Order</th><th>Items</th><th>Total</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o._id || o.id}>
                    <td>
                      <Link to={`/admin/orders/${o._id || o.id}`} style={{ fontSize: 12, color: 'var(--color-walnut)', textDecoration: 'none', fontWeight: 500 }}>
                        {o.orderNumber}
                      </Link>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{o.items ? o.items.length : 0}</td>
                    <td style={{ fontSize: 12, fontWeight: 500 }}>{formatCurrency(o.total)}</td>
                    <td><StatusBadge status={o.status} /></td>
                    <td style={{ fontSize: 11, color: 'var(--color-text-caption)' }}>{formatDate(o.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="card">
            <div className="card-header"><span className="card-title">Contact</span></div>
            <div className="card-body" style={{ fontSize: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                ['Email', customer.email || '—'],
                ['Phone', customer.phone || '—'],
                ['City', customer.city ? `${customer.city}, ${customer.country || 'India'}` : (customer.addresses?.[0]?.city || '—')],
                ['Joined', formatDate(customer.createdAt || customer.joinedAt)],
                ['Last order', lastOrderDate ? formatDate(lastOrderDate) : '—'],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-caption)' }}>{k}</span>
                  <span style={{ color: 'var(--color-text-secondary)', fontWeight: 500, maxWidth: 160, textAlign: 'right' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {customer.notes && (
            <div className="card">
              <div className="card-header"><span className="card-title">Notes</span></div>
              <div className="card-body">
                <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{customer.notes}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
