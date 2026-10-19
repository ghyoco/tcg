"use client";

import React, { useEffect } from "react";
import type { CardInstance, CreatureDef, ItemDef } from "@/engine/types";
import { getCardDef } from "@/data/cards";
import { useI18n } from "@/i18n/context";

interface CardDetailModalProps {
  card: CardInstance;
  onClose: () => void;
}

export function CardDetailModal({ card, onClose }: CardDetailModalProps) {
  const { locale, t } = useI18n();
  const def = getCardDef(card.defId);
  const isCreature = def.kind === "creature";
  const cDef = isCreature ? (def as CreatureDef) : null;
  const iDef = !isCreature ? (def as ItemDef) : null;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const maxHp = cDef?.hp ?? 0;
  const currentHp = card.hp;
  const hpPct = maxHp > 0 ? Math.max(0, Math.min(100, Math.round((currentHp / maxHp) * 100))) : 0;
  const element = isCreature ? cDef!.element : "item";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={def.name[locale]}
      data-testid="card-detail-modal"
    >
      <div
        className="relative w-full max-w-xs sm:max-w-sm rounded-2xl border-4 border-[#3a4768] bg-[#1a233a] p-4 text-white shadow-2xl flex flex-col gap-3 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700 pb-2">
          <div className="flex items-center gap-2">
            <span
              className={`rounded px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                element === "dark"
                  ? "bg-purple-900 text-purple-200"
                  : element === "fire"
                  ? "bg-red-800 text-red-200"
                  : element === "light"
                  ? "bg-amber-800 text-amber-200"
                  : "bg-cyan-900 text-cyan-200"
              }`}
            >
              {isCreature ? `${cDef!.element}` : t("item")}
            </span>
            <h2 className="text-base font-extrabold text-white">{def.name[locale]}</h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
            aria-label={t("close")}
          >
            ✕
          </button>
        </div>

        {/* SVG Artwork */}
        <div className="flex justify-center rounded-xl bg-[#0f1422] p-2 border border-slate-800">
          {def.sprite ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={def.sprite}
              alt={def.name[locale]}
              className="h-44 w-auto max-w-full object-contain drop-shadow"
            />
          ) : (
            <div className="h-44 w-full flex items-center justify-center text-slate-500 text-xs">
              No Sprite
            </div>
          )}
        </div>

        {/* Stats for Creature */}
        {isCreature && (
          <div className="flex flex-col gap-2 rounded-xl bg-slate-900/80 p-3 border border-slate-800 text-xs">
            {/* HP and Energy row */}
            <div className="flex items-center justify-between font-bold">
              <span>
                {t("hp")}: {currentHp} / {maxHp}
              </span>
              <span className="flex items-center gap-1 text-cyan-300">
                <span>{t("energyAttached")}:</span>
                <b>{card.energy}</b>
              </span>
            </div>
            {/* HP bar */}
            <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
              <div
                className={`h-full transition-all ${
                  hpPct > 50 ? "bg-emerald-500" : hpPct > 20 ? "bg-amber-500" : "bg-red-500"
                }`}
                style={{ width: `${hpPct}%` }}
              />
            </div>
            {/* Retreat cost */}
            <div className="flex items-center justify-between text-slate-400">
              <span>{t("retreat")}:</span>
              <span className="font-bold text-slate-200">{cDef!.retreatCost} Token</span>
            </div>
          </div>
        )}

        {/* Ability Box */}
        {isCreature && cDef!.ability && (
          <div className="rounded-xl bg-amber-950/40 p-2.5 border border-amber-800/60 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-amber-300">
              <span className="rounded bg-amber-800 px-1.5 py-0.2 text-[10px] uppercase">
                {t("ability")}
              </span>
              <span>{cDef!.ability.id === "thick-hide" ? "Kulit Tebal" : "Alarm Ronda"}</span>
            </div>
            <p className="mt-1 text-amber-100/90 leading-relaxed text-[11px]">
              {cDef!.ability.id === "thick-hide" ? t("thickHideDesc") : t("alarmDesc")}
            </p>
          </div>
        )}

        {/* Attacks List */}
        {isCreature && (
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {t("attacksTitle")}
            </span>
            <div className="flex flex-col gap-1.5">
              {cDef!.attacks.map((atk, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-lg bg-slate-800/80 px-2.5 py-1.5 text-xs border border-slate-700/60"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="flex items-center gap-0.5">
                      {Array.from({ length: atk.cost }).map((_, i) => (
                        <span key={i} className="inline-block h-2.5 w-2.5 rounded-full bg-cyan-400" />
                      ))}
                    </span>
                    <span className="font-semibold text-slate-100">{atk.name[locale]}</span>
                  </div>
                  <span className="font-bold text-amber-400">
                    {atk.damage} {t("damage")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Element hint */}
        {isCreature && (
          <div className="text-[11px] text-slate-400 bg-slate-900/60 rounded-lg p-2 border border-slate-800">
            {cDef!.element === "fire" && <span>🔥 {t("fireAdvantageDesc")}</span>}
            {cDef!.element === "dark" && <span>🌙 {t("darkWeaknessDesc")}</span>}
            {cDef!.element === "light" && <span>☀️ {t("lightNormalDesc")}</span>}
          </div>
        )}

        {/* Item Card Details */}
        {!isCreature && iDef && (
          <div className="flex flex-col gap-2 rounded-xl bg-cyan-950/30 p-3 border border-cyan-800/50 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-cyan-300">
              <span className="rounded bg-cyan-800 px-1.5 py-0.2 text-[10px] uppercase">
                {t("effect")}
              </span>
              <span>{def.name[locale]}</span>
            </div>
            <p className="mt-1 text-cyan-100 leading-relaxed text-[11px]">
              {iDef.effect.id === "heal-active" && t("healActiveDesc")}
              {iDef.effect.id === "draw-cards" && t("drawCardsDesc")}
              {iDef.effect.id === "energy-boost" && t("energyBoostDesc")}
            </p>
            <p className="text-[10px] text-cyan-400/80 border-t border-cyan-900/60 pt-1">
              💡 {t("itemRuleHint")}
            </p>
          </div>
        )}

        {/* Footer Hint */}
        <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800">
          <span>{t("inspectHint")}</span>
          <button
            onClick={onClose}
            className="rounded bg-slate-800 px-2.5 py-1 text-slate-300 hover:bg-slate-700 hover:text-white"
          >
            {t("close")}
          </button>
        </div>
      </div>
    </div>
  );
}
