import { Link, useNavigate, useParams } from "react-router-dom";
import { getExercise } from "../data/exercises";
import { MUSCLE_LABELS } from "../data/types";
import { EQUIPMENT_LABELS } from "../data/types";
import { useAppStore } from "../store/useAppStore";

export function ExerciseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const favorites = useAppStore((s) => s.favorites);
  const toggle = useAppStore((s) => s.toggleFavorite);
  let exercise;
  try {
    exercise = getExercise(id ?? "");
  } catch {
    return (
      <div className="page stack">
        <p>That move is not in the library.</p>
        <button className="btn" onClick={() => navigate(-1)}>
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="page stack">
      <button className="btn-quiet" onClick={() => navigate(-1)}>
        ← Back
      </button>
      <div className="spread">
        <p className="kicker">{exercise.muscles.map((m) => MUSCLE_LABELS[m]).join(" · ")}</p>
        <button className="btn-quiet" onClick={() => toggle(exercise.id)}>
          {favorites.includes(exercise.id) ? "Saved" : "Save"}
        </button>
      </div>
      <h1 className="display">{exercise.name}</h1>
      <p className="lede">{exercise.why}</p>
      <div className="chips">
        <span className="chip">{exercise.defaultSets} × {exercise.defaultReps}</span>
        <span className="chip">{exercise.restSec ? `${exercise.restSec}s rest` : "flow"}</span>
        {exercise.kneeFriendly ? <span className="chip">Knee-kind</span> : null}
        {exercise.laterality === "unilateral" ? <span className="chip">Each side</span> : null}
      </div>
      <section className="card">
        <p className="tiny muted">Where</p>
        <p style={{ marginTop: 6 }}>{exercise.where}</p>
        <p className="tiny muted" style={{ marginTop: 12 }}>
          Setup
        </p>
        <ul className="how">
          {exercise.setup.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </section>
      <section className="card">
        <p className="tiny muted">How</p>
        <ol className="how">
          {exercise.how.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
      </section>
      <section className="card">
        <p className="tiny muted">Cues</p>
        <ul className="how">
          {exercise.cues.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </section>
      <section className="card">
        <p className="tiny muted">Common misses</p>
        <ul className="how">
          {exercise.mistakes.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </section>
      <section>
        <p className="tiny muted">Swap if needed</p>
        <div className="stack" style={{ marginTop: 8 }}>
          {exercise.substitutions.map((sid) => {
            const sub = getExercise(sid);
            return (
              <Link key={sid} to={`/library/${sid}`} className="card">
                <strong>{sub.name}</strong>
                <p className="tiny muted">{sub.equipment.map((e) => EQUIPMENT_LABELS[e]).join(", ")}</p>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
