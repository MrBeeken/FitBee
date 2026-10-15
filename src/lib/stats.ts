import type { SessionLog } from "../data/types";
import { addDays, isoDate, parseIso, startOfWeek } from "./dates";

export function completedOn(sessions: SessionLog[]): Set<string> {
  return new Set(sessions.filter((s) => s.completed).map((s) => s.date));
}

export function streak(sessions: SessionLog[], today = isoDate()): number {
  const dates = completedOn(sessions);
  let cursor = parseIso(today);
  if (!dates.has(isoDate(cursor))) cursor = addDays(cursor, -1);
  let n = 0;
  while (dates.has(isoDate(cursor))) {
    n += 1;
    cursor = addDays(cursor, -1);
  }
  return n;
}

export function weekCompletions(sessions: SessionLog[], from = new Date()): number {
  const start = isoDate(startOfWeek(from));
  const dates = completedOn(sessions);
  let n = 0;
  for (let i = 0; i < 7; i++) {
    const d = isoDate(addDays(parseIso(start), i));
    if (dates.has(d)) n += 1;
  }
  return n;
}

export function personalRecords(sessions: SessionLog[]): Record<string, number> {
  const best: Record<string, number> = {};
  for (const session of sessions) {
    for (const set of session.sets) {
      if (!set.completed || set.skipped || !set.weight) continue;
      best[set.exerciseId] = Math.max(best[set.exerciseId] ?? 0, set.weight);
    }
  }
  return best;
}

export function recentSessions(sessions: SessionLog[], limit = 12): SessionLog[] {
  return [...sessions]
    .filter((s) => s.completed)
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
    .slice(0, limit);
}
