"use client";

import React, { useState } from "react";
import { useI18n } from "@/i18n/context";
import { RulesModal } from "./RulesModal";

interface MenuModalProps {
  logs: string[];
  onRestart: () => void;
  onClose: () => void;
}

export function MenuModal({ logs, onRestart, onClose }: MenuModalProps) {
  const { locale, toggleLocale, t } = useI18n();
  const [showRules, setShowRules] = useState(false);

  if (showRules) {
    return <RulesModal onClose={() => setShowRules(false)} />;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="flex max-h-[85vh] w-full max-w-xs flex-col rounded-2xl border-4 border-[#d8dce6] bg-[#f1f2fc] p-5 text-[#1f2a44] shadow-2xl">
        <h2 className="text-xl font-bold text-center">{t("menu")}</h2>

        <div className="my-4 flex flex-col gap-2">
          <button className="btn w-full" onClick={() => setShowRules(true)}>
            {t("rules")}
          </button>

          <button className="btn w-full" onClick={toggleLocale}>
            {t("language")}: {locale.toUpperCase()}
          </button>

          <button
            className="btn dark w-full"
            onClick={() => {
              onClose();
              onRestart();
            }}
          >
            {t("restart")}
          </button>
        </div>

        <div className="my-2 flex-1 overflow-hidden">
          <h3 className="mb-1 text-xs font-bold text-slate-600">{t("logTitle")}</h3>
          <div className="max-h-36 overflow-y-auto rounded-lg bg-white/70 p-2 text-[10px] space-y-1">
            {logs.slice(-10).map((log, i) => (
              <div key={i} className="leading-tight text-slate-800">
                • {log}
              </div>
            ))}
          </div>
        </div>

        <button className="btn mt-3 w-full text-xs font-bold" onClick={onClose}>
          {locale === "id" ? "Kembali" : "Back"}
        </button>
      </div>
    </div>
  );
}
