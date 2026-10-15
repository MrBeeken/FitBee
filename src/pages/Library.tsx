import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { EXERCISES } from "../data/exercises";
import type { MuscleGroup } from "../data/types";
import { MUSCLE_LABELS } from "../data/types";
import { useAppStore } from "../store/useAppStore";

const FILTERS: { id: "all" | "fav" | MuscleGroup; label: string }[] = [
  { id: "all", label: "All" },
  { id: "fav", label: "Saved" },
  { id: "glutes", label: "Glutes" },
  { id: "quads", label: "Quads" },
  { id: "hamstrings", label: "Hamstrings" },
  { id: "core", label: "Core" },
  { id: "back", label: "Back" },
  { id: "chest", label: "Upper" },
  { id: "mobility", label: "Mobility" },
];

export function Library() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const favorites = useAppStore((s) => s.favorites);

  const list = useMemo(() => {
    const query = q.trim().toLowerCase();
    return EXERCISES.filter((ex) => {
      if (filter === "fav" && !favorites.includes(ex.id)) return false;
      if (filter !== "all" && filter !== "fav") {
        if (filter === "chest") {
          if (!["chest", "shoulders", "arms"].some((m) => ex.muscles.includes(m as MuscleGroup))) {
            return false;
          }
        } else if (!ex.muscles.includes(filter)) return false;
      }
      if (!query) return true;
      return (
        ex.name.toLowerCase().includes(query) ||
        ex.where.toLowerCase().includes(query) ||
        ex.muscles.some((m) => MUSCLE_LABELS[m].toLowerCase().includes(query))
      );
    });
  }, [q, filter, favorites]);

  return (
    <div className="page stack">
      <p className="kicker">Move library</p>
      <h1 className="display">How, not just what.</h1>
      <input
        className="search"
        placeholder="Search a move, a room, a muscle"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <div className="chips">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            className={`chip ${filter === f.id ? "chip-on" : ""}`}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div>
        {list.map((ex) => (
          <Link key={ex.id} to={`/library/${ex.id}`} className="list-row">
            <div style={{ flex: 1 }}>
              <strong>{ex.name}</strong>
              <p className="tiny muted">{ex.where}</p>
            </div>
            <span className="tiny muted">{ex.defaultReps}</span>
          </Link>
        ))}
        {list.length === 0 ? <p className="lede">Nothing matches. Try glutes, sofa, or band.</p> : null}
      </div>
    </div>
  );
}
