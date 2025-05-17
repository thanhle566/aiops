"use client";

import { useState } from "react";
import { Session } from "next-auth";
import AdminHeader from "./admin-header";
import AdminSidebar from "./admin-sidebar";

export function ServerSidebarClientWrapper({
  session,
  children,
}: {
  session: Session | null;
  children?: React.ReactNode;
}) {
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col mt-11">
      <div className="fixed top-0 left-0 right-0 z-50">
        <AdminHeader
          title="TechHala"
          session={session}
        />
      </div>

      <div className="flex flex-1 pt-1">
        <div className="fixed top-12 bottom-0 z-40">
          <AdminSidebar
            isOpen={isSidebarOpen}
            onToggle={() => setSidebarOpen((p) => !p)}
            session={session}
          />
        </div>

        <main
          style={{
            height: "calc(100vh - 40px)",
          }}
          className={`flex-1 overflow-y-auto bg-gray-100 p-4 ${
            isSidebarOpen ? "ml-64" : "ml-16"
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}