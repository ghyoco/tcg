"use client";

import React from "react";
import type { CardInstance, CreatureDef } from "@/engine/types";
import { getCardDef } from "@/data/cards";
import { useI18n } from "@/i18n/context";

interface CardViewProps {
  card: CardInstance;
  size: "lg" | "sm" | "xs";
  isSelected?: boolean;
  isHighlighted?: boolean;
  animClass?: string;
  onClick?: () => void;
  onHoverStart?: (card: CardInstance) => void;
  onHoverEnd?: () => void;
  style?: React.CSSProperties;
}

export function CardView({
  card,
  size,
  isSelected = false,
  isHighlighted = false,
  animClass = "",
  onClick,
  onHoverStart,
  onHoverEnd,
  style
}: CardViewProps) {
  const { locale, t } = useI18n();
  const def = getCardDef(card.defId);
  const isCreature = def.kind === "creature";
  const cDef = isCreature ? (def as CreatureDef) : null;
  const name = def.name[locale];
  const element = isCreature ? cDef!.element : "item";

  const maxHp = cDef?.hp ?? 0;
  const currentHp = card.hp;
  const hpPct = maxHp > 0 ? Math.max(0, Math.min(100, Math.round((currentHp / maxHp) * 100))) : 0;
  const isLowHp = hpPct <= 35;

  return (
    <article
      className={`card ${size} ${isSelected ? "selected" : ""} ${isHighlighted ? "highlighted" : ""} ${animClass}`}
      data-el={element}
      style={style}
      onClick={() => {
        onHoverEnd?.();
        onClick?.();
      }}
      onMouseMove={() => onHoverStart?.(card)}
      onMouseLeave={() => onHoverEnd?.()}
      onTouchStart={() => onHoverStart?.(card)}
      onTouchEnd={() => onHoverEnd?.()}
      onTouchCancel={() => onHoverEnd?.()}
      role="button"
      tabIndex={0}
      aria-label={`${name}, ${isCreature ? `${currentHp}/${maxHp} HP` : t("item")}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onHoverEnd?.();
          onClick?.();
        }
      }}
    >
      <h3>
        <i className={`el ${element}`} />
        <span>{name}</span>
      </h3>

      <div className="art">
        {def.sprite ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={def.sprite}
            alt={name}
            loading="lazy"
            onError={(e) => {
              (e.currentTarget as HTMLElement).style.display = "none";
            }}
          />
        ) : null}
      </div>

      {size === "lg" && isCreature && (
        <>
          {cDef!.attacks.map((atk, idx) => (
            <p key={idx} className="at">
              {Array.from({ length: atk.cost }).map((_, i) => (
                <i key={i} />
              ))}
              <span>{atk.name[locale]}</span>
              <b>{atk.damage}</b>
            </p>
          ))}
          <p className="ret">
            <span>{t("retreat")}</span> {cDef!.retreatCost}
          </p>
        </>
      )}

      {size !== "xs" && isCreature && (
        <div className="hp">
          <b>{currentHp}</b>
          <span className="bar">
            <i className={isLowHp ? "low" : ""} style={{ width: `${hpPct}%` }} />
          </span>
          {card.energy > 0 && (
            <span className="en">
              {Array.from({ length: card.energy }).map((_, i) => (
                <i key={i} />
              ))}
            </span>
          )}
        </div>
      )}
    </article>
  );
}
