import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export default function PageHeader({ title, subtitle, crumbs = [], actions }) {
  return (
    <div>
      {crumbs.length > 0 && (
        <div className="breadcrumb">
          {crumbs.map((c, i) => (
            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {i > 0 && <ChevronRight size={11} className="breadcrumb-sep" />}
              {c.to ? <Link to={c.to}>{c.label}</Link> : <span style={{ color: 'var(--color-text-secondary)' }}>{c.label}</span>}
            </span>
          ))}
        </div>
      )}
      <div className="page-header">
        <div>
          <h1 className="page-title">{title}</h1>
          {subtitle && <p className="page-subtitle">{subtitle}</p>}
        </div>
        {actions && <div className="page-actions">{actions}</div>}
      </div>
    </div>
  );
}
