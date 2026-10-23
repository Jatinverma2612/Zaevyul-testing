import { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import EmptyState from './EmptyState';
import Pagination from './Pagination';

export default function DataTable({
  columns,
  data = [],
  selectable = false,
  selected = [],
  onSelect,
  pageSize: initialPageSize = 10,
  pageSizeOptions = [10, 25, 50, 100],
  emptyIcon,
  emptyTitle = 'No records found',
  emptyDesc = '',
  rowKey = 'id',
}) {
  const [sort, setSort] = useState({ key: null, dir: 'asc' });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const toggleSort = (key) => {
    setSort(s => s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' });
    setPage(1);
  };

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setPage(1);
  };

  const sorted = useMemo(() => {
    if (!sort.key) return data;
    return [...data].sort((a, b) => {
      const va = a[sort.key] ?? '';
      const vb = b[sort.key] ?? '';
      const cmp = typeof va === 'number' ? va - vb : String(va).localeCompare(String(vb));
      return sort.dir === 'asc' ? cmp : -cmp;
    });
  }, [data, sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  const allSelected = paginated.length > 0 && paginated.every(r => selected.includes(r[rowKey]));
  const toggleAll = () => {
    if (allSelected) onSelect(selected.filter(id => !paginated.some(r => r[rowKey] === id)));
    else onSelect([...new Set([...selected, ...paginated.map(r => r[rowKey])])]);
  };
  const toggleRow = (id) => {
    onSelect(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id]);
  };

  const SortIcon = ({ k }) => {
    if (sort.key !== k) return <ChevronsUpDown size={11} style={{ opacity: 0.35 }} />;
    return sort.dir === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />;
  };

  return (
    <div className="table-wrap">
      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              {selectable && (
                <th style={{ width: 40, paddingLeft: 16 }}>
                  <input type="checkbox" className="table-checkbox" checked={allSelected} onChange={toggleAll} />
                </th>
              )}
              {columns.map(col => (
                <th
                  key={col.key}
                  style={{ width: col.width, cursor: col.sortable ? 'pointer' : 'default', userSelect: 'none' }}
                  onClick={() => col.sortable && toggleSort(col.key)}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    {col.label}
                    {col.sortable && <SortIcon k={col.key} />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr><td colSpan={columns.length + (selectable ? 1 : 0)}>
                <EmptyState icon={emptyIcon} title={emptyTitle} desc={emptyDesc} />
              </td></tr>
            ) : paginated.map(row => (
              <tr key={row[rowKey]}>
                {selectable && (
                  <td style={{ paddingLeft: 16, width: 40 }}>
                    <input type="checkbox" className="table-checkbox" checked={selected.includes(row[rowKey])} onChange={() => toggleRow(row[rowKey])} />
                  </td>
                )}
                {columns.map(col => (
                  <td key={col.key} style={{ maxWidth: col.maxWidth }}>
                    {col.render ? col.render(row[col.key], row) : row[col.key] ?? '—'}
                  </td>
                ))}
              </tr>
            ))}
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
          pageSizeOptions={pageSizeOptions}
          onPageSizeChange={handlePageSizeChange}
        />
      )}
    </div>
  );
}
