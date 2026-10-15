import { useEffect } from "react";
import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { Shell } from "./components/Shell";
import { ExerciseDetail } from "./pages/ExerciseDetail";
import { Library } from "./pages/Library";
import { Onboarding } from "./pages/Onboarding";
import { Plan } from "./pages/Plan";
import { Progress } from "./pages/Progress";
import { Settings } from "./pages/Settings";
import { Today } from "./pages/Today";
import { WorkoutPlayer } from "./pages/WorkoutPlayer";
import { WorkoutPreview } from "./pages/WorkoutPreview";
import { useAppStore } from "./store/useAppStore";

function useTheme() {
  const theme = useAppStore((s) => s.profile.theme);
  useEffect(() => {
    const root = document.documentElement;
    const apply = (dark: boolean) => {
      root.dataset.theme = dark ? "dark" : "light";
    };
    if (theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      apply(mq.matches);
      const onChange = () => apply(mq.matches);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    }
    apply(theme === "dark");
  }, [theme]);
}

function Gate() {
  const onboarded = useAppStore((s) => s.profile.onboarded);
  const location = useLocation();
  if (!onboarded && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }
  if (onboarded && location.pathname === "/onboarding") {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}

export default function App() {
  useTheme();
  return (
    <div className="device">
      <Routes>
        <Route element={<Gate />}>
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/play" element={<WorkoutPlayer />} />
          <Route element={<Shell />}>
            <Route path="/" element={<Today />} />
            <Route path="/plan" element={<Plan />} />
            <Route path="/library" element={<Library />} />
            <Route path="/library/:id" element={<ExerciseDetail />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/you" element={<Settings />} />
            <Route path="/preview" element={<WorkoutPreview />} />
          </Route>
        </Route>
      </Routes>
    </div>
  );
}
