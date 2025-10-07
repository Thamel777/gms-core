"use client";
import React, { useEffect, useMemo, useState } from "react";
import { MdCalendarToday, MdOutlineArrowBack } from "react-icons/md";
import { useParams } from "next/navigation";
import { onValue, ref, get, query, orderByChild, equalTo } from "firebase/database";
import { db } from "../../firebaseConfig";

type RawGeneratorRecord = {
  id?: string;
  brand?: string;
  size?: string;
  serial_no?: string;
  serialNumber?: string;
  issued_date?: number | string | null;
  installed_date?: number | string | null;
  status?: string;
  shop_id?: string;
  location?: string;
  hasAutoStart?: number | boolean;
  hasBatteryCharger?: number | boolean;
  warranty?: number | string | null;
  extracted_parts?: unknown[];
  createdAt?: number;
  updatedAt?: number;
};

type RawServiceLog = {
  id?: string;
  generatorId?: string;
  generator_id?: string;
  generator?: string;
  serviceType?: string;
  type?: string;
  serviceDate?: string | number | null;
  date?: string | number | null;
  nextDueDate?: string | number | null;
  nextServiceDate?: string | number | null;
  technician?: string;
  notes?: string;
  description?: string;
  issue?: string;
  serviceCost?: string | number | null;
  cost?: string | number | null;
  invoiceNo?: string;
  invoice?: string;
  serviceId?: string;
  status?: string;
  statusOverride?: string;
  createdAt?: number;
  updatedAt?: number;
};

type RepairLogRecord = RawServiceLog & {
  title?: string;
};

const extractDateValue = (record: RawServiceLog): number => {
  const dynamicRecord = record as Record<string, unknown>;
  const keys = ["date", "serviceDate", "service_date", "nextServiceDate", "nextDueDate", "createdAt", "updatedAt", "timestamp"];
  for (const key of keys) {
    const candidate = dynamicRecord[key];
    if (candidate == null || candidate === "") continue;
    if (candidate instanceof Date) return candidate.getTime();
    if (typeof candidate === "number") return candidate;
    if (typeof candidate === "string") {
      const numeric = Number(candidate);
      if (!Number.isNaN(numeric) && numeric > 0) return numeric;
      const parsed = Date.parse(candidate);
      if (!Number.isNaN(parsed)) return parsed;
    }
  }
  return 0;
};

const sortRecordsByDate = <T extends RawServiceLog>(records: T[]): T[] => {
  return [...records].sort((a, b) => extractDateValue(a) - extractDateValue(b));
};

interface IndividualProps {
  onNavigate: (page: string) => void;
  generatorId?: string;
}

export default function Dashboard({ onNavigate, generatorId }: IndividualProps) {
  const params = useParams() as { id?: string } | null;
  const effectiveId = generatorId ?? (params?.id ? String(params.id) : undefined);

  // active tab state eka (default 1)
  const [activeTab, setActiveTab] = useState("1");

  // service toggle form
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    generatorId: "",
    serviceType: "",
    description: "",
    serviceDate: "",
    nextServiceDate: "",
    cost: "",
    notes: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    setShowModal(false);
  };
  const [gen, setGen] = useState<RawGeneratorRecord | null>(null);
  const [shopName, setShopName] = useState<string>("");
  const [serviceHistory, setServiceHistory] = useState<RawServiceLog[]>([]);
  const [repairsFromServices, setRepairsFromServices] = useState<RepairLogRecord[]>([]);
  const [repairsFromDirect, setRepairsFromDirect] = useState<RepairLogRecord[]>([]);

  const toTitle = (s?: string | null) => {
    const v = String(s ?? "").trim();
    if (!v) return "";
    return v.charAt(0).toUpperCase() + v.slice(1).toLowerCase();
  };
  const normalizeStatus = (s?: string) => {
    const v = String(s ?? "").toLowerCase().replace(/_/g, " ");
    if (v.includes("unusable")) return "Unusable";
    if (v.includes("under") || v.includes("repair")) return "Under Repair";
    return "Active";
  };
  const statusColor = useMemo(() => {
    const v = normalizeStatus(gen?.status).toLowerCase();
    if (v.includes("unusable")) return "text-red-600 bg-red-100";
    if (v.includes("repair")) return "text-yellow-700 bg-yellow-100";
    return "text-green-600 bg-green-100";
  }, [gen?.status]);

  const fmtDate = (d?: number | string | null): string => {
    if (d == null || d === "") return "--";
    try {
      const date = typeof d === "number" ? new Date(d) : new Date(String(d));
      if (isNaN(date.getTime())) return String(d);
      return date.toLocaleDateString();
    } catch { return String(d); }
  };

  useEffect(() => {
    let unsub: (() => void) | null = null;
    let cancelled = false;
    const load = async () => {
      if (!effectiveId) { setGen(null); return; }
      const byKeyRef = ref(db(), `generators/${effectiveId}`);
      try {
        const snap = await get(byKeyRef);
        if (cancelled) return;
        if (snap.exists()) {
          setGen(snap.val() as RawGeneratorRecord);
          unsub = onValue(byKeyRef, (s) => { if (!cancelled) setGen((s.val() ?? null) as RawGeneratorRecord | null); });
          return;
        }
        // Fallback: query by child id equal to generatorId
        const q = query(ref(db(), 'generators'), orderByChild('id'), equalTo(effectiveId));
        const snap2 = await get(q);
        if (cancelled) return;
        const val2 = (snap2.val() ?? null) as Record<string, RawGeneratorRecord> | null;
        if (val2 && Object.keys(val2).length) {
          const firstKey = Object.keys(val2)[0];
          const rec = val2[firstKey];
          setGen(rec ?? null);
          if (firstKey) {
            const realRef = ref(db(), `generators/${firstKey}`);
            unsub = onValue(realRef, (s) => { if (!cancelled) setGen((s.val() ?? null) as RawGeneratorRecord | null); });
          }
        } else {
          setGen(null);
        }
      } catch {
        setGen(null);
      }
    };
    load();
    return () => { cancelled = true; if (unsub) unsub(); };
  }, [effectiveId]);

  useEffect(() => {
    if (!gen?.shop_id) { setShopName(""); return; }
    const unsub = onValue(ref(db(), `shops/${gen.shop_id}`), (snap) => {
      const v = snap.val() as { name?: string; code?: string } | null;
      setShopName(v?.name || v?.code || gen.shop_id || "");
    });
    return () => unsub();
  }, [gen?.shop_id]);

  useEffect(() => {
    if (!effectiveId) {
      setServiceHistory([]);
      setRepairsFromServices([]);
      return;
    }

    const database = db();
    const servicesRef = ref(database, "services");
    const unsubscribe = onValue(servicesRef, (snapshot) => {
      const value = snapshot.val() as Record<string, RawServiceLog> | null;
      if (!value) {
        setServiceHistory([]);
        setRepairsFromServices([]);
        return;
      }

      const generatorCandidates = new Set<string>();
      const addCandidate = (candidate: unknown) => {
        if (!candidate && candidate !== 0) return;
        const normalized = String(candidate).trim().toLowerCase();
        if (normalized) {
          generatorCandidates.add(normalized);
        }
      };

      addCandidate(effectiveId);
      addCandidate(gen?.id);
      const potentialGeneratorId = (gen as Record<string, unknown> | null)?.["generatorId"];
      addCandidate(potentialGeneratorId);

      const mapped = Object.entries(value)
        .map(([id, record]) => ({ ...(record ?? {}), id } as RawServiceLog))
        .filter((record) => record && typeof record === "object");

      if (generatorCandidates.size === 0) {
        setServiceHistory([]);
        setRepairsFromServices([]);
        return;
      }

      const maintenance: RawServiceLog[] = [];
      const repairs: RepairLogRecord[] = [];

      mapped.forEach((record) => {
        const recordGenerator = record.generatorId ?? record.generator_id ?? record.generator;
        const trimmedRecordGenerator = recordGenerator ? String(recordGenerator).trim().toLowerCase() : "";
        if (!trimmedRecordGenerator || !generatorCandidates.has(trimmedRecordGenerator)) {
          return;
        }

        const serviceType = String(record.serviceType ?? record.type ?? "").trim();
        const lowerType = serviceType.toLowerCase();
        const base: RawServiceLog = {
          ...record,
          serviceType,
          type: serviceType,
          serviceDate: record.serviceDate ?? record.date ?? null,
          date: record.serviceDate ?? record.date ?? null,
          nextServiceDate: record.nextServiceDate ?? record.nextDueDate ?? null,
          nextDueDate: record.nextDueDate ?? record.nextServiceDate ?? null,
          serviceCost: record.serviceCost ?? record.cost ?? null,
          cost: record.serviceCost ?? record.cost ?? null,
          description: record.description ?? record.notes ?? "",
          notes: record.notes ?? record.description ?? "",
          invoiceNo: record.invoiceNo ?? record.invoice ?? record.serviceId ?? record.id,
        };

        if (lowerType.includes("repair")) {
          repairs.push({
            ...base,
            title: base.serviceType || "Repair",
            status: record.status ?? record.statusOverride ?? "Completed",
          });
        } else {
          maintenance.push(base);
        }
      });

      setServiceHistory(sortRecordsByDate(maintenance));
      setRepairsFromServices(sortRecordsByDate(repairs));
    });

    return () => unsubscribe();
  }, [effectiveId, gen]);

  useEffect(() => {
    if (!effectiveId) {
      setRepairsFromDirect([]);
      return;
    }

    const database = db();
    const repRef = ref(database, `generator_repairs/${effectiveId}`);
    const unsubscribe = onValue(repRef, (snapshot) => {
      const value = snapshot.val();
      if (!value) {
        setRepairsFromDirect([]);
        return;
      }

      let records: RepairLogRecord[] = [];
      if (Array.isArray(value)) {
        records = value
          .filter((item): item is RepairLogRecord => !!item && typeof item === "object")
          .map((item, index) => ({ ...item, id: item.id ?? String(index) }));
      } else if (typeof value === "object") {
        records = Object.entries(value as Record<string, unknown>).map(([id, item]) => {
          if (item && typeof item === "object") {
            return { ...(item as RepairLogRecord), id: (item as RepairLogRecord).id ?? id };
          }
          return { id };
        });
      }

      const normalised = records.map((record) => ({
        ...record,
        title: record.title ?? record.serviceType ?? record.type ?? "Repair",
        date: record.date ?? record.serviceDate ?? null,
        serviceDate: record.date ?? record.serviceDate ?? null,
      }));

      setRepairsFromDirect(sortRecordsByDate(normalised));
    });

    return () => unsubscribe();
  }, [effectiveId]);

  const repairLogs = (() => {
    const combined = [...repairsFromServices, ...repairsFromDirect];
    if (!combined.length) return [] as RepairLogRecord[];

    const seen = new Set<string>();
    const deduped: RepairLogRecord[] = [];

    combined.forEach((item) => {
      let key: string;
      try {
        key = JSON.stringify({
          id: item.id ?? null,
          date: item.date ?? item.serviceDate ?? null,
          type: item.serviceType ?? item.type ?? null,
          technician: item.technician ?? null,
          description: item.description ?? item.notes ?? null,
          cost: item.cost ?? item.serviceCost ?? null,
          status: item.status ?? item.statusOverride ?? null,
        });
      } catch {
        key = `${item.id ?? ""}-${item.date ?? ""}-${item.serviceType ?? item.type ?? ""}`;
      }

      if (!seen.has(key)) {
        seen.add(key);
        deduped.push(item);
      }
    });

    return sortRecordsByDate(deduped);
  })();


  return (
    <div className="flex bg-white min-h-screen font-roboto">
      {/* Sidebar 
      <aside className="w-64 bg-white shadow-md flex flex-col p-4">
        <div className="mb-8">
          <h2 className="text-xl font-bold">Generator</h2>
          <span className="text-sm text-gray-500">iTeam project</span>
        </div>

        
        <div className="flex items-center border rounded-md p-2 mb-8">
          <span className="material-icons text-gray-500">search</span>
          <input
            type="text"
            placeholder="File"
            className="ml-2 w-full focus:outline-none"
          />
        </div>
        

       
        <nav className="flex-grow">
          <ul>
            <li className="mb-4">
              <a className="flex items-center p-2 text-gray-700 rounded-md hover:bg-gray-200" href="#">
                <span className="material-icons">dashboard</span>
                <span className="ml-3">Dashboard</span>
              </a>
            </li>
            <li className="mb-4">
              <a className="flex items-center p-2 text-white bg-blue-500 rounded-md" href="#">
                <span className="material-icons">bolt</span>
                <span className="ml-3">Generators</span>
              </a>
            </li>
            <li className="mb-4">
              <a className="flex items-center p-2 text-gray-700 rounded-md hover:bg-gray-200" href="#">
                <span className="material-icons">assignment</span>
                <span className="ml-3">Tasks</span>
              </a>
            </li>
            <li className="mb-4">
              <a className="flex items-center p-2 text-gray-700 rounded-md hover:bg-gray-200" href="#">
                <span className="material-icons">build</span>
                <span className="ml-3">Services</span>
              </a>
            </li>
            <li className="mb-4">
              <a className="flex items-center p-2 text-gray-700 rounded-md hover:bg-gray-200" href="#">
                <span className="material-icons">receipt</span>
                <span className="ml-3">Invoices</span>
              </a>
            </li>
            <li className="mb-4">
              <a className="flex items-center p-2 text-gray-700 rounded-md hover:bg-gray-200" href="#">
                <span className="material-icons">assessment</span>
                <span className="ml-3">Reports</span>
              </a>
            </li>
            <li className="mb-4">
              <a className="flex items-center p-2 text-gray-700 rounded-md hover:bg-gray-200" href="#">
                <span className="material-icons">people</span>
                <span className="ml-3">Users</span>
              </a>
            </li>
            <li className="mb-4">
              <a className="flex items-center p-2 text-gray-700 rounded-md hover:bg-gray-200" href="#">
                <span className="material-icons">notifications</span>
                <span className="ml-3">Notifications</span>
              </a>
            </li>
          </ul>
        </nav>

       
        <div>
          <a className="flex items-center p-2 text-gray-700 rounded-md hover:bg-gray-200" href="#">
            <span className="material-icons">logout</span>
            <span className="ml-3">Logout</span>
          </a>
        </div>
      </aside>
      */}

      {/* Main Content */}
      <main className="flex-1 p-8">
        {/* Header */}
        <header className="flex justify-between items-center mb-2">
          <div className="flex mb-2 gap-x-4">

            <button onClick={() => onNavigate("Generators")} className="box-border size-4 border h-8 w-8 p-2 mt-4 border-indigo-500 hover:bg-gray-200 justify-items-center...">
              <MdOutlineArrowBack className="font-bold ..." />
            </button>


            <div>
              <h2 className="text-3xl font-bold text-gray-800">Generator {gen?.id ?? effectiveId ?? ""}</h2>
              <p className="text-gray-500">{[gen?.brand, gen?.size].filter(Boolean).join(" - ")}</p>
            </div>

          </div>


        </header>

        {/* Generator Details */}
        <div className="bg-white p-6 rounded-lg shadow-md pt-2">

          {/* Info & Schedule */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Generator Info */}
            <div className="col-span-2 bg-gray-50 p-4 rounded-lg border border-indigo-500/100 ...">
              <h3 className="font-semibold text-lg mb-4 text-gray-700">Generator Information</h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-x-4 gap-y-8 text-sm">
                <div>
                  <p className="text-gray-500">Serial Number</p>
                  <p className="font-medium text-gray-800">{gen?.serial_no ?? (gen as RawGeneratorRecord & { serialNumber?: string })?.serialNumber ?? "--"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Status</p>
                  <p className={`font-medium px-2 py-1 rounded-full inline-block ${statusColor}`}>{normalizeStatus(gen?.status)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Location</p>
                  <p className="font-medium text-gray-800">{toTitle(gen?.location) || "--"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Issued Date</p>
                  <p className="font-medium text-gray-800">{fmtDate(gen?.issued_date)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Auto Start</p>
                  <p className="font-medium text-gray-800">{(gen?.hasAutoStart ? 1 : 0) ? "Enabled" : "Not Enabled"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Warranty Expiry</p>
                  <p className="font-medium text-gray-800">{(() => { const m = Number(gen?.warranty ?? 0); const base = typeof gen?.installed_date === 'number' ? new Date(gen!.installed_date as number) : gen?.installed_date ? new Date(String(gen?.installed_date)) : null; if (!base || isNaN(base.getTime()) || !m) return "--"; const dt = new Date(base); dt.setMonth(dt.getMonth() + m); return dt.toLocaleDateString(); })()}</p>
                </div>
                <div>
                  <p className="text-gray-500">Installed Date</p>
                  <p className="font-medium text-gray-800">{fmtDate(gen?.installed_date)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Battery Charger</p>
                  <p className="font-medium text-blue-500">{(gen?.hasBatteryCharger ? 1 : 0) ? "Installed" : "Not Installed"}</p>
                </div>
              </div>
            </div>

            {/* Service Schedule */}
            <div className="bg-gray-50 p-4 rounded-lg border border-indigo-500/100 ...">
              <h3 className="font-semibold text-lg mb-4 text-gray-700">Service Schedule</h3>
              <div className="mb-4">
                <p className="text-sm text-gray-500">Last Service</p>
                <div className="flex items-center mt-1">
                  <span className="material-icons text-blue-500 mr-4"><MdCalendarToday /></span>
                  <p className="font-medium text-gray-800">{serviceHistory.length ? fmtDate((serviceHistory[serviceHistory.length - 1]?.date as number | string | null) ?? null) : "--"}</p>
                </div>
              </div>
              <div className="mb-4">
                <p className="text-sm text-gray-500">Due Service</p>
                <div className="flex items-center mt-1">
                  <span className="material-icons text-orange-500 mr-4"><MdCalendarToday /></span>
                  <p className="font-medium text-gray-800">{serviceHistory.length ? fmtDate((serviceHistory[serviceHistory.length - 1]?.nextServiceDate as number | string | null) ?? null) : "--"}</p>
                </div>
              </div>
              <button onClick={() => setShowModal(true)} className="w-full bg-blue-900 text-white py-2 rounded-md hover:bg-blue-950">Log Service</button>
            </div>
          </div>

          {/* Tabs + Table */}
          <div className=" p-2 border border-indigo-500/100 rounded-lg ... ">
            <div className="flex border-b w-full bg-sky-100 mb-4 border-blue-100 rounded-full ...">
              <button
                className={`flex-1 text-center px-4 py-1 rounded-full ${activeTab === "1"
                  ? "text-white font-semibold bg-blue-500"
                  : "text-gray-700 hover:bg-blue-200"
                  }`}
                onClick={() => setActiveTab("1")}
              >
                Service History
              </button>

              <button
                className={`flex-1 text-center px-4 py-1 rounded-full ${activeTab === "2"
                  ? "text-white font-semibold bg-blue-500"
                  : "text-gray-700 hover:bg-blue-200"
                  }`}
                onClick={() => setActiveTab("2")}
              >
                Repair Logs
              </button>

              <button
                className={`flex-1 text-center px-4 py-1 rounded-full ${activeTab === "3"
                  ? "text-white font-semibold bg-blue-500"
                  : "text-gray-700 hover:bg-blue-200"
                  }`}
                onClick={() => setActiveTab("3")}
              >
                Extracted Parts
              </button>

            </div>

            {activeTab === "1" && (
              <div id="1">
                {/*<div className="overflow-auto max-h-48" id="1">*/}

                <table className="w-full text-left ">
                  <thead className="bg-gray-200 sticky top-0">
                    <tr className="bg-gray-100 text-gray-600 text-sm/7 border-gray-100">
                      <th className="p-3">Date</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Technician</th>
                      <th className="p-3">Description</th>
                      <th className="p-3">Cost</th>
                      <th className="p-3">Invoice No.</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-700 text-sm/7">
                    {serviceHistory.length === 0 ? (
                      <tr><td colSpan={6} className="p-3 text-gray-500">No service records</td></tr>
                    ) : (
                      serviceHistory.map((s, idx) => (
                        <tr key={idx} className="border-b border-gray-100">
                          <td className="p-3">{fmtDate(s?.date as number | string | null)}</td>
                          <td className="p-3">{(s?.type as string) || (s?.serviceType as string) || "-"}</td>
                          <td className="p-3">{(s?.technician as string) || "-"}</td>
                          <td className="p-3">{(s?.description as string) || "-"}</td>
                          <td className="p-3">{s?.cost != null ? `LKR ${s.cost}` : "-"}</td>
                          <td className="p-3">{(s?.invoiceNo as string) || (s?.invoice as string) || "-"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}



            {activeTab === "2" && (
              <div id="2">
                {repairLogs.length > 0 && (
                  <div className="space-y-2">
                    {repairLogs.map((r, idx) => (
                      <div key={idx} className="border border-blue-300 rounded-md p-4 shadow-sm bg-white">
                        <div className="flex items-center mb-2">
                          <div className="flex items-center gap-2 mr-4">
                            <span className="text-red-500 text-lg">!</span>
                            <h2 className="font-semibold text-black-900">{(r?.title as string) || (r?.issue as string) || 'Repair'}</h2>
                          </div>
                          <span className="bg-blue-100 text-blue-600 text-xs font-medium px-2 py-1 rounded">{(r?.status as string) || 'Resolved'}</span>
                        </div>
                        <div className="text-sm  space-y-1 mb-3">
                          <p className="text-sm text-gray-600">{(r?.description as string) || '-'}</p>
                          {r?.notes ? <p className="text-sm text-black-900">{String(r.notes)}</p> : null}
                        </div>
                        <div className="text-sm text-gray-500 flex gap-4 mb-2 ">
                          <p><span className="font-medium">Technician:</span> {(r?.technician as string) || '-'}</p>
                          <p><span className="font-medium">Cost:</span> {r?.cost != null ? `LKR ${r.cost}` : '-'}</p>
                          <p><span className="font-medium">Date:</span> {fmtDate(r?.date as number | string | null)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {repairLogs.length === 0 && (
                  <div className="border border-blue-100 rounded-md p-4 bg-white text-gray-500">
                    No repair logs recorded.
                  </div>
                )}

              </div>
            )}
            {activeTab === "3" && (


              <div id="3">
                {Array.isArray(gen?.extracted_parts) && gen!.extracted_parts!.length > 0 ? (
                  <ul className="divide-y divide-gray-200 rounded-md border border-gray-200">
                    {gen!.extracted_parts!.map((p: unknown, idx: number) => (
                      <li key={idx} className="px-4 py-2 text-sm text-gray-800">
                        {typeof p === 'string' ? p : ((p as { name?: string })?.name || JSON.stringify(p))}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="p-3 text-sm text-gray-500">No extracted parts</p>
                )}
              </div>


            )}
          </div>

        </div>



        {showModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/50 bg-opacity-40">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 overflow-y-auto max-h-[90vh]">
              <h2 className="text-xl font-semibold mb-4">Service Details</h2>
              <p className="text-gray-500 mb-6">
                Record service information and maintenance activities
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Generator & Service Type */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">
                      Generator ID
                    </label>
                    <select
                      name="generatorId"
                      value={formData.generatorId}
                      onChange={handleChange}
                      className="border rounded-md px-3 py-2 focus:ring focus:ring-blue-200 bg-gray-100 border border-blue-100"
                    >
                      <option value="">Select generator</option>
                      <option value="gen1">Generator 1</option>
                      <option value="gen2">Generator 2</option>
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">
                      Service Type
                    </label>
                    <select
                      name="serviceType"
                      value={formData.serviceType}
                      onChange={handleChange}
                      className="border rounded-md px-3 py-2 focus:ring focus:ring-blue-200 bg-gray-100 border border-blue-100"
                    >
                      <option value="">Select service type</option>
                      <option value="repair">Repair</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </div>
                </div>

                {/* Service Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Service Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Enter detailed service description..."
                    className="mt-1 block w-full pl-2 py-2 bg-gray-100 rounded-md border border-blue-100"
                    rows={3}
                  />
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">
                      Service Date
                    </label>
                    <input
                      type="date"
                      name="serviceDate"
                      value={formData.serviceDate}
                      onChange={handleChange}
                      className="border rounded-md px-3 py-2 focus:ring focus:ring-blue-200 bg-gray-100 border border-blue-100"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">
                      Next Service Date
                    </label>
                    <input
                      type="date"
                      name="nextServiceDate"
                      value={formData.nextServiceDate}
                      onChange={handleChange}
                      className="border rounded-md px-3 py-2 focus:ring focus:ring-blue-200 bg-gray-100 border border-blue-100"
                    />
                  </div>
                </div>

                {/* Service Cost */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Service Cost
                  </label>
                  <input
                    type="number"
                    name="cost"
                    value={formData.cost}
                    onChange={handleChange}
                    placeholder="Enter service cost"
                    className="mt-1 pl-2 py-2 block w-full rounded-md bg-gray-100 border border-blue-100"
                  />
                </div>

                {/* Technician Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Technician Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Enter technician notes and observations..."
                    className="mt-1 block pl-2 py-3 w-full rounded-lg bg-gray-100 border border-blue-100"
                    rows={3}
                  />
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowModal(false)}
                    type="button"
                    className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setShowModal(false)}
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Log Service
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}



      </main>
    </div>
  );
}

