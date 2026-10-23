import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  onPage,
  pageSizeOptions = [10, 25, 50, 100],
  onPageSizeChange,
}) {
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  const pages = [];
  const range = (lo, hi) => { for (let i = lo; i <= hi; i++) pages.push(i); };
  if (totalPages <= 7) range(1, totalPages);
  else if (page <= 4) { range(1, 5); pages.push('…'); pages.push(totalPages); }
  else if (page >= totalPages - 3) { pages.push(1); pages.push('…'); range(totalPages - 4, totalPages); }
  else { pages.push(1); pages.push('…'); range(page - 1, page + 1); pages.push('…'); pages.push(totalPages); }

  return (
    <div className="pagination">
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <span>{start}–{end} of {total}</span>
        {onPageSizeChange && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>Rows per page:</span>
            <select
              className="pagination-select"
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      <div className="pagination-pages">
        <button className="pagination-btn" onClick={() => onPage(page - 1)} disabled={page === 1}>
          <ChevronLeft size={13} />
        </button>
        {pages.map((p, i) =>
          p === '…'
            ? <span key={`el-${i}`} style={{ padding: '0 4px', fontSize: 12, color: 'var(--color-text-caption)' }}>…</span>
            : <button key={p} className={`pagination-btn ${page === p ? 'active' : ''}`} onClick={() => onPage(p)}>{p}</button>
        )}
        <button className="pagination-btn" onClick={() => onPage(page + 1)} disabled={page === totalPages}>
          <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
}
