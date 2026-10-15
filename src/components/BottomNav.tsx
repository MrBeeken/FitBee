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
      <circle cx="12" cy="12" r="3.4" />
      <path d="M12 3v2.2M12 18.8V21M3 12h2.2M18.8 12H21M5.6 5.6l1.6 1.6M16.8 16.8l1.6 1.6M5.6 18.4l1.6-1.6M16.8 7.2l1.6-1.6" />
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
      <path d="M5 9v6M19 9v6M8 12h8M3.5 10.5v3M20.5 10.5v3" />
    </svg>
  );
}
function LogIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M6 16V8M11 16v-5M16 16V6" />
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
