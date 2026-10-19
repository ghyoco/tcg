export type Element = "dark" | "fire" | "light";

export function getDamageMultiplier(attacker: Element, defender: Element): number {
  if (attacker === "fire" && defender === "dark") {
    return 2;
  }
  return 1;
}
