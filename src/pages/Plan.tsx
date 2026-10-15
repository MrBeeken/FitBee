import { useNavigate } from "react-router-dom";
import { SESSION_LABELS } from "../data/types";
import { isoDate, prettyDate, WEEKDAY_LONG } from "../lib/dates";
import {
  adaptWorkout,
  pickWorkout,
  planWeek,
  resolveLocation,
} from "../lib/planner";
import { useAppStore, todayEnergy, todayLocation, todayMinutes } from "../store/useAppStore";

export function Plan() {
  const navigate = useNavigate();
  const profile = useAppStore((s) => s.profile);
  const sessions = useAppStore((s) => s.sessions);
  const energyByDate = useAppStore((s) => s.energyByDate);
  const locationByDate = useAppStore((s) => s.locationByDate);
  const minutesByDate = useAppStore((s) => s.minutesByDate);
  const week = planWeek(profile);
  const today = isoDate();
  const loc = resolveLocation(profile, todayLocation({ profile, locationByDate }));
  const minutes = todayMinutes({ profile, minutesByDate });

  return (
    <div className="page stack">
      <p className="kicker">This week</p>
      <h1 className="display">The plan, already decided.</h1>
      <p className="lede">
        Glutes and legs show up more often than anything else. Rest days are
        real rest. Tap a day to see the session.
      </p>
      {week.map((day) => {
        const energy = todayEnergy({ energyByDate }, day.date);
        const workout = adaptWorkout(
          pickWorkout({
            kind: day.kind,
            location: loc,
            minutes: day.isRest ? 15 : minutes,
            energy: day.date === today ? energy : "good",
            level: profile.level,
            equipment: profile.equipment,
          }),
          profile,
          loc,
        );
        const done = sessions.some((s) => s.date === day.date && s.completed);
        return (
          <button
            key={day.date}
            className="card"
            style={{ textAlign: "left" }}
            onClick={() => {
              if (day.date === today) navigate("/preview");
            }}
          >
            <div className="spread">
              <span className="tiny muted">{WEEKDAY_LONG[day.weekday]}</span>
              {done ? <span className="badge">Done</span> : day.date === today ? <span className="badge">Today</span> : null}
            </div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, marginTop: 6 }}>
              {SESSION_LABELS[day.kind]}
            </h2>
            <p className="tiny muted" style={{ marginTop: 4 }}>
              {prettyDate(day.date)} · {workout.durationMin} min · {workout.tagline}
            </p>
          </button>
        );
      })}
      <p className="tiny muted">Change training days under You.</p>
    </div>
  );
}
