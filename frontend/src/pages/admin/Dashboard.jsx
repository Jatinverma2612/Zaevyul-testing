import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShoppingBag,
  ShoppingCart,
  Users,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { api } from "../../lib/api";
import { formatCurrency, formatDate } from "../../lib/mockData";
import StatusBadge from "../../components/StatusBadge";
import { useToast } from "../../context/ToastContext";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: 8,
        padding: "10px 14px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
      }}
    >
      <p
        style={{
          color: "var(--color-text-caption)",
          fontSize: 11,
          marginBottom: 4,
        }}
      >
        {label}
      </p>
      <p
        style={{
          color: "var(--color-text-primary)",
          fontWeight: 600,
          fontSize: 13,
        }}
      >
        {formatCurrency(payload[0].value)}
      </p>
    </div>
  );
};

export default function Dashboard() {
  const showToast = useToast();
  const [data, setData] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch both endpoints in parallel — cuts sequential wait time in half
        const [reportsRes, ordersRes] = await Promise.all([
          api.reports.get(),
          api.orders.list(),
        ]);
        setData(reportsRes);
        setRecentOrders(ordersRes.slice(0, 5));
      } catch (err) {
        showToast("Error loading dashboard data", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [showToast]);

  const kpis = [
    {
      title: "Total Revenue",
      value: formatCurrency(data?.stats?.totalRevenue ?? 0),
      change: "Live Store Revenue",
      trend: "up",
      icon: ShoppingBag,
      color: "#B58A5B",
      bg: "rgba(181, 138, 91, 0.08)",
    },
    {
      title: "Total Orders",
      value: data?.stats?.totalOrders ?? 0,
      change: "Active Store Orders",
      trend: "up",
      icon: ShoppingCart,
      color: "#2A4A6A",
      bg: "rgba(42, 74, 106, 0.08)",
    },
    {
      title: "New Customers",
      value: data?.stats?.totalCustomers ?? 0,
      change: "Registered Customers",
      trend: "up",
      icon: Users,
      color: "#4A6FA5",
      bg: "rgba(74, 111, 165, 0.08)",
    },
    {
      title: "Low Stock Alert",
      value: data?.stats?.lowStockCount ?? 0,
      change: "Items Needing Restock",
      trend: "link",
      icon: AlertTriangle,
      color: "#C94C4C",
      bg: "rgba(201, 76, 76, 0.08)",
    },
  ];

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
        <div style={{ marginBottom: 36 }}>
          <div
            className="skeleton"
            style={{ width: 90, height: 13, marginBottom: 8 }}
          />
          <div
            className="skeleton"
            style={{ width: 160, height: 28, marginBottom: 8 }}
          />
          <div className="skeleton" style={{ width: 260, height: 14 }} />
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 16,
            marginBottom: 28,
          }}
          className="dashboard-kpi-grid"
        >
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="metric-card skeleton"
              style={{ height: 104 }}
            />
          ))}
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.4fr 1fr 1fr",
            gap: 20,
            marginBottom: 28,
          }}
          className="dashboard-grid-three-col"
        >
          <div className="card skeleton" style={{ height: 310 }} />
          <div className="card skeleton" style={{ height: 310 }} />
          <div className="card skeleton" style={{ height: 310 }} />
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 20,
          }}
          className="dashboard-grid-three-col"
        >
          <div className="card skeleton" style={{ height: 220 }} />
          <div className="card skeleton" style={{ height: 220 }} />
          <div className="card skeleton" style={{ height: 220 }} />
        </div>
        <style>{`
          @media (max-width: 1280px) { .dashboard-kpi-grid { grid-template-columns: repeat(2, 1fr) !important; } }
          @media (max-width: 1024px) { .dashboard-grid-three-col { grid-template-columns: 1fr !important; } }
          @media (max-width: 640px) { .dashboard-kpi-grid { grid-template-columns: 1fr !important; } }
        `}</style>
      </div>
    );
  }

  return (
    <div
      className="page page-enter"
      style={{ background: "#FAF8F5", minHeight: "100%" }}
    >
      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <span
          style={{
            fontSize: 13,
            color: "var(--color-text-caption)",
            letterSpacing: "0.04em",
            fontFamily: "var(--font-sans)",
          }}
        >
          Welcome back,
        </span>
        <h1
          className="page-title"
          style={{
            fontSize: 28,
            fontFamily: "var(--font-serif)",
            fontWeight: 400,
            marginTop: 4,
          }}
        >
          Admin
        </h1>
        <p className="page-subtitle" style={{ marginTop: 4 }}>
          Here's what's happening with your store today.
        </p>
      </div>

      {/* 4 KPI Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 16,
          marginBottom: 28,
        }}
        className="dashboard-kpi-grid"
      >
        {kpis.map((kpi) => (
          <div
            key={kpi.title}
            className="metric-card"
            style={{
              padding: "20px 24px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: "var(--color-text-caption)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                {kpi.title}
              </span>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: kpi.bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <kpi.icon size={15} style={{ color: kpi.color }} />
              </div>
            </div>
            <div>
              <p className="metric-value">{kpi.value}</p>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  marginTop: 8,
                }}
              >
                {kpi.trend === "up" && (
                  <span
                    style={{
                      fontSize: 11,
                      color: "var(--color-success)",
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                    }}
                  >
                    <TrendingUp size={11} /> {kpi.change}{" "}
                    <span style={{ color: "var(--color-text-caption)" }}>
                      vs last week
                    </span>
                  </span>
                )}
                {kpi.trend === "down" && (
                  <span
                    style={{
                      fontSize: 11,
                      color: "var(--color-warning)",
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                    }}
                  >
                    <TrendingDown size={11} /> {kpi.change}{" "}
                    <span style={{ color: "var(--color-text-caption)" }}>
                      vs last week
                    </span>
                  </span>
                )}
                {kpi.trend === "link" && (
                  <Link
                    to="/admin/products"
                    style={{
                      fontSize: 11,
                      color: "#B58A5B",
                      fontWeight: 500,
                      textDecoration: "none",
                    }}
                  >
                    {kpi.change}
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Row 2: Sales Overview + Top Selling Products + Recent Orders */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2.4fr 1fr",
          gap: 20,
          marginBottom: 28,
        }}
        className="dashboard-grid-three-col"
      >
        {/* Sales Overview Line Chart */}
        <div className="card" style={{ padding: "24px" }}>
          <div style={{ marginBottom: 20 }}>
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "var(--color-text-secondary)",
              }}
            >
              Sales Overview
            </span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                marginLeft: 16,
                fontSize: 11,
                color: "var(--color-text-caption)",
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#B58A5B",
                  display: "inline-block",
                }}
              />{" "}
              Revenue (₹)
            </span>
          </div>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data?.monthlyReport || []}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#B58A5B" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#B58A5B" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 10, fill: "var(--color-text-caption)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "var(--color-text-caption)" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `₹${v / 1000}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#B58A5B"
                  strokeWidth={2}
                  fill="url(#revenueGrad)"
                  dot={{
                    r: 3,
                    stroke: "#B58A5B",
                    strokeWidth: 2,
                    fill: "white",
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Orders */}
        <div
          className="card"
          style={{ padding: "24px", display: "flex", flexDirection: "column" }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "var(--color-text-secondary)",
              }}
            >
              Recent Orders
            </span>
            <Link
              to="/admin/orders"
              className="btn btn-ghost btn-sm"
              style={{
                fontSize: 11,
                padding: "2px 8px",
                textTransform: "capitalize",
                letterSpacing: "0",
              }}
            >
              View All
            </Link>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 14,
              flex: 1,
              justifyContent: "space-around",
            }}
          >
            {recentOrders.map((order, idx) => (
              <div
                key={order._id || order.id || order.orderNumber || idx}
                style={{ display: "flex", alignItems: "center", gap: 10 }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Link
                    to={`/admin/orders/${order.id}`}
                    style={{
                      fontSize: 12,
                      fontWeight: 500,
                      color: "var(--color-text-primary)",
                      textDecoration: "none",
                      display: "block",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {order.orderNumber}
                  </Link>
                  <span
                    style={{ fontSize: 11, color: "var(--color-text-caption)" }}
                  >
                    {order.customerName}
                  </span>
                </div>
                <div>
                  <StatusBadge status={order.status} />
                </div>
                <div style={{ textAlign: "right" }}>
                  <p
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: "var(--color-text-primary)",
                    }}
                  >
                    {formatCurrency(order.total)}
                  </p>
                  <span
                    style={{
                      fontSize: 10,
                      color: "var(--color-text-caption)",
                      display: "block",
                      marginTop: 2,
                    }}
                  >
                    {formatDate(order.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Sales by Channel + Orders Bar Chart + Inventory Summary */}
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}
        className="dashboard-grid-three-col"
      >
        {/* Orders Bar Chart */}
        <div className="card" style={{ padding: "24px" }}>
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--color-text-secondary)",
              display: "block",
              marginBottom: 20,
            }}
          >
            Orders Overview
          </span>
          <div style={{ height: 160 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={(data?.monthlyReport || []).slice(-7)}
                margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
              >
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 10, fill: "var(--color-text-caption)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "var(--color-text-caption)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip />
                <Bar
                  dataKey="orders"
                  fill="#B58A5B"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Inventory Summary */}
        <div
          className="card"
          style={{ padding: "24px", display: "flex", flexDirection: "column" }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "var(--color-text-secondary)",
              }}
            >
              Inventory
            </span>
            <Link
              to="/admin/products"
              className="btn btn-ghost btn-sm"
              style={{
                fontSize: 11,
                padding: "2px 8px",
                textTransform: "capitalize",
                letterSpacing: "0",
              }}
            >
              View All
            </Link>
          </div>
          {(() => {
            const totalProdCount = data?.stats?.totalProducts || 0;
            const lowStockCount = data?.stats?.lowStockCount || 0;
            const outOfStockCount = data?.stats?.outOfStockCount || 0;
            const inStockCount =
              data?.stats?.inStockCount ??
              Math.max(0, totalProdCount - lowStockCount - outOfStockCount);
            const inStockRatio =
              totalProdCount > 0 ? inStockCount / totalProdCount : 1;
            const inStockPct = Math.round(inStockRatio * 100);

            return (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 24,
                  flex: 1,
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    position: "relative",
                    width: 100,
                    height: 100,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <svg
                    width="100"
                    height="100"
                    viewBox="0 0 100 100"
                    style={{ transform: "rotate(-90deg)" }}
                  >
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="transparent"
                      stroke="#F0ECE8"
                      strokeWidth="6"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="transparent"
                      stroke="#B58A5B"
                      strokeWidth="6"
                      strokeDasharray={2 * Math.PI * 42}
                      strokeDashoffset={2 * Math.PI * 42 * (1 - inStockRatio)}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div style={{ position: "absolute", textAlign: "center" }}>
                    <p
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: "var(--color-text-primary)",
                        margin: 0,
                      }}
                    >
                      {inStockPct}%
                    </p>
                    <span
                      style={{
                        fontSize: 9,
                        color: "var(--color-text-caption)",
                        textTransform: "uppercase",
                      }}
                    >
                      In Stock
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    flex: 1,
                  }}
                >
                  {[
                    {
                      label: "Total Products",
                      value: totalProdCount,
                      color: "#222222",
                    },
                    {
                      label: "In Stock",
                      value: inStockCount,
                      color: "#2E7D32",
                    },
                    {
                      label: "Low Stock",
                      value: lowStockCount,
                      color: "#D98B2B",
                    },
                    {
                      label: "Out of Stock",
                      value: outOfStockCount,
                      color: "#C94C4C",
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        fontSize: 11,
                      }}
                    >
                      <span style={{ color: "var(--color-text-secondary)" }}>
                        {item.label}
                      </span>
                      <span style={{ fontWeight: 600, color: item.color }}>
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      <style>{`
        @media (max-width: 1280px) {
          .dashboard-kpi-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 1024px) {
          .dashboard-grid-three-col { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 640px) {
          .dashboard-kpi-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
