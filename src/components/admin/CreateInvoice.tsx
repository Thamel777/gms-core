"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Plus, Trash2, X } from "lucide-react";
import { ref, set, update, get } from "firebase/database";
import { db, auth } from "@/firebaseConfig";
import { createInvoiceNotification } from "@/services/notificationService";

type InvoiceStatus = "Pending" | "Paid" | "Overdue";

interface LineItemRow {
  id: string;
  description: string;
  qty?: number;
  unit_price?: number;
  amount?: number;
}

export interface InvoicePayload {
  id: string;
  company_name: string;
  description?: string;
  date: number;
  due_date?: number | null;
  status?: InvoiceStatus;
  line_items: LineItemRow[];
}

interface CreateInvoiceProps {
  onBack?: () => void;
  onClose?: () => void;
  onSuccess?: (id: string) => void;
  mode?: "create" | "edit";
  initialId?: string;
  initialData?: Partial<InvoicePayload>;
  readOnly?: boolean;
}

export default function CreateInvoice({
  onBack,
  onClose,
  onSuccess,
  mode = "create",
  initialId,
  initialData,
  readOnly = false,
}: CreateInvoiceProps) {
  const [id, setId] = useState(initialId ?? initialData?.id ?? "");
  const [companyName, setCompanyName] = useState(
    initialData?.company_name ?? ""
  );
  const [desc, setDesc] = useState(initialData?.description ?? "");
  const [date, setDate] = useState<string>(() =>
    toInputDate(initialData?.date ?? Date.now())
  );
  const [dueDate, setDueDate] = useState<string>(
    initialData?.due_date ? toInputDate(initialData.due_date) : ""
  );
  const [status, setStatus] = useState<InvoiceStatus>(
    (initialData?.status as InvoiceStatus) ?? "Pending"
  );
  const [items, setItems] = useState<LineItemRow[]>(() => {
    const base: LineItemRow[] = (initialData?.line_items as LineItemRow[])?.map(
      (it, idx) => ({
        id: (it.id ?? String(idx + 1)) as string,
        description: it.description ?? "",
        qty: toNumber(it.qty, 0),
        unit_price: toNumber(it.unit_price, 0),
        amount: toOptionalNumber(it.amount),
      })
    ) ?? [
      {
        id: "1",
        description: "",
        qty: 1,
        unit_price: 0,
        amount: undefined,
      },
    ];
    return base.length ? base : [{ id: "1", description: "", qty: 1, unit_price: 0 }];
  });

  const [submitting, setSubmitting] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ type: "success" | "error"; msg: string } | null>(
    null
  );

  const quickAddServices: { name: string; price: number }[] = [
    { name: "Generator Maintenance", price: 15000 },
    { name: "Battery Replacement", price: 8000 },
    { name: "Oil Change Service", price: 3500 },
    { name: "Filter Replacement", price: 2500 },
    { name: "Emergency Repair", price: 18000 },
    { name: "Installation Service", price: 12000 },
    { name: "Annual Service Contract", price: 75000 },
  ];

  const addQuickService = (service: { name: string; price: number }) => {
    if (readOnly) return;
    setItems((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        description: service.name,
        qty: 1,
        unit_price: service.price,
        amount: undefined,
      },
    ]);
  };

  useEffect(() => {
    if (banner) {
      const t = setTimeout(() => setBanner(null), 3500);
      return () => clearTimeout(t);
    }
  }, [banner]);

  const totals = useMemo(() => {
    const lines = items.map((it) =>
      hasAmountValue(it.amount)
        ? Math.max(0, Number(it.amount) || 0)
        : Math.max(0, toNumber(it.qty, 0) * toNumber(it.unit_price, 0))
    );
    const subtotal = lines.reduce((a, b) => a + b, 0);
    return { subtotal, total: subtotal };
  }, [items]);

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat(undefined, { style: "currency", currency: "LKR" }).format(
      n || 0
    );

  const addRow = () => {
    setItems((prev) => [
      ...prev,
      { id: String(Date.now()), description: "", qty: 1, unit_price: 0 },
    ]);
  };

  const removeRow = (rid: string) => {
    setItems((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== rid) : prev));
  };

  const updateRow = (
    rid: string,
    field: keyof LineItemRow,
    value: string | number | undefined
  ) => {
    setItems((prev) =>
      prev.map((r) =>
        r.id === rid
          ? {
              ...r,
              [field]:
                field === "qty" || field === "unit_price" || field === "amount"
                  ? toOptionalNumber(value)
                  : (value as string),
            }
          : r
      )
    );
  };

  const handleSubmit = async () => {
    setError(null);
    if (!id.trim()) {
      setError("Invoice ID is required.");
      return;
    }
    if (!companyName.trim()) {
      setError("Company name is required.");
      return;
    }
    const dateMs = fromInputDate(date);
    const dueMs = dueDate ? fromInputDate(dueDate) : null;
    if (dueMs && dueMs < dateMs) {
      setError("Due date must be on or after invoice date.");
      return;
    }
    for (const [idx, it] of items.entries()) {
      const hasAmount = hasAmountValue(it.amount);
      const qty = toNumber(it.qty, 0);
      const unit = toNumber(it.unit_price, 0);
      const amt = toNumber(it.amount, 0);
      if (!it.description?.trim()) {
        setError(`Line ${idx + 1}: description is required.`);
        return;
      }
      if (hasAmount) {
        if (amt < 0) {
          setError(`Line ${idx + 1}: amount must be >= 0.`);
          return;
        }
      } else {
        if (qty <= 0) {
          setError(`Line ${idx + 1}: quantity must be > 0.`);
          return;
        }
        if (unit < 0) {
          setError(`Line ${idx + 1}: unit price must be >= 0.`);
          return;
        }
      }
    }

    const totalAmount = items.reduce((sum, it) =>
      sum + (hasAmountValue(it.amount) ? Number(it.amount) || 0 : toNumber(it.qty, 0) * toNumber(it.unit_price, 0)), 0
    );

    const lineItemsData = items.map((it) => {
      const lineItem: Partial<LineItemRow> = {
        id: it.id,
        description: it.description,
      };

      if (hasAmountValue(it.amount)) {
        lineItem.amount = Number(it.amount) || 0;
      } else {
        lineItem.qty = toNumber(it.qty, 0);
        lineItem.unit_price = toNumber(it.unit_price, 0);
      }

      return lineItem;
    });

    const payload = {
      id: id.trim(),
      company_name: companyName.trim(),
      description: desc?.trim() || "",
      date: fromInputDate(date),
      due_date: dueDate ? fromInputDate(dueDate) : null,
      status,
      line_items: lineItemsData,
      amount: totalAmount,
      updatedAt: Date.now(),
    };

    setSubmitting(true);
    try {
      const dbInstance = db();
      const currentUser = auth().currentUser;

      if (mode === "edit") {
        await update(ref(dbInstance, `invoices/${payload.id}`), payload);
        setBanner({ type: "success", msg: "Invoice updated successfully" });

        if (currentUser?.uid) {
          try {
            await createInvoiceNotification(
              currentUser.uid,
              'updated',
              payload.id,
              payload.company_name
            );
          } catch (notifError) {
            console.error("Failed to create notification:", notifError);
          }
        }
      } else {
        const snapshot = await get(ref(dbInstance, `invoices/${payload.id}`));
        if (snapshot.exists()) {
          setError("An invoice with this ID already exists. Please use a different ID.");
          setSubmitting(false);
          return;
        }

        await set(ref(dbInstance, `invoices/${payload.id}`), payload);
        setBanner({ type: "success", msg: "Invoice created successfully" });

        if (currentUser?.uid) {
          try {
            await createInvoiceNotification(
              currentUser.uid,
              'created',
              payload.id,
              payload.company_name
            );
          } catch (notifError) {
            console.error("Failed to create notification:", notifError);
          }
        }
      }

      onSuccess?.(payload.id);
      if (onClose) onClose();
      else onBack?.();
    } catch (e: unknown) {
      const error = e as { code?: string; message?: string };
      console.error("Invoice save error:", error);

      let errorMessage = "Failed to save invoice. Please try again.";
      if (error?.code === 'PERMISSION_DENIED') {
        errorMessage = "Permission denied. Please check your access rights.";
      } else if (error?.message) {
        errorMessage = `Error: ${error.message}`;
      }

      setError(errorMessage);
      setBanner({ type: "error", msg: errorMessage });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!id) return;
    setSavingStatus(true);
    try {
      const dbInstance = db();
      const currentUser = auth().currentUser;

      await update(ref(dbInstance, `invoices/${id}`), {
        status,
        updatedAt: Date.now()
      });
      setBanner({ type: "success", msg: "Status updated successfully" });

      if (currentUser?.uid && status === "Paid") {
        try {
          await createInvoiceNotification(
            currentUser.uid,
            'paid',
            id,
            companyName
          );
        } catch (notifError) {
          console.error("Failed to create notification:", notifError);
        }
      }
    } catch (e: unknown) {
      const error = e as { code?: string; message?: string };
      console.error("Status update error:", error);
      const errorMsg = error?.message || "Failed to update status";
      setBanner({ type: "error", msg: errorMsg });
    } finally {
      setSavingStatus(false);
    }
  };

  return (
    <div className="flex-1 p-6 md:p-8">
      {banner && (
        <div
          className={`mb-4 px-4 py-2 rounded-lg border ${
            banner.type === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {banner.msg}
        </div>
      )}

      <div className="mb-6">
        <div className="flex items-center gap-3">
          {(onBack || onClose) && (
            <button
              onClick={() => (onClose ? onClose() : onBack?.())}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {onClose ? (
                <X className="w-5 h-5 text-gray-600" />
              ) : (
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              )}
            </button>
          )}
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-blue-600 mb-1">
              {mode === "edit" ? "Edit Invoice" : "Create Invoice"}
            </h1>
            <p className="text-gray-600 text-sm md:text-base">
              {mode === "edit" ? "Update invoice details" : "Create a new invoice"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-y-6 md:gap-y-8 gap-x-0">
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-blue-200 p-6">
            <div className="flex items-center mb-4">
              <svg
                className="w-4 h-4 mr-2 text-blue-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-6a1 1 0 00-1-1H9a1 1 0 00-1 1v6a1 1 0 01-1 1H4a1 1 0 110-2V4z"
                  clipRule="evenodd"
                />
              </svg>
              <h2 className="text-lg font-semibold text-blue-600">Invoice Information</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Invoice ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. INV-0001"
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  disabled={mode === "edit" || readOnly}
                  className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name
                </label>
                <input
                  type="text"
                  placeholder="Company or Client name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  disabled={readOnly}
                  className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  placeholder="Optional description"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  disabled={readOnly}
                  rows={3}
                  className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Invoice Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  disabled={readOnly}
                  className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date (optional)
                </label>
                <input
                  type="date"
                  value={dueDate}
                  min={date}
                  onChange={(e) => setDueDate(e.target.value)}
                  disabled={readOnly}
                  className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-blue-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v1H3V4zm0 3h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V7zm4 3a1 1 0 000 2h6a1 1 0 100-2H7z" />
                </svg>
                <h2 className="text-lg font-semibold text-blue-600">Line Items</h2>
              </div>
              {!readOnly && (
                <button
                  onClick={addRow}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm"
                >
                  <Plus className="w-4 h-4" /> Add Item
                </button>
              )}
            </div>

            <div className="hidden md:grid grid-cols-12 gap-3 text-sm font-medium text-gray-500 mb-2">
              <div className="col-span-5">Description</div>
              <div className="col-span-2">Qty</div>
              <div className="col-span-2">Unit Price</div>
              <div className="col-span-2">Amount (override)</div>
              <div className="col-span-1 text-right">Actions</div>
            </div>
            <div className="divide-y divide-gray-200 overflow-x-auto">
              {items.map((row) => {
                const live =
                  hasAmountValue(row.amount)
                    ? Math.max(0, Number(row.amount) || 0)
                    : Math.max(0, toNumber(row.qty, 0) * toNumber(row.unit_price, 0));
                return (
                  <div
                    key={row.id}
                    className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start md:items-center py-3"
                  >
                    <label className="md:hidden text-xs text-gray-500">Description</label>
                    <input
                      type="text"
                      value={row.description}
                      onChange={(e) => updateRow(row.id, "description", e.target.value)}
                      disabled={readOnly}
                      className="md:col-span-5 col-span-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                      placeholder="Item description"
                    />
                    <label className="md:hidden text-xs text-gray-500">Qty</label>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      inputMode="numeric"
                      value={row.qty ?? ""}
                      onChange={(e) => updateRow(row.id, "qty", toOptionalNumber(e.target.value))}
                      disabled={readOnly || hasAmountValue(row.amount)}
                      className="md:col-span-2 col-span-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                    />
                    <label className="md:hidden text-xs text-gray-500">Unit Price</label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      inputMode="decimal"
                      value={row.unit_price ?? ""}
                      onChange={(e) => updateRow(row.id, "unit_price", toOptionalNumber(e.target.value))}
                      disabled={readOnly || hasAmountValue(row.amount)}
                      className="md:col-span-2 col-span-1 w-full px-3 py-2 text-right border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                    />
                    <label className="md:hidden text-xs text-gray-500">Amount (override)</label>
                    <div className="md:col-span-2 col-span-1 relative">
                      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-500 text-sm">LKR</span>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        inputMode="decimal"
                        value={row.amount ?? ""}
                        onChange={(e) => updateRow(row.id, "amount", toOptionalNumber(e.target.value))}
                        disabled={readOnly}
                        placeholder={formatPlain(live)}
                        className="w-full px-3 py-2 pl-12 text-right border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                      />
                    </div>
                    <div className="md:col-span-1 col-span-1 flex items-center justify-end gap-2">
                      {!readOnly && (
                        <button
                          onClick={() => removeRow(row.id)}
                          className="p-2 text-gray-400 hover:text-red-600 rounded-lg"
                          disabled={items.length === 1}
                          title="Remove row"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-blue-200 p-6">
            <h2 className="text-lg font-semibold text-blue-600 mb-2">Quick Add Services</h2>
            <p className="text-sm text-gray-500 mb-4">Common services for quick selection</p>
            <div className="space-y-2">
              {quickAddServices.map((service, idx) => (
                <button
                  key={`${service.name}-${idx}`}
                  onClick={() => addQuickService(service)}
                  disabled={readOnly}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 disabled:opacity-60 rounded-lg transition-colors text-left"
                >
                  <span className="text-sm text-gray-700">{service.name}</span>
                  <span className="text-sm font-medium text-gray-900">{formatCurrency(service.price)}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-blue-200 p-6">
            {mode === "edit" && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Invoice Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as InvoiceStatus)}
                  className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Pending">Pending</option>
                  <option value="Paid">Paid</option>
                  <option value="Overdue">Overdue</option>
                </select>
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={handleUpdateStatus}
                    disabled={savingStatus}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                  >
                    Update Status
                  </button>
                </div>
              </div>
            )}
            <div className="flex items-center mb-4">
              <svg className="w-4 h-4 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" />
              </svg>
              <h2 className="text-lg font-semibold text-blue-600">Totals</h2>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">{formatCurrency(totals.subtotal)}</span>
              </div>
              <div className="border-t border-gray-200 pt-2 flex justify-between">
                <span className="text-gray-900 font-semibold">Total</span>
                <span className="text-blue-600 font-bold">{formatCurrency(totals.total)}</span>
              </div>
            </div>
            {error && (
              <div className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-2">
                {error}
              </div>
            )}
            <div className="mt-6 space-y-3">
              {!readOnly && (
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                >
                  {mode === "edit" ? "Save Changes" : "Save Invoice"}
                </button>
              )}
              <button
                onClick={() => (onClose ? onClose() : onBack?.())}
                className="w-full bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                {readOnly ? "Close" : "Cancel"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function toInputDate(msOrStr: number | string): string {
  const d = typeof msOrStr === "number" ? new Date(msOrStr) : new Date(msOrStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function fromInputDate(input: string): number {
  const [y, m, d] = input.split("-").map((x) => parseInt(x, 10));
  const dt = new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0);
  return dt.getTime();
}

function toNumber(v: string | number | undefined | null, fallback: number): number {
  const n = typeof v === "string" ? Number(v) : (v as number);
  return Number.isFinite(n) ? n : fallback;
}

function toOptionalNumber(v: string | number | undefined | null): number | undefined {
  if (v === undefined || v === null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function hasAmountValue(v: string | number | undefined | null): boolean {
  return !(v === undefined || v === null || v === "");
}

function formatPlain(n: number): string {
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n || 0);
}
