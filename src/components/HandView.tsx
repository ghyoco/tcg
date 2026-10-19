"use client";

import React from "react";
import type { CardInstance } from "@/engine/types";
import { CardView } from "./CardView";

interface HandViewProps {
  cards: CardInstance[];
  selectedCardUid: string | null;
  onSelectCard: (uid: string) => void;
}

export function HandView({ cards, selectedCardUid, onSelectCard }: HandViewProps) {
  const count = cards.length;

  return (
    <div className="hand">
      {cards.map((c, i) => {
        const offset = i - (count - 1) / 2;
        const rot = offset * 4.5;
        const yOffset = Math.abs(offset) * 0.4;

        return (
          <CardView
            key={c.uid}
            card={c}
            size="xs"
            isSelected={selectedCardUid === c.uid}
            onClick={() => onSelectCard(c.uid)}
            style={
              {
                "--r": `${rot}deg`,
                "--y": `${yOffset}cqw`
              } as React.CSSProperties
            }
          />
        );
      })}
    </div>
  );
}
