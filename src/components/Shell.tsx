import { Outlet } from "react-router-dom";
import { BottomNav } from "./BottomNav";

export function Shell() {
  return (
    <div className="app">
      <Outlet />
      <BottomNav />
    </div>
  );
}
