import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getExercise } from "../data/exercises";
import { buzz, celebrate, tap } from "../lib/haptics";
import { formatClock, parseRepTarget } from "../lib/format";
import { flattenWorkout } from "../lib/planner";
import { useToday } from "../lib/useToday";
import { useAppStore } from "../store/useAppStore";

export function WorkoutPlayer() {
  const navigate = useNavigate();
  const { workout } = useToday();
  const active = useAppStore((s) => s.activeSession);
  const abandon = useAppStore((s) => s.abandonSession);
  const saveSet = useAppStore((s) => s.saveSet);
  const rememberSet = useAppStore((s) => s.rememberSet);
  const advanceItem = useAppStore((s) => s.advanceItem);
  const beginRest = useAppStore((s) => s.beginRest);
  const skipRest = useAppStore((s) => s.skipRest);
  const addRest = useAppStore((s) => s.addRest);
  const finishSession = useAppStore((s) => s.finishSession);
  const lastWeights = useAppStore((s) => s.lastWeights);
  const lastReps = useAppStore((s) => s.lastReps);
  const units = useAppStore((s) => s.profile.units);
  const items = useMemo(() => flattenWorkout(workout), [workout]);
  const [notes, setNotes] = useState("");
  const [left, setLeft] = useState(0);
  const [reps, setReps] = useState(10);
  const [weight, setWeight] = useState(0);

  const item = active && active.itemIndex < items.length ? items[active.itemIndex] : undefined;
  const exercise = item ? getExercise(item.step.exerciseId) : undefined;
  const done = Boolean(active && active.itemIndex >= items.length);

  useEffect(() => {
    if (!active) navigate("/preview", { replace: true });
  }, [active, navigate]);

  useEffect(() => {
    let lock: WakeLockSentinel | undefined;
    void navigator.wakeLock
      ?.request("screen")
      .then((sent) => {
        lock = sent;
      })
      .catch(() => undefined);
    return () => {
      void lock?.release();
    };
  }, []);

  useEffect(() => {
    if (!active?.inRest || !active.restEndsAt) return;
    const tick = () => {
      const ms = active.restEndsAt! - Date.now();
      setLeft(Math.max(0, Math.ceil(ms / 1000)));
      if (ms <= 0) {
        buzz();
        skipRest();
      }
    };
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [active?.inRest, active?.restEndsAt, skipRest]);

  useEffect(() => {
    if (!item) return;
    setReps(lastReps[item.step.exerciseId] ?? parseRepTarget(item.step.reps));
    setWeight(lastWeights[item.step.exerciseId] ?? 0);
  }, [item, lastReps, lastWeights]);

  const completeSet = (skipped = false) => {
    if (!item || !exercise || !active) return;
    tap();
    saveSet({
      exerciseId: exercise.id,
      setIndex: item.setNumber,
      reps: skipped ? null : reps,
      weight: skipped || weight <= 0 ? null : weight,
      skipped,
      completed: !skipped,
    });
    if (!skipped) rememberSet(exercise.id, reps, weight || null);
    const isLast = active.itemIndex === items.length - 1;
    if (!isLast && item.step.restSec > 0) beginRest(item.step.restSec);
    else advanceItem();
  };

  if (!active) return null;

  if (done) {
    return (
      <div className="player stack">
        <p className="kicker">Done</p>
        <h1 className="display">That's the session.</h1>
        <p className="lede">You showed up. Log a sentence if you want, or just save it.</p>
        <label className="field">
          <span className="tiny muted">How did it feel?</span>
          <textarea
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Heavy on the last thrust set. Knees happy."
          />
        </label>
        <button
          className="btn btn-primary btn-block"
          onClick={() => {
            celebrate();
            finishSession(notes, true);
            navigate("/");
          }}
        >
          Save workout
        </button>
        <button
          className="btn btn-ghost btn-block"
          onClick={() => {
            finishSession(notes, false);
            navigate("/");
          }}
        >
          Save as partial
        </button>
      </div>
    );
  }

  if (!exercise || !item) return null;

  const phaseLabel =
    item.phase === "warmup" ? "Warmup" : item.phase === "cooldown" ? "Cooldown" : (item.blockTitle ?? "Work");
  const pct = Math.round((active.itemIndex / items.length) * 100);
  const nextItem = items[active.itemIndex + 1];

  return (
    <div className="player">
      <div className="spread">
        <button
          className="btn-quiet"
          onClick={() => {
            if (confirm("Leave this workout?")) {
              abandon();
              navigate("/");
            }
          }}
        >
          Exit
        </button>
        <span className="tiny muted">
          {active.itemIndex + 1}/{items.length}
        </span>
      </div>
      <div className="progress-bar" style={{ margin: "10px 0 18px" }}>
        <span style={{ width: `${pct}%` }} />
      </div>
      <p className="kicker">{phaseLabel}</p>
      {item.blockSubtitle && item.setNumber === 1 ? (
        <p className="tiny muted">{item.blockSubtitle}</p>
      ) : null}
      <h1 className="exercise-name" style={{ marginTop: 8 }}>
        {exercise.name}
      </h1>
      <p className="lede" style={{ marginTop: 8 }}>
        Set {item.setNumber} of {item.totalSets} · {item.step.reps}
      </p>
      <p className="tiny muted" style={{ marginTop: 6 }}>
        {exercise.where}
      </p>
      {item.step.intensity ? (
        <p className="tiny" style={{ marginTop: 10 }}>
          {item.step.intensity}
        </p>
      ) : null}

      <div className="card" style={{ marginTop: 18 }}>
        <div className="spread">
          <span className="tiny muted">Reps</span>
          <span className="tiny muted">Target {item.step.reps}</span>
        </div>
        <div className="stepper" style={{ marginTop: 8 }}>
          <button onClick={() => setReps((n) => Math.max(0, n - 1))}>−</button>
          <input
            inputMode="numeric"
            value={reps}
            onChange={(e) => setReps(Number(e.target.value) || 0)}
          />
          <button onClick={() => setReps((n) => n + 1)}>+</button>
        </div>
        {item.phase === "work" ? (
          <>
            <div className="spread" style={{ marginTop: 14 }}>
              <span className="tiny muted">Weight ({units})</span>
              <span className="tiny muted">0 = bodyweight</span>
            </div>
            <div className="stepper" style={{ marginTop: 8 }}>
              <button onClick={() => setWeight((n) => Math.max(0, n - 2.5))}>−</button>
              <input
                inputMode="decimal"
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value) || 0)}
              />
              <button onClick={() => setWeight((n) => n + 2.5)}>+</button>
            </div>
          </>
        ) : null}
      </div>

      <details className="details" style={{ marginTop: 12 }}>
        <summary>How to do this</summary>
        <p className="tiny muted">Setup</p>
        <ul className="how">
          {exercise.setup.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
        <p className="tiny muted">How</p>
        <ol className="how">
          {exercise.how.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
        <p className="tiny muted">Cues</p>
        <ul className="how">
          {exercise.cues.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
        {item.step.notes ? <p className="tiny">{item.step.notes}</p> : null}
        <p className="tiny muted" style={{ marginTop: 8 }}>
          Swap
        </p>
        {exercise.substitutions.slice(0, 3).map((sid) => (
          <Link key={sid} to={`/library/${sid}`} className="tiny" style={{ display: "block", marginTop: 4 }}>
            {getExercise(sid).name}
          </Link>
        ))}
      </details>

      <div style={{ marginTop: "auto", display: "grid", gap: 8, paddingTop: 16 }}>
        <button className="btn btn-primary btn-block" onClick={() => completeSet(false)}>
          {item.isLastSet ? "Finish move" : "Log set"}
        </button>
        <button className="btn btn-ghost btn-block" onClick={() => completeSet(true)}>
          Skip this set
        </button>
      </div>

      {active.inRest ? (
        <div className="timer-overlay">
          <div style={{ textAlign: "center" }}>
            <p className="kicker" style={{ color: "#E3A51A" }}>
              Rest
            </p>
            <div className="clock">{formatClock(left)}</div>
            <p className="lede" style={{ color: "#E8C4B0" }}>
              Next: {nextItem ? getExercise(nextItem.step.exerciseId).name : "Done"}
            </p>
            <div className="row" style={{ justifyContent: "center", marginTop: 18 }}>
              <button className="btn btn-honey" onClick={() => addRest(15)}>
                +15s
              </button>
              <button className="btn" onClick={skipRest}>
                Skip rest
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
