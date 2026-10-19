"use client";

import React from "react";
import type { CardInstance, CreatureDef } from "@/engine/types";
import { getCardDef } from "@/data/cards";
import { useI18n } from "@/i18n/context";

interface AttackModalProps {
  card: CardInstance;
  onSelectAttack: (attackIndex: 0 | 1) => void;
  onClose: () => void;
}

export function AttackModal({ card, onSelectAttack, onClose }: AttackModalProps) {
  const { locale, t } = useI18n();
  const def = getCardDef(card.defId) as CreatureDef;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-xs rounded-2xl border-4 border-[#d8dce6] bg-[#f1f2fc] p-5 text-center text-[#1f2a44] shadow-2xl">
        <h2 className="text-lg font-bold">{t("attack")}</h2>
        <p className="mt-1 text-xs text-slate-600">
          {locale === "id" ? "Pilih serangan yang ingin digunakan:" : "Select an attack to unleash:"}
        </p>

        <div className="my-4 flex flex-col gap-2">
          {def.attacks.map((atk, idx) => {
            const canAfford = card.energy >= atk.cost;
            return (
              <button
                key={idx}
                className="btn dark flex items-center justify-between px-3 py-2 text-sm"
                disabled={!canAfford}
                onClick={() => {
                  onSelectAttack(idx as 0 | 1);
                  onClose();
                }}
              >
                <span className="flex items-center gap-1">
                  {Array.from({ length: atk.cost }).map((_, i) => (
                    <span
                      key={i}
                      className="inline-block h-3 w-3 rounded-full bg-cyan-300"
                    />
                  ))}
                  <b className="ml-1">{atk.name[locale]}</b>
                </span>
                <span className="rounded-md bg-white/20 px-2 py-0.5 text-xs font-bold">
                  {atk.damage}
                </span>
              </button>
            );
          })}
        </div>

        <button className="btn w-full text-xs font-bold" onClick={onClose}>
          {locale === "id" ? "Batal" : "Cancel"}
        </button>
      </div>
    </div>
  );
}
