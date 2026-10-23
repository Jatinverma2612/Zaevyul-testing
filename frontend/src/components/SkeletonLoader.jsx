export function SkeletonBox({ h = 16, w = '100%', radius = 4 }) {
  return (
    <div
      className="skeleton"
      style={{ height: h, width: w, borderRadius: radius, display: 'block' }}
    />
  );
}

export function SkeletonRow({ cols = 4 }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} style={{ padding: '12px 16px' }}>
          <SkeletonBox h={14} w={i === 0 ? '60%' : i === cols - 1 ? '40%' : '80%'} />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonCard() {
  return (
    <div className="metric-card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <SkeletonBox h={10} w="40%" />
      <SkeletonBox h={28} w="60%" />
      <SkeletonBox h={10} w="30%" />
    </div>
  );
}

export default function SkeletonTable({ rows = 8, cols = 5 }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i}><SkeletonBox h={10} w={i === 0 ? '50%' : '70%'} /></th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => <SkeletonRow key={i} cols={cols} />)}
        </tbody>
      </table>
    </div>
  );
}
