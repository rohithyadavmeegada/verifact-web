"use client";

interface TrustScoreGaugeProps {
  score: number; // 0 - 100
  verdict?: string;
  confidence?: number; // 0 - 1
  size?: number;
}

export default function TrustScoreGauge({
  score,
  verdict = "unverifiable",
  confidence = 0.85,
  size = 200,
}: TrustScoreGaugeProps) {
  // Radius and circumference for SVG circle
  const strokeWidth = 14;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(100, Math.max(0, score));
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  // Determine colors based on score
  let colorGradient = {
    start: "#06b6d4",
    end: "#3b82f6",
    badgeBg: "bg-blue-500/15",
    badgeBorder: "border-blue-500/30",
    badgeText: "text-blue-300",
    label: "Likely Reliable",
  };

  if (score >= 70) {
    colorGradient = {
      start: "#10b981",
      end: "#06b6d4",
      badgeBg: "bg-emerald-500/15",
      badgeBorder: "border-emerald-500/30",
      badgeText: "text-emerald-300",
      label: "Likely Reliable",
    };
  } else if (score >= 50) {
    colorGradient = {
      start: "#06b6d4",
      end: "#3b82f6",
      badgeBg: "bg-cyan-500/15",
      badgeBorder: "border-cyan-500/30",
      badgeText: "text-cyan-300",
      label: "Unverifiable",
    };
  } else if (score >= 30) {
    colorGradient = {
      start: "#f59e0b",
      end: "#fbbf24",
      badgeBg: "bg-amber-500/15",
      badgeBorder: "border-amber-500/30",
      badgeText: "text-amber-300",
      label: "Insufficient Evidence",
    };
  } else {
    colorGradient = {
      start: "#ef4444",
      end: "#f43f5e",
      badgeBg: "bg-rose-500/15",
      badgeBorder: "border-rose-500/30",
      badgeText: "text-rose-300",
      label: "Likely False",
    };
  }

  // Format verdict nicely if passed from backend
  const displayLabel = verdict ? verdict.replace(/_/g, " ").toUpperCase() : colorGradient.label.toUpperCase();

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <defs>
            <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colorGradient.start} />
              <stop offset="100%" stopColor={colorGradient.end} />
            </linearGradient>
          </defs>

          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth={strokeWidth}
          />

          {/* Animated score fill */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="url(#scoreGradient)"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center content */}
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-4xl font-black text-white font-mono tracking-tight">
            {Math.round(score)}
          </span>
          <span className="text-xs text-slate-400 font-mono tracking-wider">TRUST SCORE</span>
        </div>
      </div>

      {/* Verdict & Confidence Badge */}
      <div className="mt-3 flex flex-col items-center gap-1.5">
        <span
          className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider font-mono border ${colorGradient.badgeBg} ${colorGradient.badgeBorder} ${colorGradient.badgeText}`}
        >
          {displayLabel}
        </span>
        <span className="text-[11px] text-slate-400">
          Model Confidence: <span className="text-slate-200 font-semibold">{Math.round(confidence * 100)}%</span>
        </span>
      </div>
    </div>
  );
}
