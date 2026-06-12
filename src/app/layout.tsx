import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#3b6d11",
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://agroclima-ia.vercel.app"),
  title: {
    default: "CampoClima — Inteligência para o campo",
    template: "%s | CampoClima",
  },
  description:
    "Plataforma de gestão agrícola com IA para pequenos e médios produtores rurais. Clima em tempo real, NDVI por satélite, análise de solo, pulverização inteligente e AgroAssistente.",
  keywords: [
    "agricultura de precisão", "gestão agrícola", "previsão do tempo agro",
    "NDVI satélite", "análise de solo IA", "pulverização inteligente",
    "irrigação automatizada", "calendário agrícola", "produtor rural", "agtech brasil",
  ],
  authors: [{ name: "CampoClima" }],
  creator: "CampoClima",
  publisher: "CampoClima",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "/",
    siteName: "CampoClima",
    title: "CampoClima — Inteligência para o campo",
    description:
      "Clima, satélite, solo e IA reunidos para o produtor rural brasileiro. Tome decisões melhores a cada safra.",
    images: [{ url: "/api/og", width: 1200, height: 630, alt: "CampoClima" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "CampoClima — Inteligência para o campo",
    description: "Plataforma agro com IA para produtores rurais brasileiros.",
    images: ["/api/og"],
  },
  robots: { index: true, follow: true },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CampoClima",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/icons/icon-192x192.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="h-full">
      <body className={`${inter.className} bg-stone-50 text-stone-900 h-full antialiased`}>
        <ServiceWorkerRegistrar />
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
