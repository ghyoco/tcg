import type { Metadata, Viewport } from "next";
import { Fredoka } from "next/font/google";
import "./globals.css";

const fredoka = Fredoka({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-fredoka"
});

export const metadata: Metadata = {
  title: "Babi Ngepet vs Warga",
  description: "Turn-based card battler inspired by Indonesian folklore"
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${fredoka.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
