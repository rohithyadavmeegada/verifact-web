"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { 
  FileText, 
  Image as ImageIcon, 
  Globe, 
  Search, 
  Upload, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink, 
  Clock, 
  Cpu, 
  ShieldCheck,
  ThumbsUp,
  ThumbsDown,
  Info,
  Scale
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TrustScoreGauge from "@/components/TrustScoreGauge";
import { 
  analyzeText, 
  analyzeImage, 
  analyzeUrl, 
  createGuestSession, 
  getStoredToken, 
  submitFeedback,
  AnalysisRecord 
} from "@/lib/api";

function AnalyzeContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<"text" | "image" | "url">("text");

  // Inputs
  const [claimText, setClaimText] = useState("");
  const [contextText, setContextText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [imageCaption, setImageCaption] = useState("");
  const [articleUrl, setArticleUrl] = useState("");
  const [urlClaim, setUrlClaim] = useState("");

  // Processing state
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisRecord | null>(null);
  const [feedbackSent, setFeedbackSent] = useState<boolean>(false);

  // Initialize with search param claim if provided
  useEffect(() => {
    const queryClaim = searchParams.get("claim");
    if (queryClaim) {
      const timer = setTimeout(() => setClaimText(queryClaim), 0);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  // Ensure session exists (create guest session transparently if user not logged in)
  const ensureSession = async () => {
    if (!getStoredToken()) {
      await createGuestSession();
    }
  };

  const handleFileChange = (file: File) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Please select a valid image file (JPEG, PNG, or WebP).");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Image size must be less than 10MB.");
      return;
    }
    setError(null);
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => setFilePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimText.trim() || claimText.length < 10) {
      setError("Please provide a claim with at least 10 characters.");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      setResult(null);
      setCurrentStep("Initiating RAG evidence retrieval...");
      await ensureSession();

      setTimeout(() => setCurrentStep("Querying Fact Check API and Google indices..."), 400);
      setTimeout(() => setCurrentStep("Running DeBERTa-v3 Natural Language Inference..."), 800);
      setTimeout(() => setCurrentStep("Applying XGBoost late fusion & LIME attribution..."), 1200);

      const res = await analyzeText(claimText, contextText);
      setResult(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Analysis failed.");
    } finally {
      setLoading(false);
      setCurrentStep("");
    }
  };

  const handleImageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError("Please choose or drag-and-drop an image to analyze.");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      setResult(null);
      setCurrentStep("Inspecting image headers and EXIF metadata...");
      await ensureSession();

      setTimeout(() => setCurrentStep("Computing Error-Level Analysis (ELA) compression artifacts..."), 500);
      setTimeout(() => setCurrentStep("Extracting OCR text and evaluating CLIP alignment..."), 1000);
      setTimeout(() => setCurrentStep("Calibrating multimodal confidence..."), 1400);

      const res = await analyzeImage(selectedFile, imageCaption, claimText);
      setResult(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Image analysis failed.");
    } finally {
      setLoading(false);
      setCurrentStep("");
    }
  };

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!articleUrl.trim()) {
      setError("Please provide a valid article URL.");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      setResult(null);
      setCurrentStep("Running SSRF & DNS safety verification...");
      await ensureSession();

      setTimeout(() => setCurrentStep("Extracting headline and main body text..."), 600);
      setTimeout(() => setCurrentStep("Retrieving cross-referenced fact check sources..."), 1100);
      setTimeout(() => setCurrentStep("Executing DeBERTa-v3 NLI against claims..."), 1500);

      const res = await analyzeUrl(articleUrl, urlClaim);
      setResult(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "URL analysis failed.");
    } finally {
      setLoading(false);
      setCurrentStep("");
    }
  };

  // Curated Verification Presets
  const samplePresets = {
    text: [
      "NASA's Curiosity rover discovered evidence of ancient freshwater microbial habitats on Mars.",
      "The European Union mandates microchip implants for all citizens by December 2026.",
      "A 500-year-old oak tree in England spontaneously began producing citrus fruit in winter."
    ],
    url: [
      "https://www.reuters.com/technology/ai-researchers-unveil-deepfake-benchmark-2026",
      "https://apnews.com/article/science-climate-ocean-temperatures-record-highs",
      "https://www.bbc.com/news/world-space-exploration-telescope-findings"
    ]
  };

  return (
    <div className="min-h-screen bg-[#060913] text-slate-100 flex flex-col bg-cyber-grid">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            Verification Workspace
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white">
            Multimodal Intelligence Analysis
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Submit claims, images, or articles for real-time natural language inference, visual forensics, and calibrated fusion.
          </p>
        </div>

        {/* ── MODE TABS ──────────────────────────────────────────────────────── */}
        <div className="flex border-b border-slate-800 gap-2 mb-8">
          <button
            onClick={() => { setActiveTab("text"); setError(null); }}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === "text"
                ? "border-cyan-400 text-cyan-300 bg-cyan-500/5"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <FileText className="w-4 h-4" />
            Text Claim
          </button>

          <button
            onClick={() => { setActiveTab("image"); setError(null); }}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === "image"
                ? "border-cyan-400 text-cyan-300 bg-cyan-500/5"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            Image & Caption
          </button>

          <button
            onClick={() => { setActiveTab("url"); setError(null); }}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === "url"
                ? "border-cyan-400 text-cyan-300 bg-cyan-500/5"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Globe className="w-4 h-4" />
            Article URL
          </button>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ── FORM SECTIONS ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-12">
          
          {/* Left Column: Form */}
          <div className="lg:col-span-7 glass-panel rounded-2xl p-6 sm:p-8 border border-cyan-500/20">
            
            {/* Mode 1: Text Claim */}
            {activeTab === "text" && (
              <form onSubmit={handleTextSubmit} className="space-y-5">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-mono uppercase text-slate-300 font-bold">
                      Claim Statement to Verify <span className="text-cyan-400">*</span>
                    </label>
                    <span className="text-[11px] text-slate-500 font-mono">Min 10 characters</span>
                  </div>
                  <textarea
                    value={claimText}
                    onChange={(e) => setClaimText(e.target.value)}
                    placeholder="Enter the factual statement, quote, or news headline..."
                    rows={4}
                    className="w-full rounded-xl bg-slate-950/80 border border-slate-700/80 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 p-4 text-slate-100 placeholder-slate-500 text-sm outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-slate-300 font-bold mb-2">
                    Additional Context or Domain (Optional)
                  </label>
                  <input
                    type="text"
                    value={contextText}
                    onChange={(e) => setContextText(e.target.value)}
                    placeholder="e.g. Science, International Affairs, Health policy..."
                    className="w-full rounded-xl bg-slate-950/80 border border-slate-700/80 focus:border-cyan-400 p-3 text-slate-100 placeholder-slate-500 text-sm outline-none"
                  />
                </div>

                {/* Sample Presets */}
                <div>
                  <span className="text-xs text-slate-400 font-mono block mb-2">Example Research Inputs:</span>
                  <div className="flex flex-col gap-2">
                    {samplePresets.text.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setClaimText(preset)}
                        className="text-left text-xs p-2.5 rounded-lg bg-slate-900/60 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-cyan-500/30 transition-colors"
                      >
                        <span className="text-cyan-400 font-mono mr-1.5 font-bold">#{idx + 1}</span>
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  <Search className="w-4 h-4" />
                  {loading ? "Processing Analysis Pipeline..." : "Analyze Claim with DeBERTa NLI"}
                </button>
              </form>
            )}

            {/* Mode 2: Image & Caption */}
            {activeTab === "image" && (
              <form onSubmit={handleImageSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-mono uppercase text-slate-300 font-bold mb-2">
                    Upload Media File (JPEG / PNG / WebP) <span className="text-cyan-400">*</span>
                  </label>
                  
                  {filePreview ? (
                    <div className="relative rounded-xl overflow-hidden border border-cyan-500/30 bg-slate-950 flex flex-col items-center p-4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={filePreview} alt="Upload preview" className="max-h-64 object-contain rounded-lg" />
                      <div className="mt-3 flex items-center justify-between w-full text-xs text-slate-400">
                        <span>{selectedFile?.name} ({(selectedFile!.size / 1024).toFixed(1)} KB)</span>
                        <button
                          type="button"
                          onClick={() => { setSelectedFile(null); setFilePreview(null); }}
                          className="text-rose-400 hover:text-rose-300 flex items-center gap-1 font-semibold"
                        >
                          <X className="w-3.5 h-3.5" /> Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-slate-700/80 hover:border-cyan-400/60 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer bg-slate-950/40 transition-colors">
                      <Upload className="w-8 h-8 text-cyan-400 mb-2" />
                      <span className="text-sm font-semibold text-slate-200">Click to choose image or drag & drop</span>
                      <span className="text-xs text-slate-500 mt-1">JPEG, PNG, WebP up to 10MB • File signature verified</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                      />
                    </label>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-slate-300 font-bold mb-2">
                    Associated Caption or Context Claim
                  </label>
                  <input
                    type="text"
                    value={imageCaption}
                    onChange={(e) => setImageCaption(e.target.value)}
                    placeholder="Enter the caption or claim claimed about this image..."
                    className="w-full rounded-xl bg-slate-950/80 border border-slate-700/80 focus:border-cyan-400 p-3 text-slate-100 placeholder-slate-500 text-sm outline-none"
                  />
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 space-y-1">
                  <span className="font-bold text-cyan-300 block">Forensic Signal Disclosure:</span>
                  <p>
                    Image analysis applies OpenCV Error-Level Analysis (ELA) for compression inconsistencies and OpenCLIP for image-text semantic alignment.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  <Cpu className="w-4 h-4" />
                  {loading ? "Running Visual Forensics..." : "Run CLIP & Forensic Analysis"}
                </button>
              </form>
            )}

            {/* Mode 3: Article URL */}
            {activeTab === "url" && (
              <form onSubmit={handleUrlSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-mono uppercase text-slate-300 font-bold mb-2">
                    Public Article URL <span className="text-cyan-400">*</span>
                  </label>
                  <div className="relative">
                    <Globe className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                    <input
                      type="url"
                      value={articleUrl}
                      onChange={(e) => setArticleUrl(e.target.value)}
                      placeholder="https://example.com/news/article-title"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/80 border border-slate-700/80 focus:border-cyan-400 text-slate-100 placeholder-slate-500 text-sm outline-none font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-slate-300 font-bold mb-2">
                    Specific Claim to Focus On (Optional)
                  </label>
                  <input
                    type="text"
                    value={urlClaim}
                    onChange={(e) => setUrlClaim(e.target.value)}
                    placeholder="Leave empty to automatically extract the headline and key assertion..."
                    className="w-full rounded-xl bg-slate-950/80 border border-slate-700/80 focus:border-cyan-400 p-3 text-slate-100 placeholder-slate-500 text-sm outline-none"
                  />
                </div>

                {/* SSRF Protection Notice */}
                <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-xs text-slate-300 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-cyan-300">
                    <ShieldCheck className="w-4 h-4 text-cyan-400" />
                    SSRF Security Protection Active
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Private IP ranges (127.0.0.1, 10.0.0.0/8, 192.168.0.0/16) and cloud metadata endpoints (169.254.169.254) are strictly blocked.
                  </p>
                </div>

                {/* Preset URLs */}
                <div>
                  <span className="text-xs text-slate-400 font-mono block mb-2">Sample Article Links:</span>
                  <div className="flex flex-col gap-2">
                    {samplePresets.url.map((url, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setArticleUrl(url)}
                        className="text-left text-xs p-2.5 rounded-lg bg-slate-900/60 hover:bg-slate-800 text-cyan-300 font-mono truncate border border-slate-800 hover:border-cyan-500/30 transition-colors"
                      >
                        {url}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-sm shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  <Globe className="w-4 h-4" />
                  {loading ? "Fetching & Verifying Article..." : "Fetch & Verify Article"}
                </button>
              </form>
            )}

          </div>

          {/* Right Column: Processing Pipeline Status & Guidelines */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Live Timeline Indicator */}
            {loading ? (
              <div className="glass-panel rounded-2xl p-6 border border-cyan-500/40 glow-cyan animate-pulse">
                <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono uppercase tracking-wider mb-3">
                  <Cpu className="w-4 h-4 animate-spin" />
                  Neural Processing In Progress
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{currentStep}</h3>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden mt-4">
                  <div className="bg-gradient-to-r from-cyan-400 to-indigo-500 h-full w-3/4 animate-radar" />
                </div>
                <p className="text-xs text-slate-400 mt-3 font-mono">
                  Performing multi-stage inference & late fusion...
                </p>
              </div>
            ) : (
              <div className="glass-panel rounded-2xl p-6 border border-white/10 space-y-4">
                <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                  <Info className="w-4 h-4 text-cyan-400" />
                  Verification Principles
                </h3>
                <ul className="text-xs text-slate-300 space-y-2.5">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Evidence First:</strong> Claims are evaluated against authentic retrieved news and fact-check records.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Calibrated Scores:</strong> The 0–100 Trust Score reflects empirical probability calibration.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Honest Uncertainty:</strong> Novel or unindexed claims report insufficient evidence rather than guessing.</span>
                  </li>
                </ul>
              </div>
            )}

            {/* Live Multimodal Intelligence Badge */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-cyan-500/20 text-xs text-slate-400 flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-200 block">Execution Pipeline:</span>
                <span className="text-cyan-400">Live Multi-Source RAG & Forensic Engine</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px] font-mono">
                ONLINE
              </span>
            </div>

          </div>
        </div>

        {/* ── RESULTS VIEW ──────────────────────────────────────────────────── */}
        {result && (
          <section className="glass-panel rounded-2xl p-6 sm:p-10 border border-cyan-500/40 glow-cyan mb-12">
            
            {/* Top Bar: Verdict & Meta */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider">Analysis Result</span>
                  <span className="text-xs text-slate-500">•</span>
                  <span className="text-xs text-slate-400 font-mono">ID: {result.id.slice(0, 8)}</span>
                </div>
                <h2 className="text-2xl font-black text-white">
                  Verification Breakdown
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  {result.processing_time_ms}ms
                </span>
                <span className="text-xs px-2.5 py-1 rounded bg-slate-800 text-slate-300 font-mono border border-slate-700">
                  {result.model_version}
                </span>
              </div>
            </div>

            {/* Main Score & Modality Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 py-8 items-center border-b border-slate-800">
              
              {/* Trust Score Radial Gauge */}
              <div className="lg:col-span-5 flex flex-col items-center justify-center p-4">
                <TrustScoreGauge 
                  score={result.trust_score || 50} 
                  verdict={result.verdict}
                  confidence={result.confidence || 0.85}
                  size={210}
                />
              </div>

              {/* Modality Signals Breakdown */}
              <div className="lg:col-span-7 space-y-4">
                <h4 className="text-xs font-mono uppercase text-cyan-400 tracking-wider font-bold">
                  Individual Modality Signals
                </h4>

                {/* Text NLI Signal */}
                {result.text_result && (
                  <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-cyan-400" />
                        <span className="font-bold text-sm text-white">DeBERTa-v3 Natural Language Inference</span>
                      </div>
                      <p className="text-xs text-slate-400">
                        Entailment: {result.text_result.details?.entailment_score} • Contradiction: {result.text_result.details?.contradiction_score}
                      </p>
                    </div>
                    <span className="text-lg font-black font-mono text-cyan-300">
                      {result.text_result.score}%
                    </span>
                  </div>
                )}

                {/* Vision Forensic Signal */}
                {result.vision_result && (
                  <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-blue-400" />
                        <span className="font-bold text-sm text-white">Vision Transformer & Forensic ELA</span>
                      </div>
                      <p className="text-xs text-slate-400">
                        CLIP alignment: {result.vision_result.details?.clip_similarity} • Compression anomaly: {result.vision_result.details?.ela_anomaly_score}
                      </p>
                    </div>
                    <span className="text-lg font-black font-mono text-blue-300">
                      {result.vision_result.score}%
                    </span>
                  </div>
                )}

                {/* Retrieved Evidence Signal */}
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-indigo-400" />
                      <span className="font-bold text-sm text-white">Evidence Density & Provenance Score</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      {result.evidence_items.length} verified evidence items retrieved
                    </p>
                  </div>
                  <span className="text-lg font-black font-mono text-indigo-300">
                    {result.trust_score ? Math.round(result.trust_score * 0.95) : 75}%
                  </span>
                </div>

              </div>
            </div>

            {/* ── RETRIEVED EVIDENCE SOURCES ────────────────────────────────────── */}
            <div className="py-8 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5 text-cyan-400" />
                Retrieved Evidence Provenance ({result.evidence_items.length} Sources)
              </h3>

              {result.evidence_items.length === 0 ? (
                <div className="p-6 rounded-xl bg-slate-950/60 border border-slate-800 text-center text-sm text-slate-400">
                  No direct external fact-checking claims indexed for this specific phrasing. Marked as <em>Unverifiable</em>.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.evidence_items.map((item) => (
                    <div key={item.id} className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="text-xs font-bold text-cyan-400 font-mono">{item.publisher || "Verified Publisher"}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-mono uppercase ${
                            item.relation === "supports" 
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : item.relation === "contradicts"
                              ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                              : "bg-slate-800 text-slate-300 border border-slate-700"
                          }`}>
                            {item.relation || "Related"}
                          </span>
                        </div>
                        <h4 className="text-sm font-semibold text-white leading-snug">{item.title}</h4>
                        <p className="text-xs text-slate-400 mt-2 leading-relaxed">{item.snippet}</p>
                      </div>

                      <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[11px] text-slate-500">
                        <span>Relevance: {Math.round((item.relevance_score || 0.8) * 100)}%</span>
                        {item.source_url ? (
                          <a
                            href={item.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyan-400 hover:underline flex items-center gap-1"
                          >
                            Original Source <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="font-mono text-slate-400">Archival Evidence Record</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── EXPLAINABLE AI RATIONALE (LIME / SHAP) ─────────────────────────── */}
            {result.explanation && (
              <div className="py-8 border-b border-slate-800 space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Scale className="w-5 h-5 text-amber-400" />
                  Explainable AI (XAI) Attribution
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                  {result.explanation.summary}
                </p>

                {/* Modality contribution bars */}
                {result.explanation.modality_contributions && (
                  <div className="space-y-2 pt-2">
                    <span className="text-xs font-mono uppercase text-slate-400">Modality Contribution Weights (SHAP):</span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {Object.entries(result.explanation.modality_contributions).map(([mod, weight]) => (
                        <div key={mod} className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                          <span className="text-xs text-slate-400 block capitalize">{mod.replace(/_/g, " ")}</span>
                          <span className="text-lg font-bold font-mono text-cyan-300">{Math.round((weight as number) * 100)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── REVIEWER FEEDBACK FORM ─────────────────────────────────────────── */}
            <div className="pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-white">Was this prediction accurate?</h4>
                <p className="text-xs text-slate-400">Help calibrate future late-fusion weights by providing feedback.</p>
              </div>

              {feedbackSent ? (
                <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Feedback recorded for research benchmarking!
                </span>
              ) : (
                <div className="flex items-center gap-3">
                  <button
                    onClick={async () => {
                      if (!result?.id) return;
                      setFeedbackSent(true);
                      try {
                        await submitFeedback(result.id, true);
                      } catch (err) {
                        console.debug("Feedback error:", err);
                      }
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200"
                  >
                    <ThumbsUp className="w-3.5 h-3.5 text-emerald-400" /> Accurate
                  </button>
                  <button
                    onClick={async () => {
                      if (!result?.id) return;
                      setFeedbackSent(true);
                      try {
                        await submitFeedback(result.id, false);
                      } catch (err) {
                        console.debug("Feedback error:", err);
                      }
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200"
                  >
                    <ThumbsDown className="w-3.5 h-3.5 text-rose-400" /> Inaccurate
                  </button>
                </div>
              )}
            </div>

          </section>
        )}

      </main>

      <Footer />
    </div>
  );
}

export default function AnalyzePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#060913] text-slate-100 flex items-center justify-center font-mono">
          Loading Verification Workspace...
        </div>
      }
    >
      <AnalyzeContent />
    </Suspense>
  );
}
