import type { CardDef, CardInstance, CreatureDef, ItemDef } from "@/engine/types";

export const CREATURE_DEFS: CreatureDef[] = [
  {
    kind: "creature",
    id: "bn-01",
    name: { id: "Babi Ngepet", en: "Ngepet Boar" },
    series: "babi-ngepet",
    element: "dark",
    hp: 130,
    retreatCost: 1,
    attacks: [
      { name: { id: "Seruduk Malam", en: "Night Charge" }, damage: 20, cost: 1 },
      { name: { id: "Gaib Emas", en: "Golden Hex" }, damage: 50, cost: 2 }
    ],
    ability: { id: "thick-hide" },
    sprite: "/cards/babi-ngepet.svg"
  },
  {
    kind: "creature",
    id: "bn-02",
    name: { id: "Siluman Babi", en: "Boar Demon" },
    series: "babi-ngepet",
    element: "dark",
    hp: 150,
    retreatCost: 2,
    attacks: [
      { name: { id: "Cakar Bayangan", en: "Shadow Claw" }, damage: 30, cost: 2 },
      { name: { id: "Murka Siluman", en: "Demon Wrath" }, damage: 70, cost: 3 }
    ],
    sprite: "/cards/siluman-babi.svg"
  },
  {
    kind: "creature",
    id: "bn-03",
    name: { id: "Kucing Hitam", en: "Black Cat" },
    series: "babi-ngepet",
    element: "dark",
    hp: 60,
    retreatCost: 0,
    attacks: [
      { name: { id: "Cakar Cepat", en: "Swift Scratch" }, damage: 20, cost: 1 }
    ],
    sprite: "/cards/kucing.svg"
  },
  {
    kind: "creature",
    id: "bn-04",
    name: { id: "Punarma", en: "Punarma Shadow" },
    series: "babi-ngepet",
    element: "dark",
    hp: 90,
    retreatCost: 1,
    attacks: [
      { name: { id: "Hawa Dingin", en: "Cold Mist" }, damage: 20, cost: 1 },
      { name: { id: "Teror Gelap", en: "Dark Terror" }, damage: 40, cost: 2 }
    ],
    sprite: "/cards/punarma.svg"
  },
  {
    kind: "creature",
    id: "bn-05",
    name: { id: "Bayangan Gelap", en: "Dark Shadow" },
    series: "babi-ngepet",
    element: "dark",
    hp: 80,
    retreatCost: 1,
    attacks: [
      { name: { id: "Kutukan Kabut", en: "Mist Curse" }, damage: 30, cost: 1 }
    ],
    sprite: "/cards/dark-element.svg"
  },
  {
    kind: "creature",
    id: "bn-06",
    name: { id: "Babi Celeng", en: "Wild Boar" },
    series: "babi-ngepet",
    element: "dark",
    hp: 70,
    retreatCost: 1,
    attacks: [
      { name: { id: "Sundulan Liar", en: "Wild Bash" }, damage: 20, cost: 1 }
    ],
    sprite: "/cards/babi-ngepet.svg"
  },
  {
    kind: "creature",
    id: "bn-07",
    name: { id: "Arwah Hitam", en: "Dark Spirit" },
    series: "babi-ngepet",
    element: "dark",
    hp: 100,
    retreatCost: 1,
    attacks: [
      { name: { id: "Sengatan Jiwa", en: "Soul Sting" }, damage: 40, cost: 2 }
    ],
    sprite: "/cards/punarma.svg"
  },
  {
    kind: "creature",
    id: "wg-01",
    name: { id: "Pak Karta", en: "Chief Karta" },
    series: "warga",
    element: "fire",
    hp: 100,
    retreatCost: 1,
    attacks: [
      { name: { id: "Teriakan Ronda", en: "Patrol Shout" }, damage: 20, cost: 1 },
      { name: { id: "Hantaman Bambu", en: "Bamboo Strike" }, damage: 50, cost: 2 }
    ],
    sprite: "/cards/pak-karta.svg"
  },
  {
    kind: "creature",
    id: "wg-02",
    name: { id: "Mbok Sumi", en: "Mbok Sumi" },
    series: "warga",
    element: "light",
    hp: 80,
    retreatCost: 1,
    attacks: [
      { name: { id: "Lemparan Cobek", en: "Mortar Throw" }, damage: 20, cost: 1 },
      { name: { id: "Sapu Lidi", en: "Palm Broom" }, damage: 40, cost: 2 }
    ],
    sprite: "/cards/mbok-sumi.svg"
  },
  {
    kind: "creature",
    id: "wg-03",
    name: { id: "Anak Warga", en: "Village Kid" },
    series: "warga",
    element: "light",
    hp: 50,
    retreatCost: 0,
    attacks: [
      { name: { id: "Ketapel Batu", en: "Stone Sling" }, damage: 20, cost: 1 }
    ],
    sprite: "/cards/anak.svg"
  },
  {
    kind: "creature",
    id: "wg-04",
    name: { id: "Warga Ronda 1", en: "Patroller 1" },
    series: "warga",
    element: "fire",
    hp: 60,
    retreatCost: 1,
    attacks: [
      { name: { id: "Obor Ronda", en: "Patrol Torch" }, damage: 20, cost: 1 }
    ],
    sprite: "/cards/warga-evo-1.svg"
  },
  {
    kind: "creature",
    id: "wg-05",
    name: { id: "Warga Ronda 2", en: "Patroller 2" },
    series: "warga",
    element: "fire",
    hp: 90,
    retreatCost: 1,
    attacks: [
      { name: { id: "Sorot Senter", en: "Flashlight" }, damage: 20, cost: 1 },
      { name: { id: "Kerumunan", en: "Mob Rush" }, damage: 50, cost: 2 }
    ],
    sprite: "/cards/warga-evo-2.svg"
  },
  {
    kind: "creature",
    id: "wg-06",
    name: { id: "Warga Ronda 3", en: "Patroller 3" },
    series: "warga",
    element: "fire",
    hp: 120,
    retreatCost: 2,
    attacks: [
      { name: { id: "Obor Membara", en: "Blazing Torch" }, damage: 30, cost: 2 },
      { name: { id: "Kepung Warga", en: "Village Siege" }, damage: 70, cost: 3 }
    ],
    sprite: "/cards/warga-evo-3.svg"
  },
  {
    kind: "creature",
    id: "wg-07",
    name: { id: "Roh Api Desa", en: "Village Fire Spirit" },
    series: "warga",
    element: "fire",
    hp: 70,
    retreatCost: 1,
    attacks: [
      { name: { id: "Kobaran Api", en: "Fire Flare" }, damage: 30, cost: 1 }
    ],
    sprite: "/cards/fire-element.svg"
  }
];

export const ITEM_DEFS: ItemDef[] = [
  {
    kind: "item",
    id: "bn-it-01",
    name: { id: "Lilin Keramat", en: "Sacred Candle" },
    effect: { id: "heal-active", params: { amount: 30 } },
    sprite: "/cards/dark-element.svg"
  },
  {
    kind: "item",
    id: "bn-it-02",
    name: { id: "Kemenyan Wangi", en: "Sweet Incense" },
    effect: { id: "draw-cards", params: { count: 2 } },
    sprite: "/cards/punarma.svg"
  },
  {
    kind: "item",
    id: "bn-it-03",
    name: { id: "Kopi Hitam Pekat", en: "Strong Black Coffee" },
    effect: { id: "energy-boost" },
    sprite: "/cards/kucing.svg"
  },
  {
    kind: "item",
    id: "wg-it-01",
    name: { id: "Air Doa", en: "Blessed Water" },
    effect: { id: "heal-active", params: { amount: 30 } },
    sprite: "/cards/anak.svg"
  },
  {
    kind: "item",
    id: "wg-it-02",
    name: { id: "Kentongan Ronda", en: "Patrol Drum" },
    effect: { id: "draw-cards", params: { count: 2 } },
    sprite: "/cards/warga-evo-1.svg"
  },
  {
    kind: "item",
    id: "wg-it-03",
    name: { id: "Kopi Jahe Hangat", en: "Warm Ginger Coffee" },
    effect: { id: "energy-boost" },
    sprite: "/cards/pak-karta.svg"
  }
];

export const ALL_CARD_DEFS: CardDef[] = [...CREATURE_DEFS, ...ITEM_DEFS];

const CARD_MAP = new Map<string, CardDef>(
  ALL_CARD_DEFS.map((def) => [def.id, def])
);

export function getCardDef(id: string): CardDef {
  const def = CARD_MAP.get(id);
  if (!def) {
    throw new Error(`Card definition not found for id: ${id}`);
  }
  return def;
}

export function createDeck(series: "babi-ngepet" | "warga"): CardInstance[] {
  const creatureIds = series === "babi-ngepet"
    ? ["bn-01", "bn-02", "bn-03", "bn-04", "bn-05", "bn-06", "bn-07"]
    : ["wg-01", "wg-02", "wg-03", "wg-04", "wg-05", "wg-06", "wg-07"];

  const itemIds = series === "babi-ngepet"
    ? ["bn-it-01", "bn-it-02", "bn-it-03"]
    : ["wg-it-01", "wg-it-02", "wg-it-03"];

  const list: string[] = [];
  creatureIds.forEach((id) => list.push(id, id));
  itemIds.forEach((id) => list.push(id, id));

  return list.map((defId, idx) => {
    const def = getCardDef(defId);
    return {
      uid: `${series}-${defId}-${idx}`,
      defId,
      hp: def.kind === "creature" ? def.hp : 0,
      energy: 0
    };
  });
}
