"use client";

import Link from "next/link";
import { 
  FlaskConical, 
  Database, 
  Scale, 
  BarChart3, 
  ArrowRight, 
  CheckCircle, 
  AlertCircle,
  BookOpen,
  Code2
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function ResearchPage() {
  const datasets = [
    {
      name: "LIAR / LIAR-PLUS",
      task: "Text Claim Verification",
      records: "12,836 statements",
      labels: "6 fine-grained (pants-fire to true)",
      source: "PolitiFact rulings",
      role: "Benchmark for text NLI entailment and justification sentence extraction."
    },
    {
      name: "FakeNewsNet",
      task: "News & Social Propagation",
      records: "23,196 news articles + cascades",
      labels: "Binary (real / fake)",
      source: "PolitiFact & GossipCop",
      role: "Evaluates social diffusion patterns and temporal cascade velocity."
    },
    {
      name: "Fakeddit",
      task: "Multimodal Fake News",
      records: "1,063,106 multimodal posts",
      labels: "2, 3, and 6-way classification",
      source: "Reddit submissions",
      role: "Benchmark for image-text mismatch, manipulated media, and satire."
    },
    {
      name: "NewsCLIPpings",
      task: "Out-of-Context Media",
      records: "71,072 multimodal pairs",
      labels: "Pristine vs. out-of-context mismatch",
      source: "Visual News dataset",
      role: "Tests CLIP cross-modal semantic similarity for unmanipulated images used deceptively."
    },
    {
      name: "M4 (Machine-Generated Text)",
      task: "Synthetic Text Attribution",
      records: "122,000 multi-generator samples",
      labels: "Human vs. ChatGPT/LLaMA/Cohere",
      source: "Academic preprint collection",
      role: "Exploratory evaluation of automated hallucinated news stories."
    }
  ];

  const ablations = [
    { id: "M0", name: "TF-IDF + Logistic Regression", modalities: "Text only", role: "Lexical baseline" },
    { id: "M1", name: "Fine-Tuned BERT Baseline", modalities: "Text only", role: "Pre-trained transformer baseline" },
    { id: "M2", name: "DeBERTa-v3 NLI", modalities: "Text + Retrieval", role: "Core natural language inference" },
    { id: "M3", name: "ViT + CLIP Image Alignment", modalities: "Vision only", role: "Visual semantic alignment" },
    { id: "M4", name: "GraphSAGE Propagation Network", modalities: "Social graph only", role: "Diffusion cascade representation" },
    { id: "M5", name: "Multimodal Late Fusion (Proposed)", modalities: "Text + Vision + RAG + XGBoost", role: "Full VeriFact Framework" }
  ];

  return (
    <div className="min-h-screen bg-[#060913] text-slate-100 flex flex-col bg-cyber-grid">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-mono mb-3">
            <FlaskConical className="w-3.5 h-3.5" />
            B.Tech CSE Capstone Research Project
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white">
            Research & Methodology
          </h1>
          <p className="text-slate-400 text-sm sm:text-base mt-3 leading-relaxed">
            Theoretical foundation, formal problem formulation, benchmark datasets, baseline ablations, and scientific evaluation criteria.
          </p>
        </div>

        {/* ── PROBLEM FORMULATION ────────────────────────────────────────────── */}
        <section className="glass-panel rounded-2xl p-6 sm:p-8 border border-white/10 mb-12">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Scale className="w-5 h-5 text-cyan-400" />
            1. Problem Formulation & Research Questions
          </h2>
          <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
            <p>
              Given an input claim <code className="text-cyan-300 font-mono">C = (T, I, U, G)</code> where <code className="text-cyan-300 font-mono">T</code> is textual statement, <code className="text-cyan-300 font-mono">I</code> is associated visual media, <code className="text-cyan-300 font-mono">U</code> is publisher URL, and <code className="text-cyan-300 font-mono">G</code> is diffusion graph, the goal is to produce:
            </p>
            <div className="p-4 rounded-xl bg-slate-950/80 font-mono text-xs text-cyan-300 border border-slate-800">
              Y = f_fusion(f_text(T, E_RAG), f_vision(I, T), f_social(G)) → [y_cat, s_trust, u_uncertainty]
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="font-bold text-slate-100 block mb-1">RQ1: Multimodal Fusion Advantage</span>
                <p className="text-xs text-slate-400">
                  Does calibrated late fusion of NLI and CLIP outperform unimodal baselines on out-of-context image-caption manipulation by at least 8% Macro-F1?
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="font-bold text-slate-100 block mb-1">RQ2: Faithfulness of Explanations</span>
                <p className="text-xs text-slate-400">
                  Do LIME and SHAP attributions grounded in retrieved live fact-checking citations improve human reviewer agreement compared to ungrounded LLM summaries?
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── BENCHMARK DATASET REGISTRY ───────────────────────────────────────── */}
        <section className="glass-panel rounded-2xl p-6 sm:p-8 border border-white/10 mb-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-cyan-400" />
                2. Academic Dataset Registry
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Standardized benchmarks leveraged for model fine-tuning and comparative evaluation.
              </p>
            </div>
            <Link
              href="/lab"
              className="px-3.5 py-1.5 rounded-lg bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-300 border border-cyan-500/30 text-xs font-semibold flex items-center gap-1.5"
            >
              Open Research Lab <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {datasets.map((d, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-white text-sm font-mono">{d.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-mono">{d.task}</span>
                  </div>
                  <p className="text-xs text-slate-400 mb-3">{d.role}</p>
                </div>
                <div className="text-[11px] font-mono text-slate-500 pt-2 border-t border-slate-900 space-y-0.5">
                  <div>Size: <span className="text-slate-300">{d.records}</span></div>
                  <div>Labels: <span className="text-slate-300">{d.labels}</span></div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── ABLATION MATRIX ─────────────────────────────────────────────────── */}
        <section className="glass-panel rounded-2xl p-6 sm:p-8 border border-white/10 mb-12">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            3. Controlled Baseline & Ablation Experiment Matrix
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="text-[11px] font-mono uppercase bg-slate-950/90 text-cyan-400 border-b border-slate-800">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">Architecture / Model</th>
                  <th className="p-3">Active Modalities</th>
                  <th className="p-3">Experimental Purpose</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {ablations.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-900/50">
                    <td className="p-3 text-cyan-400 font-bold">{a.id}</td>
                    <td className="p-3 text-white font-sans font-medium">{a.name}</td>
                    <td className="p-3 text-slate-400">{a.modalities}</td>
                    <td className="p-3 text-slate-400 font-sans">{a.role}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">
                        Available
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── EVALUATION METRICS SPECIFICATION ───────────────────────────────── */}
        <section className="glass-panel rounded-2xl p-6 sm:p-8 border border-white/10">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Scale className="w-5 h-5 text-cyan-400" />
            4. Scientific Evaluation Metrics
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed mb-6">
            All reported model numbers are computed from genuine prediction sets against labeled test splits without artificial extrapolation:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
            <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
              <span className="text-cyan-400 font-bold block mb-1">Macro-F1 & Accuracy</span>
              <p className="text-slate-400 font-sans text-[11px]">Handles severe class imbalance in real-world misinformation.</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
              <span className="text-cyan-400 font-bold block mb-1">ROC-AUC & PR-AUC</span>
              <p className="text-slate-400 font-sans text-[11px]">Measures discrimination capability across classification thresholds.</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
              <span className="text-cyan-400 font-bold block mb-1">ECE & Brier Score</span>
              <p className="text-slate-400 font-sans text-[11px]">Calculates probability calibration to prevent false overconfidence.</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
              <span className="text-cyan-400 font-bold block mb-1">Latency p50 / p95</span>
              <p className="text-slate-400 font-sans text-[11px]">Measures retrieval and inference response times under load.</p>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
