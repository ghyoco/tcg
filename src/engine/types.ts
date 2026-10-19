import type { Element } from "@/data/types";

export interface LocalText {
  id: string;
  en: string;
}

export interface EffectRef {
  id: string;
  params?: Record<string, number>;
}

export interface Attack {
  name: LocalText;
  damage: number;
  cost: number;
}

export interface CreatureDef {
  kind: "creature";
  id: string;
  name: LocalText;
  series: "babi-ngepet" | "warga";
  element: Element;
  hp: number;
  retreatCost: number;
  attacks: [Attack] | [Attack, Attack];
  ability?: EffectRef;
  sprite?: string;
}

export interface ItemDef {
  kind: "item";
  id: string;
  name: LocalText;
  effect: EffectRef;
  sprite?: string;
}

export type CardDef = CreatureDef | ItemDef;

export interface CardInstance {
  uid: string;
  defId: string;
  hp: number;
  energy: number;
}

export interface PlayerState {
  deck: CardInstance[];
  hand: CardInstance[];
  active: CardInstance | null;
  bench: (CardInstance | null)[]; // fixed length 3
  discard: CardInstance[];
  energyReady: 0 | 1;
  points: number;
}

export type GamePhase = "setup" | "main" | "promote" | "over";

export interface GameState {
  players: [PlayerState, PlayerState]; // 0 = human, 1 = bot
  turn: 0 | 1;
  turnNumber: number;
  phase: GamePhase;
  winner: 0 | 1 | null;
  retreatedThisTurn: boolean;
  attackUsedThisTurn: boolean;
  pendingPromotePlayer: 0 | 1 | null;
  attackBonusThisTurn: [number, number]; // Temporary attack boosts for turn [p0, p1]
  log: string[];
}

export type GameAction =
  | { type: "SETUP_CHOOSE_ACTIVE"; playerIndex: 0 | 1; cardUid: string }
  | { type: "ATTACH_ENERGY"; playerIndex: 0 | 1; targetUid: string }
  | { type: "PLAY_TO_BENCH"; playerIndex: 0 | 1; cardUid: string; slotIndex: number }
  | { type: "PLAY_ITEM"; playerIndex: 0 | 1; cardUid: string; targetUid?: string }
  | { type: "RETREAT"; playerIndex: 0 | 1; benchSlotIndex: number }
  | { type: "ATTACK"; playerIndex: 0 | 1; attackIndex: 0 | 1 }
  | { type: "PROMOTE"; playerIndex: 0 | 1; benchSlotIndex: number }
  | { type: "END_TURN"; playerIndex: 0 | 1 };
