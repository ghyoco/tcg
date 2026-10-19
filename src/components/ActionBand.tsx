"use client";

import React from "react";
import { useI18n } from "@/i18n/context";

interface ActionBandProps {
  canRetreat: boolean;
  retreatCost: number;
  isRetreatMode: boolean;
  canAttack: boolean;
  canEndTurn: boolean;
  onRetreatClick: () => void;
  onAttackClick: () => void;
  onEndTurnClick: () => void;
}

export function ActionBand({
  canRetreat,
  retreatCost,
  isRetreatMode,
  canAttack,
  canEndTurn,
  onRetreatClick,
  onAttackClick,
  onEndTurnClick
}: ActionBandProps) {
  const { t } = useI18n();

  return (
    <nav className="band">
      <button
        className={`btn ${isRetreatMode ? "go" : ""} ${!canRetreat && !isRetreatMode ? "opacity-60" : ""}`}
        onClick={onRetreatClick}
        aria-label={`${t("retreat")} (${retreatCost})`}
      >
        <span>{t("retreat")}</span> ({retreatCost})
      </button>

      <button
        className={`btn dark ${canAttack ? "go border-cyan-400" : "opacity-60"}`}
        onClick={onAttackClick}
        aria-label={t("attack")}
      >
        {t("attack")}
      </button>

      <button
        className={`btn ${canEndTurn ? "go" : "opacity-60"}`}
        onClick={onEndTurnClick}
        aria-label={t("end")}
      >
        {t("end")}
      </button>
    </nav>
  );
}
