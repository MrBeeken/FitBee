import { SESSION_LABELS } from "../data/types";
import { isoDate } from "./dates";
import {
  adaptWorkout,
  pickWorkout,
  resolveLocation,
  todayPlan,
} from "./planner";
import {
  todayEnergy,
  todayLocation,
  todayMinutes,
  useAppStore,
} from "../store/useAppStore";

export function useToday() {
  const profile = useAppStore((s) => s.profile);
  const energyByDate = useAppStore((s) => s.energyByDate);
  const locationByDate = useAppStore((s) => s.locationByDate);
  const minutesByDate = useAppStore((s) => s.minutesByDate);
  const sessions = useAppStore((s) => s.sessions);
  const date = isoDate();
  const planned = todayPlan(profile);
  const energy = todayEnergy({ energyByDate }, date);
  const minutes = todayMinutes({ profile, minutesByDate }, date);
  const location = resolveLocation(profile, todayLocation({ profile, locationByDate }, date));
  const raw = pickWorkout({
    kind: planned.kind,
    location,
    minutes,
    energy,
    level: profile.level,
    equipment: profile.equipment,
  });
  const workout = adaptWorkout(raw, profile, location);
  const doneToday = sessions.some((s) => s.date === date && s.completed);

  return {
    date,
    planned,
    energy,
    minutes,
    location,
    workout,
    doneToday,
    title: SESSION_LABELS[planned.kind],
  };
}
