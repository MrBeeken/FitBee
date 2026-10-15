import { Logo } from "../components/Logo";
import type { Equipment } from "../data/types";
import { EQUIPMENT_LABELS } from "../data/types";
import { defaultPreferredDays } from "../lib/planner";
import { useAppStore } from "../store/useAppStore";

const EQUIP_OPTIONS: Equipment[] = [
  "bodyweight",
  "mat",
  "dumbbells",
  "bands",
  "bench",
  "kettlebell",
  "box",
  "barbell",
  "cable",
  "machines",
];

const DAYS = ["S", "M", "T", "W", "T", "F", "S"];

export function Settings() {
  const profile = useAppStore((s) => s.profile);
  const update = useAppStore((s) => s.updateProfile);
  const sessions = useAppStore((s) => s.sessions);

  const exportData = () => {
    const blob = new Blob(
      [JSON.stringify({ profile, sessions, exportedAt: new Date().toISOString() }, null, 2)],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "fitbee-log.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    if (!confirm("Clear local FitBee data on this phone?")) return;
    localStorage.removeItem("fitbee-v1");
    window.location.reload();
  };

  return (
    <div className="page stack">
      <div className="row">
        <Logo />
        <div>
          <p className="kicker">You</p>
          <h1 className="display" style={{ fontSize: 28 }}>
            {profile.name || "FitBee"}
          </h1>
        </div>
      </div>
      <label className="field">
        <span className="tiny muted">Name</span>
        <input value={profile.name} onChange={(e) => update({ name: e.target.value })} />
      </label>
      <div>
        <p className="tiny muted">Experience</p>
        <div className="chips" style={{ marginTop: 8 }}>
          {(
            [
              ["beginner", "Starting fresh"],
              ["returning", "Coming back"],
              ["comfortable", "Comfortable"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              className={`chip ${profile.level === id ? "chip-on" : ""}`}
              onClick={() => update({ level: id })}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="tiny muted">Usual place</p>
        <div className="chips" style={{ marginTop: 8 }}>
          {(
            [
              ["home", "Home"],
              ["gym", "Gym"],
              ["both", "Both"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              className={`chip ${profile.location === id ? "chip-on" : ""}`}
              onClick={() => update({ location: id })}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="tiny muted">Equipment</p>
        <div className="chips" style={{ marginTop: 8 }}>
          {EQUIP_OPTIONS.map((id) => {
            const on = profile.equipment.includes(id);
            return (
              <button
                key={id}
                className={`chip ${on ? "chip-on" : ""}`}
                onClick={() =>
                  update({
                    equipment: on
                      ? profile.equipment.filter((e) => e !== id)
                      : [...profile.equipment, id],
                  })
                }
              >
                {EQUIPMENT_LABELS[id]}
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <p className="tiny muted">Session length</p>
        <div className="chips" style={{ marginTop: 8 }}>
          {([20, 30, 45] as const).map((n) => (
            <button
              key={n}
              className={`chip ${profile.minutes === n ? "chip-on" : ""}`}
              onClick={() => update({ minutes: n })}
            >
              {n} min
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="tiny muted">Training days</p>
        <div className="chips" style={{ marginTop: 8 }}>
          {DAYS.map((label, n) => {
            const on = profile.preferredDays.includes(n);
            return (
              <button
                key={`${label}-${n}`}
                className={`chip ${on ? "chip-on" : ""}`}
                onClick={() => {
                  const preferredDays = on
                    ? profile.preferredDays.filter((d) => d !== n)
                    : [...profile.preferredDays, n];
                  const daysPerWeek = Math.min(5, Math.max(3, preferredDays.length)) as 3 | 4 | 5;
                  update({ preferredDays, daysPerWeek });
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
        <button
          className="btn-quiet tiny"
          onClick={() =>
            update({
              daysPerWeek: 4,
              preferredDays: defaultPreferredDays(4),
            })
          }
        >
          Reset to Mon / Tue / Thu / Sat
        </button>
      </div>
      <div className="chips">
        <button
          className={`chip ${profile.kneeSensitive ? "chip-on" : ""}`}
          onClick={() => update({ kneeSensitive: !profile.kneeSensitive })}
        >
          Knees fussy
        </button>
        <button
          className={`chip ${profile.backSensitive ? "chip-on" : ""}`}
          onClick={() => update({ backSensitive: !profile.backSensitive })}
        >
          Back fussy
        </button>
        <button
          className={`chip ${profile.units === "lb" ? "chip-on" : ""}`}
          onClick={() => update({ units: "lb" })}
        >
          lb
        </button>
        <button
          className={`chip ${profile.units === "kg" ? "chip-on" : ""}`}
          onClick={() => update({ units: "kg" })}
        >
          kg
        </button>
      </div>
      <div>
        <p className="tiny muted">Theme</p>
        <div className="chips" style={{ marginTop: 8 }}>
          {(["system", "light", "dark"] as const).map((id) => (
            <button
              key={id}
              className={`chip ${profile.theme === id ? "chip-on" : ""}`}
              onClick={() => update({ theme: id })}
            >
              {id}
            </button>
          ))}
        </div>
      </div>
      <section className="card">
        <p className="tiny muted">On her phone</p>
        <p style={{ marginTop: 8 }}>
          iPhone: open this site in Safari → Share → Add to Home Screen.
        </p>
        <p style={{ marginTop: 8 }}>
          Android: Chrome menu → Add to Home screen / Install app.
        </p>
      </section>
      <button className="btn btn-ghost" onClick={exportData}>
        Export log
      </button>
      <button className="btn btn-ghost" onClick={reset}>
        Reset this device
      </button>
      <p className="tiny muted">
        FitBee keeps everything on this phone. No account, no feed, no streak
        shame. Rest days count when you mark them.
      </p>
    </div>
  );
}
