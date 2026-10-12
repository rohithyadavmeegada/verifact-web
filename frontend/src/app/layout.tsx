import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VeriFact — Multimodal AI Fake News & Deepfake Detection Platform",
  description: "A Multimodal Deep Learning Framework for Real-Time, Explainable Fake News and Deepfake Detection leveraging DeBERTa-v3 NLI, ViT/CLIP Forensics, and Calibrated Late Fusion.",
  keywords: ["fake news detection", "deepfake detection", "DeBERTa", "multimodal AI", "fact checking", "explainable AI", "LIME", "SHAP"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#060913] text-slate-100">{children}</body>
    </html>
  );
}
