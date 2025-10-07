'use client';

import { useEffect, useMemo, useState } from "react";
import { FiSearch, FiFilter, FiDownload } from "react-icons/fi";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";
import { onValue, ref } from "firebase/database";

import { db } from "@/firebaseConfig";

type IssueStatus = "open" | "pending" | "in-progress" | "resolved" | "closed";
type IssuePriority = "low" | "medium" | "high" | "critical";
type IssueCategory = "battery" | "generator" | "charger" | "other";

interface Issue {
  id: string;
  title: string;
  description: string;
  status: IssueStatus;
  priority: IssuePriority;
  reportedDate: string;
  lastUpdated: string;
  assignedTo?: string;
  category: IssueCategory;
  location: string;
  equipmentId?: string;
}

interface RawIssue {
  id?: string;
  title?: string;
  description?: string;
  status?: string;
  severity?: string;
  createdAt?: number | string;
  lastUpdated?: number | string;
  assignedTo?: string;
  createdBy?: string;
  equipment_id?: string;
  equipment_type?: string;
  location?: string;
  site?: string;
}

interface TechnicianIssueReportingProps {
  onNavigate?: (page: string) => void;
}

const normalize = (value?: string | null): string | null => {
  if (!value) {
    return null;
  }
  return value.trim().toLowerCase();
};

const mapStatus = (status?: string | null): IssueStatus => {
  const normalized = normalize(status);
  switch (normalized) {
    case "pending":
    case "new":
      return "pending";
    case "open":
      return "open";
    case "in-progress":
    case "in progress":
    case "progress":
      return "in-progress";
    case "resolved":
    case "complete":
      return "resolved";
    case "closed":
    case "archived":
      return "closed";
    default:
      return "open";
  }
};

const mapPriority = (priority?: string | null): IssuePriority => {
  const normalized = normalize(priority);
  switch (normalized) {
    case "critical":
    case "urgent":
      return "critical";
    case "high":
    case "major":
      return "high";
    case "low":
    case "minor":
      return "low";
    case "medium":
    case "normal":
    default:
      return "medium";
  }
};

const mapCategory = (equipmentType?: string | null): IssueCategory => {
  const normalized = normalize(equipmentType);
  switch (normalized) {
    case "generator":
      return "generator";
    case "battery":
      return "battery";
    case "charger":
      return "charger";
    default:
      return "other";
  }
};

const formatTimestamp = (value?: number | string): string => {
  if (!value) {
    return new Date().toISOString().split("T")[0];
  }

  if (typeof value === "number") {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toISOString().split("T")[0];
    }
  }

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().split("T")[0];
  }

  return new Date().toISOString().split("T")[0];
};

const buildIssueFromSnapshot = (id: string, raw: RawIssue): Issue => {
  const status = mapStatus(raw.status);
  const priority = mapPriority(raw.severity);
  const category = mapCategory(raw.equipment_type);
  const assignedTo = raw.assignedTo ?? (raw as { assigned_to?: string }).assigned_to ?? undefined;
  const equipmentId = raw.equipment_id ?? (raw as { equipmentId?: string }).equipmentId ?? undefined;

  return {
    id,
    title: raw.title ?? (raw.description ? raw.description.slice(0, 60) : "Untitled Issue"),
    description: raw.description ?? "",
    status,
    priority,
    category,
    location: raw.location ?? raw.site ?? "Not specified",
    reportedDate: formatTimestamp(raw.createdAt),
    lastUpdated: formatTimestamp(raw.lastUpdated ?? raw.createdAt),
    assignedTo,
    equipmentId,
  };
};

export default function TechnicianIssueReporting({ onNavigate }: TechnicianIssueReportingProps) {
  void onNavigate;

  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<'all' | IssueStatus>('all');
  const [isExporting, setIsExporting] = useState(false);

  const [issues, setIssues] = useState<Issue[]>([]);
  const [issuesLoading, setIssuesLoading] = useState(true);
  const [issuesError, setIssuesError] = useState<string | null>(null);

  useEffect(() => {
    const dbInstance = db();
    const issuesRef = ref(dbInstance, "issues");
    setIssuesLoading(true);
    setIssuesError(null);

    const unsubscribe = onValue(
      issuesRef,
      (snapshot) => {
        const data = snapshot.val() as Record<string, RawIssue> | null;
        setIssuesError(null);
        if (!data) {
          setIssues([]);
          setIssuesLoading(false);
          return;
        }

        const mapped = Object.entries(data).map(([id, raw]) => buildIssueFromSnapshot(id, raw ?? {}));
        setIssues(mapped.sort((a, b) => new Date(b.reportedDate).getTime() - new Date(a.reportedDate).getTime()));
        setIssuesLoading(false);
      },
      (error) => {
        console.error("Failed to load issues", error);
        setIssues([]);
        setIssuesError("Unable to load issues right now. Please try again later.");
        setIssuesLoading(false);
      }
    );

    return () => unsubscribe();
  }, [setIssuesError]);

  const filteredIssues = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return issues
      .filter((issue) => {
        if (activeFilter !== 'all' && issue.status !== activeFilter) {
          return false;
        }

        if (!normalizedSearch) {
          return true;
        }

        return (
          issue.title.toLowerCase().includes(normalizedSearch) ||
          issue.description.toLowerCase().includes(normalizedSearch) ||
          (issue.equipmentId?.toLowerCase().includes(normalizedSearch) ?? false)
        );
      })
      .sort((a, b) => new Date(b.reportedDate).getTime() - new Date(a.reportedDate).getTime());
  }, [issues, activeFilter, searchTerm]);

  const getStatusBadge = (status: string) => {
    const statusClasses = {
        open: "bg-blue-100 text-blue-800",
      pending: "bg-yellow-100 text-yellow-800",
      "in-progress": "bg-blue-100 text-blue-800",
      resolved: "bg-green-100 text-green-800",
      closed: "bg-gray-100 text-gray-800",
    };

    const statusText = status.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");

    return (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusClasses[status as keyof typeof statusClasses]}`}>
        {statusText}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityClasses = {
      low: "bg-gray-100 text-gray-800",
      medium: "bg-blue-100 text-blue-800",
      high: "bg-yellow-100 text-yellow-800",
      critical: "bg-red-100 text-red-800",
    };

    return (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${priorityClasses[priority as keyof typeof priorityClasses]}`}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </span>
    );
  };

  const exportToPDF = () => {
    setIsExporting(true);
    const pdfDoc = new jsPDF();
    const title = "Issues Report";
    const date = new Date().toLocaleDateString();

    pdfDoc.setFontSize(18);
    pdfDoc.text(title, 14, 22);
    pdfDoc.setFontSize(11);
    pdfDoc.setTextColor(100);
    pdfDoc.text(`Generated on: ${date}`, 14, 30);

    const tableColumn = ["ID", "Title", "Status", "Priority", "Category", "Equipment ID", "Location", "Reported Date"];
    const tableRows: string[][] = [];

    filteredIssues.forEach((issue) => {
      const issueData = [
        issue.id,
        issue.title,
        issue.status.charAt(0).toUpperCase() + issue.status.slice(1),
        issue.priority.charAt(0).toUpperCase() + issue.priority.slice(1),
        issue.category.charAt(0).toUpperCase() + issue.category.slice(1),
        issue.equipmentId ?? "—",
        issue.location,
        new Date(issue.reportedDate).toLocaleDateString(),
      ];
      tableRows.push(issueData);
    });

    autoTable(pdfDoc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      styles: { fontSize: 8, cellPadding: 2, valign: "middle", overflow: "linebreak", cellWidth: "wrap" },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 35 },
        2: { cellWidth: 20 },
        3: { cellWidth: 20 },
  4: { cellWidth: 25 },
  5: { cellWidth: 25 },
  6: { cellWidth: 35 },
  7: { cellWidth: 25 },
      },
      headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: "bold", fontSize: 8 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { top: 40 },
      didDrawPage: function (data) {
        const pageSize = pdfDoc.internal.pageSize;
        const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
        pdfDoc.text("Page " + (data as unknown as { pageCount: number }).pageCount, 14, pageHeight - 10);
      },
    });

    pdfDoc.save(`issues_report_${new Date().toISOString().slice(0, 10)}.pdf`);
    setIsExporting(false);
  };

  const exportToExcel = () => {
    setIsExporting(true);
    const excelData = filteredIssues.map((issue) => ({
      ID: issue.id,
      Title: issue.title,
      Description: issue.description,
      Status: issue.status.charAt(0).toUpperCase() + issue.status.slice(1),
      Priority: issue.priority.charAt(0).toUpperCase() + issue.priority.slice(1),
      Category: issue.category.charAt(0).toUpperCase() + issue.category.slice(1),
      "Equipment ID": issue.equipmentId ?? "—",
      Location: issue.location,
      "Reported Date": new Date(issue.reportedDate).toLocaleDateString(),
      "Last Updated": new Date(issue.lastUpdated).toLocaleDateString(),
      "Assigned To": issue.assignedTo || "Unassigned",
    }));

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Issues");

    worksheet.columns = [
      { header: "ID", key: "ID", width: 16 },
      { header: "Title", key: "Title", width: 30 },
      { header: "Description", key: "Description", width: 50 },
      { header: "Status", key: "Status", width: 14 },
      { header: "Priority", key: "Priority", width: 14 },
  { header: "Category", key: "Category", width: 16 },
  { header: "Equipment ID", key: "Equipment ID", width: 18 },
  { header: "Location", key: "Location", width: 30 },
      { header: "Reported Date", key: "Reported Date", width: 16 },
      { header: "Last Updated", key: "Last Updated", width: 16 },
      { header: "Assigned To", key: "Assigned To", width: 18 },
    ];

    worksheet.addRows(excelData);

    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.alignment = { vertical: "middle", horizontal: "center" };

    const fileName = `issues_export_${new Date().toISOString().slice(0, 10)}.xlsx`;

    workbook.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setIsExporting(false);
    }).catch(() => setIsExporting(false));
  };

  return (
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-4xl font-bold text-blue-600 mb-2">Issue Reporting</h1>
              <p className="text-gray-600">Report and track technical issues with batteries and equipment</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 mt-4 md:mt-0">
              <button
                  onClick={exportToPDF}
                  disabled={isExporting}
                  className={`flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors ${
                      isExporting ? "opacity-50 cursor-not-allowed" : ""
                  }`}
              >
                <FiDownload className="mr-2" />
                {isExporting ? "Exporting..." : "Export PDF"}
              </button>
              <button
                  onClick={exportToExcel}
                  disabled={isExporting}
                  className={`flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors ${
                      isExporting ? "opacity-50 cursor-not-allowed" : ""
                  }`}
              >
                <FiDownload className="mr-2" />
                {isExporting ? "Exporting..." : "Export Excel"}
              </button>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="text-gray-400" />
              </div>
              <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Search issues..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-2">
              <label className="sr-only" htmlFor="status-filter">
                Filter issues by status
              </label>
              <select
                  id="status-filter"
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  value={activeFilter}
                  onChange={(e) => setActiveFilter(e.target.value as 'all' | IssueStatus)}
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
              <button className="flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                <FiFilter className="mr-2" />
                More Filters
              </button>
            </div>
          </div>
        </div>

        {issuesError && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {issuesError}
          </div>
        )}

        {/* Issues List */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {filteredIssues.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {filteredIssues.map((issue) => (
                <li key={issue.id} className="hover:bg-gray-50">
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-blue-600 truncate">{issue.id}</p>
                        <div className="ml-2">{getStatusBadge(issue.status)}</div>
                      </div>
                      <div className="ml-2 flex-shrink-0 flex">{getPriorityBadge(issue.priority)}</div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">{issue.title}</p>
                        <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                          <span className="font-medium">Location:</span> {issue.location}
                        </p>
                        <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                          <span className="font-medium">Equipment:</span> {issue.equipmentId ?? "—"}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <p>
                          Reported on <time dateTime={issue.reportedDate}>{new Date(issue.reportedDate).toLocaleDateString()}</time>
                        </p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 line-clamp-2">{issue.description}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : issuesLoading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading issues...</p>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No issues found matching your criteria</p>
            </div>
          )}
        </div>
      </div>
  );
}
