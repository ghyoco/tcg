import { describe, it, expect } from "vitest";
import { SeededRNG } from "./rng";
import { createInitialState, gameReducer } from "./reducer";
import { getCardDef } from "@/data/cards";
import { getDamageMultiplier } from "@/data/types";

describe("Game Engine Unit Tests", () => {
  it("draws 5 cards with at least one creature on setup", () => {
    const rng = new SeededRNG(42);
    const state = createInitialState(rng);

    expect(state.players[0].hand).toHaveLength(5);
    expect(state.players[1].hand).toHaveLength(5);

    const p0HasCreature = state.players[0].hand.some((c) => getCardDef(c.defId).kind === "creature");
    const p1HasCreature = state.players[1].hand.some((c) => getCardDef(c.defId).kind === "creature");

    expect(p0HasCreature).toBe(true);
    expect(p1HasCreature).toBe(true);
  });

  it("handles setup active card selection and starts main phase", () => {
    const rng = new SeededRNG(101);
    let state = createInitialState(rng);

    const p0Creature = state.players[0].hand.find((c) => getCardDef(c.defId).kind === "creature")!;
    const p1Creature = state.players[1].hand.find((c) => getCardDef(c.defId).kind === "creature")!;

    state = gameReducer(state, { type: "SETUP_CHOOSE_ACTIVE", playerIndex: 0, cardUid: p0Creature.uid });
    expect(state.players[0].active?.uid).toBe(p0Creature.uid);
    expect(state.phase).toBe("setup");

    state = gameReducer(state, { type: "SETUP_CHOOSE_ACTIVE", playerIndex: 1, cardUid: p1Creature.uid });
    expect(state.players[1].active?.uid).toBe(p1Creature.uid);
    expect(state.phase).toBe("main");
    expect(state.players[state.turn].energyReady).toBe(1);
  });

  it("attaches energy once per turn to active or bench, lost if unused", () => {
    const rng = new SeededRNG(202);
    let state = createInitialState(rng);
    const p0Creature = state.players[0].hand.find((c) => getCardDef(c.defId).kind === "creature")!;
    const p1Creature = state.players[1].hand.find((c) => getCardDef(c.defId).kind === "creature")!;
    state = gameReducer(state, { type: "SETUP_CHOOSE_ACTIVE", playerIndex: 0, cardUid: p0Creature.uid });
    state = gameReducer(state, { type: "SETUP_CHOOSE_ACTIVE", playerIndex: 1, cardUid: p1Creature.uid });

    const activeP = state.turn;
    const targetUid = state.players[activeP].active!.uid;

    expect(state.players[activeP].energyReady).toBe(1);
    expect(state.players[activeP].active!.energy).toBe(0);

    state = gameReducer(state, { type: "ATTACH_ENERGY", playerIndex: activeP, targetUid });
    expect(state.players[activeP].active!.energy).toBe(1);
    expect(state.players[activeP].energyReady).toBe(0);

    // Second attach in same turn should do nothing
    state = gameReducer(state, { type: "ATTACH_ENERGY", playerIndex: activeP, targetUid });
    expect(state.players[activeP].active!.energy).toBe(1);
  });

  it("allows multiple items per turn without limit", () => {
    const rng = new SeededRNG(303);
    let state = createInitialState(rng);
    const p0Creature = state.players[0].hand.find((c) => getCardDef(c.defId).kind === "creature")!;
    const p1Creature = state.players[1].hand.find((c) => getCardDef(c.defId).kind === "creature")!;
    state = gameReducer(state, { type: "SETUP_CHOOSE_ACTIVE", playerIndex: 0, cardUid: p0Creature.uid });
    state = gameReducer(state, { type: "SETUP_CHOOSE_ACTIVE", playerIndex: 1, cardUid: p1Creature.uid });

    const p = state.turn;
    // Inject two items in hand
    state.players[p].hand.push({ uid: "item-1", defId: "bn-it-02", hp: 0, energy: 0 }); // draw 2
    state.players[p].hand.push({ uid: "item-2", defId: "bn-it-02", hp: 0, energy: 0 }); // draw 2

    const handBefore = state.players[p].hand.length;
    state = gameReducer(state, { type: "PLAY_ITEM", playerIndex: p, cardUid: "item-1" });
    // Drew 2 cards, spent 1 item = +1 net
    expect(state.players[p].hand.length).toBe(handBefore + 1);

    // Playing second item in same turn MUST succeed (no limit per turn)
    state = gameReducer(state, { type: "PLAY_ITEM", playerIndex: p, cardUid: "item-2" });
    expect(state.players[p].hand.length).toBe(handBefore + 2);
  });

  it("retreats active to bench, spending retreat cost energy", () => {
    const rng = new SeededRNG(404);
    let state = createInitialState(rng);
    const p0Creature = state.players[0].hand.find((c) => getCardDef(c.defId).kind === "creature")!;
    const p1Creature = state.players[1].hand.find((c) => getCardDef(c.defId).kind === "creature")!;
    state = gameReducer(state, { type: "SETUP_CHOOSE_ACTIVE", playerIndex: 0, cardUid: p0Creature.uid });
    state = gameReducer(state, { type: "SETUP_CHOOSE_ACTIVE", playerIndex: 1, cardUid: p1Creature.uid });

    const p = state.turn;
    // Add bench creature
    state.players[p].bench[0] = { uid: "bench-c", defId: "bn-03", hp: 60, energy: 0 };
    // Active needs energy for retreat (bn-01 needs 1)
    state.players[p].active!.energy = 2;

    const oldActiveUid = state.players[p].active!.uid;
    state = gameReducer(state, { type: "RETREAT", playerIndex: p, benchSlotIndex: 0 });

    expect(state.players[p].active!.uid).toBe("bench-c");
    expect(state.players[p].bench[0]?.uid).toBe(oldActiveUid);
    expect(state.players[p].bench[0]?.energy).toBe(1); // 2 - 1 retreat cost
    expect(state.retreatedThisTurn).toBe(true);

    // Cannot retreat twice in one turn
    state = gameReducer(state, { type: "RETREAT", playerIndex: p, benchSlotIndex: 0 });
    expect(state.players[p].active!.uid).toBe("bench-c");
  });

  it("applies type chart multiplier correctly (fire does 2x to dark)", () => {
    expect(getDamageMultiplier("fire", "dark")).toBe(2);
    expect(getDamageMultiplier("dark", "fire")).toBe(1);
    expect(getDamageMultiplier("light", "dark")).toBe(1);
    expect(getDamageMultiplier("dark", "dark")).toBe(1);
  });

  it("prevents attacking on turn 1", () => {
    const rng = new SeededRNG(505);
    let state = createInitialState(rng);
    const p0Creature = state.players[0].hand.find((c) => getCardDef(c.defId).kind === "creature")!;
    const p1Creature = state.players[1].hand.find((c) => getCardDef(c.defId).kind === "creature")!;
    state = gameReducer(state, { type: "SETUP_CHOOSE_ACTIVE", playerIndex: 0, cardUid: p0Creature.uid });
    state = gameReducer(state, { type: "SETUP_CHOOSE_ACTIVE", playerIndex: 1, cardUid: p1Creature.uid });

    expect(state.turnNumber).toBe(1);
    const p = state.turn;
    state.players[p].active!.energy = 5;

    const oppHpBefore = state.players[1 - p as 0 | 1].active!.hp;
    state = gameReducer(state, { type: "ATTACK", playerIndex: p, attackIndex: 0 });

    // Attack must have been blocked on turn 1
    expect(state.players[1 - p as 0 | 1].active!.hp).toBe(oppHpBefore);
  });

  it("handles knockout, awards point, and prompts defender promotion", () => {
    const rng = new SeededRNG(606);
    let state = createInitialState(rng);
    const p0Creature = state.players[0].hand.find((c) => getCardDef(c.defId).kind === "creature")!;
    const p1Creature = state.players[1].hand.find((c) => getCardDef(c.defId).kind === "creature")!;
    state = gameReducer(state, { type: "SETUP_CHOOSE_ACTIVE", playerIndex: 0, cardUid: p0Creature.uid });
    state = gameReducer(state, { type: "SETUP_CHOOSE_ACTIVE", playerIndex: 1, cardUid: p1Creature.uid });

    state.turnNumber = 2; // Allow attack
    const p = state.turn;
    const opp = (1 - p) as 0 | 1;

    // Set opponent active to low HP and add bench card
    state.players[opp].active!.hp = 10;
    state.players[opp].bench[1] = { uid: "opp-bench", defId: "wg-03", hp: 50, energy: 0 };
    state.players[p].active!.energy = 3;

    state = gameReducer(state, { type: "ATTACK", playerIndex: p, attackIndex: 0 });

    expect(state.players[p].points).toBe(1);
    expect(state.players[opp].active).toBeNull();
    expect(state.phase).toBe("promote");
    expect(state.pendingPromotePlayer).toBe(opp);

    // Defender promotes
    state = gameReducer(state, { type: "PROMOTE", playerIndex: opp, benchSlotIndex: 1 });
    expect(state.players[opp].active?.uid).toBe("opp-bench");
    expect(state.phase).toBe("main");
    expect(state.turn).toBe(opp);
  });

  it("declares immediate victory when defender has no bench to promote", () => {
    const rng = new SeededRNG(707);
    let state = createInitialState(rng);
    const p0Creature = state.players[0].hand.find((c) => getCardDef(c.defId).kind === "creature")!;
    const p1Creature = state.players[1].hand.find((c) => getCardDef(c.defId).kind === "creature")!;
    state = gameReducer(state, { type: "SETUP_CHOOSE_ACTIVE", playerIndex: 0, cardUid: p0Creature.uid });
    state = gameReducer(state, { type: "SETUP_CHOOSE_ACTIVE", playerIndex: 1, cardUid: p1Creature.uid });

    state.turnNumber = 2;
    const p = state.turn;
    const opp = (1 - p) as 0 | 1;

    state.players[opp].active!.hp = 5;
    state.players[opp].bench = [null, null, null]; // empty bench
    state.players[p].active!.energy = 3;

    state = gameReducer(state, { type: "ATTACK", playerIndex: p, attackIndex: 0 });

    expect(state.phase).toBe("over");
    expect(state.winner).toBe(p);
  });

  it("wins immediately when reaching 3 knockout points", () => {
    const rng = new SeededRNG(808);
    let state = createInitialState(rng);
    const p0Creature = state.players[0].hand.find((c) => getCardDef(c.defId).kind === "creature")!;
    const p1Creature = state.players[1].hand.find((c) => getCardDef(c.defId).kind === "creature")!;
    state = gameReducer(state, { type: "SETUP_CHOOSE_ACTIVE", playerIndex: 0, cardUid: p0Creature.uid });
    state = gameReducer(state, { type: "SETUP_CHOOSE_ACTIVE", playerIndex: 1, cardUid: p1Creature.uid });

    state.turnNumber = 2;
    const p = state.turn;
    const opp = (1 - p) as 0 | 1;

    state.players[p].points = 2;
    state.players[opp].active!.hp = 5;
    state.players[opp].bench[0] = { uid: "bench-res", defId: "wg-03", hp: 50, energy: 0 };
    state.players[p].active!.energy = 3;

    state = gameReducer(state, { type: "ATTACK", playerIndex: p, attackIndex: 0 });

    expect(state.players[p].points).toBe(3);
    expect(state.phase).toBe("over");
    expect(state.winner).toBe(p);
  });
});
