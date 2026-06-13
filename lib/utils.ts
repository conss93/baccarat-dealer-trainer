// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { SUITS, RANKS, CHIPS } from "./constants";

export const won = (n) => "₩" + n.toLocaleString("ko-KR");
export const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
export function drawCard() {
  const suit = SUITS[Math.floor(Math.random() * 4)];
  return { rank: RANKS[Math.floor(Math.random() * 13)], suit: suit.s, color: suit.c };
}
export function cardValue(c) {
  if (c.rank === "A") return 1;
  if (["10", "J", "Q", "K"].includes(c.rank)) return 0;
  return parseInt(c.rank, 10);
}
export const handTotal = (cards) => cards.reduce((s, c) => s + cardValue(c), 0) % 10;
export function bankerShouldDraw(bT, pThird) {
  if (pThird === null) return bT <= 5;
  if (bT <= 2) return true;
  if (bT === 3) return pThird !== 8;
  if (bT === 4) return pThird >= 2 && pThird <= 7;
  if (bT === 5) return pThird >= 4 && pThird <= 7;
  if (bT === 6) return pThird === 6 || pThird === 7;
  return false;
}
export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
export function chipBreakdown(amount, denoms?) {
  const pool = denoms || CHIPS.map((c) => c.v);
  const out = [];
  let rest = amount;
  for (const v of pool) {
    const cnt = Math.floor(rest / v);
    if (cnt > 0) { out.push({ v, cnt }); rest -= cnt * v; }
  }
  return out;
}
export const minimalChipCount = (amount) => chipBreakdown(amount).reduce((s, g) => s + g.cnt, 0);
export const groupsTotal = (groups) => groups.reduce((s, g) => s + g.denom * g.count, 0);
export const chipMeta = (v) => CHIPS.find((c) => c.v === v);
export function mergeAdd(groups, denom, nAdd) {
  const i = groups.findIndex((g) => g.denom === denom);
  if (i >= 0) { const out = [...groups]; out[i] = { ...out[i], count: out[i].count + nAdd }; return out; }
  return [...groups, { denom, count: nAdd }].sort((a, b) => b.denom - a.denom);
}
export function mergeRemove(groups, denom, nSub) {
  return groups.map((g) => (g.denom === denom ? { ...g, count: g.count - nSub } : g)).filter((g) => g.count > 0);
}
export function spreadPattern(count) {
  if (count <= 0) return [];
  const bigs = [];
  let r = count;
  while (r > 20) { bigs.push({ n: 20, kind: "big" }); r -= 20; }
  if (r <= 5) return [...bigs, { n: r, kind: "spread" }];
  let parts;
  if (r === 6) parts = [3, 3];
  else if (r === 7) parts = [3, 3, 1];
  else if (r === 8) parts = [4, 4];
  else if (r === 9) parts = [4, 4, 1];
  else { parts = []; let q = r; while (q > 5) { parts.push(5); q -= 5; } if (q > 0) parts.push(q); }
  const spreadN = parts.length === 1 ? 1 : parts[parts.length - 1] < parts[parts.length - 2] ? 2 : 1;
  return [...bigs, ...parts.map((p, i) => ({ n: p, kind: i >= parts.length - spreadN ? "spread" : "stack" }))];
}
export function seatX(i, n) { return n === 1 ? 190 : 36 + 308 * (i / (n - 1)); }
export function seatY(i, n) { const t = n === 1 ? 0.5 : i / (n - 1); return 16 + 20 * Math.pow(2 * t - 1, 2); }
export function spotPos(i, n) { const sx = seatX(i, n); return { x: 190 + (sx - 190) * 0.8, y: seatY(i, n) + 50 }; }
