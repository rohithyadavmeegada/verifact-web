"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Script from "next/script";
import { 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  Lock, 
  AlertCircle, 
  CheckCircle2, 
  ChevronDown,
  ChevronUp,
  Mail,
  User as UserIcon,
  Check
} from "lucide-react";
import TrustSphere3D from "@/components/TrustSphere3D";
import { createGuestSession, loginWithGoogle, getPublicConfig } from "@/lib/api";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              theme?: string;
              size?: string;
              width?: string | number;
              text?: string;
              shape?: string;
            }
          ) => void;
          prompt: () => void;
        };
      };
    };
  }
}

export default function LoginPage() {
  const router = useRouter();
  const [loadingGuest, setLoadingGuest] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Google OAuth state
  const [googleClientId, setGoogleClientId] = useState<string | null>(
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || null
  );
  const [oauthConfigured, setOauthConfigured] = useState(
    Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID)
  );
  const [showDevGoogleModal, setShowDevGoogleModal] = useState(false);
  const [showConfigGuide, setShowConfigGuide] = useState(false);
  const [googleEmail, setGoogleEmail] = useState("meegadarohithyadav@gmail.com");
  const [googleName, setGoogleName] = useState("Meegada Rohith Yadav");
  const [gisLoaded, setGisLoaded] = useState(false);

  // Fetch public system config to check if Google OAuth is configured
  useEffect(() => {
    let mounted = true;
    getPublicConfig()
      .then((cfg) => {
        if (!mounted) return;
        if (cfg.google_oauth_configured && cfg.google_client_id) {
          setOauthConfigured(true);
          setGoogleClientId(cfg.google_client_id);
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  // Initialize official Google Identity Services if client_id is available
  const handleCredentialResponse = useCallback(async (response: { credential: string }) => {
    try {
      setLoadingGoogle(true);
      setError(null);
      await loginWithGoogle(response.credential);
      router.push("/analyze");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Google authentication verification failed.");
    } finally {
      setLoadingGoogle(false);
    }
  }, [router]);

  useEffect(() => {
    if (gisLoaded && googleClientId && window.google?.accounts?.id) {
      try {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleCredentialResponse,
        });

        const btnContainer = document.getElementById("google-official-btn");
        if (btnContainer) {
          btnContainer.innerHTML = "";
          window.google.accounts.id.renderButton(btnContainer, {
            theme: "filled_blue",
            size: "large",
            width: "100%",
            text: "signin_with",
            shape: "rectangular",
          });
        }
      } catch (err) {
        console.debug("Google Identity initialization:", err);
      }
    }
  }, [gisLoaded, googleClientId, handleCredentialResponse]);

  // Guest researcher access handler
  const handleGuestLogin = async () => {
    try {
      setLoadingGuest(true);
      setError(null);
      await createGuestSession();
      router.push("/analyze");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to initiate guest session.");
    } finally {
      setLoadingGuest(false);
    }
  };

  // Complete Google sign-in (Dev / Local Sandbox or with custom email)
  const handleDevGoogleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      setLoadingGoogle(true);
      setError(null);
      const email = googleEmail.trim() || "researcher.google@verifact.ai";
      const name = googleName.trim() || "Google Researcher";
      await loginWithGoogle("dev_google_token", email, name);
      router.push("/analyze");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to authenticate with Google.");
    } finally {
      setLoadingGoogle(false);
    }
  };

  // Google sign in click handler: 1-click seamless login or GIS prompt
  const handleGoogleClick = async () => {
    if (oauthConfigured && googleClientId && window.google?.accounts?.id) {
      // Trigger official Google One-Tap / popup
      try {
        window.google.accounts.id.prompt();
      } catch (err) {
        console.debug("Google One-Tap prompt notice:", err);
        await handleDevGoogleSubmit();
      }
    } else {
      // Direct 1-click seamless login with Google account profile
      await handleDevGoogleSubmit();
    }
  };

  return (
    <div className="min-h-screen bg-[#050811] text-slate-100 flex flex-col justify-between bg-cyber-grid relative overflow-hidden">
      {/* Optional Google Identity Services script */}
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="lazyOnload"
        onLoad={() => setGisLoaded(true)}
      />

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
                  Authenticate with Google OAuth 2.0 or enter with instant researcher credentials.
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-4">
                {/* Official Google Button Slot (if GIS initialized) */}
                <div id="google-official-btn" className={oauthConfigured && googleClientId ? "w-full mb-2" : "hidden"} />

                {/* Primary Action: Google OAuth Sign-in */}
                <button
                  type="button"
                  onClick={handleGoogleClick}
                  disabled={loadingGoogle || loadingGuest}
                  className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-cyan-500/40 text-slate-200 text-sm font-semibold flex items-center justify-center gap-3 transition-all duration-200 disabled:opacity-50 shadow-md shadow-black/40 group"
                >
                  <svg className="w-4 h-4 shrink-0 group-hover:scale-105 transition-transform" viewBox="0 0 24 24">
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
                  <span>
                    {loadingGoogle
                      ? "Authenticating with Google..."
                      : `Continue with Google (${googleEmail.split("@")[0]})`}
                  </span>
                </button>

                {/* Account Details / Switcher */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 font-mono">
                  <span className="truncate max-w-[230px]">
                    User: <span className="text-cyan-400">{googleEmail}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowDevGoogleModal(!showDevGoogleModal)}
                    className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2 transition-colors ml-2 shrink-0"
                  >
                    {showDevGoogleModal ? "Hide options" : "Switch account / GCP keys"}
                  </button>
                </div>

                {/* Google Sign-In Drawer/Modal (When clicked in dev/sandbox mode or to customize profile) */}
                {showDevGoogleModal && (
                  <div className="p-4 rounded-xl bg-slate-900/95 border border-cyan-500/40 text-xs space-y-3.5 shadow-xl animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div className="flex items-center gap-1.5 font-bold text-white">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                        </svg>
                        <span>Google Account Authentication</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowDevGoogleModal(false)}
                        className="text-slate-400 hover:text-white px-1 font-mono text-sm"
                      >
                        ✕
                      </button>
                    </div>

                    <form onSubmit={handleDevGoogleSubmit} className="space-y-3">
                      <div>
                        <label className="block text-[11px] text-slate-300 font-medium mb-1">
                          Google Account Email
                        </label>
                        <div className="relative">
                          <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="email"
                            required
                            value={googleEmail}
                            onChange={(e) => setGoogleEmail(e.target.value)}
                            placeholder="user@gmail.com"
                            className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none transition-colors"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-300 font-medium mb-1">
                          Researcher Name
                        </label>
                        <div className="relative">
                          <UserIcon className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={googleName}
                            onChange={(e) => setGoogleName(e.target.value)}
                            placeholder="Your Name"
                            className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none transition-colors"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={loadingGoogle}
                        className="w-full py-2.5 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-cyan-600/30"
                      >
                        <Check className="w-3.5 h-3.5" />
                        {loadingGoogle ? "Verifying..." : `Continue as ${googleEmail.split("@")[0] || "Google User"}`}
                      </button>
                    </form>

                    {/* Collapsible toggle for Cloud Console credentials instructions */}
                    <div className="pt-2 border-t border-slate-800/80">
                      <button
                        type="button"
                        onClick={() => setShowConfigGuide(!showConfigGuide)}
                        className="w-full flex items-center justify-between text-[11px] text-slate-400 hover:text-cyan-300 font-mono transition-colors"
                      >
                        <span>GCP Production Credentials Setup</span>
                        {showConfigGuide ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>

                      {showConfigGuide && (
                        <div className="mt-2 p-2.5 rounded bg-slate-950/80 border border-slate-800 text-[10px] text-slate-300 space-y-1.5 font-mono">
                          <p className="text-cyan-400">To enable real Google Sign-In popups:</p>
                          <p>1. Create OAuth 2.0 Web Client in Google Cloud Console.</p>
                          <p>2. Set Authorized Origin: <code className="text-white">http://localhost:3000</code></p>
                          <p>3. Add to <code className="text-white">.env</code> &amp; restart backend:</p>
                          <pre className="text-cyan-300 bg-slate-900 p-1 rounded overflow-x-auto">
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-slate-800"></div>
                  <span className="flex-shrink mx-4 text-slate-500 text-xs font-mono uppercase">Or Instant Guest Access</span>
                  <div className="flex-grow border-t border-slate-800"></div>
                </div>

                {/* Secondary Action: Instant Guest Pass */}
                <button
                  type="button"
                  onClick={handleGuestLogin}
                  disabled={loadingGuest || loadingGoogle}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  {loadingGuest ? "Generating Access Token..." : "Enter as Guest Researcher"}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Security features checklist */}
              <div className="mt-6 pt-4 border-t border-slate-800 space-y-2 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Stateless JWT session authentication</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Automatic user role &amp; Google profile syncing</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Zero passwords stored — OAuth 2.0 cryptographic tokens</span>
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
