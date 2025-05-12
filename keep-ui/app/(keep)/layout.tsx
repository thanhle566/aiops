import { ReactNode } from "react";
import { NextAuthProvider } from "../auth-provider";
import { Mulish } from "next/font/google";
import { ToastContainer } from "react-toastify";
// import AdminSidebar from "@/components/admin/AdminSidebar";
// import AdminHeader from "@/components/admin/AdminHeader";
import { TopologyPollingContextProvider } from "@/app/(keep)/topology/model/TopologyPollingContext";
import { FrigadeProvider } from "../frigade-provider";
import { getConfig } from "@/shared/lib/server/getConfig";
import { ConfigProvider } from "../config-provider";
import { PHProvider } from "../posthog-provider";
import ReadOnlyBanner from "@/components/banners/read-only-banner";
import { auth } from "@/auth";
import { ThemeScript, WatchUpdateTheme } from "@/shared/ui";
import "@/app/globals.css";
import "@/app/theme-colors.css";
import "@/app/tremor-overrides.css";
import "@/app/dark-inputs.css";
import "react-toastify/dist/ReactToastify.css";
import { PostHogPageView } from "@/shared/ui/PostHogPageView";
import ServerSidebar from "@/components/layout/server-sidebar";

// If loading a variable font, you don't need to specify the font weight
const mulish = Mulish({
  subsets: ["latin"],
  display: "swap",
});

type RootLayoutProps = {
  children: ReactNode;
};

export default async function RootLayout({ children }: RootLayoutProps) {
  const config = getConfig();
  const session = await auth();
  return (
    <html lang="en" className={`bg-gray-50 ${mulish.className}`}>
      <link rel="icon" href="/static/favicons/favicon.ico" />
      <link rel="apple-touch-icon" sizes="180x180" href="/static/favicons/apple-touch-icon.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/static/favicons/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/static/favicons/favicon-16x16.png" />
      <link rel="manifest" href="/static/favicons/site.webmanifest" />
      <body className="h-screen flex flex-col" suppressHydrationWarning={true}>
        {/* ThemeScript must be the first thing to avoid flickering */}
        <ThemeScript />
        <ConfigProvider config={config}>
          <PHProvider>
            <NextAuthProvider session={session}>
              <TopologyPollingContextProvider>
                <FrigadeProvider>
                  {/* @ts-ignore-error Server Component */}
                  <PostHogPageView />
                  <ServerSidebar>{children}</ServerSidebar>
                </FrigadeProvider>
              </TopologyPollingContextProvider>
            </NextAuthProvider>
          </PHProvider>
        </ConfigProvider>
        <WatchUpdateTheme />
      </body>
    </html>
  );
}