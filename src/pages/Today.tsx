import { Link, useNavigate } from "react-router-dom";
import { InstallBanner } from "../components/InstallBanner";
import { Logo } from "../components/Logo";
import { EQUIPMENT_LABELS, SESSION_LABELS } from "../data/types";
import { greetingHour, isoDate, WEEKDAY_SHORT } from "../lib/dates";
import { tap } from "../lib/haptics";
import { countWorkingSets, planWeek, uniqueEquipment, workoutWhere } from "../lib/planner";
import { streak, weekCompletions } from "../lib/stats";
import { useToday } from "../lib/useToday";
import { useAppStore } from "../store/useAppStore";

export function Today() {
  const navigate = useNavigate();
  const profile = useAppStore((s) => s.profile);
  const sessions = useAppStore((s) => s.sessions);
  const setEnergy = useAppStore((s) => s.setEnergy);
  const setTodayLocation = useAppStore((s) => s.setTodayLocation);
  const setTodayMinutes = useAppStore((s) => s.setTodayMinutes);
  const { date, planned, energy, minutes, location, workout, doneToday, title } = useToday();
  const week = planWeek(profile);
  const hi = greetingHour();
  const who = profile.name.trim() || "there";
  const hello =
    hi === "morning" ? `Good morning, ${who}` : hi === "afternoon" ? `Hey, ${who}` : `Good evening, ${who}`;

  return (
    <div className="page stack">
      <div className="spread">
        <div className="row">
          <Logo size={32} />
          <span className="kicker">FitBee</span>
        </div>
        <span className="tiny muted">{WEEKDAY_SHORT[new Date().getDay()]}</span>
      </div>
      <div>
        <p className="lede">{hello}</p>
        <h1 className="display" style={{ marginTop: 6 }}>
          {doneToday ? "That's enough for today." : "Here is exactly what to do."}
        </h1>
      </div>
      <InstallBanner />
      <div className="stats">
        <div className="stat">
          <span className="tiny muted">Streak</span>
          <b>{streak(sessions)}</b>
        </div>
        <div className="stat">
          <span className="tiny muted">This week</span>
          <b>
            {weekCompletions(sessions)}/{profile.daysPerWeek}
          </b>
        </div>
        <div className="stat">
          <span className="tiny muted">Time</span>
          <b>{minutes}m</b>
        </div>
      </div>

      <div className="week">
        {week.map((d) => {
          const day = Number(d.date.slice(-2));
          const isToday = d.date === date;
          const done = sessions.some((s) => s.date === d.date && s.completed);
          return (
            <div key={d.date} className={`week-day ${isToday ? "on" : ""} ${done ? "done" : ""}`}>
              <div className="d">{WEEKDAY_SHORT[d.weekday][0]}</div>
              <div className="n">{day}</div>
              {!d.isRest ? <div className="dot" /> : <div style={{ height: 12 }} />}
            </div>
          );
        })}
      </div>

      <section className="card card-hero stack">
        <div className="spread">
          <span className="badge">{title}</span>
          {planned.isRest ? <span className="rest-pill">Rest is training</span> : null}
        </div>
        <h2 className="display" style={{ fontSize: 28 }}>
          {workout.name.split("·")[0].trim()}
        </h2>
        <p className="lede">{workout.what}</p>
        <div className="chips">
          <span className="chip">{workout.durationMin} min</span>
          <span className="chip">{location === "home" ? "Home" : "Gym"}</span>
          <span className="chip">{countWorkingSets(workout)} working sets</span>
        </div>
        <p className="tiny muted">
          <strong>Where · </strong>
          {workoutWhere(workout)}
        </p>
        {uniqueEquipment(workout).length ? (
          <p className="tiny muted">
            <strong>Bring · </strong>
            {uniqueEquipment(workout).map((e) => EQUIPMENT_LABELS[e]).join(", ")}
          </p>
        ) : (
          <p className="tiny muted">
            <strong>Bring · </strong>just you, and a little floor
          </p>
        )}

        {doneToday ? (
          <Link className="btn btn-ghost btn-block" to="/progress">
            See the log
          </Link>
        ) : (
          <button
            className="btn btn-primary btn-block"
            onClick={() => {
              tap();
              navigate("/preview");
            }}
          >
            {planned.isRest ? "Open rest options" : "Start this workout"}
          </button>
        )}
      </section>

      <section className="stack">
        <p className="tiny muted">Tune today without rewriting the week</p>
        <div>
          <p className="tiny" style={{ marginBottom: 8 }}>
            Energy
          </p>
          <div className="chips">
            {(["low", "good", "high"] as const).map((id) => (
              <button
                key={id}
                className={`chip ${energy === id ? "chip-on" : ""}`}
                onClick={() => setEnergy(isoDate(), id)}
              >
                {id === "low" ? "Low" : id === "good" ? "Good" : "High"}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="tiny" style={{ marginBottom: 8 }}>
            Time
          </p>
          <div className="chips">
            {([20, 30, 45] as const).map((n) => (
              <button
                key={n}
                className={`chip ${minutes === n ? "chip-on" : ""}`}
                onClick={() => setTodayMinutes(isoDate(), n)}
              >
                {n} min
              </button>
            ))}
          </div>
        </div>
        {profile.location === "both" || true ? (
          <div>
            <p className="tiny" style={{ marginBottom: 8 }}>
              Place
            </p>
            <div className="chips">
              {(["home", "gym"] as const).map((id) => (
                <button
                  key={id}
                  className={`chip ${location === id ? "chip-on" : ""}`}
                  onClick={() => setTodayLocation(isoDate(), id)}
                >
                  {id === "home" ? "Home" : "Gym"}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        {energy === "low" && !planned.isRest ? (
          <p className="tiny muted">
            Low energy selected — today's session is a 15-minute glute activation,
            not a skip.
          </p>
        ) : null}
      </section>
      <p className="tiny muted">
        This week: {week.filter((d) => !d.isRest).map((d) => SESSION_LABELS[d.kind]).join(" · ")}
      </p>
    </div>
  );
}
