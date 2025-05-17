import { Search } from "@/components/navbar/Search";
import { NoiseReductionLinks } from "@/components/navbar/NoiseReductionLinks";
import { AlertsLinks } from "@/components/navbar/AlertsLinks";
import { DashboardLinks } from "@/components/navbar/DashboardLinks";
import { IncidentsLinks } from "@/components/navbar/IncidentLinks";
import { TopologyLinks } from "@/components/navbar/TopologyLinks";
import { Session } from "next-auth";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  isOpen: boolean;
  onToggle: () => void;
  session: Session | null;
}

export default function AdminSidebar({ isOpen, onToggle, session }: Props) {
  return (
    <aside
      className={`transition-all duration-300 bg-[#2C4A4B] text-white h-full flex flex-col ${
        isOpen ? "w-64" : "w-16"
      }`}
    >
      {/* Search + menu */}
      <div className="flex-1 flex flex-col">
        {
          isOpen && (
            <div className="navbar-container">
              <Search />
            </div>
          )
        }
        <div className="py-4 space-y-4 flex-1 overflow-auto scrollable-menu-shadow px-2">
          <div className="overflow-y-auto scrollbar-thin scroll-thin scroll-smooth scrollbar-thumb-rounded scrollbar-thumb-white/30 hover:scrollbar-thumb-white/50" style={{ height: "calc(100vh - 182px)" }}>
            <IncidentsLinks session={session} isSidebarOpen={isOpen} />
            <TopologyLinks isSidebarOpen={isOpen} />
            <AlertsLinks session={session} isSidebarOpen={isOpen} />
            <NoiseReductionLinks session={session} isSidebarOpen={isOpen} />
            <DashboardLinks isSidebarOpen={isOpen} />
          </div>
        </div>
      </div>

      {/* Footer toggle button */}
      <div className="h-12 flex items-center justify-center border-t border-white/10">
        <button
          onClick={onToggle}
          className="flex w-full items-center gap-2 text-white hover:bg-[#3a5a5b] px-3 py-2 justify-center transition duration-200 group"
          aria-label="Toggle Sidebar"
        >
          <span
            className="transition-transform duration-300"
          >
            {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </span>
          {isOpen && (
            <span className="text-sm font-medium text-white">Collapse</span>
          )}
        </button>
      </div>
    </aside>
  );
}
