import { describe, expect, it } from "vitest";
import { EXERCISES, getExercise } from "../data/exercises";
import type { Profile } from "../data/types";
import { WORKOUTS } from "../data/workouts";
import { defaultProfile } from "../store/useAppStore";
import {
  adaptWorkout,
  defaultPreferredDays,
  flattenWorkout,
  pickWorkout,
  planWeek,
} from "./planner";

const profile: Profile = { ...defaultProfile, onboarded: true };

describe("planWeek", () => {
  it("places the right number of training days on preferred weekdays", () => {
    const week = planWeek(profile, new Date(2026, 9, 12)); // Monday
    const training = week.filter((d) => !d.isRest);
    expect(training).toHaveLength(4);
    expect(training.map((d) => d.weekday)).toEqual(defaultPreferredDays(4));
    expect(training.map((d) => d.kind)).toEqual([
      "glute-strength",
      "upper-core",
      "leg-sculpt",
      "glute-pump",
    ]);
  });

  it("keeps glutes/legs as the majority of a 3-day week", () => {
    const week = planWeek(
      { ...profile, daysPerWeek: 3, preferredDays: defaultPreferredDays(3) },
      new Date(2026, 9, 12),
    );
    const kinds = week.filter((d) => !d.isRest).map((d) => d.kind);
    const lower = kinds.filter((k) => k.includes("glute") || k === "leg-sculpt");
    expect(lower.length).toBeGreaterThanOrEqual(2);
  });
});

describe("pickWorkout", () => {
  it("picks a home glute session near 30 minutes", () => {
    const w = pickWorkout({
      kind: "glute-strength",
      location: "home",
      minutes: 30,
      energy: "good",
      level: "beginner",
      equipment: profile.equipment,
    });
    expect(w.kind).toBe("glute-strength");
    expect(w.location).toContain("home");
    expect(w.durationMin).toBe(30);
  });

  it("swaps to the low-energy glute session when energy is low", () => {
    const w = pickWorkout({
      kind: "leg-sculpt",
      location: "home",
      minutes: 30,
      energy: "low",
      level: "beginner",
      equipment: profile.equipment,
    });
    expect(w.id).toBe("low-energy-glutes-15");
  });

  it("uses the restore session on rest days", () => {
    const w = pickWorkout({
      kind: "rest",
      location: "home",
      minutes: 30,
      energy: "good",
      level: "beginner",
      equipment: profile.equipment,
    });
    expect(w.id).toBe("rest-restore-15");
  });
});

describe("catalog integrity", () => {
  it("has unique exercise ids and valid substitutions", () => {
    const ids = EXERCISES.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const exercise of EXERCISES) {
      for (const sub of exercise.substitutions) {
        expect(() => getExercise(sub), `${exercise.id} -> ${sub}`).not.toThrow();
      }
    }
  });

  it("references only real exercises from every workout", () => {
    for (const workout of WORKOUTS) {
      const steps = [
        ...workout.warmup,
        ...workout.blocks.flatMap((b) => b.steps),
        ...workout.cooldown,
      ];
      for (const step of steps) {
        expect(() => getExercise(step.exerciseId), `${workout.id} ${step.exerciseId}`).not.toThrow();
      }
      const flat = flattenWorkout(workout);
      expect(flat.length).toBeGreaterThan(3);
    }
  });

  it("adapts lunges away when knees are sensitive", () => {
    const raw = pickWorkout({
      kind: "glute-strength",
      location: "home",
      minutes: 30,
      energy: "good",
      level: "beginner",
      equipment: profile.equipment,
    });
    const adapted = adaptWorkout(
      raw,
      { ...profile, kneeSensitive: true },
      "home",
    );
    const ids = adapted.blocks.flatMap((b) => b.steps.map((s) => s.exerciseId));
    expect(ids.some((id) => id.includes("lunge") || id === "bulgarian-split-squat")).toBe(
      false,
    );
    for (const id of ids) {
      const ex = getExercise(id);
      expect(ex.kneeFriendly).not.toBe(false);
    }
  });
});
