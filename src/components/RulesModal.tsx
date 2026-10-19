"use client";

import React from "react";
import { useI18n } from "@/i18n/context";

interface RulesModalProps {
  onClose: () => void;
}

export function RulesModal({ onClose }: RulesModalProps) {
  const { dict, t, locale } = useI18n();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="flex max-h-[85vh] w-full max-w-sm flex-col rounded-2xl border-4 border-[#d8dce6] bg-[#f1f2fc] p-5 text-[#1f2a44] shadow-2xl">
        <h2 className="text-xl font-bold text-center">{t("rules")}</h2>

        <div className="my-3 flex-1 overflow-y-auto pr-1 text-xs space-y-2">
          {dict.rulesBody.map((rule, idx) => (
            <p key={idx} className="rounded-lg bg-white/70 p-2 leading-relaxed">
              {rule}
            </p>
          ))}
        </div>

        <button className="btn dark mt-2 w-full py-2 text-sm font-bold" onClick={onClose}>
          {locale === "id" ? "Tutup" : "Close"}
        </button>
      </div>
    </div>
  );
}
