import { ORDER_STATUS, PRODUCT_STATUS } from '../lib/mockData';

const STATUS_MAP = { ...ORDER_STATUS, ...PRODUCT_STATUS,
  active:       { label: 'Active',       badge: 'badge-green' },
  inactive:     { label: 'Inactive',     badge: 'badge-gray' },
  published:    { label: 'Published',    badge: 'badge-green' },
  draft:        { label: 'Draft',        badge: 'badge-gray' },
  archived:     { label: 'Archived',     badge: 'badge-red' },
  paid:         { label: 'Paid',         badge: 'badge-green' },
  pending:      { label: 'Pending',      badge: 'badge-amber' },
  refunded:     { label: 'Refunded',     badge: 'badge-gray' },
  unsubscribed: { label: 'Unsubscribed', badge: 'badge-gray' },
};

export default function StatusBadge({ status, label: customLabel }) {
  const config = STATUS_MAP[status] || { label: status, badge: 'badge-gray' };
  return (
    <span className={`badge ${config.badge}`}>
      {customLabel || config.label}
    </span>
  );
}
