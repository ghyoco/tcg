import { describe, it, expect } from "vitest";
import { id } from "./id";
import { en } from "./en";

describe("i18n dictionaries", () => {
  it("id and en dictionaries have identical keys", () => {
    const idKeys = Object.keys(id).sort();
    const enKeys = Object.keys(en).sort();

    expect(idKeys).toEqual(enKeys);
  });

  it("rulesBody has equal number of steps", () => {
    expect(id.rulesBody.length).toBe(en.rulesBody.length);
  });
});
