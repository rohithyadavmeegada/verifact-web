"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  FileText, 
  Image as ImageIcon, 
  Globe, 
  Layers, 
  BrainCircuit, 
  Scale, 
  ArrowRight, 
  CheckCircle, 
  AlertTriangle,
  Cpu,
  ArrowDown
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function HowItWorksPage() {
  const [selectedModule, setSelectedModule] = useState<string>("text");

  const modules: Record<string, {
    title: string;
    icon: any;
    tag: string;
    summary: string;
    inputs: string[];
    models: string[];
    outputs: string[];
    dependencies: string[];
    limitations: string[];
  }> = {
    text: {
      title: "Text Pipeline: Natural Language Inference",
      icon: FileText,
      tag: "DeBERTa-v3 NLI",
      summary: "Takes normalized claims and pairs them with retrieved factual evidence snippets to calculate semantic entailment, contradiction, and neutral distributions.",
      inputs: ["Claim text (user input or parsed from URL)", "Top-k retrieved evidence snippets"],
      models: ["DeBERTa-v3-large / base fine-tuned on MNLI / FEVER"],
      outputs: ["Entailment probability [0, 1]", "Contradiction probability [0, 1]", "Neutral probability [0, 1]", "Aggregated textual trust score [0, 100]"],
      dependencies: ["Evidence Retrieval Engine", "Tokenizer service"],
      limitations: ["High fluency does not guarantee truthfulness; without retrieved evidence, NLI defaults to neutral uncertainty."]
    },
    vision: {
      title: "Vision Pipeline: ViT, CLIP & Forensics",
      icon: ImageIcon,
      tag: "Vision Forensics",
      summary: "Evaluates image authenticity via Error-Level Analysis (ELA) for double-compression anomalies, OCR text extraction, and cross-modal semantic similarity via CLIP.",
      inputs: ["Image file (JPEG/PNG/WebP)", "Claim caption / accompanying claim"],
      models: ["OpenCLIP ViT-B/32", "OpenCV Error-Level Analysis (ELA)", "EasyOCR engine"],
      outputs: ["Image-caption semantic similarity [-1, 1]", "Forensic manipulation anomaly score [0, 1]", "Extracted OCR text payload"],
      dependencies: ["Pillow / OpenCV image decoder", "EXIF metadata parser"],
      limitations: ["ELA compression anomalies can occur from normal social media re-saving; low CLIP similarity alone does not prove malicious manipulation."]
    },
    retrieval: {
      title: "Retrieval-Augmented Fact-Checking (RAG)",
      icon: Globe,
      tag: "Live Provenance Engine",
      summary: "Extracts key verification queries from the claim and queries authoritative fact-checking databases, news registries, and domain provenance registries.",
      inputs: ["Claim statement", "Extracted entities & keywords"],
      models: ["Google Fact Check Tools API adapter", "News API search adapter", "Domain reliability scorer"],
      outputs: ["Normalized evidence snippets", "Source publisher provenance & original URLs", "Supporting vs. Contradicting relationships"],
      dependencies: ["Network connectivity", "API rate limits & cache coordination (Redis)"],
      limitations: ["Brand-new breaking events might lack indexed fact-checks, requiring explicit handling of insufficient evidence."]
    },
    social: {
      title: "Social Propagation: GraphSAGE / GAT",
      icon: Layers,
      tag: "Network Cascades",
      summary: "Analyzes social diffusion trees and engagement graphs where post and retweeter metadata are available to detect coordinated inauthentic propagation.",
      inputs: ["Diffusion tree nodes (user, post, citation)", "Timestamped interaction cascade"],
      models: ["GraphSAGE inductive representation", "Graph Attention Network (GAT)"],
      outputs: ["Structural virality index", "Propagation velocity metric", "Network coordination anomaly score"],
      dependencies: ["Neo4j Graph Database", "Platform API credentials"],
      limitations: ["Privacy restrictions and API quotas frequently make social network graphs unavailable; this signal is optional and explicitly reported."]
    },
    fusion: {
      title: "Multimodal Late-Fusion Classifier",
      icon: BrainCircuit,
      tag: "Calibrated Fusion",
      summary: "Combines text NLI vectors, vision mismatch scores, retrieval confidence, and propagation metrics into a unified XGBoost classifier with probability calibration.",
      inputs: ["Text NLI probabilities", "Vision forensic & CLIP metrics", "Evidence density & relevance", "Propagation features"],
      models: ["XGBoost Classifier", "Platt / Isotonic Probability Calibrator"],
      outputs: ["Final Unified Trust Score (0-100)", "Verdict category (Reliable, False, Unverifiable, Satire)", "Calibrated uncertainty score"],
      dependencies: ["Scikit-learn", "XGBoost runtime"],
      limitations: ["Must handle missing modalities dynamically without defaulting to arbitrary true/false heuristics."]
    },
    explainability: {
      title: "Explainable AI: LIME & SHAP Rationale",
      icon: Scale,
      tag: "Explainable AI (XAI)",
      summary: "Unpacks model attributions to provide transparent token-level weights (LIME) and modality contributions (SHAP) grounded in authentic source citations.",
      inputs: ["Trained models", "Instance features and tokens"],
      models: ["LIME text explainer", "SHAP TreeExplainer"],
      outputs: ["Token attribution weights", "Modality contribution breakdown chart", "Human-readable evidence reasoning narrative"],
      dependencies: ["LIME / SHAP libraries", "Retrieved source snippets"],
      limitations: ["Model feature attribution reflects why the model predicted what it did, not absolute mathematical proof of real-world facts."]
    }
  };

  const active = modules[selectedModule];
  const Icon = active.icon;

  return (
    <div className="min-h-screen bg-[#060913] text-slate-100 flex flex-col bg-cyber-grid">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs uppercase tracking-widest font-mono text-cyan-400">
            System Specification
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-white mt-2">
            How VeriFact Works
          </h1>
          <p className="text-slate-400 text-sm sm:text-base mt-3">
            Explore the multi-stage pipeline from claim input to evidence retrieval, parallel neural inference, late fusion, and transparent explanation.
          </p>
        </div>

        {/* ── INTERACTIVE PIPELINE SELECTOR TABS ─────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          {Object.entries(modules).map(([key, mod]) => {
            const ModIcon = mod.icon;
            const isSelected = selectedModule === key;
            return (
              <button
                key={key}
                onClick={() => setSelectedModule(key)}
                className={`p-3.5 rounded-xl text-left transition-all duration-200 border flex flex-col justify-between ${
                  isSelected
                    ? "bg-cyan-500/20 border-cyan-400 text-white shadow-lg shadow-cyan-500/20"
                    : "glass-panel border-white/10 text-slate-400 hover:text-slate-200 hover:border-white/20"
                }`}
              >
                <ModIcon className={`w-5 h-5 mb-2 ${isSelected ? "text-cyan-300" : "text-slate-500"}`} />
                <div>
                  <div className="text-xs font-mono text-cyan-400/80">{mod.tag}</div>
                  <div className="text-sm font-bold truncate">{mod.title.split(":")[0]}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* ── DETAILED INSPECTION CARD FOR ACTIVE MODULE ───────────────────────── */}
        <div className="glass-panel rounded-2xl p-6 sm:p-10 border border-cyan-500/30 mb-12 glow-cyan">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/15 border border-cyan-500/40 flex items-center justify-center">
                <Icon className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <span className="text-xs font-mono text-cyan-400 tracking-wider uppercase">{active.tag}</span>
                <h2 className="text-xl sm:text-2xl font-bold text-white">{active.title}</h2>
              </div>
            </div>
            <Link
              href="/analyze"
              className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-cyan-600/30"
            >
              Test in Workspace <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed my-6">
            {active.summary}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Inputs */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
              <h4 className="text-xs font-mono uppercase text-cyan-400 font-bold">Input Signals</h4>
              <ul className="text-xs text-slate-300 space-y-1.5">
                {active.inputs.map((inp, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-cyan-500 font-bold">•</span>
                    <span>{inp}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Model Architecture */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
              <h4 className="text-xs font-mono uppercase text-blue-400 font-bold">Models & Algorithms</h4>
              <ul className="text-xs text-slate-300 space-y-1.5">
                {active.models.map((mod, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-blue-500 font-bold">•</span>
                    <span>{mod}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Outputs */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
              <h4 className="text-xs font-mono uppercase text-emerald-400 font-bold">Generated Outputs</h4>
              <ul className="text-xs text-slate-300 space-y-1.5">
                {active.outputs.map((out, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span>{out}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Scientific Limitations */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
              <h4 className="text-xs font-mono uppercase text-amber-400 font-bold">Known Limitations</h4>
              <ul className="text-xs text-slate-300 space-y-1.5">
                {active.limitations.map((lim, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-amber-500 font-bold">•</span>
                    <span>{lim}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* ── FLOW DIAGRAM SUMMARY ──────────────────────────────────────────────── */}
        <section className="glass-panel rounded-2xl p-8 border border-white/10">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            End-to-End Processing Flow Sequence
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 text-center">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-xs font-mono text-cyan-400 font-bold">STEP 1</span>
              <p className="font-semibold text-sm text-slate-200 mt-1">Input Ingestion</p>
              <p className="text-xs text-slate-500 mt-1">Text / Image / URL Sanitization & SSRF checks</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-xs font-mono text-cyan-400 font-bold">STEP 2</span>
              <p className="font-semibold text-sm text-slate-200 mt-1">Live RAG Retrieval</p>
              <p className="text-xs text-slate-500 mt-1">Query Fact Check Tools & news providers</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-xs font-mono text-cyan-400 font-bold">STEP 3</span>
              <p className="font-semibold text-sm text-slate-200 mt-1">Modality Inference</p>
              <p className="text-xs text-slate-500 mt-1">DeBERTa NLI + CLIP + ELA forensics</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-xs font-mono text-cyan-400 font-bold">STEP 4</span>
              <p className="font-semibold text-sm text-slate-200 mt-1">XGBoost Late Fusion</p>
              <p className="text-xs text-slate-500 mt-1">Calibrated Trust Score & verdict generation</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-xs font-mono text-cyan-400 font-bold">STEP 5</span>
              <p className="font-semibold text-sm text-slate-200 mt-1">XAI Attribution</p>
              <p className="text-xs text-slate-500 mt-1">LIME token weights & SHAP feature rationale</p>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
