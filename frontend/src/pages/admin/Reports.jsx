import { useState, useEffect } from "react";
import { Download } from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { api } from "../../lib/api";
import { formatCurrency } from "../../lib/mockData";
import PageHeader from "../../components/PageHeader";
import { useToast } from "../../context/ToastContext";

const PALETTE = ["#B58A5B", "#C7A27A", "#D9C2A7", "#E8DED1", "#FAF8F5"];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: 8,
        padding: "10px 14px",
        fontSize: 12,
        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
      }}
    >
      <p
        style={{
          color: "var(--color-text-caption)",
          marginBottom: 4,
          fontSize: 11,
        }}
      >
        {label}
      </p>
      {payload.map((p, i) => (
        <p
          key={i}
          style={{ color: "var(--color-text-primary)", fontWeight: 600 }}
        >
          {p.name}:{" "}
          {typeof p.value === "number" && p.dataKey !== "orders"
            ? formatCurrency(p.value)
            : p.value}
        </p>
      ))}
    </div>
  );
};

const PERIODS = ["Last 3 months", "Last 6 months", "Last 12 months"];

export default function Reports() {
  const showToast = useToast();
  const [period, setPeriod] = useState("Last 12 months");
  const [reportData, setReportData] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        // Fetch both endpoints in parallel
        const [data, prodList] = await Promise.all([
          api.reports.get(),
          api.products.list(),
        ]);
        setReportData(data);
        setProducts(prodList);
      } catch (err) {
        showToast("Error loading reports", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, [showToast]);

  if (loading) {
    return (
      <div
        className="page page-enter"
        style={{ background: "#FAF8F5", minHeight: "100%" }}
      >
        <style>{`
          @keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
          .skeleton { background: linear-gradient(90deg, #f0ece8 25%, #e8e2dc 50%, #f0ece8 75%); background-size: 800px 100%; animation: shimmer 1.4s infinite; border-radius: 8px; }
        `}</style>
        {/* Header skeleton */}
        <div style={{ marginBottom: 28 }}>
          <div
            className="skeleton"
            style={{ width: 120, height: 28, marginBottom: 8 }}
          />
          <div className="skeleton" style={{ width: 200, height: 13 }} />
        </div>
        {/* KPI row skeleton */}
        <div className="grid-cols-3" style={{ marginBottom: 24 }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="metric-card skeleton"
              style={{ height: 90 }}
            />
          ))}
        </div>
        {/* Chart skeletons */}
        <div
          className="card skeleton"
          style={{ height: 280, marginBottom: 20 }}
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 20,
            marginBottom: 20,
          }}
          className="reports-grid-two-col"
        >
          <div className="card skeleton" style={{ height: 220 }} />
          <div className="card skeleton" style={{ height: 220 }} />
        </div>
        <div className="card skeleton" style={{ height: 240 }} />
        <style>{`
          @media (max-width: 768px) { .reports-grid-two-col { grid-template-columns: 1fr !important; } }
        `}</style>
      </div>
    );
  }

  const chartData = reportData?.monthlyReport || [];
  const periodData =
    period === "Last 3 months"
      ? chartData.slice(-3)
      : period === "Last 6 months"
        ? chartData.slice(-6)
        : chartData;

  const totalRevenue = periodData.reduce((s, d) => s + d.revenue, 0);
  const totalOrders = periodData.reduce((s, d) => s + d.orders, 0);
  const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const exportCSV = () => {
    const rows = [
      ["Month", "Revenue", "Orders"],
      ...periodData.map((d) => [d.month, d.revenue, d.orders]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "revenue-report.csv";
    a.click();
  };

  return (
    <div
      className="page page-enter"
      style={{ background: "#FAF8F5", minHeight: "100%" }}
    >
      <PageHeader
        title="Reports"
        crumbs={[{ label: "Reports" }]}
        actions={
          <div style={{ display: "flex", gap: 8 }}>
            {PERIODS.map((p) => (
              <button
                key={p}
                className={`btn ${period === p ? "btn-primary" : "btn-secondary"}`}
                onClick={() => setPeriod(p)}
                style={{ fontSize: 11 }}
              >
                {p}
              </button>
            ))}
            <button className="btn btn-secondary" onClick={exportCSV}>
              <Download size={13} /> Export
            </button>
          </div>
        }
      />

      {/* Summary stats */}
      <div className="grid-cols-3" style={{ marginBottom: 24 }}>
        {[
          { label: "Total Revenue", value: formatCurrency(totalRevenue) },
          { label: "Total Orders", value: totalOrders },
          {
            label: "Avg. Order Value",
            value: formatCurrency(Math.round(avgOrder)),
          },
        ].map((s) => (
          <div
            key={s.label}
            className="metric-card"
            style={{ padding: "20px 24px" }}
          >
            <p
              className="metric-label"
              style={{
                fontSize: 10,
                letterSpacing: "0.08em",
                color: "var(--color-text-caption)",
                textTransform: "uppercase",
                marginBottom: 12,
              }}
            >
              {s.label}
            </p>
            <p className="metric-value">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Revenue chart */}
      <div className="card" style={{ marginBottom: 20, padding: 24 }}>
        <div style={{ marginBottom: 20 }}>
          <span className="card-title">Revenue History</span>
        </div>
        <div style={{ padding: "0 4px" }}>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart
              data={periodData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="reportsRevGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#B58A5B" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#B58A5B" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: "var(--color-text-caption)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--color-text-caption)" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `₹${v / 1000}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                name="Revenue"
                stroke="#B58A5B"
                strokeWidth={2}
                fill="url(#reportsRevGrad)"
                dot={{ r: 3, stroke: "#B58A5B", strokeWidth: 2, fill: "white" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 20,
          marginBottom: 20,
        }}
        className="reports-grid-two-col"
      >
        {/* Orders chart */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ marginBottom: 20 }}>
            <span className="card-title">Orders Overview</span>
          </div>
          <div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart
                data={periodData}
                margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
              >
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: "var(--color-text-caption)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "var(--color-text-caption)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="orders"
                  name="Orders"
                  fill="#B58A5B"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={24}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category breakdown */}
        <div
          className="card"
          style={{ padding: 24, display: "flex", flexDirection: "column" }}
        >
          <span className="card-title" style={{ marginBottom: 20 }}>
            Sales by Category
          </span>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 24,
              flex: 1,
              justifyContent: "center",
            }}
            className="flex-wrap"
          >
            <ResponsiveContainer
              width={130}
              height={130}
              style={{ flexShrink: 0 }}
            >
              <PieChart>
                <Pie
                  data={reportData?.categoryBreakdown || []}
                  dataKey="value"
                  innerRadius={42}
                  outerRadius={60}
                  strokeWidth={0}
                >
                  {(reportData?.categoryBreakdown || []).map((_, i) => (
                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                flex: 1,
              }}
            >
              {(reportData?.categoryBreakdown || []).map((c, i) => (
                <div
                  key={c.name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 11,
                  }}
                >
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: PALETTE[i % PALETTE.length],
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{ flex: 1, color: "var(--color-text-secondary)" }}
                  >
                    {c.name}
                  </span>
                  <span
                    style={{
                      fontWeight: 600,
                      color: "var(--color-text-primary)",
                    }}
                  >
                    {c.value}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .reports-grid-two-col {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
