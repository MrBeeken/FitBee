import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Logo } from "../components/Logo";
import type { Equipment, Level, Profile } from "../data/types";
import { EQUIPMENT_LABELS } from "../data/types";
import { defaultPreferredDays } from "../lib/planner";
import { tap } from "../lib/haptics";
import { defaultProfile, useAppStore } from "../store/useAppStore";

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

const DAYS = [
  { n: 0, l: "S" },
  { n: 1, l: "M" },
  { n: 2, l: "T" },
  { n: 3, l: "W" },
  { n: 4, l: "T" },
  { n: 5, l: "F" },
  { n: 6, l: "S" },
];

export function Onboarding() {
  const complete = useAppStore((s) => s.completeOnboarding);
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Omit<Profile, "onboarded">>(defaultProfile);

  const next = () => {
    tap();
    setStep((s) => s + 1);
  };

  const finish = () => {
    tap();
    complete({
      ...draft,
      preferredDays:
        draft.preferredDays.length === draft.daysPerWeek
          ? draft.preferredDays
          : defaultPreferredDays(draft.daysPerWeek),
    });
    navigate("/", { replace: true });
  };

  return (
    <div className="app">
      <div className="page page-flush stack" style={{ paddingTop: 36 }}>
        <div className="row">
          <Logo />
          <span className="kicker">FitBee</span>
        </div>
        {step === 0 && (
          <>
            <h1 className="display">You do not have to invent a workout.</h1>
            <p className="lede">
              FitBee tells you what to do, when to do it, where to stand, and how
              to move. Glutes and legs get first dibs. Upper body and rest still
              get a real place in the week.
            </p>
            <button className="btn btn-primary btn-block" onClick={next}>
              Build my plan
            </button>
          </>
        )}
        {step === 1 && (
          <>
            <h1 className="display">What should I call you?</h1>
            <label className="field">
              <span className="tiny muted">Name</span>
              <input
                autoFocus
                value={draft.name}
                placeholder="Your name"
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </label>
            <button className="btn btn-primary btn-block" onClick={next}>
              Continue
            </button>
          </>
        )}
        {step === 2 && (
          <>
            <h1 className="display">How does training feel right now?</h1>
            <p className="lede">This only changes load and complexity, not whether you get a plan.</p>
            {(
              [
                ["beginner", "Starting fresh", "I want to be shown every step."],
                ["returning", "Coming back", "I remember some of this."],
                ["comfortable", "Comfortable", "I can lift with intent."],
              ] as [Level, string, string][]
            ).map(([id, title, sub]) => (
              <button
                key={id}
                className="card"
                style={{
                  textAlign: "left",
                  borderColor: draft.level === id ? "var(--ink)" : undefined,
                }}
                onClick={() => {
                  setDraft({ ...draft, level: id });
                  next();
                }}
              >
                <strong>{title}</strong>
                <p className="tiny muted">{sub}</p>
              </button>
            ))}
          </>
        )}
        {step === 3 && (
          <>
            <h1 className="display">Where will you train?</h1>
            <div className="chips">
              {(
                [
                  ["home", "Home"],
                  ["gym", "Gym"],
                  ["both", "Both"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  className={`chip ${draft.location === id ? "chip-on" : ""}`}
                  onClick={() => setDraft({ ...draft, location: id })}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="lede">Tap what you actually have. We will swap moves if something is missing.</p>
            <div className="chips">
              {EQUIP_OPTIONS.map((id) => {
                const on = draft.equipment.includes(id);
                return (
                  <button
                    key={id}
                    className={`chip ${on ? "chip-on" : ""}`}
                    onClick={() =>
                      setDraft({
                        ...draft,
                        equipment: on
                          ? draft.equipment.filter((e) => e !== id)
                          : [...draft.equipment, id],
                      })
                    }
                  >
                    {EQUIPMENT_LABELS[id]}
                  </button>
                );
              })}
            </div>
            <button className="btn btn-primary btn-block" onClick={next}>
              Continue
            </button>
          </>
        )}
        {step === 4 && (
          <>
            <h1 className="display">How much time is realistic?</h1>
            <div className="chips">
              {([20, 30, 45] as const).map((n) => (
                <button
                  key={n}
                  className={`chip ${draft.minutes === n ? "chip-on" : ""}`}
                  onClick={() => setDraft({ ...draft, minutes: n })}
                >
                  {n} min
                </button>
              ))}
            </div>
            <p className="lede">Training days this week. Glute/leg days land first.</p>
            <div className="chips">
              {([3, 4, 5] as const).map((n) => (
                <button
                  key={n}
                  className={`chip ${draft.daysPerWeek === n ? "chip-on" : ""}`}
                  onClick={() =>
                    setDraft({
                      ...draft,
                      daysPerWeek: n,
                      preferredDays: defaultPreferredDays(n),
                    })
                  }
                >
                  {n} days
                </button>
              ))}
            </div>
            <div className="chips">
              {DAYS.map((d) => {
                const on = draft.preferredDays.includes(d.n);
                return (
                  <button
                    key={d.n}
                    className={`chip ${on ? "chip-on" : ""}`}
                    onClick={() => {
                      const nextDays = on
                        ? draft.preferredDays.filter((x) => x !== d.n)
                        : [...draft.preferredDays, d.n];
                      setDraft({
                        ...draft,
                        preferredDays: nextDays,
                        daysPerWeek: Math.min(5, Math.max(3, nextDays.length)) as 3 | 4 | 5,
                      });
                    }}
                  >
                    {d.l}
                  </button>
                );
              })}
            </div>
            <button className="btn btn-primary btn-block" onClick={next}>
              Continue
            </button>
          </>
        )}
        {step === 5 && (
          <>
            <h1 className="display">Anything we should work around?</h1>
            <p className="lede">Optional. We will swap lunges, jumps, or heavy hinges if you tap these.</p>
            <button
              className={`chip ${draft.kneeSensitive ? "chip-on" : ""}`}
              onClick={() => setDraft({ ...draft, kneeSensitive: !draft.kneeSensitive })}
            >
              Knees are fussy
            </button>{" "}
            <button
              className={`chip ${draft.backSensitive ? "chip-on" : ""}`}
              onClick={() => setDraft({ ...draft, backSensitive: !draft.backSensitive })}
            >
              Low back is fussy
            </button>
            <div className="card">
              <p className="tiny muted">Your default week</p>
              <h2 className="display" style={{ fontSize: 26, marginTop: 6 }}>
                {draft.daysPerWeek} days · {draft.minutes} min
              </h2>
              <p className="lede" style={{ marginTop: 8 }}>
                Glute strength, a lighter upper-body day, then legs again. Rest is
                part of the plan, not a failure.
              </p>
            </div>
            <button className="btn btn-primary btn-block" onClick={finish}>
              Show me today
            </button>
          </>
        )}
      </div>
    </div>
  );
}
