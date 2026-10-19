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
        className={`btn ${isRetreatMode ? "go" : ""}`}
        disabled={!canRetreat && !isRetreatMode}
        onClick={onRetreatClick}
        aria-label={`${t("retreat")} (${retreatCost})`}
      >
        <span>{t("retreat")}</span> ({retreatCost})
      </button>

      <button
        className="btn dark"
        disabled={!canAttack}
        onClick={onAttackClick}
        aria-label={t("attack")}
      >
        {t("attack")}
      </button>

      <button
        className="btn go"
        disabled={!canEndTurn}
        onClick={onEndTurnClick}
        aria-label={t("end")}
      >
        {t("end")}
      </button>
    </nav>
  );
}
