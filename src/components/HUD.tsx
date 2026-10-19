"use client";

import React from "react";
import { useI18n } from "@/i18n/context";

interface HUDProps {
  title: string;
  points: number;
  chipLabel: string;
  showLang?: boolean;
}

export function HUD({ title, points, chipLabel, showLang = false }: HUDProps) {
  const { locale, toggleLocale, t } = useI18n();

  return (
    <header className="hud">
      <b>{title}</b>
      <span
        className="pips"
        role="img"
        aria-label={`${t("pts")}: ${points} / 3`}
      >
        <i className={points >= 1 ? "on" : ""} />
        <i className={points >= 2 ? "on" : ""} />
        <i className={points >= 3 ? "on" : ""} />
      </span>
      <span className="chip">{chipLabel}</span>
      {showLang && (
        <button
          className="btn lang push"
          onClick={toggleLocale}
          aria-label="Ganti Bahasa / Switch Language"
        >
          {locale === "id" ? "EN" : "ID"}
        </button>
      )}
    </header>
  );
}
