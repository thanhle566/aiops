import { auth } from "@/auth";
import { SetSentryUser } from "../navbar/SetSentryUser";
import { ServerSidebarClientWrapper } from "./server-sidebar-client-wrapper";

export default async function ServerSidebar({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <>
      <ServerSidebarClientWrapper session={session}>
        {children}
      </ServerSidebarClientWrapper>
      <SetSentryUser session={session} />
    </>
  );
}