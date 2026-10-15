import { getExercise } from "../data/exercises";
import type {
  Energy,
  Equipment,
  Exercise,
  Level,
  Location,
  PlannedDay,
  Profile,
  SessionKind,
  WorkoutStep,
  WorkoutTemplate,
} from "../data/types";
import { WORKOUTS } from "../data/workouts";
import { isoDate, startOfWeek } from "./dates";

const SEQUENCE: SessionKind[] = [
  "glute-strength",
  "upper-core",
  "leg-sculpt",
  "glute-pump",
  "full-body",
];

const FREE_EQUIPMENT = new Set<Equipment>(["bodyweight", "mat"]);

export function defaultPreferredDays(daysPerWeek: 3 | 4 | 5): number[] {
  if (daysPerWeek === 3) return [1, 3, 5];
  if (daysPerWeek === 4) return [1, 2, 4, 6];
  return [1, 2, 4, 5, 6];
}

export function planWeek(profile: Profile, from = new Date()): PlannedDay[] {
  const start = startOfWeek(from);
  const training = (
    profile.preferredDays.length ? profile.preferredDays : defaultPreferredDays(profile.daysPerWeek)
  ).slice();
  let ti = 0;
  const out: PlannedDay[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const weekday = date.getDay();
    const isTraining = training.includes(weekday);
    const kind: SessionKind = isTraining ? SEQUENCE[ti++ % SEQUENCE.length] : "rest";
    out.push({
      date: isoDate(date),
      weekday,
      kind,
      isRest: kind === "rest",
    });
  }
  return out;
}

export function todayPlan(profile: Profile, from = new Date()): PlannedDay {
  const iso = isoDate(from);
  return planWeek(profile, from).find((d) => d.date === iso) ?? {
    date: iso,
    weekday: from.getDay(),
    kind: "rest",
    isRest: true,
  };
}

export function resolveLocation(
  profile: Profile,
  override?: Location | null,
): Location {
  if (override) return override;
  if (profile.location === "both") return "home";
  return profile.location;
}

function equipmentScore(required: Equipment[], owned: Equipment[]): number {
  const have = new Set(owned);
  let missing = 0;
  for (const item of required) {
    if (FREE_EQUIPMENT.has(item)) continue;
    if (!have.has(item)) missing += 1;
  }
  return missing === 0 ? 8 : Math.max(-6, 2 - missing * 3);
}

export function pickWorkout(opts: {
  kind: SessionKind;
  location: Location;
  minutes: number;
  energy: Energy;
  level: Level;
  equipment: Equipment[];
}): WorkoutTemplate {
  const { kind, location, minutes, energy, level, equipment } = opts;

  if (kind === "rest") {
    return mustWorkout("rest-restore-15");
  }

  if (energy === "low" && kind !== "walk-mobility") {
    return mustWorkout("low-energy-glutes-15");
  }

  const candidates = WORKOUTS.filter((w) => {
    if (w.kind !== kind) return false;
    return w.location.includes(location);
  });

  const pool = candidates.length ? candidates : WORKOUTS.filter((w) => w.kind === kind);

  const scored = pool
    .map((w) => {
      const durationDelta = Math.abs(w.durationMin - minutes);
      const score =
        (durationDelta === 0 ? 12 : 8 - durationDelta / 5) +
        (w.energy.includes(energy) ? 4 : 0) +
        (w.level.includes(level) ? 2 : 0) +
        equipmentScore(w.requiredEquipment, equipment);
      return { w, score };
    })
    .sort((a, b) => b.score - a.score);

  return scored[0]?.w ?? mustWorkout("low-energy-glutes-15");
}

function mustWorkout(id: string): WorkoutTemplate {
  const w = WORKOUTS.find((item) => item.id === id);
  if (!w) throw new Error(`Missing workout ${id}`);
  return w;
}

function ownsEquipment(exercise: Exercise, owned: Set<Equipment>): boolean {
  if (exercise.equipment.every((e) => FREE_EQUIPMENT.has(e))) return true;
  return exercise.equipment.some((e) => FREE_EQUIPMENT.has(e) || owned.has(e));
}

function swapExercise(
  id: string,
  profile: Profile,
  owned: Set<Equipment>,
  location: Location,
): string {
  const seen = new Set<string>();
  let current = id;
  for (let i = 0; i < 6; i++) {
    if (seen.has(current)) break;
    seen.add(current);
    const ex = getExercise(current);
    const kneeBad = profile.kneeSensitive && ex.kneeFriendly === false;
    const backBad = profile.backSensitive && ex.backFriendly === false;
    const locBad = !ex.locations.includes(location);
    const equipBad = !ownsEquipment(ex, owned);
    if (!kneeBad && !backBad && !locBad && !equipBad) return current;

    const next = ex.substitutions.find((sid) => {
      if (seen.has(sid)) return false;
      try {
        const sub = getExercise(sid);
        if (profile.kneeSensitive && sub.kneeFriendly === false) return false;
        if (profile.backSensitive && sub.backFriendly === false) return false;
        if (!sub.locations.includes(location)) return false;
        if (!ownsEquipment(sub, owned)) return false;
        return true;
      } catch {
        return false;
      }
    });
    if (!next) return current;
    current = next;
  }
  return current;
}

function mapSteps(
  steps: WorkoutStep[],
  profile: Profile,
  owned: Set<Equipment>,
  location: Location,
): WorkoutStep[] {
  return steps.map((step) => ({
    ...step,
    exerciseId: swapExercise(step.exerciseId, profile, owned, location),
  }));
}

export function adaptWorkout(
  template: WorkoutTemplate,
  profile: Profile,
  location: Location,
): WorkoutTemplate {
  const owned = new Set(profile.equipment);
  return {
    ...template,
    warmup: mapSteps(template.warmup, profile, owned, location),
    cooldown: mapSteps(template.cooldown, profile, owned, location),
    blocks: template.blocks.map((block) => ({
      ...block,
      steps: mapSteps(block.steps, profile, owned, location),
    })),
  };
}

export interface PlayItem {
  key: string;
  phase: "warmup" | "work" | "cooldown";
  blockTitle?: string;
  blockSubtitle?: string;
  step: WorkoutStep;
  setNumber: number;
  totalSets: number;
  isLastSet: boolean;
}

export function flattenWorkout(workout: WorkoutTemplate): PlayItem[] {
  const items: PlayItem[] = [];
  const add = (
    phase: PlayItem["phase"],
    steps: WorkoutStep[],
    blockTitle?: string,
    blockSubtitle?: string,
  ) => {
    for (const step of steps) {
      for (let s = 1; s <= step.sets; s++) {
        items.push({
          key: `${phase}-${blockTitle ?? ""}-${step.exerciseId}-${s}`,
          phase,
          blockTitle,
          blockSubtitle,
          step,
          setNumber: s,
          totalSets: step.sets,
          isLastSet: s === step.sets,
        });
      }
    }
  };
  add("warmup", workout.warmup);
  for (const block of workout.blocks) {
    add("work", block.steps, block.title, block.subtitle);
  }
  add("cooldown", workout.cooldown);
  return items;
}

export function workoutWhere(workout: WorkoutTemplate): string {
  return workout.howToPrep[0] ?? (workout.location.includes("home") ? "At home" : "At the gym");
}

export function uniqueEquipment(workout: WorkoutTemplate): Equipment[] {
  return workout.requiredEquipment.filter((e) => !FREE_EQUIPMENT.has(e));
}

export function countWorkingSets(workout: WorkoutTemplate): number {
  return workout.blocks.reduce(
    (sum, block) => sum + block.steps.reduce((s, step) => s + step.sets, 0),
    0,
  );
}
