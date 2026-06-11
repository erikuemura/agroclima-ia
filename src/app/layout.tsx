import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CampoClima — Inteligência para o campo",
  description: "Plataforma de apoio à decisão para pequenos e médios produtores rurais",
  manifest: "/manifest.json",
  themeColor: "#3b6d11",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CampoClima",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="h-full">
      <body className={`${inter.className} bg-stone-50 text-stone-900 h-full antialiased`}>
        {children}
      </body>
    </html>
  );
}
