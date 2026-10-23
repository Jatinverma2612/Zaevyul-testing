import { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  Hash,
  BadgePercent,
  IndianRupee,
  CalendarDays,
  FileText,
  Users,
  Copy,
  Check,
} from "lucide-react";
import { formatDate, formatCurrency } from "../../lib/mockData";
import PageHeader from "../../components/PageHeader";
import Pagination from "../../components/Pagination";
import { Modal, DeleteDialog } from "../../components/Modal";
import StatusBadge from "../../components/StatusBadge";
import { useToast } from "../../context/ToastContext";
import { api } from "../../lib/api";

const BLANK = {
  code: "",
  type: "percentage",
  value: "",
  description: "",
  expiry: "",
  usageLimit: 1,
  minOrderValue: "",
  active: true,
};
const COUPON_FORM_ID = "coupon-form";

export default function Coupons() {
  const toast = useToast();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [editId, setEditId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [codeCopied, setCodeCopied] = useState(false);

  // ── Fetch from backend ────────────────────────────────────────────────────
  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const data = await api.coupons.list();
      // Normalise: backend uses _id, frontend uses id
      setCoupons((data || []).map((c) => ({ ...c, id: c._id || c.id })));
    } catch (err) {
      toast("Failed to load coupons", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const openNew = () => {
    setForm(BLANK);
    setEditId(null);
    setModal(true);
  };
  const openEdit = (c) => {
    setForm({
      code: c.code || "",
      type: c.type || "percentage",
      value: c.value ?? "",
      description: c.description || "",
      expiry: c.expiry ? c.expiry.slice(0, 10) : "",
      usageLimit: c.usageLimit ?? "",
      minOrderValue: c.minOrderValue ?? "",
      active: c.active ?? true,
    });
    setEditId(c.id);
    setModal(true);
  };

  const handleSave = async (e) => {
    e?.preventDefault();
    if (!form.code.trim()) {
      toast("Coupon code is required", "error");
      return;
    }
    if (!form.value || Number(form.value) <= 0) {
      toast("Coupon value must be greater than zero", "error");
      return;
    }
    if (form.type === "percentage" && Number(form.value) > 100) {
      toast("Percentage coupon value cannot exceed 100", "error");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        code: form.code.toUpperCase().trim(),
        type: form.type,
        value: +form.value,
        description: form.description,
        expiry: form.expiry || null,
        usageLimit: form.usageLimit ? +form.usageLimit : null,
        minOrderValue: form.minOrderValue ? +form.minOrderValue : 0,
        active: form.active,
      };
      if (editId) {
        await api.coupons.update(editId, payload);
        toast("Coupon updated", "success");
      } else {
        await api.coupons.create(payload);
        toast("Coupon created", "success");
      }
      await fetchCoupons();
      setModal(false);
    } catch (err) {
      toast(err.message || "Failed to save coupon", "error");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (id) => {
    try {
      await api.coupons.toggle(id);
      setCoupons((cs) =>
        cs.map((c) => (c.id === id ? { ...c, active: !c.active } : c)),
      );
      toast("Status updated", "success");
    } catch (err) {
      toast("Failed to update status", "error");
    }
  };

  const handleDelete = async () => {
    try {
      setDeleteLoading(true);
      await api.coupons.delete(deleteTarget);
      setCoupons((cs) => cs.filter((c) => c.id !== deleteTarget));
      setDeleteTarget(null);
      toast("Coupon deleted", "success");
    } catch (err) {
      toast("Failed to delete coupon", "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    try {
      setDeleteLoading(true);
      await api.coupons.bulkDelete(selected);
      setCoupons((cs) => cs.filter((c) => !selected.includes(c.id)));
      setSelected([]);
      toast(`${selected.length} coupon(s) deleted`, "success");
    } catch (err) {
      toast("Bulk delete failed", "error");
    } finally {
      setDeleteBulkConfirm(false);
      setDeleteLoading(false);
    }
  };

  const handleCopyCode = async () => {
    const code = form.code.trim();
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 1500);
    } catch {
      toast("Could not copy code", "error");
    }
  };

  const isExpired = (expiry) => expiry && new Date(expiry) < new Date();

  // Pagination
  const totalPages = Math.max(1, Math.ceil(coupons.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = coupons.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );

  const allOnPageSelected =
    paginated.length > 0 && paginated.every((c) => selected.includes(c.id));
  const toggleAll = () => {
    if (allOnPageSelected)
      setSelected((s) => s.filter((id) => !paginated.some((c) => c.id === id)));
    else
      setSelected((s) => [...new Set([...s, ...paginated.map((c) => c.id)])]);
  };
  const toggleRow = (id) =>
    setSelected((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id],
    );

  const couponToDelete = useMemo(
    () => coupons.find((c) => c.id === deleteTarget),
    [coupons, deleteTarget],
  );

  const discountPreview = useMemo(() => {
    if (!form.value || Number(form.value) <= 0) return null;
    return form.type === "percentage"
      ? `${form.value}% OFF`
      : `${formatCurrency(+form.value)} OFF`;
  }, [form.type, form.value]);

  return (
    <div className="page page-enter">
      <PageHeader
        title="Coupons"
        subtitle={`${coupons.filter((c) => c.active).length} active`}
        crumbs={[{ label: "Coupons" }]}
        actions={
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={fetchCoupons}
              title="Refresh"
              disabled={loading}
            >
              <RefreshCw
                size={13}
                style={{
                  animation: loading ? "spin 1s linear infinite" : "none",
                }}
              />
            </button>
            <button className="btn btn-primary" onClick={openNew}>
              <Plus size={14} /> New Coupon
            </button>
          </div>
        }
      />

      {selected.length > 0 && (
        <div className="bulk-bar">
          <span>{selected.length} selected</span>
          <button
            className="btn btn-sm"
            style={{
              background: "rgba(255,255,255,0.15)",
              color: "white",
              marginLeft: "auto",
            }}
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

      <div className="card">
        <div style={{ overflowX: "auto" }}>
          {loading ? (
            <div
              style={{
                padding: "48px 24px",
                textAlign: "center",
                color: "var(--color-text-caption)",
                fontSize: 13,
              }}
            >
              Loading coupons…
            </div>
          ) : coupons.length === 0 ? (
            <div
              style={{
                padding: "48px 24px",
                textAlign: "center",
                color: "var(--color-text-caption)",
                fontSize: 13,
              }}
            >
              No coupons yet. Create your first coupon to get started.
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th style={{ width: 40, paddingLeft: 16 }}>
                    <input
                      type="checkbox"
                      className="table-checkbox"
                      checked={allOnPageSelected}
                      onChange={toggleAll}
                    />
                  </th>
                  <th>Code</th>
                  <th>Type</th>
                  <th>Value</th>
                  <th>Used / Limit</th>
                  <th>Min. Order</th>
                  <th>Expiry</th>
                  <th>Status</th>
                  <th style={{ width: 100 }}></th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((c) => (
                  <tr key={c.id}>
                    <td style={{ paddingLeft: 16, width: 40 }}>
                      <input
                        type="checkbox"
                        className="table-checkbox"
                        checked={selected.includes(c.id)}
                        onChange={() => toggleRow(c.id)}
                      />
                    </td>
                    <td>
                      <code
                        style={{
                          fontSize: 12,
                          background: "var(--color-surface-2)",
                          border: "1px solid var(--color-border)",
                          borderRadius: 3,
                          padding: "2px 7px",
                          letterSpacing: "0.06em",
                          fontWeight: 600,
                        }}
                      >
                        {c.code}
                      </code>
                    </td>
                    <td
                      style={{
                        fontSize: 12,
                        color: "var(--color-text-secondary)",
                        textTransform: "capitalize",
                      }}
                    >
                      {c.type}
                    </td>
                    <td style={{ fontSize: 13, fontWeight: 500 }}>
                      {c.type === "percentage"
                        ? `${c.value}%`
                        : formatCurrency(c.value)}
                    </td>
                    <td
                      style={{
                        fontSize: 12,
                        color: "var(--color-text-secondary)",
                      }}
                    >
                      {c.usedCount ?? 0} / {c.usageLimit || "∞"}
                      {c.usageLimit && (c.usedCount ?? 0) >= c.usageLimit && (
                        <span
                          style={{
                            color: "var(--color-error)",
                            marginLeft: 6,
                            fontSize: 10,
                            fontWeight: 600,
                          }}
                        >
                          MAXED
                        </span>
                      )}
                    </td>
                    <td style={{ fontSize: 12 }}>
                      {c.minOrderValue ? formatCurrency(c.minOrderValue) : "—"}
                    </td>
                    <td
                      style={{
                        fontSize: 12,
                        color: isExpired(c.expiry)
                          ? "var(--color-error)"
                          : "var(--color-text-caption)",
                      }}
                    >
                      {formatDate(c.expiry)}
                      {isExpired(c.expiry) && " (expired)"}
                    </td>
                    <td>
                      <StatusBadge
                        status={
                          c.active && !isExpired(c.expiry)
                            ? "active"
                            : "inactive"
                        }
                      />
                    </td>
                    <td>
                      <div
                        style={{
                          display: "flex",
                          gap: 2,
                          justifyContent: "flex-end",
                        }}
                      >
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => toggleActive(c.id)}
                          title={c.active ? "Deactivate" : "Activate"}
                        >
                          {c.active ? (
                            <ToggleRight
                              size={14}
                              style={{ color: "var(--color-cedar)" }}
                            />
                          ) : (
                            <ToggleLeft size={14} />
                          )}
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => openEdit(c)}
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ color: "var(--color-error)" }}
                          onClick={() => setDeleteTarget(c.id)}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {coupons.length > 0 && (
          <Pagination
            page={safePage}
            totalPages={totalPages}
            total={coupons.length}
            pageSize={pageSize}
            onPage={setPage}
            pageSizeOptions={[10, 25, 50, 100]}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setPage(1);
            }}
          />
        )}
      </div>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editId ? "Edit Coupon" : "New Coupon"}
        size="lg"
        footer={
          <>
            <button
              className="btn btn-secondary"
              onClick={() => setModal(false)}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              type="submit"
              form={COUPON_FORM_ID}
              disabled={saving}
            >
              {saving ? "Saving…" : editId ? "Save" : "Create"}
            </button>
          </>
        }
      >
        <form
          id={COUPON_FORM_ID}
          className="coupon-modal-form"
          onSubmit={handleSave}
        >
          {/* ── Ticket-style summary: code, live discount preview, active toggle ── */}
          <div className="coupon-ticket">
            <div className="coupon-preview-main">
              <span className="coupon-preview-label">Coupon Code</span>
              <div className="coupon-code-row">
                <div className="coupon-code-preview">
                  {form.code.trim() || "WELCOME15"}
                </div>
                {form.code.trim() && (
                  <button
                    type="button"
                    className="coupon-copy-btn"
                    onClick={handleCopyCode}
                    title="Copy code"
                  >
                    {codeCopied ? <Check size={13} /> : <Copy size={13} />}
                  </button>
                )}
              </div>
              <span
                className={`coupon-discount-preview ${discountPreview ? "" : "muted"}`}
              >
                {discountPreview || "Set a value below to preview the discount"}
              </span>
            </div>

            <div className="coupon-preview-divider" aria-hidden="true" />

            <div
              className={`coupon-status-panel ${form.active ? "active" : "inactive"}`}
            >
              <span>{form.active ? "Active" : "Inactive"}</span>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, active: e.target.checked }))
                  }
                />
                <div className="toggle-track" />
                <div className="toggle-thumb" />
              </label>
            </div>
          </div>

          {/* ── Section: Coupon details ── */}
          <div className="coupon-section">
            <span className="coupon-section-title">Coupon Details</span>

            <div className="field-group">
              <label className="field-label">Code *</label>
              <div className="coupon-field-with-icon">
                <Hash size={14} />
                <input
                  className="field-input"
                  value={form.code}
                  placeholder="WELCOME15"
                  style={{
                    textTransform: "uppercase",
                    fontFamily: "monospace",
                    letterSpacing: "0.06em",
                  }}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      code: e.target.value.toUpperCase(),
                    }))
                  }
                />
              </div>
            </div>

            <div className="form-row">
              <div className="field-group">
                <label className="field-label">Type</label>
                <div className="coupon-field-with-icon">
                  <BadgePercent size={14} />
                  <select
                    className="field-select"
                    value={form.type}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, type: e.target.value }))
                    }
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
              </div>
              <div className="field-group">
                <label className="field-label">Value *</label>
                <div className="coupon-field-with-icon">
                  {form.type === "percentage" ? (
                    <BadgePercent size={14} />
                  ) : (
                    <IndianRupee size={14} />
                  )}
                  <input
                    className="field-input"
                    type="number"
                    min="0"
                    value={form.value}
                    placeholder={form.type === "percentage" ? "15" : "2000"}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        value: e.target.value === '' ? '' : Math.max(0, Number(e.target.value))
                      }))
                    }
                  />
                </div>
              </div>
            </div>

            <div className="field-group">
              <label className="field-label">Description</label>
              <div className="coupon-field-with-icon">
                <FileText size={14} />
                <input
                  className="field-input"
                  value={form.description}
                  placeholder="Internal note (not shown to customers)"
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                />
              </div>
              <span className="field-hint">
                Visible to your team only — customers won't see this.
              </span>
            </div>
          </div>

          {/* ── Section: Usage rules & validity ── */}
          <div className="coupon-section">
            <span className="coupon-section-title">
              Usage Rules &amp; Validity
            </span>

            <div className="form-row">
              <div className="field-group">
                <label className="field-label">Usage Limit</label>
                <div className="coupon-field-with-icon">
                  <Users size={14} />
                  <input
                    className="field-input"
                    type="number"
                    value={form.usageLimit}
                    placeholder="Unlimited"
                    min="1"
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        usageLimit: e.target.value === '' ? '' : Math.max(1, Number(e.target.value))
                      }))
                    }
                  />
                </div>
                <span className="field-hint">
                  Leave blank for unlimited redemptions.
                </span>
              </div>
              <div className="field-group">
                <label className="field-label">Min. Order Value</label>
                <div className="coupon-field-with-icon">
                  <IndianRupee size={14} />
                  <input
                    className="field-input"
                    type="number"
                    value={form.minOrderValue}
                    placeholder="0"
                    min="0"
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        minOrderValue: e.target.value === '' ? '' : Math.max(0, Number(e.target.value))
                      }))
                    }
                  />
                </div>
                <span className="field-hint">
                  Minimum cart value required to apply.
                </span>
              </div>
            </div>

            <div className="field-group">
              <label className="field-label">Expiry Date</label>
              <div className="coupon-field-with-icon">
                <CalendarDays size={14} />
                <input
                  className="field-input"
                  type="date"
                  value={form.expiry ? form.expiry.slice(0, 10) : ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, expiry: e.target.value }))
                  }
                />
              </div>
              <span className="field-hint">
                {form.expiry
                  ? `Expires ${formatDate(form.expiry)}`
                  : "Leave blank for no expiry."}
              </span>
            </div>
          </div>
        </form>
      </Modal>

      <DeleteDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Delete coupon"
        desc={
          couponToDelete
            ? `“${couponToDelete.code}” will be permanently removed and can no longer be redeemed at checkout.`
            : "This coupon will be permanently removed."
        }
      />

      <DeleteDialog
        open={bulkDeleteConfirm}
        onClose={() => setBulkDeleteConfirm(false)}
        onConfirm={handleBulkDelete}
        loading={deleteLoading}
        title="Delete selected coupons"
        desc={`Are you sure you want to delete ${selected.length} selected coupon(s)? This action cannot be undone.`}
      />
    </div>
  );
}
