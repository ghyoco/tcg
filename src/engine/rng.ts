export interface RNG {
  next(): number;
  nextInt(min: number, max: number): number;
  shuffle<T>(array: T[]): T[];
  coinFlip(): 0 | 1;
}

export class SeededRNG implements RNG {
  private s: number;

  constructor(seed: number = 1337) {
    this.s = Math.floor(seed) >>> 0;
  }

  next(): number {
    let t = (this.s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  nextInt(min: number, max: number): number {
    const low = Math.ceil(min);
    const high = Math.floor(max);
    return Math.floor(this.next() * (high - low + 1)) + low;
  }

  shuffle<T>(array: T[]): T[] {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      const temp = copy[i];
      copy[i] = copy[j];
      copy[j] = temp;
    }
    return copy;
  }

  coinFlip(): 0 | 1 {
    return this.next() < 0.5 ? 0 : 1;
  }
}
