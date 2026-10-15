export type MuscleGroup =
  | "glutes"
  | "quads"
  | "hamstrings"
  | "calves"
  | "core"
  | "back"
  | "chest"
  | "shoulders"
  | "arms"
  | "cardio"
  | "mobility";

export type Equipment =
  | "bodyweight"
  | "dumbbells"
  | "bands"
  | "bench"
  | "barbell"
  | "cable"
  | "machines"
  | "kettlebell"
  | "box"
  | "mat";

export type Location = "home" | "gym";
export type Level = "beginner" | "returning" | "comfortable";
export type Energy = "low" | "good" | "high";
export type SessionKind =
  | "glute-strength"
  | "leg-sculpt"
  | "glute-pump"
  | "upper-core"
  | "full-body"
  | "walk-mobility"
  | "rest";

export type ExerciseKind = "reps" | "time" | "hold";
export type Units = "lb" | "kg";
export type Theme = "light" | "dark" | "system";

export interface Exercise {
  id: string;
  name: string;
  muscles: MuscleGroup[];
  equipment: Equipment[];
  locations: Location[];
  level: Level;
  kind: ExerciseKind;
  /** Plain-language place to do it */
  where: string;
  setup: string[];
  how: string[];
  cues: string[];
  mistakes: string[];
  why: string;
  substitutions: string[];
  kneeFriendly?: boolean;
  backFriendly?: boolean;
  defaultSets: number;
  defaultReps: string;
  restSec: number;
  tempo?: string;
  laterality?: "bilateral" | "unilateral";
}

export interface WorkoutStep {
  exerciseId: string;
  sets: number;
  reps: string;
  restSec: number;
  notes?: string;
  /** Shown as a small coach whisper */
  intensity?: string;
}

export interface WorkoutBlock {
  title: string;
  subtitle?: string;
  steps: WorkoutStep[];
}

export interface WorkoutTemplate {
  id: string;
  kind: SessionKind;
  name: string;
  tagline: string;
  /** What she's training, in one sentence */
  what: string;
  focus: MuscleGroup[];
  durationMin: number;
  location: Location[];
  requiredEquipment: Equipment[];
  energy: Energy[];
  level: Level[];
  warmup: WorkoutStep[];
  blocks: WorkoutBlock[];
  cooldown: WorkoutStep[];
  howToPrep: string[];
}

export interface Profile {
  name: string;
  level: Level;
  location: "home" | "gym" | "both";
  equipment: Equipment[];
  daysPerWeek: 3 | 4 | 5;
  minutes: 20 | 30 | 45;
  /** 0 Sunday … 6 Saturday */
  preferredDays: number[];
  kneeSensitive: boolean;
  backSensitive: boolean;
  units: Units;
  theme: Theme;
  onboarded: boolean;
}

export interface LoggedSet {
  exerciseId: string;
  setIndex: number;
  reps: number | null;
  weight: number | null;
  skipped: boolean;
  completed: boolean;
}

export interface SessionLog {
  id: string;
  date: string;
  workoutId: string;
  workoutName: string;
  kind: SessionKind;
  durationSec: number;
  energy: Energy;
  notes: string;
  completed: boolean;
  sets: LoggedSet[];
}

export interface PlannedDay {
  date: string;
  weekday: number;
  kind: SessionKind;
  isRest: boolean;
}

export const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  glutes: "Glutes",
  quads: "Quads",
  hamstrings: "Hamstrings",
  calves: "Calves",
  core: "Core",
  back: "Back",
  chest: "Chest",
  shoulders: "Shoulders",
  arms: "Arms",
  cardio: "Cardio",
  mobility: "Mobility",
};

export const SESSION_LABELS: Record<SessionKind, string> = {
  "glute-strength": "Glute strength",
  "leg-sculpt": "Legs + glutes",
  "glute-pump": "Glute pump",
  "upper-core": "Upper + core",
  "full-body": "Full body",
  "walk-mobility": "Walk + mobility",
  rest: "Rest day",
};

export const EQUIPMENT_LABELS: Record<Equipment, string> = {
  bodyweight: "Just me",
  dumbbells: "Dumbbells",
  bands: "Resistance bands",
  bench: "Bench or sturdy couch",
  barbell: "Barbell",
  cable: "Cable machine",
  machines: "Gym machines",
  kettlebell: "Kettlebell",
  box: "Step or box",
  mat: "Mat",
};
