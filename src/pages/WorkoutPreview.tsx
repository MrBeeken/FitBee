import { Link, useNavigate } from "react-router-dom";
import { getExercise } from "../data/exercises";
import { tap } from "../lib/haptics";
import { isoDate } from "../lib/dates";
import { flattenWorkout } from "../lib/planner";
import { useToday } from "../lib/useToday";
import { useAppStore } from "../store/useAppStore";

export function WorkoutPreview() {
  const navigate = useNavigate();
  const { workout, planned, energy, location, doneToday } = useToday();
  const startSession = useAppStore((s) => s.startSession);
  const logRestDay = useAppStore((s) => s.logRestDay);
  const items = flattenWorkout(workout);
  const moves = [
    ...workout.warmup,
    ...workout.blocks.flatMap((b) => b.steps),
    ...workout.cooldown,
  ];

  const start = () => {
    tap();
    startSession({
      workoutId: workout.id,
      workoutName: workout.name,
      kind: workout.kind,
      energy,
    });
    navigate("/play");
  };

  return (
    <div className="page stack">
      <button className="btn-quiet" onClick={() => navigate(-1)}>
        ← Today
      </button>
      <p className="kicker">{planned.isRest ? "Rest day" : "Today's session"}</p>
      <h1 className="display">{workout.name.split("·")[0].trim()}</h1>
      <p className="lede">{workout.what}</p>
      <div className="chips">
        <span className="chip">{workout.durationMin} min</span>
        <span className="chip">{location === "home" ? "Home" : "Gym"}</span>
        <span className="chip">{items.length} steps</span>
      </div>
      <section className="card stack">
        <p className="tiny muted">What · when · where · how</p>
        <p>
          <strong>What · </strong>
          {workout.tagline}
        </p>
        <p>
          <strong>When · </strong>
          now, for about {workout.durationMin} minutes
        </p>
        <p>
          <strong>Where · </strong>
          {workout.howToPrep[0]}
        </p>
        <p>
          <strong>How · </strong>
          warmup, then the main sets, then a short unwind. I'll count sets and rest
          for you.
        </p>
      </section>
      <section className="card">
        <p className="tiny muted">Before you start</p>
        <div className="stack" style={{ marginTop: 10 }}>
          {workout.howToPrep.map((item) => (
            <label key={item} className="check">
              <input type="checkbox" />
              <span>{item}</span>
            </label>
          ))}
        </div>
      </section>
      {workout.blocks.map((block) => (
        <section key={block.title} className="card">
          <strong>{block.title}</strong>
          {block.subtitle ? <p className="tiny muted">{block.subtitle}</p> : null}
          {block.steps.map((step) => {
            const ex = getExercise(step.exerciseId);
            return (
              <Link key={step.exerciseId + step.reps} to={`/library/${ex.id}`} className="list-row">
                <div style={{ flex: 1 }}>
                  <strong>{ex.name}</strong>
                  <p className="tiny muted">
                    {step.sets} × {step.reps}
                    {step.restSec ? ` · ${step.restSec}s rest` : ""}
                  </p>
                </div>
              </Link>
            );
          })}
        </section>
      ))}
      <details className="details">
        <summary>Warmup & cooldown ({moves.length} moves in the full flow)</summary>
        <p className="tiny muted" style={{ marginTop: 8 }}>
          Warmup: {workout.warmup.map((s) => getExercise(s.exerciseId).name).join(", ")}
        </p>
        <p className="tiny muted">
          Cooldown: {workout.cooldown.map((s) => getExercise(s.exerciseId).name).join(", ")}
        </p>
      </details>
      {doneToday ? (
        <p className="lede">You already logged today. You can still run it again if you want.</p>
      ) : null}
      <button className="btn btn-primary btn-block" onClick={start}>
        {planned.isRest ? "Start the restore session" : "Let's go"}
      </button>
      {planned.isRest ? (
        <button
          className="btn btn-ghost btn-block"
          onClick={() => {
            logRestDay(isoDate(), workout.id, workout.name);
            navigate("/");
          }}
        >
          I'm resting — mark the day
        </button>
      ) : null}
    </div>
  );
}
