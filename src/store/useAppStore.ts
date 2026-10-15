import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Energy,
  Location,
  Profile,
  SessionLog,
} from "../data/types";
import { defaultPreferredDays } from "../lib/planner";
import { isoDate } from "../lib/dates";

export const defaultProfile: Profile = {
  name: "",
  level: "beginner",
  location: "home",
  equipment: ["bodyweight", "mat", "dumbbells", "bands"],
  daysPerWeek: 4,
  minutes: 30,
  preferredDays: defaultPreferredDays(4),
  kneeSensitive: false,
  backSensitive: false,
  units: "lb",
  theme: "system",
  onboarded: false,
};

interface ActiveSession {
  logId: string;
  workoutId: string;
  workoutName: string;
  startedAt: number;
  itemIndex: number;
  inRest: boolean;
  restEndsAt: number | null;
  restSec: number;
}

interface AppState {
  profile: Profile;
  energyByDate: Record<string, Energy>;
  locationByDate: Record<string, Location>;
  minutesByDate: Record<string, 20 | 30 | 45>;
  sessions: SessionLog[];
  favorites: string[];
  lastWeights: Record<string, number>;
  lastReps: Record<string, number>;
  activeSession: ActiveSession | null;
  dismissedInstall: boolean;
  completeOnboarding: (profile: Omit<Profile, "onboarded">) => void;
  updateProfile: (patch: Partial<Profile>) => void;
  setEnergy: (date: string, energy: Energy) => void;
  setTodayLocation: (date: string, location: Location) => void;
  setTodayMinutes: (date: string, minutes: 20 | 30 | 45) => void;
  toggleFavorite: (id: string) => void;
  rememberSet: (exerciseId: string, reps: number, weight: number | null) => void;
  startSession: (input: {
    workoutId: string;
    workoutName: string;
    kind: SessionLog["kind"];
    energy: Energy;
  }) => string;
  saveSet: (set: SessionLog["sets"][number]) => void;
  advanceItem: () => void;
  beginRest: (sec: number) => void;
  skipRest: () => void;
  addRest: (sec: number) => void;
  finishSession: (notes: string, completed: boolean) => void;
  abandonSession: () => void;
  logRestDay: (date: string, workoutId: string, workoutName: string) => void;
  dismissInstall: () => void;
}

function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      profile: defaultProfile,
      energyByDate: {},
      locationByDate: {},
      minutesByDate: {},
      sessions: [],
      favorites: [],
      lastWeights: {},
      lastReps: {},
      activeSession: null,
      dismissedInstall: false,
      completeOnboarding: (profile) =>
        set({
          profile: { ...profile, onboarded: true },
        }),
      updateProfile: (patch) =>
        set((state) => {
          const next = { ...state.profile, ...patch };
          if (patch.daysPerWeek && !patch.preferredDays) {
            next.preferredDays = defaultPreferredDays(patch.daysPerWeek);
          }
          return { profile: next };
        }),
      setEnergy: (date, energy) =>
        set((state) => ({
          energyByDate: { ...state.energyByDate, [date]: energy },
        })),
      setTodayLocation: (date, location) =>
        set((state) => ({
          locationByDate: { ...state.locationByDate, [date]: location },
        })),
      setTodayMinutes: (date, minutes) =>
        set((state) => ({
          minutesByDate: { ...state.minutesByDate, [date]: minutes },
        })),
      toggleFavorite: (id) =>
        set((state) => ({
          favorites: state.favorites.includes(id)
            ? state.favorites.filter((x) => x !== id)
            : [...state.favorites, id],
        })),
      rememberSet: (exerciseId, reps, weight) =>
        set((state) => ({
          lastReps: { ...state.lastReps, [exerciseId]: reps },
          lastWeights:
            weight && weight > 0
              ? { ...state.lastWeights, [exerciseId]: weight }
              : state.lastWeights,
        })),
      startSession: ({ workoutId, workoutName, kind, energy }) => {
        const id = newId();
        const log: SessionLog = {
          id,
          date: isoDate(),
          workoutId,
          workoutName,
          kind,
          durationSec: 0,
          energy,
          notes: "",
          completed: false,
          sets: [],
        };
        set((state) => ({
          sessions: [log, ...state.sessions.filter((s) => s.id !== state.activeSession?.logId)],
          activeSession: {
            logId: id,
            workoutId,
            workoutName,
            startedAt: Date.now(),
            itemIndex: 0,
            inRest: false,
            restEndsAt: null,
            restSec: 0,
          },
        }));
        return id;
      },
      saveSet: (logged) =>
        set((state) => ({
          sessions: state.sessions.map((session) =>
            session.id === state.activeSession?.logId
              ? { ...session, sets: [...session.sets, logged] }
              : session,
          ),
        })),
      advanceItem: () =>
        set((state) => {
          if (!state.activeSession) return state;
          return {
            activeSession: {
              ...state.activeSession,
              itemIndex: state.activeSession.itemIndex + 1,
              inRest: false,
              restEndsAt: null,
            },
          };
        }),
      beginRest: (sec) =>
        set((state) => {
          if (!state.activeSession) return state;
          return {
            activeSession: {
              ...state.activeSession,
              inRest: true,
              restSec: sec,
              restEndsAt: Date.now() + sec * 1000,
            },
          };
        }),
      skipRest: () =>
        set((state) => {
          if (!state.activeSession) return state;
          return {
            activeSession: {
              ...state.activeSession,
              inRest: false,
              restEndsAt: null,
              itemIndex: state.activeSession.itemIndex + 1,
            },
          };
        }),
      addRest: (sec) =>
        set((state) => {
          if (!state.activeSession?.restEndsAt) return state;
          return {
            activeSession: {
              ...state.activeSession,
              restEndsAt: state.activeSession.restEndsAt + sec * 1000,
              restSec: state.activeSession.restSec + sec,
            },
          };
        }),
      finishSession: (notes, completed) =>
        set((state) => {
          if (!state.activeSession) return state;
          const { logId, startedAt } = state.activeSession;
          return {
            activeSession: null,
            sessions: state.sessions.map((session) =>
              session.id === logId
                ? {
                    ...session,
                    notes,
                    completed,
                    durationSec: Math.round((Date.now() - startedAt) / 1000),
                  }
                : session,
            ),
          };
        }),
      abandonSession: () =>
        set((state) => {
          if (!state.activeSession) return { activeSession: null };
          const { logId } = state.activeSession;
          return {
            activeSession: null,
            sessions: state.sessions.filter((session) => session.id !== logId),
          };
        }),
      logRestDay: (date, workoutId, workoutName) => {
        const exists = get().sessions.some((s) => s.date === date && s.completed && s.kind === "rest");
        if (exists) return;
        const log: SessionLog = {
          id: newId(),
          date,
          workoutId,
          workoutName,
          kind: "rest",
          durationSec: 0,
          energy: get().energyByDate[date] ?? "good",
          notes: "",
          completed: true,
          sets: [],
        };
        set((state) => ({ sessions: [log, ...state.sessions] }));
      },
      dismissInstall: () => set({ dismissedInstall: true }),
    }),
    {
      name: "fitbee-v1",
      partialize: (state) => ({
        profile: state.profile,
        energyByDate: state.energyByDate,
        locationByDate: state.locationByDate,
        minutesByDate: state.minutesByDate,
        sessions: state.sessions,
        favorites: state.favorites,
        lastWeights: state.lastWeights,
        lastReps: state.lastReps,
        dismissedInstall: state.dismissedInstall,
      }),
    },
  ),
);

export function todayEnergy(state: Pick<AppState, "energyByDate">, date = isoDate()): Energy {
  return state.energyByDate[date] ?? "good";
}

export function todayLocation(
  state: Pick<AppState, "profile" | "locationByDate">,
  date = isoDate(),
): Location | null {
  return state.locationByDate[date] ?? null;
}

export function todayMinutes(
  state: Pick<AppState, "profile" | "minutesByDate">,
  date = isoDate(),
): 20 | 30 | 45 {
  return state.minutesByDate[date] ?? state.profile.minutes;
}
