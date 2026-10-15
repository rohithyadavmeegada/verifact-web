import Link from "next/link";
import { ShieldCheck, Terminal, CheckCircle2 } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-cyan-500/15 bg-[#050812] text-slate-400 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
        {/* Col 1: Project overview */}
        <div className="space-y-4 md:col-span-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
            </div>
            <span className="text-lg font-bold text-white font-mono">
              Veri<span className="text-cyan-400">Fact</span>
            </span>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed max-w-md">
            A Multimodal Deep Learning Framework for Real-Time, Explainable Fake News and Deepfake Detection. Built as a fourth-year B.Tech CSE Research Project.
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono border border-slate-700">DeBERTa-v3</span>
            <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono border border-slate-700">CLIP/ViT</span>
            <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono border border-slate-700">XGBoost Late Fusion</span>
            <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono border border-slate-700">SHAP / LIME</span>
            <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono border border-slate-700">RAG Engine</span>
          </div>
        </div>

        {/* Col 2: Navigation */}
        <div>
          <h4 className="text-xs uppercase tracking-wider font-semibold text-slate-200 mb-3 font-mono">Platform</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/analyze" className="hover:text-cyan-300 transition-colors">Analysis Workspace</Link></li>
            <li><Link href="/how-it-works" className="hover:text-cyan-300 transition-colors">Architecture Flow</Link></li>
            <li><Link href="/research" className="hover:text-cyan-300 transition-colors">Research Methodology</Link></li>
            <li><Link href="/lab" className="hover:text-cyan-300 transition-colors">Research Laboratory</Link></li>
            <li><Link href="/history" className="hover:text-cyan-300 transition-colors">Analysis History</Link></li>
          </ul>
        </div>

        {/* Col 3: Research & Admin */}
        <div>
          <h4 className="text-xs uppercase tracking-wider font-semibold text-slate-200 mb-3 font-mono">Resources</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/admin/providers" className="hover:text-cyan-300 transition-colors">API Provider Health</Link></li>
            <li><Link href={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/docs`} target="_blank" rel="noopener noreferrer" className="hover:text-cyan-300 transition-colors flex items-center gap-1">FastAPI Swagger <Terminal className="w-3 h-3" /></Link></li>
            <li><span className="text-slate-500 cursor-not-allowed">Academic Paper (Draft)</span></li>
            <li><Link href="/research" className="hover:text-cyan-300 transition-colors">Dataset Benchmarks</Link></li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <p>© 2026 VeriFact AI Research Platform. All scientific metrics are calculated from reproducible experiments.</p>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" /> Systems Operational
          </span>
          <span>v1.0.0-rc</span>
        </div>
      </div>
    </footer>
  );
}
