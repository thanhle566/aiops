import { auth } from "@/auth";
import { Search } from "@/components/navbar/Search";
import { NoiseReductionLinks } from "@/components/navbar/NoiseReductionLinks";
import { AlertsLinks } from "@/components/navbar/AlertsLinks";
import { UserInfo } from "@/components/navbar/UserInfo";
import { Menu } from "@/components/navbar/Menu";
import { MinimizeMenuButton } from "@/components/navbar/MinimizeMenuButton";
import { DashboardLinks } from "@/components/navbar/DashboardLinks";
import { IncidentsLinks } from "@/components/navbar/IncidentLinks";
import { SetSentryUser } from "./SetSentryUser";
import "./Navbar.css";

export default async function NavbarInner() {
  const session = await auth();
  return (
    <>
      <Menu>
        <div className="flex flex-col h-full bg-[#2C4A4B] navbar-container">
          <Search />
          {/* <SidebarHeader title="Dynatrace Incident Integration" /> */}
          <div className="pt-4 space-y-4 flex-1 overflow-auto scrollable-menu-shadow text-white">
            {/* <IncidentsLinks session={session} />
            <AlertsLinks session={session} />
            <NoiseReductionLinks session={session} />
            <DashboardLinks /> */}
          </div>
        </div>
      </Menu>
      {/* <MinimizeMenuButton /> */}
      <SetSentryUser session={session} />
    </>
  );
}
