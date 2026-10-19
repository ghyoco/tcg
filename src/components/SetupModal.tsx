"use client";

import React, { useState } from "react";
import type { CardInstance } from "@/engine/types";
import { getCardDef } from "@/data/cards";
import { useI18n } from "@/i18n/context";
import { CardView } from "./CardView";

interface SetupModalProps {
  hand: CardInstance[];
  firstPlayer: 0 | 1;
  onChooseActive: (cardUid: string) => void;
}

export function SetupModal({ hand, firstPlayer, onChooseActive }: SetupModalProps) {
  const { t, locale } = useI18n();
  const [selectedUid, setSelectedUid] = useState<string | null>(null);

  const creatures = hand.filter((c) => getCardDef(c.defId).kind === "creature");

  const handleSelect = (uid: string) => {
    const isC = creatures.some((c) => c.uid === uid);
    if (isC) setSelectedUid(uid);
  };

  const handleConfirm = () => {
    if (selectedUid) onChooseActive(selectedUid);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-sm rounded-2xl border-4 border-[#d8dce6] bg-[#f1f2fc] p-5 text-center text-[#1f2a44] shadow-2xl">
        <h2 className="text-xl font-bold">{t("chooseActive")}</h2>
        <p className="mt-1 text-sm font-semibold text-slate-700">{t("chooseActivePrompt")}</p>

        <div className="my-2 rounded-lg bg-white/70 py-1.5 text-xs font-bold text-slate-800">
          {firstPlayer === 0
            ? locale === "id"
              ? "Hasil Koin: Kamu giliran pertama!"
              : "Coin Flip: You go first!"
            : locale === "id"
              ? "Hasil Koin: Bot giliran pertama!"
              : "Coin Flip: Bot goes first!"}
        </div>

        <div className="my-4 flex flex-wrap justify-center gap-2">
          {hand.map((c) => {
            const def = getCardDef(c.defId);
            const isCreature = def.kind === "creature";
            return (
              <div
                key={c.uid}
                data-setup-creature={isCreature ? "true" : undefined}
                className={`transition-opacity ${!isCreature ? "opacity-40 pointer-events-none" : ""}`}
              >
                <CardView
                  card={c}
                  size="sm"
                  isSelected={selectedUid === c.uid}
                  onClick={() => handleSelect(c.uid)}
                />
              </div>
            );
          })}
        </div>

        <button
          className="btn go w-full py-2 text-base font-bold"
          disabled={!selectedUid}
          onClick={handleConfirm}
        >
          {locale === "id" ? "Mulai Pertarungan" : "Start Battle"}
        </button>
      </div>
    </div>
  );
}
