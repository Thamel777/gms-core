"use client";

import { useEffect, useMemo, useState } from "react";
import { MdSearch, MdVisibility, MdEdit, MdDelete } from "react-icons/md";
import { auth, db } from "@/firebaseConfig";
import { onValue, ref, remove, get } from "firebase/database";
import CreateInvoice, { type InvoicePayload } from "@/components/admin/CreateInvoice";

type InvoiceStatus = "Pending" | "Paid" | "Overdue";

interface InvoiceRow {
  id: string;
  company_name: string;
  amount: number;
  date: number;
  due_date?: number | null;
  status: InvoiceStatus;
  updatedAt?: number;
}

interface Props { onNavigate?: (p: string) => void }

export default function InvoiceManagement({ onNavigate }: Props) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"All" | InvoiceStatus>("All");
  const [rowBusy, setRowBusy] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [editData, setEditData] = useState<InvoicePayload | null>(null);
  const [readOnly, setReadOnly] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t); } }, [toast]);

  useEffect(() => {
    const u = auth().onAuthStateChanged(async (user) => {
      if (!user) { setIsAdmin(false); return; }
      try {
        const r = await user.getIdTokenResult();
        const c: Record<string, unknown> = r.claims || {};
        const ok = c.admin === true || c.isAdmin === true || ["admin", "superadmin", "owner"].includes(String(c.role || "").toLowerCase());
        setIsAdmin(ok);
      } catch {
        setIsAdmin(false);
      }
    });
    return () => u();
  }, []);

  const fmtAmt = (n: number) => new Intl.NumberFormat(undefined, { style: "currency", currency: "LKR" }).format(n || 0);
  const fmtDate = (ms?: number | null) => (!ms ? "-" : new Date(ms).toLocaleDateString());

  useEffect(() => {
    if (!isAdmin) return;

    setLoading(true);
    const dbInstance = db();
    const unsubscribe = onValue(ref(dbInstance, "/invoices"), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list: InvoiceRow[] = Object.keys(data).map(key => {
          const invoice = data[key];
          return {
            id: invoice.id || key,
            company_name: invoice.company_name || "",
            amount: Number(invoice.amount || 0),
            date: Number(invoice.date || 0),
            due_date: invoice.due_date != null ? Number(invoice.due_date) : null,
            status: toStatus(invoice.status),
            updatedAt: Number(invoice.updatedAt || 0) || undefined
          };
        });
        list.sort((a, b) => (b.date || 0) - (a.date || 0));
        setInvoices(list);
      } else {
        setInvoices([]);
      }
      setLoading(false);
    }, (error) => {
      setToast({ type: "error", msg: "Failed to load invoices" });
      setInvoices([]);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isAdmin]);

  const openCreate = () => { setMode("create"); setEditData(null); setReadOnly(false); setOpen(true); };

  const openEdit = async (id: string) => {
    try {
      const dbInstance = db();
      const snapshot = await get(ref(dbInstance, `invoices/${id}`));
      if (snapshot.exists()) {
        const d = snapshot.val();
        const rec: InvoicePayload = {
          id: String(d.id ?? id),
          company_name: String(d.company_name ?? ""),
          description: (d.description as string) ?? "",
          date: Number(d.date ?? Date.now()),
          due_date: d.due_date != null ? Number(d.due_date) : null,
          status: toStatus(d.status),
          line_items: (Array.isArray(d.line_items) ? d.line_items : []) as InvoicePayload['line_items']
        };
        setEditData(rec);
        setMode("edit");
        setReadOnly(rec.status === "Paid");
        setOpen(true);
      } else {
        setToast({ type: "error", msg: "Invoice not found" });
      }
    } catch (e: unknown) {
      setToast({ type: "error", msg: String((e as Error)?.message || "Failed to load invoice") });
    }
  };

  const openView = async (id: string) => {
    try {
      const dbInstance = db();
      const snapshot = await get(ref(dbInstance, `invoices/${id}`));
      if (snapshot.exists()) {
        const d = snapshot.val();
        const rec: InvoicePayload = {
          id: String(d.id ?? id),
          company_name: String(d.company_name ?? ""),
          description: (d.description as string) ?? "",
          date: Number(d.date ?? Date.now()),
          due_date: d.due_date != null ? Number(d.due_date) : null,
          status: toStatus(d.status),
          line_items: (Array.isArray(d.line_items) ? d.line_items : []) as InvoicePayload['line_items']
        };
        setEditData(rec);
        setMode("edit");
        setReadOnly(true);
        setOpen(true);
      } else {
        setToast({ type: "error", msg: "Invoice not found" });
      }
    } catch (e: unknown) {
      setToast({ type: "error", msg: String((e as Error)?.message || "Failed to load invoice") });
    }
  };

  const doDelete = async (id: string) => {
    if (!confirm("Delete this invoice? This action cannot be undone.")) return;
    setRowBusy(id);
    try {
      const dbInstance = db();
      await remove(ref(dbInstance, `/invoices/${id}`));
      setInvoices((p) => p.filter((r) => r.id !== id));
      setToast({ type: "success", msg: "Invoice deleted" });
    } catch (e: unknown) {
      setToast({ type: "error", msg: String((e as Error)?.message || "Delete failed") });
    } finally {
      setRowBusy(null);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return invoices.filter(r =>
      (!q || r.id.toLowerCase().includes(q) || r.company_name.toLowerCase().includes(q)) &&
      (status === "All" || r.status === status)
    );
  }, [invoices, search, status]);

  const sums = useMemo(() => {
    const total = invoices.reduce((s, r) => s + (r.amount || 0), 0);
    const paid = invoices.filter(r => r.status === "Paid").reduce((s, r) => s + (r.amount || 0), 0);
    const pending = invoices.filter(r => r.status === "Pending").reduce((s, r) => s + (r.amount || 0), 0);
    const overdue = invoices.filter(r => r.status === "Overdue").reduce((s, r) => s + (r.amount || 0), 0);
    return { total, paid, pending, overdue };
  }, [invoices]);

  if (isAdmin === false) return (
    <div className="flex-1 p-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
          Admin only. Please sign in with an admin account.
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex-1 p-8">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-sm border ${toast.type === "success" ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}`}>
          {toast.msg}
        </div>
      )}

      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-blue-600 mb-1">Invoices</h1>
            <p className="text-gray-600 text-base">Admin can view and manage invoices</p>
          </div>
          <button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2">
            + Add Invoice
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card dot="bg-blue-500" label="Total Amount" value={fmtAmt(sums.total)} />
        <Card dot="bg-green-500" label="Paid" value={fmtAmt(sums.paid)} />
        <Card dot="bg-yellow-500" label="Pending" value={fmtAmt(sums.pending)} />
        <Card dot="bg-red-500" label="Overdue" value={fmtAmt(sums.overdue)} />
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-blue-200 p-6 mb-8">
        <div className="flex items-center mb-4">
          <svg className="w-4 h-4 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
          </svg>
          <h2 className="text-sm font-medium text-blue-600">Filters</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative md:col-span-2">
            <MdSearch className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search by ID or Company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 pl-10 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as "All" | InvoiceStatus)}
            className="px-4 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="All">All</option>
            <option value="Pending">Pending</option>
            <option value="Paid">Paid</option>
            <option value="Overdue">Overdue</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-blue-200">
        <div className="px-6 py-4 border-b border-blue-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-blue-600">Invoices</h2>
            <p className="text-sm text-gray-500">{filtered.length} invoices found</p>
          </div>
          {loading && <div className="text-sm text-gray-500">Loading…</div>}
        </div>

        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-8 gap-4 text-sm font-medium text-gray-500">
            <div>ID</div>
            <div>Company</div>
            <div className="text-right">Amount</div>
            <div>Invoice Date</div>
            <div>Due Date</div>
            <div>Status</div>
            <div>Updated</div>
            <div className="text-right">Actions</div>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {filtered.map((r) => (
            <div key={r.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="grid grid-cols-8 gap-4 items-center">
                <div className="font-medium text-blue-600 truncate" title={r.id}>{r.id}</div>
                <div className="truncate" title={r.company_name}>{r.company_name}</div>
                <div className="font-medium text-gray-900 text-right">{fmtAmt(r.amount)}</div>
                <div>{fmtDate(r.date)}</div>
                <div>{fmtDate(r.due_date ?? undefined)}</div>
                <div>{badge(r.status)}</div>
                <div>{fmtDate(r.updatedAt)}</div>
                <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                  <button
                    className="p-1.5 rounded hover:bg-blue-50 text-blue-600"
                    onClick={() => openView(r.id)}
                    aria-label="View"
                    title="View"
                    type="button"
                  >
                    <MdVisibility className="w-4 h-4 inline align-middle" />
                  </button>
                  <button
                    className="p-1.5 rounded hover:bg-blue-50 text-blue-600"
                    onClick={() => openEdit(r.id)}
                    aria-label="Edit"
                    title="Edit"
                    type="button"
                  >
                    <MdEdit className="w-4 h-4 inline align-middle" />
                  </button>
                  <button
                    className="p-1.5 rounded hover:bg-red-50 text-red-700 disabled:opacity-60"
                    onClick={() => doDelete(r.id)}
                    disabled={rowBusy === r.id}
                    aria-label="Delete"
                    title="Delete"
                    type="button"
                  >
                    <MdDelete className="w-4 h-4 inline align-middle" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 right-0 left-0 md:left-64 bg-white shadow-xl border-l border-blue-200 overflow-auto">
            <CreateInvoice
              mode={mode}
              initialId={editData?.id}
              initialData={editData ?? undefined}
              readOnly={readOnly}
              onClose={() => setOpen(false)}
              onSuccess={() => setOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function toStatus(s: unknown): InvoiceStatus {
  const v = String(s || "Pending").toLowerCase();
  if (v.includes("paid")) return "Paid";
  if (v.includes("overdue")) return "Overdue";
  return "Pending";
}

function badge(s: InvoiceStatus) {
  if (s === "Paid") return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Paid</span>;
  if (s === "Overdue") return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Overdue</span>;
  return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Pending</span>;
}

function Card({ dot, label, value }: { dot: string; label: string; value: string }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-blue-200 p-6">
      <div className="flex items-center">
        <div className={`w-3 h-3 ${dot} rounded-full mr-3`}></div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-xl font-bold">{value}</p>
        </div>
      </div>
    </div>
  );
}
