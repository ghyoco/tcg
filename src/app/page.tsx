"use client";

import dynamic from "next/dynamic";
import { I18nProvider } from "@/i18n/context";

const Board = dynamic(
  () => import("@/components/Board").then((mod) => mod.Board),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-screen w-screen items-center justify-center bg-[#e4e4ef] font-bold text-[#1f2a44]">
        Memuat Arena Pertarungan...
      </div>
    )
  }
);

export default function Home() {
  return (
    <I18nProvider>
      <Board />
    </I18nProvider>
  );
}
