import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

function MainLayout() {
  return (
    <div className="min-h-screen bg-slate-100 flex">
      <Sidebar />

      <main className="flex-1 p-6">
        <Topbar />
        <Outlet />
      </main>
    </div>
  );
}

export default MainLayout;