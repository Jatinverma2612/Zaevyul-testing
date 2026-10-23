import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, Pencil, Trash2, ExternalLink, Globe } from "lucide-react";
import { formatDate } from "../../../lib/mockData";
import PageHeader from "../../../components/PageHeader";
import DataTable from "../../../components/DataTable";
import StatusBadge from "../../../components/StatusBadge";
import { DeleteDialog } from "../../../components/Modal";
import { useToast } from "../../../context/ToastContext";
import { api } from "../../../lib/api";

export default function MediaCoverage() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [filter, setFilter] = useState("");

  const fetchItems = async () => {
    try {
      setLoading(true);
      const data = await api.mediaCoverage.list();
      setItems(data || []);
    } catch {
      toast("Failed to load media coverage entries", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const filtered = useMemo(() => {
    setSelected([]);
    return items.filter((b) => !filter || b.status === filter);
  }, [items, filter]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await api.mediaCoverage.delete(deleteTarget);
      setItems((prev) => prev.filter((b) => (b._id || b.id) !== deleteTarget));
      setSelected((s) => s.filter((id) => id !== deleteTarget));
      toast("Media coverage entry deleted", "success");
    } catch {
      toast("Failed to delete media coverage entry", "error");
    } finally {
      setDeleteTarget(null);
      setDeleteLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    setDeleteLoading(true);
    try {
      await Promise.all(selected.map((id) => api.mediaCoverage.delete(id)));
      setItems((prev) => prev.filter((b) => !selected.includes(b._id || b.id)));
      toast(`${selected.length} entries deleted`, "success");
    } catch {
      toast("Failed to delete selected entries", "error");
    } finally {
      setSelected([]);
      setBulkDeleteConfirm(false);
      setDeleteLoading(false);
    }
  };

  const COLUMNS = [
    {
      key: "image",
      label: "Image",
      width: 60,
      render: (val, row) => {
        const imgUrl = row.imageUrl || row.image?.url;
        return (
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 4,
              overflow: "hidden",
              background: "var(--color-bg-secondary, #FAF8F5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid var(--color-border, #E7DED3)",
            }}
          >
            {imgUrl ? (
              <img
                src={imgUrl}
                alt={row.title}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <Globe size={18} style={{ color: "var(--color-text-caption, #8A857E)" }} />
            )}
          </div>
        );
      },
    },
    {
      key: "title",
      label: "Article Title",
      sortable: true,
      maxWidth: 320,
      render: (val, row) => {
        const itemId = row._id || row.id;
        return (
          <div>
            <Link
              to={`/admin/media-coverage/${itemId}`}
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "var(--color-text-primary)",
                textDecoration: "none",
              }}
              onMouseOver={(e) => (e.target.style.color = "var(--color-walnut, #B58A5B)")}
              onMouseOut={(e) => (e.target.style.color = "var(--color-text-primary)")}
            >
              {val}
            </Link>
            {row.excerpt && (
              <p
                style={{
                  fontSize: 11,
                  color: "var(--color-text-caption)",
                  marginTop: 2,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: 300,
                }}
              >
                {row.excerpt}
              </p>
            )}
          </div>
        );
      },
    },
    {
      key: "sourceName",
      label: "Publication / Source",
      sortable: true,
      render: (val) => (
        <span style={{ fontSize: 12, color: "var(--color-text-secondary)", fontWeight: 500 }}>
          {val || <em style={{ color: "var(--color-text-caption)" }}>General</em>}
        </span>
      ),
    },
    {
      key: "articleUrl",
      label: "Article URL",
      render: (val) => {
        if (!val) return "—";
        const formatted = val.startsWith("http") ? val : `https://${val}`;
        return (
          <a
            href={formatted}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: 12,
              color: "var(--color-walnut, #B58A5B)",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              textDecoration: "none",
              maxWidth: 180,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={formatted}
          >
            <span>Visit</span>
            <ExternalLink size={11} />
          </a>
        );
      },
    },
    { key: "status", label: "Status", render: (val) => <StatusBadge status={val} /> },
    {
      key: "publishedAt",
      label: "Published",
      sortable: true,
      render: (val) => (
        <span style={{ fontSize: 12, color: "var(--color-text-caption)" }}>{formatDate(val)}</span>
      ),
    },
    {
      key: "id",
      label: "",
      render: (val, row) => {
        const itemId = row._id || row.id;
        return (
          <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
            <Link to={`/admin/media-coverage/${itemId}`} className="btn btn-ghost btn-sm" title="Edit">
              <Pencil size={13} />
            </Link>
            <button
              className="btn btn-ghost btn-sm"
              style={{ color: "var(--color-error, #D32F2F)" }}
              onClick={() => setDeleteTarget(itemId)}
              title="Delete"
            >
              <Trash2 size={13} />
            </button>
          </div>
        );
      },
    },
  ];

  if (loading) {
    return (
      <div className="page flex-center py-20">
        <div className="spinner" />
      </div>
    );
  }

  const activeRowKey = items[0]?._id ? "_id" : "id";

  return (
    <div className="page page-enter">
      <PageHeader
        title="Media Coverage"
        subtitle={`${items.length} articles & publications`}
        crumbs={[{ label: "Media Coverage" }]}
        actions={
          <Link to="/admin/media-coverage/new" className="btn btn-primary">
            <Plus size={14} /> New Entry
          </Link>
        }
      />

      {/* Bulk action bar */}
      {selected.length > 0 && (
        <div className="bulk-bar">
          <span>{selected.length} selected</span>
          <button
            className="btn btn-sm"
            style={{ background: "rgba(255,255,255,0.15)", color: "white", marginLeft: "auto" }}
            onClick={() => setBulkDeleteConfirm(true)}
          >
            <Trash2 size={12} /> Delete
          </button>
          <button
            className="btn btn-sm"
            style={{ background: "rgba(255,255,255,0.1)", color: "white" }}
            onClick={() => setSelected([])}
          >
            Clear
          </button>
        </div>
      )}

      <div className="table-wrap">
        <div className="table-toolbar">
          {["", "published", "draft"].map((s) => (
            <button
              key={s || "all"}
              className={`tab ${filter === s ? "active" : ""}`}
              style={{ border: "none", background: "none", cursor: "pointer" }}
              onClick={() => setFilter(s)}
            >
              {s === "" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}{" "}
              ({s === "" ? items.length : items.filter((b) => b.status === s).length})
            </button>
          ))}
          <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--color-text-caption)" }}>
            {filtered.length} entries
          </span>
        </div>

        <DataTable
          columns={COLUMNS}
          data={filtered}
          selectable
          selected={selected}
          onSelect={setSelected}
          pageSize={12}
          rowKey={activeRowKey}
          emptyTitle="No media coverage entries found"
        />
      </div>

      <DeleteDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Delete Media Coverage"
        desc="This media coverage entry will be permanently removed. This action cannot be undone."
      />

      <DeleteDialog
        open={bulkDeleteConfirm}
        onClose={() => setBulkDeleteConfirm(false)}
        onConfirm={handleBulkDelete}
        loading={deleteLoading}
        title="Delete Selected Entries"
        desc={`Are you sure you want to delete ${selected.length} selected entry/entries? This action cannot be undone.`}
      />
    </div>
  );
}
