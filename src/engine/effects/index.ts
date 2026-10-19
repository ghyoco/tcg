import type { EffectRef, GameState } from "@/engine/types";
import { getCardDef } from "@/data/cards";

export type EffectHandler = (
  state: GameState,
  playerIndex: 0 | 1,
  effect: EffectRef,
  targetUid?: string
) => GameState;

const effectRegistry: Record<string, EffectHandler> = {
  "heal-active": (state, playerIndex, effect) => {
    const player = state.players[playerIndex];
    if (!player.active) return state;

    const def = getCardDef(player.active.defId);
    if (def.kind !== "creature") return state;

    const amount = effect.params?.amount ?? 30;
    const newHp = Math.min(def.hp, player.active.hp + amount);

    const updatedPlayers = [...state.players] as [typeof player, typeof player];
    updatedPlayers[playerIndex] = {
      ...player,
      active: { ...player.active, hp: newHp }
    };

    return {
      ...state,
      players: updatedPlayers,
      log: [...state.log, `Player ${playerIndex} healed active card for ${amount} HP`]
    };
  },

  "draw-cards": (state, playerIndex, effect) => {
    const player = state.players[playerIndex];
    const count = effect.params?.count ?? 2;
    const drawn = player.deck.slice(0, count);
    const remainingDeck = player.deck.slice(count);

    const updatedPlayers = [...state.players] as [typeof player, typeof player];
    updatedPlayers[playerIndex] = {
      ...player,
      deck: remainingDeck,
      hand: [...player.hand, ...drawn]
    };

    return {
      ...state,
      players: updatedPlayers,
      log: [...state.log, `Player ${playerIndex} drew ${drawn.length} cards`]
    };
  },

  "energy-boost": (state, playerIndex, _effect, targetUid) => {
    const player = state.players[playerIndex];
    let targetFound = false;

    let newActive = player.active;
    if (newActive && (!targetUid || newActive.uid === targetUid)) {
      newActive = { ...newActive, energy: newActive.energy + 1 };
      targetFound = true;
    }

    const newBench = player.bench.map((c) => {
      if (c && targetUid && c.uid === targetUid && !targetFound) {
        targetFound = true;
        return { ...c, energy: c.energy + 1 };
      }
      return c;
    });

    if (!targetFound && newActive) {
      newActive = { ...newActive, energy: newActive.energy + 1 };
    }

    const updatedPlayers = [...state.players] as [typeof player, typeof player];
    updatedPlayers[playerIndex] = {
      ...player,
      active: newActive,
      bench: newBench
    };

    return {
      ...state,
      players: updatedPlayers,
      log: [...state.log, `Player ${playerIndex} attached bonus energy`]
    };
  }
};

export function applyEffect(
  state: GameState,
  playerIndex: 0 | 1,
  effect: EffectRef,
  targetUid?: string
): GameState {
  const handler = effectRegistry[effect.id];
  if (!handler) {
    return state;
  }
  return handler(state, playerIndex, effect, targetUid);
}
