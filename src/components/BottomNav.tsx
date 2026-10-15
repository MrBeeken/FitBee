import { NavLink } from "react-router-dom";

const items = [
  { to: "/", label: "Today", icon: TodayIcon },
  { to: "/plan", label: "Plan", icon: PlanIcon },
  { to: "/library", label: "Moves", icon: MovesIcon },
  { to: "/progress", label: "Log", icon: LogIcon },
  { to: "/you", label: "You", icon: YouIcon },
];

export function BottomNav() {
  return (
    <nav className="nav">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === "/"}
          className={({ isActive }) => (isActive ? "active" : undefined)}
        >
          <item.icon />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}

function TodayIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 21s-7-4.4-7-10a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 5.6-7 10-7 10Z" />
    </svg>
  );
}
function PlanIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M8 3v4M16 3v4M4 10h16" />
    </svg>
  );
}
function MovesIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M7 17c2-6 4-9 5-13 1 4 3 7 5 13" />
      <path d="M8 13h8" />
    </svg>
  );
}
function LogIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M5 19V5M5 19l5-6 4 3 5-8" />
    </svg>
  );
}
function YouIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="8" r="3" />
      <path d="M5 19c1.5-3 4-4.5 7-4.5S17.5 16 19 19" />
    </svg>
  );
}
