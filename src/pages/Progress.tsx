import { getExercise } from "../data/exercises";
import { SESSION_LABELS } from "../data/types";
import { addDays, isoDate, prettyDate, startOfWeek } from "../lib/dates";
import { formatDuration, formatWeight } from "../lib/format";
import { personalRecords, recentSessions, streak, weekCompletions } from "../lib/stats";
import { useAppStore } from "../store/useAppStore";

export function Progress() {
  const sessions = useAppStore((s) => s.sessions);
  const units = useAppStore((s) => s.profile.units);
  const daysPerWeek = useAppStore((s) => s.profile.daysPerWeek);
  const completed = sessions.filter((s) => s.completed);
  const prs = personalRecords(sessions);
  const prList = Object.entries(prs)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const cells: { date: string; count: number }[] = [];
  const start = addDays(startOfWeek(new Date()), -77);
  for (let i = 0; i < 84; i++) {
    const date = isoDate(addDays(start, i));
    const count = sessions.filter((s) => s.date === date && s.completed).length;
    cells.push({ date, count });
  }

  return (
    <div className="page stack">
      <p className="kicker">Your log</p>
      <h1 className="display">Quiet proof it happened.</h1>
      <div className="stats">
        <div className="stat">
          <span className="tiny muted">Streak</span>
          <b>{streak(sessions)}</b>
        </div>
        <div className="stat">
          <span className="tiny muted">This week</span>
          <b>
            {weekCompletions(sessions)}/{daysPerWeek}
          </b>
        </div>
        <div className="stat">
          <span className="tiny muted">Sessions</span>
          <b>{completed.length}</b>
        </div>
      </div>
      <section className="card">
        <p className="tiny muted">Last 12 weeks</p>
        <div className="cal" style={{ marginTop: 10 }}>
          {cells.map((c) => (
            <i
              key={c.date}
              className={c.count >= 2 ? "l3" : c.count === 1 ? "l2" : ""}
              title={c.date}
            />
          ))}
        </div>
      </section>
      {prList.length ? (
        <section className="card">
          <p className="tiny muted">Heaviest logged</p>
          {prList.map(([id, w]) => (
            <div key={id} className="spread" style={{ padding: "8px 0" }}>
              <span>{safeName(id)}</span>
              <strong>{formatWeight(w, units)}</strong>
            </div>
          ))}
        </section>
      ) : (
        <p className="lede">Finish a session and log a weight — your heaviest sets will live here.</p>
      )}
      <section>
        <p className="tiny muted">Recent</p>
        {recentSessions(sessions).map((s) => (
          <div key={s.id} className="list-row">
            <div style={{ flex: 1 }}>
              <strong>{s.workoutName.split("·")[0].trim()}</strong>
              <p className="tiny muted">
                {prettyDate(s.date)} · {SESSION_LABELS[s.kind]} · {formatDuration(s.durationSec)}
              </p>
              {s.notes ? <p className="tiny">{s.notes}</p> : null}
            </div>
          </div>
        ))}
        {completed.length === 0 ? <p className="lede">No sessions yet. Today is a good first one.</p> : null}
      </section>
    </div>
  );
}

function safeName(id: string): string {
  try {
    return getExercise(id).name;
  } catch {
    return id;
  }
}
