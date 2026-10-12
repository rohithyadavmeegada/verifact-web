"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  Lock, 
  AlertCircle, 
  CheckCircle2, 
  Cpu, 
  UserCheck,
  Info
} from "lucide-react";
import TrustSphere3D from "@/components/TrustSphere3D";
import { createGuestSession } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [loadingGuest, setLoadingGuest] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [googleOauthNotice, setGoogleOauthNotice] = useState(false);

  const handleGuestLogin = async () => {
    try {
      setLoadingGuest(true);
      setError(null);
      await createGuestSession();
      router.push("/analyze");
    } catch (err: any) {
      setError(err.message || "Failed to initiate guest demo session.");
    } finally {
      setLoadingGuest(false);
    }
  };

  const handleGoogleClick = () => {
    setGoogleOauthNotice(true);
  };

  return (
    <div className="min-h-screen bg-[#050811] text-slate-100 flex flex-col justify-between bg-cyber-grid relative overflow-hidden">
      {/* Background radial lights */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-cyan-500/10 via-blue-600/5 to-transparent blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="p-6 flex items-center justify-between max-w-7xl mx-auto w-full z-10">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
          </div>
          <span className="text-lg font-bold text-white font-mono">
            Veri<span className="text-cyan-400">Fact</span>
          </span>
        </Link>

        <Link
          href="/"
          className="text-xs text-slate-400 hover:text-cyan-300 font-mono transition-colors"
        >
          ← Return to Website
        </Link>
      </header>

      {/* Main Split Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 flex items-center justify-center z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center w-full max-w-5xl">
          
          {/* Left Column: 3D Holographic Scene */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-full max-w-sm aspect-square flex items-center justify-center relative">
              <TrustSphere3D score={88} size={360} />
            </div>
            <div className="max-w-sm space-y-1">
              <h3 className="text-lg font-bold text-white font-mono">
                Multimodal Evidence Core
              </h3>
              <p className="text-xs text-slate-400">
                Encrypted session authentication protects analysis history, dataset benchmarks, and reproducible research artifacts.
              </p>
            </div>
          </div>

          {/* Right Column: Sign-in Glass Panel */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="w-full max-w-md glass-panel rounded-2xl p-8 border border-cyan-500/30 shadow-2xl shadow-cyan-500/10">
              
              <div className="space-y-2 mb-6 text-center">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-mono">
                  <Lock className="w-3.5 h-3.5" />
                  Secure Intelligence Access
                </div>
                <h2 className="text-2xl font-black text-white tracking-tight">
                  Sign in to VeriFact
                </h2>
                <p className="text-xs text-slate-400">
                  Select an authenticated role or enter with an ephemeral researcher demo pass.
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Primary Action 1: Guest Demo Mode */}
              <div className="space-y-4">
                <button
                  onClick={handleGuestLogin}
                  disabled={loadingGuest}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  {loadingGuest ? "Generating Demo Session..." : "Enter as Guest Researcher (Instant Demo)"}
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-slate-800"></div>
                  <span className="flex-shrink mx-4 text-slate-500 text-xs font-mono uppercase">Or OAuth 2.0</span>
                  <div className="flex-grow border-t border-slate-800"></div>
                </div>

                {/* Primary Action 2: Google OAuth */}
                <button
                  type="button"
                  onClick={handleGoogleClick}
                  className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-cyan-500/30 text-slate-200 text-sm font-medium flex items-center justify-center gap-3 transition-all"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  Sign in with Google OAuth
                </button>

                {/* Clear, honest OAuth explanation notice */}
                {googleOauthNotice && (
                  <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-xs text-slate-300 space-y-2">
                    <div className="flex items-center gap-1.5 font-bold text-cyan-300">
                      <Info className="w-4 h-4 text-cyan-400" />
                      OAuth Credentials Configuration Note
                    </div>
                    <p className="leading-relaxed">
                      Google OAuth requires authorized credentials in <code className="text-cyan-400 bg-slate-900 px-1 py-0.5 rounded">.env</code>:
                    </p>
                    <pre className="p-2 rounded bg-slate-950 text-[10px] text-cyan-300 overflow-x-auto font-mono">
GOOGLE_CLIENT_ID=your-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-secret
                    </pre>
                    <p className="text-[11px] text-slate-400">
                      When credentials are not present, please click <strong>Enter as Guest Researcher</strong> above to test all analysis and research features immediately without setup!
                    </p>
                  </div>
                )}
              </div>

              {/* Security features checklist */}
              <div className="mt-6 pt-4 border-t border-slate-800 space-y-2 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Stateless JWT session authentication</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Guest demo sandboxed from administrative settings</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>SSRF and input sanitization on all endpoints</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* Footer */}
      <footer className="p-4 text-center text-xs text-slate-600 font-mono z-10">
        VeriFact Research Intelligence • 3D WebGL Interface • Fourth-Year CSE Capstone
      </footer>
    </div>
  );
}
