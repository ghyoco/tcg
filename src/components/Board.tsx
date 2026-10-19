"use client";

import React, { useState, useEffect, useReducer, useRef } from "react";
import type { GameAction, CreatureDef } from "@/engine/types";
import { SeededRNG } from "@/engine/rng";
import { createInitialState, gameReducer } from "@/engine/reducer";
import { getNextBotAction, pickBotSetupActive } from "@/bot/bot";
import { getCardDef } from "@/data/cards";
import { useI18n } from "@/i18n/context";
import { HUD } from "./HUD";
import { CardView } from "./CardView";
import { HandView } from "./HandView";
import { ActionBand } from "./ActionBand";
import { SetupModal } from "./SetupModal";
import { AttackModal } from "./AttackModal";
import { ResultModal } from "./ResultModal";
import { MenuModal } from "./MenuModal";

interface AnimationState {
  attackerSlot: "player" | "bot" | null;
  hitSlot: "player" | "bot" | null;
  deadSlot: "player" | "bot" | null;
  switchSlot: "player" | "bot" | null;
  damageValue: number | null;
  damageTarget: "player" | "bot" | null;
}

export function Board() {
  const { t } = useI18n();
  const [rng] = useState(() => new SeededRNG(Date.now()));
  const [state, dispatch] = useReducer(gameReducer, null, () => createInitialState(rng));

  const [selectedHandUid, setSelectedHandUid] = useState<string | null>(null);
  const [isEnergySelected, setIsEnergySelected] = useState(false);
  const [isRetreatMode, setIsRetreatMode] = useState(false);
  const [showAttackModal, setShowAttackModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [botBusy, setBotBusy] = useState(false);

  const [anim, setAnim] = useState<AnimationState>({
    attackerSlot: null,
    hitSlot: null,
    deadSlot: null,
    switchSlot: null,
    damageValue: null,
    damageTarget: null
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  const player = state.players[0];
  const bot = state.players[1];
  const isPlayerTurn = state.phase === "main" && state.turn === 0;

  // Bot Turn Automation
  useEffect(() => {
    const isBotSetup = state.phase === "setup" && bot.active === null;
    const isBotPromote = state.phase === "promote" && state.pendingPromotePlayer === 1;
    const isBotMainTurn = state.phase === "main" && state.turn === 1;

    if ((isBotSetup || isBotPromote || isBotMainTurn) && !botBusy) {
      setBotBusy(true);
      const timer = setTimeout(() => {
        const action = getNextBotAction(stateRef.current);
        if (action.type === "ATTACK") {
          triggerAttackAnimation("bot");
          setTimeout(() => {
            dispatch(action);
            setBotBusy(false);
          }, 450);
        } else {
          if (action.type === "RETREAT" || action.type === "PROMOTE") {
            triggerSwitchAnimation("bot");
          }
          dispatch(action);
          setBotBusy(false);
        }
      }, 750);
      return () => clearTimeout(timer);
    }
  }, [state, bot.active, botBusy]);

  const triggerAttackAnimation = (attacker: "player" | "bot") => {
    const target = attacker === "player" ? "bot" : "player";
    setAnim((prev) => ({
      ...prev,
      attackerSlot: attacker,
      hitSlot: target
    }));
    setTimeout(() => {
      setAnim((prev) => ({ ...prev, attackerSlot: null, hitSlot: null }));
    }, 600);
  };

  const triggerSwitchAnimation = (side: "player" | "bot") => {
    setAnim((prev) => ({ ...prev, switchSlot: side }));
    setTimeout(() => {
      setAnim((prev) => ({ ...prev, switchSlot: null }));
    }, 450);
  };

  const handleAction = (action: GameAction) => {
    if (action.type === "ATTACK") {
      triggerAttackAnimation("player");
      setTimeout(() => dispatch(action), 400);
    } else {
      if (action.type === "RETREAT" || action.type === "PROMOTE") {
        triggerSwitchAnimation("player");
      }
      dispatch(action);
    }
    setSelectedHandUid(null);
    setIsEnergySelected(false);
    setIsRetreatMode(false);
  };

  const handleSetupActive = (cardUid: string) => {
    dispatch({ type: "SETUP_CHOOSE_ACTIVE", playerIndex: 0, cardUid });
    const botAction = pickBotSetupActive(stateRef.current);
    if (botAction) {
      dispatch(botAction);
    }
  };

  const handleHandSelect = (uid: string) => {
    if (!isPlayerTurn) return;
    if (selectedHandUid === uid) {
      setSelectedHandUid(null);
      return;
    }
    const card = player.hand.find((c) => c.uid === uid);
    if (!card) return;
    const def = getCardDef(card.defId);

    if (def.kind === "item") {
      // Play item directly
      handleAction({ type: "PLAY_ITEM", playerIndex: 0, cardUid: uid });
    } else {
      setSelectedHandUid(uid);
      setIsEnergySelected(false);
      setIsRetreatMode(false);
    }
  };

  const handleEnergyClick = () => {
    if (!isPlayerTurn || player.energyReady !== 1) return;
    setIsEnergySelected(!isEnergySelected);
    setSelectedHandUid(null);
    setIsRetreatMode(false);
  };

  const handleActiveClick = () => {
    if (!isPlayerTurn || !player.active) return;
    if (isEnergySelected) {
      handleAction({ type: "ATTACH_ENERGY", playerIndex: 0, targetUid: player.active.uid });
      return;
    }
    const aDef = getCardDef(player.active.defId) as CreatureDef;
    const hasBench = player.bench.some((c) => c !== null);
    if (hasBench && player.active.energy >= aDef.retreatCost && !state.retreatedThisTurn) {
      setIsRetreatMode(!isRetreatMode);
    }
  };

  const handleBenchSlotClick = (idx: number) => {
    const benchCard = player.bench[idx];

    // Promotion phase: tap bench card to promote
    if (state.phase === "promote" && state.pendingPromotePlayer === 0 && benchCard) {
      handleAction({ type: "PROMOTE", playerIndex: 0, benchSlotIndex: idx });
      return;
    }

    if (!isPlayerTurn) return;

    if (isEnergySelected && benchCard) {
      handleAction({ type: "ATTACH_ENERGY", playerIndex: 0, targetUid: benchCard.uid });
      return;
    }

    if (isRetreatMode && benchCard) {
      handleAction({ type: "RETREAT", playerIndex: 0, benchSlotIndex: idx });
      return;
    }

    if (selectedHandUid && !benchCard) {
      handleAction({ type: "PLAY_TO_BENCH", playerIndex: 0, cardUid: selectedHandUid, slotIndex: idx });
    }
  };

  const handleAttackClick = () => {
    if (!isPlayerTurn || !player.active || state.turnNumber === 1) return;
    const def = getCardDef(player.active.defId) as CreatureDef;
    if (def.attacks.length === 1) {
      handleAction({ type: "ATTACK", playerIndex: 0, attackIndex: 0 });
    } else {
      setShowAttackModal(true);
    }
  };

  const playerActiveDef = player.active ? (getCardDef(player.active.defId) as CreatureDef) : null;
  const canRetreat =
    isPlayerTurn &&
    !state.retreatedThisTurn &&
    player.active !== null &&
    playerActiveDef !== null &&
    player.active.energy >= playerActiveDef.retreatCost &&
    player.bench.some((c) => c !== null);

  const canAttack =
    isPlayerTurn &&
    state.turnNumber > 1 &&
    player.active !== null &&
    playerActiveDef !== null &&
    playerActiveDef.attacks.some((a) => player.active!.energy >= a.cost);

  return (
    <div className="stage">
      <main className="board">
        <div className="ring" />

        {/* Bot Half */}
        <section className="half top">
          <HUD
            title={t("bot")}
            points={bot.points}
            chipLabel={`${t("hand")} ${bot.hand.length}`}
            showLang={true}
          />
          <div className="row">
            <div className="side">
              <div className="pile d" aria-label={`${t("discard")}: ${bot.discard.length}`}>
                <b>{bot.discard.length}</b>
              </div>
            </div>
            <div className="mid">
              {bot.bench.map((card, i) =>
                card ? (
                  <CardView key={card.uid} card={card} size="sm" />
                ) : (
                  <div key={i} className="slot" />
                )
              )}
            </div>
            <div className="side r" />
          </div>

          <div className="row">
            <div className="side">
              <div className="pile" aria-label={`${t("deck")}: ${bot.deck.length}`}>
                <b>{bot.deck.length}</b>
              </div>
            </div>
            {bot.active ? (
              <CardView
                card={bot.active}
                size="lg"
                animClass={`${anim.attackerSlot === "bot" ? "anim-lunge-down" : ""} ${
                  anim.hitSlot === "bot" ? "anim-hit" : ""
                } ${anim.switchSlot === "bot" ? "anim-switch" : ""}`}
              />
            ) : (
              <div className="slot lg" />
            )}
            <div className="side r ac">
              <label className="auto opacity-60 cursor-not-allowed">
                <input type="checkbox" disabled />
                <span />
                {t("auto")}
              </label>
            </div>
          </div>
        </section>

        {/* Action Band */}
        <ActionBand
          canRetreat={canRetreat}
          retreatCost={playerActiveDef?.retreatCost ?? 0}
          isRetreatMode={isRetreatMode}
          canAttack={canAttack}
          canEndTurn={isPlayerTurn}
          onRetreatClick={() => setIsRetreatMode(!isRetreatMode)}
          onAttackClick={handleAttackClick}
          onEndTurnClick={() => handleAction({ type: "END_TURN", playerIndex: 0 })}
        />

        {/* Player Half */}
        <section className="half me" data-team="dark">
          <div className="row">
            <div className="side">
              <div className="tk">
                <button
                  className={`token ${isEnergySelected ? "selected" : ""}`}
                  disabled={!isPlayerTurn || player.energyReady !== 1}
                  onClick={handleEnergyClick}
                  aria-label={`${t("energy")}: ${player.energyReady}`}
                >
                  {player.energyReady}
                </button>
                <small>{t("energy")}</small>
              </div>
            </div>
            {player.active ? (
              <CardView
                card={player.active}
                size="lg"
                isSelected={isRetreatMode}
                isHighlighted={isEnergySelected}
                animClass={`${anim.attackerSlot === "player" ? "anim-lunge-up" : ""} ${
                  anim.hitSlot === "player" ? "anim-hit" : ""
                } ${anim.switchSlot === "player" ? "anim-switch" : ""}`}
                onClick={handleActiveClick}
              />
            ) : (
              <div
                className={`slot lg ${
                  state.phase === "promote" && state.pendingPromotePlayer === 0
                    ? "border-cyan-400 animate-pulse"
                    : ""
                }`}
              />
            )}
            <div className="side r">
              <div className="pile" aria-label={`${t("deck")}: ${player.deck.length}`}>
                <b>{player.deck.length}</b>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="side" />
            <div className="mid">
              {player.bench.map((card, i) =>
                card ? (
                  <CardView
                    key={card.uid}
                    card={card}
                    size="sm"
                    isHighlighted={
                      isRetreatMode ||
                      isEnergySelected ||
                      (state.phase === "promote" && state.pendingPromotePlayer === 0)
                    }
                    onClick={() => handleBenchSlotClick(i)}
                  />
                ) : (
                  <div
                    key={i}
                    className={`slot ${selectedHandUid ? "active-target" : ""}`}
                    onClick={() => handleBenchSlotClick(i)}
                    role="button"
                    tabIndex={0}
                    aria-label={t("emptySlot")}
                  />
                )
              )}
            </div>
            <div className="side r">
              <div className="pile d" aria-label={`${t("discard")}: ${player.discard.length}`}>
                <b>{player.discard.length}</b>
              </div>
            </div>
          </div>

          <footer className="dock">
            <HUD
              title={t("you")}
              points={player.points}
              chipLabel={`${t("items")} ${player.hand.filter((c) => getCardDef(c.defId).kind === "item").length}`}
            />
            <HandView
              cards={player.hand}
              selectedCardUid={selectedHandUid}
              onSelectCard={handleHandSelect}
            />
            <button
              className="menu"
              onClick={() => setShowMenu(true)}
              aria-label={t("menu")}
            >
              <i />
            </button>
          </footer>
        </section>

        {/* Modals & Overlays */}
        {state.phase === "setup" && (
          <SetupModal
            hand={player.hand}
            firstPlayer={state.turn}
            onChooseActive={handleSetupActive}
          />
        )}

        {showAttackModal && player.active && (
          <AttackModal
            card={player.active}
            onSelectAttack={(idx) => handleAction({ type: "ATTACK", playerIndex: 0, attackIndex: idx })}
            onClose={() => setShowAttackModal(false)}
          />
        )}

        {state.phase === "over" && (
          <ResultModal
            winner={state.winner}
            playerPoints={player.points}
            botPoints={bot.points}
            onRestart={() => dispatch({ type: "END_TURN", playerIndex: 0 })}
          />
        )}

        {showMenu && (
          <MenuModal
            logs={state.log}
            onRestart={() => window.location.reload()}
            onClose={() => setShowMenu(false)}
          />
        )}
      </main>
    </div>
  );
}
