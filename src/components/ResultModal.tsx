"use client";

import React from "react";
import { useI18n } from "@/i18n/context";

interface ResultModalProps {
  winner: 0 | 1 | null;
  playerPoints: number;
  botPoints: number;
  onRestart: () => void;
}

export function ResultModal({
  winner,
  playerPoints,
  botPoints,
  onRestart
}: ResultModalProps) {
  const { t } = useI18n();
  const isPlayerWin = winner === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-sm rounded-2xl border-4 border-[#d8dce6] bg-[#f1f2fc] p-6 text-center text-[#1f2a44] shadow-2xl">
        <h2 className="text-3xl font-extrabold tracking-wide">
          {isPlayerWin ? t("victory") : t("defeat")}
        </h2>
        <p className="mt-2 text-sm font-semibold text-slate-700">
          {isPlayerWin ? t("victoryDesc") : t("defeatDesc")}
        </p>

        <div className="my-5 flex items-center justify-center gap-6 rounded-xl bg-white/80 py-3 text-lg font-bold">
          <div>
            <div className="text-xs text-slate-500">{t("you")}</div>
            <div className="text-2xl text-cyan-600">{playerPoints}</div>
          </div>
          <div className="text-slate-400">-</div>
          <div>
            <div className="text-xs text-slate-500">{t("bot")}</div>
            <div className="text-2xl text-slate-600">{botPoints}</div>
          </div>
        </div>

        <button
          className="btn go w-full py-3 text-base font-bold"
          onClick={onRestart}
        >
          {t("playAgain")}
        </button>
      </div>
    </div>
  );
}
