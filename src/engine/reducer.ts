import type { GameAction, GameState, PlayerState, CardInstance, Attack, CreatureDef } from "./types";
import type { RNG } from "./rng";
import { getCardDef, createDeck } from "@/data/cards";
import { getDamageMultiplier } from "@/data/types";
import { applyEffect } from "./effects";

export function drawValidHand(deck: CardInstance[], rng: RNG): { hand: CardInstance[]; remaining: CardInstance[] } {
  let d = [...deck];
  while (true) {
    d = rng.shuffle(d);
    const hand = d.slice(0, 5);
    const hasCreature = hand.some((c) => getCardDef(c.defId).kind === "creature");
    if (hasCreature) {
      return { hand, remaining: d.slice(5) };
    }
  }
}

export function createInitialState(rng: RNG): GameState {
  const p0Deck = createDeck("babi-ngepet");
  const p1Deck = createDeck("warga");
  const p0Draw = drawValidHand(p0Deck, rng);
  const p1Draw = drawValidHand(p1Deck, rng);

  const firstTurn = rng.coinFlip();
  const p0: PlayerState = {
    deck: p0Draw.remaining,
    hand: p0Draw.hand,
    active: null,
    bench: [null, null, null],
    discard: [],
    energyReady: 0,
    points: 0
  };
  const p1: PlayerState = {
    deck: p1Draw.remaining,
    hand: p1Draw.hand,
    active: null,
    bench: [null, null, null],
    discard: [],
    energyReady: 0,
    points: 0
  };

  return {
    players: [p0, p1],
    turn: firstTurn,
    turnNumber: 1,
    phase: "setup",
    winner: null,
    retreatedThisTurn: false,
    attackUsedThisTurn: false,
    pendingPromotePlayer: null,
    attackBonusThisTurn: [0, 0],
    log: [`Koin dilempar: Pemain ${firstTurn === 0 ? "Kamu" : "Bot"} jalan duluan.`]
  };
}

export function startNextTurn(state: GameState, nextPlayerIndex: 0 | 1): GameState {
  const nextPlayer = state.players[nextPlayerIndex];
  const drawn = nextPlayer.deck.slice(0, 1);
  const remainingDeck = nextPlayer.deck.slice(1);

  const updatedPlayer: PlayerState = {
    ...nextPlayer,
    deck: remainingDeck,
    hand: drawn.length > 0 ? [...nextPlayer.hand, drawn[0]] : nextPlayer.hand,
    energyReady: 1
  };

  const updatedPlayers = [...state.players] as [PlayerState, PlayerState];
  updatedPlayers[nextPlayerIndex] = updatedPlayer;

  return {
    ...state,
    players: updatedPlayers,
    turn: nextPlayerIndex,
    turnNumber: state.turnNumber + 1,
    phase: "main",
    retreatedThisTurn: false,
    attackUsedThisTurn: false,
    attackBonusThisTurn: [0, 0],
    pendingPromotePlayer: null,
    log: [...state.log, `Giliran ${nextPlayerIndex === 0 ? "Kamu" : "Bot"} dimulai.`]
  };
}

function handleSetupChooseActive(state: GameState, playerIndex: 0 | 1, cardUid: string): GameState {
  if (state.phase !== "setup") return state;
  const player = state.players[playerIndex];
  if (player.active) return state;

  const card = player.hand.find((c) => c.uid === cardUid);
  if (!card) return state;
  const def = getCardDef(card.defId);
  if (def.kind !== "creature") return state;

  const updatedPlayer: PlayerState = {
    ...player,
    active: card,
    hand: player.hand.filter((c) => c.uid !== cardUid)
  };

  const updatedPlayers = [...state.players] as [PlayerState, PlayerState];
  updatedPlayers[playerIndex] = updatedPlayer;

  const bothReady = updatedPlayers[0].active !== null && updatedPlayers[1].active !== null;
  if (!bothReady) {
    return { ...state, players: updatedPlayers };
  }

  // Both chose active, reveal and start first turn
  const firstPlayerIndex = state.turn;
  const firstPlayer = updatedPlayers[firstPlayerIndex];
  const drawn = firstPlayer.deck.slice(0, 1);
  const remainingDeck = firstPlayer.deck.slice(1);

  updatedPlayers[firstPlayerIndex] = {
    ...firstPlayer,
    deck: remainingDeck,
    hand: drawn.length > 0 ? [...firstPlayer.hand, drawn[0]] : firstPlayer.hand,
    energyReady: 1
  };

  return {
    ...state,
    players: updatedPlayers,
    phase: "main",
    log: [...state.log, "Kedua kartu aktif terungkap! Pertarungan dimulai."]
  };
}

function handleAttachEnergy(state: GameState, playerIndex: 0 | 1, targetUid: string): GameState {
  if (state.phase !== "main" || state.turn !== playerIndex) return state;
  const player = state.players[playerIndex];
  if (player.energyReady !== 1) return state;

  let targetFound = false;
  let newActive = player.active;
  if (newActive && newActive.uid === targetUid) {
    newActive = { ...newActive, energy: newActive.energy + 1 };
    targetFound = true;
  }

  const newBench = player.bench.map((c) => {
    if (c && c.uid === targetUid && !targetFound) {
      targetFound = true;
      return { ...c, energy: c.energy + 1 };
    }
    return c;
  });

  if (!targetFound) return state;

  const updatedPlayers = [...state.players] as [PlayerState, PlayerState];
  updatedPlayers[playerIndex] = {
    ...player,
    active: newActive,
    bench: newBench,
    energyReady: 0
  };

  return {
    ...state,
    players: updatedPlayers,
    log: [...state.log, `${playerIndex === 0 ? "Kamu" : "Bot"} memasang 1 energi.`]
  };
}

function handlePlayToBench(state: GameState, playerIndex: 0 | 1, cardUid: string, slotIndex: number): GameState {
  if (state.phase !== "main" || state.turn !== playerIndex) return state;
  if (slotIndex < 0 || slotIndex > 2) return state;

  const player = state.players[playerIndex];
  if (player.bench[slotIndex] !== null) return state;

  const card = player.hand.find((c) => c.uid === cardUid);
  if (!card) return state;
  const def = getCardDef(card.defId);
  if (def.kind !== "creature") return state;

  const newBench = [...player.bench] as (CardInstance | null)[];
  newBench[slotIndex] = card;

  const updatedPlayers = [...state.players] as [PlayerState, PlayerState];
  updatedPlayers[playerIndex] = {
    ...player,
    bench: newBench,
    hand: player.hand.filter((c) => c.uid !== cardUid)
  };

  return {
    ...state,
    players: updatedPlayers,
    log: [...state.log, `${playerIndex === 0 ? "Kamu" : "Bot"} memainkan ${def.name.id} ke bangku.`]
  };
}

function handlePlayItem(state: GameState, playerIndex: 0 | 1, cardUid: string, targetUid?: string): GameState {
  if (state.phase !== "main" || state.turn !== playerIndex) return state;
  const player = state.players[playerIndex];
  const card = player.hand.find((c) => c.uid === cardUid);
  if (!card) return state;

  const def = getCardDef(card.defId);
  if (def.kind !== "item") return state;

  const updatedPlayer: PlayerState = {
    ...player,
    hand: player.hand.filter((c) => c.uid !== cardUid),
    discard: [...player.discard, card]
  };

  const updatedPlayers = [...state.players] as [PlayerState, PlayerState];
  updatedPlayers[playerIndex] = updatedPlayer;

  const intermediateState: GameState = {
    ...state,
    players: updatedPlayers,
    log: [...state.log, `${playerIndex === 0 ? "Kamu" : "Bot"} menggunakan ${def.name.id}.`]
  };

  return applyEffect(intermediateState, playerIndex, def.effect, targetUid);
}

function handleRetreat(state: GameState, playerIndex: 0 | 1, benchSlotIndex: number): GameState {
  if (state.phase !== "main" || state.turn !== playerIndex || state.retreatedThisTurn) return state;
  const player = state.players[playerIndex];
  if (!player.active) return state;

  const benchCard = player.bench[benchSlotIndex];
  if (!benchCard) return state;

  const def = getCardDef(player.active.defId);
  if (def.kind !== "creature" || player.active.energy < def.retreatCost) return state;

  const newBench = [...player.bench] as (CardInstance | null)[];
  const retreatingCard = {
    ...player.active,
    energy: player.active.energy - def.retreatCost
  };
  newBench[benchSlotIndex] = retreatingCard;

  const updatedPlayers = [...state.players] as [PlayerState, PlayerState];
  updatedPlayers[playerIndex] = {
    ...player,
    active: benchCard,
    bench: newBench
  };

  return {
    ...state,
    players: updatedPlayers,
    retreatedThisTurn: true,
    log: [...state.log, `${playerIndex === 0 ? "Kamu" : "Bot"} menukar kartu aktif dengan kartu di bangku.`]
  };
}

function calculateAttackDamage(
  attackerDef: CreatureDef,
  defenderDef: CreatureDef,
  attack: Attack,
  bonus: number
): number {
  let dmg = attack.damage + bonus;
  const mult = getDamageMultiplier(attackerDef.element, defenderDef.element);
  dmg = Math.round(dmg * mult);
  if (defenderDef.ability?.id === "thick-hide") {
    dmg = Math.max(0, dmg - 10);
  }
  return dmg;
}

function handleAttack(state: GameState, playerIndex: 0 | 1, attackIndex: 0 | 1): GameState {
  if (state.phase !== "main" || state.turn !== playerIndex || state.turnNumber === 1) return state;

  const player = state.players[playerIndex];
  const opponentIndex: 0 | 1 = (1 - playerIndex) as 0 | 1;
  const opponent = state.players[opponentIndex];
  if (!player.active || !opponent.active) return state;

  const attackerDef = getCardDef(player.active.defId);
  const defenderDef = getCardDef(opponent.active.defId);
  if (attackerDef.kind !== "creature" || defenderDef.kind !== "creature") return state;

  const attack = attackerDef.attacks[attackIndex];
  if (!attack || player.active.energy < attack.cost) return state;

  const bonus = state.attackBonusThisTurn[playerIndex];
  const finalDamage = calculateAttackDamage(attackerDef, defenderDef, attack, bonus);
  const remainingHp = opponent.active.hp - finalDamage;

  if (remainingHp > 0) {
    const updatedOpponent: PlayerState = {
      ...opponent,
      active: { ...opponent.active, hp: remainingHp }
    };
    const updatedPlayers = [...state.players] as [PlayerState, PlayerState];
    updatedPlayers[opponentIndex] = updatedOpponent;

    const postAttackState: GameState = {
      ...state,
      players: updatedPlayers,
      log: [...state.log, `${playerIndex === 0 ? "Kamu" : "Bot"} menggunakan ${attack.name.id} menghasilkan ${finalDamage} luka.`]
    };
    return startNextTurn(postAttackState, opponentIndex);
  }

  // Knockout occurred!
  return handleKnockout(state, playerIndex, opponentIndex, finalDamage, attack.name.id);
}

function handleKnockout(
  state: GameState,
  attackerIndex: 0 | 1,
  defenderIndex: 0 | 1,
  damage: number,
  attackName: string
): GameState {
  const attacker = state.players[attackerIndex];
  const defender = state.players[defenderIndex];
  if (!defender.active) return state;

  const newPoints = attacker.points + 1;
  const updatedDefender: PlayerState = {
    ...defender,
    active: null,
    discard: [...defender.discard, defender.active]
  };
  const updatedAttacker: PlayerState = {
    ...attacker,
    points: newPoints
  };

  const updatedPlayers = [...state.players] as [PlayerState, PlayerState];
  updatedPlayers[attackerIndex] = updatedAttacker;
  updatedPlayers[defenderIndex] = updatedDefender;

  const logMsg = `${attackerIndex === 0 ? "Kamu" : "Bot"} menumbangkan kartu lawan dengan ${attackName}! (+1 Poin)`;

  if (newPoints >= 3) {
    return {
      ...state,
      players: updatedPlayers,
      phase: "over",
      winner: attackerIndex,
      log: [...state.log, logMsg, `Pemain ${attackerIndex === 0 ? "Kamu" : "Bot"} Menang!`]
    };
  }

  const hasBench = updatedDefender.bench.some((c) => c !== null);
  if (!hasBench) {
    return {
      ...state,
      players: updatedPlayers,
      phase: "over",
      winner: attackerIndex,
      log: [...state.log, logMsg, `Lawan tidak memiliki kartu cadangan di bangku! Pemain ${attackerIndex === 0 ? "Kamu" : "Bot"} Menang!`]
    };
  }

  return {
    ...state,
    players: updatedPlayers,
    phase: "promote",
    pendingPromotePlayer: defenderIndex,
    log: [...state.log, logMsg, `Menunggu ${defenderIndex === 0 ? "Kamu" : "Bot"} memajukan kartu cadangan.`]
  };
}

function handlePromote(state: GameState, playerIndex: 0 | 1, benchSlotIndex: number): GameState {
  if (state.phase !== "promote" || state.pendingPromotePlayer !== playerIndex) return state;
  const player = state.players[playerIndex];
  const card = player.bench[benchSlotIndex];
  if (!card) return state;

  const newBench = [...player.bench] as (CardInstance | null)[];
  newBench[benchSlotIndex] = null;

  const updatedPlayer: PlayerState = {
    ...player,
    active: card,
    bench: newBench
  };

  const updatedPlayers = [...state.players] as [PlayerState, PlayerState];
  updatedPlayers[playerIndex] = updatedPlayer;

  const intermediateState: GameState = {
    ...state,
    players: updatedPlayers,
    pendingPromotePlayer: null,
    log: [...state.log, `${playerIndex === 0 ? "Kamu" : "Bot"} memajukan ${getCardDef(card.defId).name.id} ke arena aktif.`]
  };

  // Check alarm ability on newly promoted card
  const def = getCardDef(card.defId);
  let postAbilityState = intermediateState;
  if (def.kind === "creature" && def.ability?.id === "alarm") {
    postAbilityState = applyEffect(intermediateState, playerIndex, { id: "draw-cards", params: { count: 1 } });
  }

  // Turn passes to the promoted player
  return startNextTurn(postAbilityState, playerIndex);
}

function handleEndTurn(state: GameState, playerIndex: 0 | 1): GameState {
  if (state.phase !== "main" || state.turn !== playerIndex) return state;
  const player = state.players[playerIndex];

  // Token is lost if unused
  const updatedPlayer: PlayerState = {
    ...player,
    energyReady: 0
  };
  const updatedPlayers = [...state.players] as [PlayerState, PlayerState];
  updatedPlayers[playerIndex] = updatedPlayer;

  const nextPlayerIndex = (1 - playerIndex) as 0 | 1;
  const intermediateState: GameState = {
    ...state,
    players: updatedPlayers,
    log: [...state.log, `${playerIndex === 0 ? "Kamu" : "Bot"} mengakhiri giliran.`]
  };

  return startNextTurn(intermediateState, nextPlayerIndex);
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "SETUP_CHOOSE_ACTIVE":
      return handleSetupChooseActive(state, action.playerIndex, action.cardUid);
    case "ATTACH_ENERGY":
      return handleAttachEnergy(state, action.playerIndex, action.targetUid);
    case "PLAY_TO_BENCH":
      return handlePlayToBench(state, action.playerIndex, action.cardUid, action.slotIndex);
    case "PLAY_ITEM":
      return handlePlayItem(state, action.playerIndex, action.cardUid, action.targetUid);
    case "RETREAT":
      return handleRetreat(state, action.playerIndex, action.benchSlotIndex);
    case "ATTACK":
      return handleAttack(state, action.playerIndex, action.attackIndex);
    case "PROMOTE":
      return handlePromote(state, action.playerIndex, action.benchSlotIndex);
    case "END_TURN":
      return handleEndTurn(state, action.playerIndex);
    default:
      return state;
  }
}
