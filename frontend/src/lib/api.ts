/**
 * VeriFact Frontend API Client
 * Connects to the FastAPI backend with token auth and fallback handling.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface UserSession {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  role: string;
  is_demo: boolean;
}

export interface EvidenceItem {
  id: string;
  source_url?: string;
  source_name?: string;
  publisher?: string;
  title?: string;
  snippet?: string;
  published_at?: string;
  relation?: "supports" | "contradicts" | "neutral" | "related";
  relevance_score?: number;
  is_fact_check?: boolean;
}

export interface ModalityResult {
  modality: string;
  score?: number;
  confidence?: number;
  available: boolean;
  details: Record<string, string | number | boolean | null | undefined>;
  warnings: string[];
}

export interface ExplanationData {
  method: string;
  summary: string;
  token_attributions?: Array<{ token: string; weight: number }>;
  feature_importance?: Array<{ feature: string; weight: number }>;
  evidence_reasoning?: Array<{ claim: string; evidence: string; relation: string }>;
  modality_contributions?: Record<string, number>;
  limitations: string[];
}

export interface AnalysisRecord {
  id: string;
  analysis_type: "text" | "image" | "url" | "multimodal";
  status: string;
  is_demo: boolean;
  claim_text?: string;
  source_url?: string;
  caption?: string;
  trust_score?: number;
  verdict?: "likely_reliable" | "unverifiable" | "likely_false" | "satire" | "insufficient_evidence";
  confidence?: number;
  is_calibrated?: boolean;
  text_result?: ModalityResult;
  vision_result?: ModalityResult;
  social_result?: ModalityResult;
  evidence_result?: ModalityResult;
  evidence_items: EvidenceItem[];
  explanation?: ExplanationData;
  model_version?: string;
  processing_time_ms?: number;
  warnings: string[];
  created_at?: string;
  completed_at?: string;
}

// Session Token Storage
export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("verifact_token");
}

export function setStoredToken(token: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem("verifact_token", token);
}

export function clearStoredToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("verifact_token");
  localStorage.removeItem("verifact_user");
}

export function getStoredUser(): UserSession | null {
  if (typeof window === "undefined") return null;
  const user = localStorage.getItem("verifact_user");
  if (!user) return null;
  try {
    return JSON.parse(user);
  } catch {
    return null;
  }
}

export function setStoredUser(user: UserSession) {
  if (typeof window === "undefined") return;
  localStorage.setItem("verifact_user", JSON.stringify(user));
}

// API Helper
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errorMsg = `API request failed: ${res.status} ${res.statusText}`;
    try {
      const errorJson = await res.json();
      errorMsg = errorJson.detail || errorJson.error || errorMsg;
    } catch {}
    throw new Error(errorMsg);
  }

  return res.json();
}

// Authentication API
export async function createGuestSession(): Promise<{ user: UserSession; access_token: string }> {
  const data = await request<{ user: UserSession; access_token: string }>("/api/v1/auth/guest", {
    method: "POST",
  });
  setStoredToken(data.access_token);
  setStoredUser(data.user);
  return data;
}

export async function loginWithGoogle(
  token: string,
  email?: string,
  name?: string,
  avatar_url?: string
): Promise<{ user: UserSession; access_token: string }> {
  const data = await request<{ user: UserSession; access_token: string }>("/api/v1/auth/google", {
    method: "POST",
    body: JSON.stringify({ token, email, name, avatar_url }),
  });
  setStoredToken(data.access_token);
  setStoredUser(data.user);
  return data;
}

export async function getCurrentSession(): Promise<UserSession | null> {
  const token = getStoredToken();
  if (!token) return null;
  try {
    const user = await request<UserSession>("/api/v1/auth/session");
    setStoredUser(user);
    return user;
  } catch {
    clearStoredToken();
    return null;
  }
}

export async function logout(): Promise<void> {
  try {
    await request("/api/v1/auth/logout", { method: "POST" });
  } finally {
    clearStoredToken();
  }
}

// Analysis API
export async function analyzeText(claim: string, context?: string): Promise<AnalysisRecord> {
  return request<AnalysisRecord>("/api/v1/analyze/text", {
    method: "POST",
    body: JSON.stringify({ claim, context }),
  });
}

export async function analyzeImage(file: File, caption?: string, claim?: string): Promise<AnalysisRecord> {
  const formData = new FormData();
  formData.append("image", file);
  if (caption) formData.append("caption", caption);
  if (claim) formData.append("claim", claim);

  return request<AnalysisRecord>("/api/v1/analyze/image", {
    method: "POST",
    body: formData,
  });
}

export async function analyzeUrl(url: string, claim?: string): Promise<AnalysisRecord> {
  return request<AnalysisRecord>("/api/v1/analyze/url", {
    method: "POST",
    body: JSON.stringify({ url, claim }),
  });
}

export async function getAnalysis(id: string): Promise<AnalysisRecord> {
  return request<AnalysisRecord>(`/api/v1/analyze/${id}`);
}

export async function submitFeedback(
  analysisId: string,
  isCorrect?: boolean,
  rating?: number,
  comment?: string
): Promise<{ id: string }> {
  return request<{ id: string }>(`/api/v1/analyze/${analysisId}/feedback`, {
    method: "POST",
    body: JSON.stringify({ is_correct: isCorrect, rating, comment }),
  });
}

export interface HistoryItem {
  id: string;
  analysis_type: string;
  status: string;
  claim_text?: string;
  trust_score?: number;
  verdict?: string;
  is_demo: boolean;
  created_at?: string;
}

export async function getHistory(): Promise<HistoryItem[]> {
  return request("/api/v1/history");
}

export interface DatasetItem {
  id: string;
  name: string;
  version?: string;
  description?: string;
  source_url?: string;
  license?: string;
  total_records?: number;
  is_downloaded: boolean;
  split_info?: Record<string, number>;
  label_definitions?: Record<string, string>;
}

// Research Lab API
export async function getDatasets(): Promise<DatasetItem[]> {
  return request("/api/v1/research/datasets");
}

export async function getExperiments(): Promise<Record<string, unknown>[]> {
  return request("/api/v1/research/experiments");
}

export async function createExperiment(params: {
  name: string;
  description?: string;
  dataset_id?: string;
  pipeline_components: string[];
  hyperparameters?: Record<string, unknown>;
  random_seed?: number;
}): Promise<Record<string, unknown>> {
  return request("/api/v1/research/experiments", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export interface ResearchStats {
  total_analyses: number;
  completed_analyses: number;
  average_processing_time_ms: number | null;
  total_experiments: number;
  datasets_registered: number;
}

export async function getResearchStats(): Promise<ResearchStats> {
  return request("/api/v1/research/stats");
}

export async function getPublicConfig(): Promise<{
  demo_mode: boolean;
  google_oauth_configured: boolean;
  google_client_id?: string | null;
  providers: Record<string, boolean>;
  features: Record<string, boolean>;
}> {
  return request("/api/v1/config/public");
}
