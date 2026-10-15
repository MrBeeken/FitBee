export function parseRepTarget(reps: string): number {
  const side = reps.split("/")[0];
  const range = side.split("–").join("-");
  const nums = range.match(/\d+/g);
  if (!nums?.length) return 10;
  return Number(nums[nums.length - 1]);
}

export function formatDuration(totalSec: number): string {
  const s = Math.max(0, Math.round(totalSec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m === 0) return `${r}s`;
  if (r === 0) return `${m} min`;
  return `${m}:${String(r).padStart(2, "0")}`;
}

export function formatClock(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

export function formatWeight(value: number, units: "lb" | "kg"): string {
  if (!Number.isFinite(value) || value <= 0) return "—";
  return `${trimNum(value)} ${units}`;
}

export function trimNum(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1).replace(/\.0$/, "");
}

export function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}
