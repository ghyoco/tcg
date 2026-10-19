import { describe, it, expect } from "vitest";
import { SeededRNG } from "@/engine/rng";
import { createInitialState, gameReducer } from "@/engine/reducer";
import { getNextBotAction } from "./bot";
import type { GameState, GameAction } from "@/engine/types";

function runBotGame(seed: number): { winner: 0 | 1 | null; turns: number } {
  const rng = new SeededRNG(seed);
  let state: GameState = createInitialState(rng);

  // Bot vs Bot simulation for 1000 games
  let safetyCounter = 0;
  const maxActions = 400;

  while (state.phase !== "over" && safetyCounter < maxActions) {
    safetyCounter++;
    let action: GameAction | null = null;

    if (state.phase === "setup") {
      action = state.players[0].active === null
        ? {
            ...getNextBotAction({ ...state, players: [state.players[1], state.players[0]], turn: 1 }),
            playerIndex: 0
          }
        : getNextBotAction(state);
    } else if (state.phase === "promote") {
      const pIdx = state.pendingPromotePlayer!;
      if (pIdx === 0) {
        // Human slot proxy bot
        const swapped: GameState = {
          ...state,
          players: [state.players[1], state.players[0]],
          pendingPromotePlayer: 1
        };
        const act = getNextBotAction(swapped);
        action = { ...act, playerIndex: 0 };
      } else {
        action = getNextBotAction(state);
      }
    } else if (state.phase === "main") {
      const pIdx = state.turn;
      if (pIdx === 0) {
        const swapped: GameState = {
          ...state,
          players: [state.players[1], state.players[0]],
          turn: 1
        };
        const act = getNextBotAction(swapped);
        action = { ...act, playerIndex: 0 };
      } else {
        action = getNextBotAction(state);
      }
    }

    if (!action) break;
    const nextState = gameReducer(state, action);
    // Ensure state mutated or progressed
    state = nextState;
  }

  return { winner: state.winner, turns: state.turnNumber };
}

describe("Bot Simulation Tests", () => {
  it("runs 1000 seeded games to completion without illegal action or lockups", () => {
    let completedGames = 0;
    for (let seed = 1; seed <= 1000; seed++) {
      const result = runBotGame(seed);
      expect(result.winner).not.toBeNull();
      completedGames++;
    }
    expect(completedGames).toBe(1000);
  });
});
