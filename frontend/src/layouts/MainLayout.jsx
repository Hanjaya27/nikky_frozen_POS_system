import { Outlet } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

function MainLayout() {
  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />

      <main className="min-w-0 flex-1">
        <div className="h-screen overflow-y-auto">
          <div className="p-6">
            <Topbar />

            <div className="pb-6">
              <Outlet />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default MainLayout;