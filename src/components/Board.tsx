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
import { CardDetailModal } from "./CardDetailModal";
import type { CardInstance } from "@/engine/types";

interface AnimationState {
  attackerSlot: "player" | "bot" | null;
  hitSlot: "player" | "bot" | null;
  switchSlot: "player" | "bot" | null;
}

export function Board() {
  const { t, locale } = useI18n();
  const [rng] = useState(() => new SeededRNG(Date.now()));
  const [state, dispatch] = useReducer(gameReducer, null, () => createInitialState(rng));

  const [selectedHandUid, setSelectedHandUid] = useState<string | null>(null);
  const [isEnergySelected, setIsEnergySelected] = useState(false);
  const [isRetreatMode, setIsRetreatMode] = useState(false);
  const [showAttackModal, setShowAttackModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [inspectedCard, setInspectedCard] = useState<CardInstance | null>(null);

  const [anim, setAnim] = useState<AnimationState>({
    attackerSlot: null,
    hitSlot: null,
    switchSlot: null
  });

  const stateRef = useRef(state);
  stateRef.current = state;
  const botBusyRef = useRef(false);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentHoveredUidRef = useRef<string | null>(null);

  const handleCardHoverStart = (card: CardInstance) => {
    if (state.phase === "setup") return;
    if (currentHoveredUidRef.current === card.uid && hoverTimerRef.current) return;
    currentHoveredUidRef.current = card.uid;
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      setInspectedCard(card);
    }, 450);
  };

  const handleCardHoverEnd = () => {
    currentHoveredUidRef.current = null;
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  };

  const player = state.players[0];
  const bot = state.players[1];
  const isPlayerTurn = state.phase === "main" && state.turn === 0;

  const showToast = (msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMsg(msg);
    toastTimerRef.current = setTimeout(() => setToastMsg(null), 3000);
  };

  // Bot Turn Automation using ref to prevent timer cancellation
  useEffect(() => {
    const isBotSetup = state.phase === "setup" && bot.active === null;
    const isBotPromote = state.phase === "promote" && state.pendingPromotePlayer === 1;
    const isBotMainTurn = state.phase === "main" && state.turn === 1;

    if ((isBotSetup || isBotPromote || isBotMainTurn) && !botBusyRef.current) {
      botBusyRef.current = true;
      const timer = setTimeout(() => {
        const action = getNextBotAction(stateRef.current);
        if (action.type === "ATTACK") {
          triggerAttackAnimation("bot");
          setTimeout(() => {
            dispatch(action);
            botBusyRef.current = false;
          }, 450);
        } else {
          if (action.type === "RETREAT" || action.type === "PROMOTE") {
            triggerSwitchAnimation("bot");
          }
          dispatch(action);
          botBusyRef.current = false;
        }
      }, 750);

      return () => {
        clearTimeout(timer);
        botBusyRef.current = false;
      };
    }
  }, [state, bot.active]);

  const triggerAttackAnimation = (attacker: "player" | "bot") => {
    const target = attacker === "player" ? "bot" : "player";
    setAnim((prev) => ({ ...prev, attackerSlot: attacker, hitSlot: target }));
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
    handleCardHoverEnd();
    setInspectedCard(null);
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
    handleCardHoverEnd();
    setInspectedCard(null);
    dispatch({ type: "SETUP_CHOOSE_ACTIVE", playerIndex: 0, cardUid });
    const botAction = pickBotSetupActive(stateRef.current);
    if (botAction) {
      dispatch(botAction);
    }
    showToast(locale === "id" ? "Kartu aktif dipilih! Pertarungan dimulai." : "Active card chosen! Battle begins.");
  };

  const handleHandSelect = (uid: string) => {
    if (!isPlayerTurn) {
      showToast(locale === "id" ? "Bukan giliranmu! Tunggu Bot selesai." : "Not your turn! Wait for Bot.");
      return;
    }

    const card = player.hand.find((c) => c.uid === uid);
    if (!card) return;
    const def = getCardDef(card.defId);

    if (def.kind === "item") {
      handleAction({ type: "PLAY_ITEM", playerIndex: 0, cardUid: uid });
      showToast(locale === "id" ? `${def.name.id} digunakan!` : `${def.name.en} used!`);
      return;
    }

    // Creature card: If already selected, auto-place into first free bench slot
    if (selectedHandUid === uid) {
      const freeIdx = player.bench.findIndex((s) => s === null);
      if (freeIdx !== -1) {
        handleAction({ type: "PLAY_TO_BENCH", playerIndex: 0, cardUid: uid, slotIndex: freeIdx });
        showToast(locale === "id" ? `${def.name.id} ditaruh di bangku!` : `${def.name.en} placed on bench!`);
      } else {
        showToast(locale === "id" ? "Bangku penuh! Maksimal 3 kartu." : "Bench full! Max 3 creatures.");
      }
      return;
    }

    setSelectedHandUid(uid);
    setIsEnergySelected(false);
    setIsRetreatMode(false);
    showToast(locale === "id" ? "Ketuk slot bangku kosong untuk menaruh." : "Tap an empty bench slot to place.");
  };

  const handleEnergyClick = () => {
    if (!isPlayerTurn) {
      showToast(locale === "id" ? "Bukan giliranmu!" : "Not your turn!");
      return;
    }
    if (player.energyReady !== 1) {
      showToast(locale === "id" ? "Energi sudah terpasang di giliran ini." : "Energy already attached this turn.");
      return;
    }
    setIsEnergySelected(!isEnergySelected);
    setSelectedHandUid(null);
    setIsRetreatMode(false);
    showToast(locale === "id" ? "Ketuk kartu aktif atau bangku untuk pasang energi!" : "Tap active or bench card to attach energy!");
  };

  const handleActiveClick = () => {
    if (!isPlayerTurn || !player.active) return;

    // Direct energy attach if energy is ready
    if (player.energyReady === 1) {
      handleAction({ type: "ATTACH_ENERGY", playerIndex: 0, targetUid: player.active.uid });
      showToast(locale === "id" ? "1 Energi dipasang ke kartu aktif!" : "1 Energy attached to active card!");
      return;
    }

    // Tapping active character toggles retreat/switch mode
    const aDef = getCardDef(player.active.defId) as CreatureDef;
    const hasBench = player.bench.some((c) => c !== null);

    if (!hasBench) {
      showToast(locale === "id" ? "Tidak ada kartu di bangku untuk bertukar!" : "No bench card to switch with!");
      return;
    }

    if (player.active.energy < aDef.retreatCost) {
      showToast(
        locale === "id"
          ? `Energi kurang untuk mundur! Butuh ${aDef.retreatCost}, saat ini ${player.active.energy}.`
          : `Not enough energy to retreat! Needs ${aDef.retreatCost}, current ${player.active.energy}.`
      );
      return;
    }

    if (state.retreatedThisTurn) {
      showToast(locale === "id" ? "Sudah mundur 1x di giliran ini!" : "Already retreated this turn!");
      return;
    }

    setIsRetreatMode(!isRetreatMode);
    showToast(
      isRetreatMode
        ? locale === "id" ? "Mode mundur dibatalkan." : "Retreat cancelled."
        : locale === "id" ? "Ketuk kartu di bangku untuk bertukar posisi!" : "Tap a bench card to switch positions!"
    );
  };

  const handleBenchSlotClick = (idx: number) => {
    const benchCard = player.bench[idx];

    // Promotion phase: tap bench card to promote
    if (state.phase === "promote" && state.pendingPromotePlayer === 0 && benchCard) {
      handleAction({ type: "PROMOTE", playerIndex: 0, benchSlotIndex: idx });
      showToast(locale === "id" ? "Kartu dimajukan ke arena aktif!" : "Promoted card to active!");
      return;
    }

    if (!isPlayerTurn) {
      showToast(locale === "id" ? "Bukan giliranmu!" : "Not your turn!");
      return;
    }

    // Attach energy to bench card
    if ((isEnergySelected || player.energyReady === 1) && benchCard) {
      handleAction({ type: "ATTACH_ENERGY", playerIndex: 0, targetUid: benchCard.uid });
      showToast(locale === "id" ? "1 Energi dipasang ke kartu bangku!" : "1 Energy attached to bench card!");
      return;
    }

    // Switch/Retreat by tapping bench card
    if (benchCard && player.active) {
      const aDef = getCardDef(player.active.defId) as CreatureDef;
      if (player.active.energy >= aDef.retreatCost && !state.retreatedThisTurn) {
        handleAction({ type: "RETREAT", playerIndex: 0, benchSlotIndex: idx });
        showToast(locale === "id" ? "Bertukar posisi dengan bangku!" : "Switched with bench card!");
        return;
      }
      if (player.active.energy < aDef.retreatCost) {
        showToast(
          locale === "id"
            ? `Energi kartu aktif kurang untuk bertukar! Butuh ${aDef.retreatCost}.`
            : `Not enough energy to retreat! Needs ${aDef.retreatCost}.`
        );
        return;
      }
    }

    // Play card from hand to empty bench slot
    if (selectedHandUid && !benchCard) {
      handleAction({ type: "PLAY_TO_BENCH", playerIndex: 0, cardUid: selectedHandUid, slotIndex: idx });
      showToast(locale === "id" ? "Kartu berhasil ditaruh di bangku!" : "Card placed on bench!");
    }
  };

  const handleAttackClick = () => {
    if (!isPlayerTurn) {
      showToast(locale === "id" ? "Bukan giliranmu! Tunggu Bot selesai." : "Not your turn! Wait for Bot.");
      return;
    }
    if (state.turnNumber === 1) {
      showToast(
        locale === "id"
          ? "Pemain pertama tidak dapat menyerang di giliran ke-1! Pasang energi lalu akhiri giliran."
          : "First player cannot attack on turn 1! Attach energy then end turn."
      );
      return;
    }
    if (!player.active) {
      showToast(locale === "id" ? "Tidak ada kartu aktif!" : "No active card!");
      return;
    }

    const def = getCardDef(player.active.defId) as CreatureDef;
    const canAffordAny = def.attacks.some((a) => player.active!.energy >= a.cost);

    if (!canAffordAny) {
      const minCost = Math.min(...def.attacks.map((a) => a.cost));
      showToast(
        locale === "id"
          ? `Energi belum cukup! Butuh ${minCost} energi (saat ini: ${player.active.energy}). Pasang energi terlebih dahulu.`
          : `Not enough energy! Needs ${minCost} energy (current: ${player.active.energy}). Attach energy first.`
      );
      return;
    }

    if (def.attacks.length === 1) {
      handleAction({ type: "ATTACK", playerIndex: 0, attackIndex: 0 });
    } else {
      setShowAttackModal(true);
    }
  };

  const handleEndTurnClick = () => {
    if (!isPlayerTurn) {
      showToast(locale === "id" ? "Bukan giliranmu!" : "Not your turn!");
      return;
    }
    handleAction({ type: "END_TURN", playerIndex: 0 });
    showToast(locale === "id" ? "Giliran diakhiri. Giliran Bot dimulai..." : "Turn ended. Bot is thinking...");
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

        {/* Floating Toast Notification */}
        {toastMsg && (
          <div className="absolute top-[48%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 rounded-xl bg-[#1f2a44] px-4 py-2 text-center text-xs font-bold text-white shadow-xl border-2 border-cyan-400 pointer-events-none max-w-[85cqw] transition-all">
            {toastMsg}
          </div>
        )}

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
                  <CardView
                    key={card.uid}
                    card={card}
                    size="sm"
                    onHoverStart={handleCardHoverStart}
                    onHoverEnd={handleCardHoverEnd}
                  />
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
                onHoverStart={handleCardHoverStart}
                onHoverEnd={handleCardHoverEnd}
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

        {/* Turn Status Band */}
        <div className="relative z-10 flex items-center justify-center bg-[#e4e7f5] py-0.5 text-[11px] font-bold text-[#1f2a44]">
          {state.phase === "promote" && state.pendingPromotePlayer === 0 && (
            <span className="text-amber-700 animate-pulse">⚠️ {t("promotePrompt")}</span>
          )}
          {state.phase === "main" && !isPlayerTurn && (
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="inline-block h-2 w-2 rounded-full bg-amber-500 animate-ping" />
              {locale === "id" ? "Giliran Bot sedang berjalan..." : "Bot turn in progress..."}
            </span>
          )}
          {state.phase === "main" && isPlayerTurn && state.turnNumber === 1 && (
            <span className="text-cyan-800">
              {locale === "id"
                ? "Giliran 1: Pasang energi ke kartu aktif & akhiri giliran"
                : "Turn 1: Attach energy & end turn"}
            </span>
          )}
          {state.phase === "main" && isPlayerTurn && state.turnNumber > 1 && (
            <span className="text-cyan-800">
              {locale === "id" ? "⭐ Giliran Kamu (Serang jika energi cukup)" : "⭐ Your Turn (Attack when ready)"}
            </span>
          )}
        </div>

        {/* Action Band */}
        <ActionBand
          canRetreat={canRetreat}
          retreatCost={playerActiveDef?.retreatCost ?? 0}
          isRetreatMode={isRetreatMode}
          canAttack={canAttack}
          canEndTurn={isPlayerTurn}
          onRetreatClick={() => handleActiveClick()}
          onAttackClick={handleAttackClick}
          onEndTurnClick={handleEndTurnClick}
        />

        {/* Player Half */}
        <section className="half me" data-team="dark">
          <div className="row">
            <div className="side">
              <div className="tk">
                <button
                  className={`token ${isEnergySelected ? "selected" : ""} ${
                    player.energyReady === 1 && isPlayerTurn ? "ring-4 ring-cyan-300 animate-pulse" : ""
                  }`}
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
                isHighlighted={isEnergySelected || player.energyReady === 1}
                animClass={`${anim.attackerSlot === "player" ? "anim-lunge-up" : ""} ${
                  anim.hitSlot === "player" ? "anim-hit" : ""
                } ${anim.switchSlot === "player" ? "anim-switch" : ""}`}
                onClick={handleActiveClick}
                onHoverStart={handleCardHoverStart}
                onHoverEnd={handleCardHoverEnd}
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
                    onHoverStart={handleCardHoverStart}
                    onHoverEnd={handleCardHoverEnd}
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
              onHoverStart={handleCardHoverStart}
              onHoverEnd={handleCardHoverEnd}
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
            onRestart={() => window.location.reload()}
          />
        )}

        {showMenu && (
          <MenuModal
            logs={state.log}
            onRestart={() => window.location.reload()}
            onClose={() => setShowMenu(false)}
          />
        )}

        {inspectedCard && (
          <CardDetailModal
            card={inspectedCard}
            onClose={() => setInspectedCard(null)}
          />
        )}
      </main>
    </div>
  );
}
