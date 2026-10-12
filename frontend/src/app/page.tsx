"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  ShieldCheck, 
  Search, 
  Cpu, 
  Layers, 
  Sparkles, 
  ArrowRight, 
  CheckCircle, 
  AlertTriangle, 
  FileText, 
  Image as ImageIcon, 
  Globe, 
  Activity, 
  FlaskConical,
  Scale,
  BrainCircuit,
  Lock,
  ChevronRight
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TrustSphere3D from "@/components/TrustSphere3D";
import TrustScoreGauge from "@/components/TrustScoreGauge";

export default function Home() {
  const [interactiveClaim, setInteractiveClaim] = useState("");
  const [sampleScore, setSampleScore] = useState(84);
  const [sampleVerdict, setSampleVerdict] = useState("likely_reliable");

  const sampleClaims = [
    { text: "James Webb Space Telescope detects atmospheric water vapor on habitable-zone exoplanet.", score: 92, verdict: "likely_reliable" },
    { text: "WHO announces mandatory global digital carbon biometric passports for international travel.", score: 18, verdict: "likely_false" },
    { text: "Archeological dig in Greece uncovers bronze artifact with unknown mathematical inscriptions.", score: 54, verdict: "unverifiable" },
  ];

  return (
    <div className="min-h-screen bg-[#060913] text-slate-100 flex flex-col bg-cyber-grid">
      <Navbar />

      <main className="flex-1">
        {/* ── HERO SECTION ──────────────────────────────────────────────────────── */}
        <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 overflow-hidden bg-radial-gradient">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              {/* Left Column: Headlines & CTA */}
              <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                {/* Academic Pill */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-panel border border-cyan-500/30 text-xs font-mono text-cyan-300">
                  <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                  B.Tech CSE Research Project • Multimodal Fact Verification
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
                  Real-Time, <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 text-glow-cyan">Explainable</span> Truth Intelligence.
                </h1>

                <p className="text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                  VeriFact combines <strong>DeBERTa-v3 Natural Language Inference</strong>, <strong>Vision Transformer forensics</strong>, and <strong>retrieval-augmented evidence ranking</strong> into a calibrated late-fusion framework for automated fake news and deepfake detection.
                </p>

                {/* Primary Actions */}
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-4">
                  <Link
                    href="/analyze"
                    className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-semibold shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:-translate-y-0.5 transition-all duration-300"
                  >
                    <Search className="w-4 h-4" />
                    Analyze a Claim
                  </Link>

                  <Link
                    href="/how-it-works"
                    className="flex items-center gap-2 px-6 py-3.5 rounded-xl glass-panel glass-panel-hover text-slate-200 font-semibold border border-white/10"
                  >
                    <Cpu className="w-4 h-4 text-cyan-400" />
                    Explore Architecture
                  </Link>

                  <Link
                    href="/login"
                    className="flex items-center gap-2 px-5 py-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-cyan-300 font-mono text-sm border border-cyan-500/20"
                  >
                    <Sparkles className="w-4 h-4" />
                    Open Demo Mode
                  </Link>
                </div>

                {/* Live Model Stats Badges */}
                <div className="pt-6 grid grid-cols-3 gap-4 border-t border-slate-800/80 max-w-lg mx-auto lg:mx-0">
                  <div>
                    <div className="text-2xl font-black text-white font-mono">0–100</div>
                    <div className="text-xs text-slate-400">Calibrated Trust Score</div>
                  </div>
                  <div>
                    <div className="text-2xl font-black text-cyan-400 font-mono">&lt;850ms</div>
                    <div className="text-xs text-slate-400">Target p50 Latency</div>
                  </div>
                  <div>
                    <div className="text-2xl font-black text-indigo-400 font-mono">3 Modalities</div>
                    <div className="text-xs text-slate-400">Text • Vision • Propagation</div>
                  </div>
                </div>
              </div>

              {/* Right Column: Interactive 3D Trust Sphere */}
              <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
                <div className="relative w-full max-w-md aspect-square flex items-center justify-center">
                  <TrustSphere3D score={sampleScore} size={420} />
                </div>
                <p className="text-xs text-slate-400 text-center font-mono mt-2">
                  Interactive 3D Evidence Network • Drag to inspect nodes
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* ── INTERACTIVE DEMO PREVIEW CARD ─────────────────────────────────────── */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-cyan-500/30 glow-cyan">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-cyan-400" />
                  Quick Claim Verification Sandbox
                </h3>
                <p className="text-sm text-slate-400">
                  Select a test claim below or input your own to observe the calibrated Trust Score computation.
                </p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
                Interactive Preview
              </span>
            </div>

            {/* Sample Claim Pills */}
            <div className="flex flex-wrap gap-2.5 mb-6">
              {sampleClaims.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInteractiveClaim(item.text);
                    setSampleScore(item.score);
                    setSampleVerdict(item.verdict);
                  }}
                  className="text-left text-xs sm:text-sm px-3.5 py-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60 hover:border-cyan-500/40 transition-all duration-200"
                >
                  <span className="text-cyan-400 font-mono mr-1.5 font-bold">#{idx + 1}</span>
                  {item.text.slice(0, 55)}...
                </button>
              ))}
            </div>

            {/* Input & Output Split */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-8 space-y-4">
                <textarea
                  value={interactiveClaim}
                  onChange={(e) => setInteractiveClaim(e.target.value)}
                  placeholder="Paste any headline, statement, or claim to evaluate against indexed evidence..."
                  rows={3}
                  className="w-full rounded-xl bg-slate-950/70 border border-slate-700/80 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 p-4 text-slate-200 placeholder-slate-500 text-sm outline-none transition-all"
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-mono">
                    {interactiveClaim.length} characters • DeBERTa tokenization ready
                  </span>
                  <Link
                    href={`/analyze?claim=${encodeURIComponent(interactiveClaim || sampleClaims[0].text)}`}
                    className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-cyan-600/30"
                  >
                    Run Full Pipeline <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              <div className="lg:col-span-4 flex justify-center py-2">
                <TrustScoreGauge score={sampleScore} verdict={sampleVerdict} size={170} />
              </div>
            </div>
          </div>
        </section>

        {/* ── SYSTEM ARCHITECTURE MODULES ───────────────────────────────────────── */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs uppercase tracking-widest font-mono text-cyan-400 mb-2">
              Modular Deep Learning Architecture
            </h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-white">
              End-to-End Multimodal Verification
            </p>
            <p className="text-slate-400 text-sm sm:text-base mt-3">
              Independent processing pipelines ensure robustness against missing modalities while exposing granular evidence signals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Module 1: Text Pipeline */}
            <div className="glass-panel glass-panel-hover rounded-xl p-6 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-cyan-400" />
                </div>
                <h3 className="text-lg font-bold text-white">Text Pipeline: DeBERTa-v3 NLI</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Performs Natural Language Inference comparing claims against retrieved source snippets. Computes entailment, contradiction, and neutral probabilities.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800 text-xs font-mono text-cyan-400 flex items-center justify-between">
                <span>Model: DeBERTa-v3-large</span>
                <span>Signal: NLI Matrix</span>
              </div>
            </div>

            {/* Module 2: Vision Pipeline */}
            <div className="glass-panel glass-panel-hover rounded-xl p-6 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
                  <ImageIcon className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="text-lg font-bold text-white">Vision: CLIP, ViT & ELA Forensics</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Calculates cross-modal image-text semantic alignment via CLIP. Analyzes compression artifacts via Error-Level Analysis (ELA) and extracts embedded text with OCR.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800 text-xs font-mono text-blue-400 flex items-center justify-between">
                <span>Model: ViT-B/32 + ELA</span>
                <span>Signal: Visual Match</span>
              </div>
            </div>

            {/* Module 3: RAG Retrieval Engine */}
            <div className="glass-panel glass-panel-hover rounded-xl p-6 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-indigo-400" />
                </div>
                <h3 className="text-lg font-bold text-white">RAG Evidence Retrieval</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Asynchronously queries authoritative fact-check registries and news providers. Deduplicates, scores domain reputation, and feeds verified citations to the NLI module.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800 text-xs font-mono text-indigo-400 flex items-center justify-between">
                <span>Providers: Fact Check API</span>
                <span>Signal: Provenance</span>
              </div>
            </div>

            {/* Module 4: Social Propagation */}
            <div className="glass-panel glass-panel-hover rounded-xl p-6 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
                  <Layers className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="text-lg font-bold text-white">Propagation: GraphSAGE / GAT</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Models information diffusion cascades across user and post networks using Graph Neural Networks. Evaluates virality velocity and structural tree depth.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800 text-xs font-mono text-purple-400 flex items-center justify-between">
                <span>Model: Inductive GNN</span>
                <span>Signal: Cascade Depth</span>
              </div>
            </div>

            {/* Module 5: Multimodal Late Fusion */}
            <div className="glass-panel glass-panel-hover rounded-xl p-6 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                  <BrainCircuit className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-lg font-bold text-white">Multimodal Late Fusion</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  An XGBoost classifier combines text entailment vectors, image-text mismatch scores, propagation metrics, and evidence density. Calibrates final prediction probabilities.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800 text-xs font-mono text-emerald-400 flex items-center justify-between">
                <span>Model: Calibrated XGBoost</span>
                <span>Signal: Unified Trust</span>
              </div>
            </div>

            {/* Module 6: Explainable AI */}
            <div className="glass-panel glass-panel-hover rounded-xl p-6 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                  <Scale className="w-5 h-5 text-amber-400" />
                </div>
                <h3 className="text-lg font-bold text-white">Explainable AI (XAI)</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Extracts token-level attributions with LIME and global modality importance using SHAP. Generates honest human-readable rationales citing supporting and contradicting sources.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800 text-xs font-mono text-amber-400 flex items-center justify-between">
                <span>Methods: LIME & SHAP</span>
                <span>Signal: Transparent XAI</span>
              </div>
            </div>

          </div>
        </section>

        {/* ── RESEARCH INTEGRITY & LIMITATIONS SECTION ───────────────────────── */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="glass-panel rounded-2xl p-8 border border-white/10 bg-slate-900/50">
            <div className="flex items-center gap-2.5 text-amber-400 font-mono text-xs uppercase tracking-wider mb-3">
              <AlertTriangle className="w-4 h-4" />
              Scientific Integrity & Academic Boundaries
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">
              Honest Scientific Principles
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed mb-6">
              Unlike black-box commercial tools that generate arbitrary true/false verdicts, VeriFact explicitly follows research-grade safeguards:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-slate-400">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-white/5 space-y-2">
                <h4 className="font-semibold text-slate-200 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-cyan-400" />
                  Absence ≠ Falsehood
                </h4>
                <p className="text-xs leading-relaxed">
                  When no corroborating records exist, the system labels the claim as <em>Unverifiable</em> or <em>Insufficient Evidence</em> rather than falsely declaring it manipulated.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-950/60 border border-white/5 space-y-2">
                <h4 className="font-semibold text-slate-200 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-cyan-400" />
                  C2PA & Provenance
                </h4>
                <p className="text-xs leading-relaxed">
                  Compression artifacts (ELA) or low CLIP similarity are documented as forensic signals, not conclusive evidence of synthetic deepfakes without cryptographic provenance.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-950/60 border border-white/5 space-y-2">
                <h4 className="font-semibold text-slate-200 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-cyan-400" />
                  No Fabricated Citations
                </h4>
                <p className="text-xs leading-relaxed">
                  All source citations are retrieved from authentic fact-check tools or news APIs with live URLs and verified publishers. Simulated demo results are clearly isolated.
                </p>
              </div>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
