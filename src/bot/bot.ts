import type { GameAction, GameState, CardInstance, CreatureDef } from "@/engine/types";
import { getCardDef } from "@/data/cards";
import { getDamageMultiplier } from "@/data/types";

export function getExpectedDamage(attacker: CardInstance, defender: CardInstance | null): number {
  if (!defender) return 0;
  const aDef = getCardDef(attacker.defId) as CreatureDef;
  const dDef = getCardDef(defender.defId) as CreatureDef;
  let maxDmg = 0;

  for (const atk of aDef.attacks) {
    let dmg = Math.round(atk.damage * getDamageMultiplier(aDef.element, dDef.element));
    if (dDef.ability?.id === "thick-hide") dmg = Math.max(0, dmg - 10);
    if (dmg > maxDmg) maxDmg = dmg;
  }
  return maxDmg;
}

export function pickBotSetupActive(state: GameState): GameAction | null {
  const bot = state.players[1];
  if (bot.active) return null;

  const creatures = bot.hand.filter((c) => getCardDef(c.defId).kind === "creature");
  if (creatures.length === 0) return null;

  // Pick highest HP creature
  let best = creatures[0];
  let bestHp = (getCardDef(best.defId) as CreatureDef).hp;
  for (let i = 1; i < creatures.length; i++) {
    const hp = (getCardDef(creatures[i].defId) as CreatureDef).hp;
    if (hp > bestHp) {
      best = creatures[i];
      bestHp = hp;
    }
  }
  return { type: "SETUP_CHOOSE_ACTIVE", playerIndex: 1, cardUid: best.uid };
}

export function pickBotPromote(state: GameState): GameAction | null {
  if (state.phase !== "promote" || state.pendingPromotePlayer !== 1) return null;
  const bot = state.players[1];
  const humanActive = state.players[0].active;

  let bestSlot = -1;
  let bestDmg = -1;
  let bestHp = -1;

  bot.bench.forEach((c, idx) => {
    if (!c) return;
    const dmg = getExpectedDamage(c, humanActive);
    const hp = c.hp;
    if (dmg > bestDmg || (dmg === bestDmg && hp > bestHp)) {
      bestSlot = idx;
      bestDmg = dmg;
      bestHp = hp;
    }
  });

  return bestSlot >= 0 ? { type: "PROMOTE", playerIndex: 1, benchSlotIndex: bestSlot } : null;
}

export function pickBotEnergyTarget(state: GameState): string | null {
  const bot = state.players[1];
  if (bot.energyReady !== 1) return null;

  if (bot.active) {
    const aDef = getCardDef(bot.active.defId) as CreatureDef;
    const canAffordAll = aDef.attacks.every((atk) => bot.active!.energy >= atk.cost);
    if (!canAffordAll) return bot.active.uid;
  }

  // Find bench card closest to affording its best attack
  let bestUid: string | null = null;
  let minDiff = 999;
  bot.bench.forEach((c) => {
    if (!c) return;
    const cDef = getCardDef(c.defId) as CreatureDef;
    const maxCost = Math.max(...cDef.attacks.map((a) => a.cost));
    const diff = maxCost - c.energy;
    if (diff > 0 && diff < minDiff) {
      minDiff = diff;
      bestUid = c.uid;
    }
  });

  return bestUid || bot.active?.uid || null;
}

export function pickBotBenchPlay(state: GameState): GameAction | null {
  const bot = state.players[1];
  const emptySlotIdx = bot.bench.findIndex((s) => s === null);
  if (emptySlotIdx === -1) return null;

  const creatures = bot.hand.filter((c) => getCardDef(c.defId).kind === "creature");
  if (creatures.length === 0) return null;

  const humanActive = state.players[0].active;
  let bestCard = creatures[0];
  let bestScore = -999;

  for (const c of creatures) {
    const cDef = getCardDef(c.defId) as CreatureDef;
    let score = cDef.hp;
    if (humanActive) {
      const hDef = getCardDef(humanActive.defId) as CreatureDef;
      if (getDamageMultiplier(cDef.element, hDef.element) > 1) score += 100;
    }
    if (score > bestScore) {
      bestScore = score;
      bestCard = c;
    }
  }

  return { type: "PLAY_TO_BENCH", playerIndex: 1, cardUid: bestCard.uid, slotIndex: emptySlotIdx };
}

export function pickBotItemPlay(state: GameState): GameAction | null {
  const bot = state.players[1];
  const items = bot.hand.filter((c) => getCardDef(c.defId).kind === "item");
  if (items.length === 0) return null;

  for (const it of items) {
    const def = getCardDef(it.defId);
    if (def.kind !== "item") continue;
    if (def.effect.id === "heal-active" && bot.active) {
      const aDef = getCardDef(bot.active.defId) as CreatureDef;
      if (bot.active.hp <= aDef.hp - 20) {
        return { type: "PLAY_ITEM", playerIndex: 1, cardUid: it.uid };
      }
    }
    if (def.effect.id === "draw-cards" && bot.hand.length <= 4) {
      return { type: "PLAY_ITEM", playerIndex: 1, cardUid: it.uid };
    }
    if (def.effect.id === "energy-boost" && bot.active) {
      return { type: "PLAY_ITEM", playerIndex: 1, cardUid: it.uid, targetUid: bot.active.uid };
    }
  }
  return null;
}

export function pickBotRetreat(state: GameState): GameAction | null {
  const bot = state.players[1];
  if (state.retreatedThisTurn || !bot.active) return null;

  const aDef = getCardDef(bot.active.defId) as CreatureDef;
  const isLowHp = bot.active.hp <= aDef.hp * 0.3;
  if (!isLowHp || bot.active.energy < aDef.retreatCost) return null;

  const currentDmg = getExpectedDamage(bot.active, state.players[0].active);
  let bestSlot = -1;
  let bestDmg = currentDmg;

  bot.bench.forEach((c, idx) => {
    if (!c) return;
    const dmg = getExpectedDamage(c, state.players[0].active);
    if (dmg > bestDmg) {
      bestDmg = dmg;
      bestSlot = idx;
    }
  });

  return bestSlot >= 0 ? { type: "RETREAT", playerIndex: 1, benchSlotIndex: bestSlot } : null;
}

export function pickBotAttack(state: GameState): GameAction | null {
  if (state.turnNumber === 1) return null;
  const bot = state.players[1];
  if (!bot.active || !state.players[0].active) return null;

  const aDef = getCardDef(bot.active.defId) as CreatureDef;
  const hDef = getCardDef(state.players[0].active.defId) as CreatureDef;

  let bestAtkIdx: 0 | 1 | null = null;
  let maxDmg = -1;

  aDef.attacks.forEach((atk, idx) => {
    if (bot.active!.energy >= atk.cost) {
      let dmg = Math.round(atk.damage * getDamageMultiplier(aDef.element, hDef.element));
      if (hDef.ability?.id === "thick-hide") dmg = Math.max(0, dmg - 10);
      if (dmg > maxDmg) {
        maxDmg = dmg;
        bestAtkIdx = idx as 0 | 1;
      }
    }
  });

  return bestAtkIdx !== null ? { type: "ATTACK", playerIndex: 1, attackIndex: bestAtkIdx } : null;
}

export function getNextBotAction(state: GameState): GameAction {
  if (state.phase === "setup") {
    const setupAct = pickBotSetupActive(state);
    if (setupAct) return setupAct;
  }
  if (state.phase === "promote") {
    const promoteAct = pickBotPromote(state);
    if (promoteAct) return promoteAct;
  }
  if (state.phase === "main" && state.turn === 1) {
    const energyTarget = pickBotEnergyTarget(state);
    if (energyTarget) return { type: "ATTACH_ENERGY", playerIndex: 1, targetUid: energyTarget };

    const benchPlay = pickBotBenchPlay(state);
    if (benchPlay) return benchPlay;

    const itemPlay = pickBotItemPlay(state);
    if (itemPlay) return itemPlay;

    const retreatAct = pickBotRetreat(state);
    if (retreatAct) return retreatAct;

    const attackAct = pickBotAttack(state);
    if (attackAct) return attackAct;

    return { type: "END_TURN", playerIndex: 1 };
  }
  return { type: "END_TURN", playerIndex: 1 };
}
