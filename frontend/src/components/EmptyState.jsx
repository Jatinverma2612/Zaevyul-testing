import { Package } from 'lucide-react';

export default function EmptyState({ icon: Icon = Package, title = 'Nothing here yet', desc = '', action }) {
  return (
    <div className="empty-state">
      <Icon className="empty-state-icon" strokeWidth={1.25} />
      <p className="empty-state-title">{title}</p>
      {desc && <p className="empty-state-desc">{desc}</p>}
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  );
}
