"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  History, 
  Search, 
  Download, 
  FileText, 
  Image as ImageIcon, 
  Globe, 
  ArrowRight, 
  Filter
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getHistory, createGuestSession, getStoredToken, HistoryItem } from "@/lib/api";

export default function HistoryPage() {
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        if (!getStoredToken()) {
          await createGuestSession();
        }
        const data = await getHistory();
        setHistoryItems(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredItems = historyItems.filter((item) => {
    const matchesSearch = item.claim_text?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
    const matchesType = filterType === "all" || item.analysis_type === filterType;
    return matchesSearch && matchesType;
  });

  const exportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(historyItems, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `verifact_history_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const exportCSV = () => {
    if (historyItems.length === 0) return;
    const headers = ["id", "analysis_type", "status", "trust_score", "verdict", "created_at", "claim_text"];
    const rows = historyItems.map(item => [
      item.id,
      item.analysis_type,
      item.status,
      item.trust_score ?? "",
      item.verdict ?? "",
      item.created_at ?? "",
      `"${(item.claim_text || "").replace(/"/g, '""')}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", encodeURI(csvContent));
    downloadAnchor.setAttribute("download", `verifact_history_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="min-h-screen bg-[#060913] text-slate-100 flex flex-col bg-cyber-grid">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        
        {/* Header & Export Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-wider mb-1">
              <History className="w-4 h-4" />
              Audit Log & History
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white">
              Analysis Records
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Search, filter, inspect provenance, and export previous multimodal verifications.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportJSON}
              disabled={historyItems.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200 transition-colors disabled:opacity-40"
            >
              <Download className="w-3.5 h-3.5" /> Export JSON
            </button>
            <button
              onClick={exportCSV}
              disabled={historyItems.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200 transition-colors disabled:opacity-40"
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
          </div>
        </div>

        {/* ── SEARCH & FILTER CONTROLS ────────────────────────────────────────── */}
        <div className="glass-panel rounded-xl p-4 border border-white/10 mb-8 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search claims by keyword..."
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-950/80 border border-slate-700/80 focus:border-cyan-400 text-xs text-slate-100 placeholder-slate-500 outline-none"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-xs text-slate-400 font-mono">Modality:</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none"
            >
              <option value="all">All Types</option>
              <option value="text">Text Only</option>
              <option value="image">Image & Caption</option>
              <option value="url">Article URL</option>
            </select>
          </div>
        </div>

        {/* ── RECORDS TABLE / LIST ────────────────────────────────────────────── */}
        {loading ? (
          <div className="glass-panel rounded-2xl p-12 text-center text-slate-400 text-sm">
            <span className="font-mono">Loading history records from database...</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="glass-panel rounded-2xl p-12 text-center space-y-4">
            <History className="w-12 h-12 text-slate-600 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">No analysis records found</h3>
              <p className="text-xs text-slate-400">
                You have not run any verifications in this session yet or your query returned no matches.
              </p>
            </div>
            <Link
              href="/analyze"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md shadow-cyan-600/30"
            >
              Submit First Analysis <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="glass-panel rounded-2xl overflow-hidden border border-white/10">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="text-[11px] font-mono uppercase bg-slate-950 text-cyan-400 border-b border-slate-800">
                  <tr>
                    <th className="p-4">Type</th>
                    <th className="p-4">Claim Statement</th>
                    <th className="p-4">Trust Score</th>
                    <th className="p-4">Verdict Category</th>
                    <th className="p-4">Timestamp</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-900/40">
                      <td className="p-4">
                        <span className="flex items-center gap-1.5 capitalize font-medium text-slate-200">
                          {item.analysis_type === "image" ? (
                            <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
                          ) : item.analysis_type === "url" ? (
                            <Globe className="w-3.5 h-3.5 text-indigo-400" />
                          ) : (
                            <FileText className="w-3.5 h-3.5 text-cyan-400" />
                          )}
                          {item.analysis_type}
                        </span>
                      </td>
                      <td className="p-4 max-w-md font-sans">
                        <p className="truncate text-slate-100 font-medium">{item.claim_text || "No text provided"}</p>
                      </td>
                      <td className="p-4">
                        <span className="text-base font-bold text-cyan-300">
                          {item.trust_score ? Math.round(item.trust_score) : "—"}
                        </span>
                        <span className="text-[10px] text-slate-500">/100</span>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-slate-800 text-slate-200 border border-slate-700">
                          {(item.verdict || "Completed").replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500 text-[11px]">
                        {item.created_at ? new Date(item.created_at).toLocaleString() : "Just now"}
                      </td>
                      <td className="p-4 text-right">
                        <Link
                          href={`/analyze?claim=${encodeURIComponent(item.claim_text || "")}`}
                          className="text-cyan-400 hover:text-cyan-300 font-semibold text-xs flex items-center gap-1 justify-end"
                        >
                          View <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}
