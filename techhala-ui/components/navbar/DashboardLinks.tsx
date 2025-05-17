"use client";

import {
  DndContext,
  useSensor,
  useSensors,
  PointerSensor,
  TouchSensor,
  rectIntersection,
} from "@dnd-kit/core";
import { arrayMove, SortableContext } from "@dnd-kit/sortable";
import { usePathname, useRouter } from "next/navigation";
import { Subtitle, Button, Badge, Text } from "@tremor/react";
import { Disclosure } from "@headlessui/react";
import { ChevronsUpDown, BarChart3, PlusCircle } from "lucide-react";
import clsx from "clsx";
import { useDashboards } from "utils/hooks/useDashboards";
import { useApi } from "@/shared/lib/hooks/useApi";
import { PlusIcon } from "@radix-ui/react-icons";
import { DashboardLink } from "./DashboardLink";

type DashboardLinksProps = {
  isSidebarOpen: boolean;
};

export const DashboardLinks = ({ isSidebarOpen }: DashboardLinksProps) => {
  const { dashboards = [], isLoading, error, mutate } = useDashboards();
  const api = useApi();
  const router = useRouter();
  const pathname = usePathname();

  const dashboardsArray = Array.isArray(dashboards) ? dashboards : [];

  const sensors = useSensors(useSensor(PointerSensor), useSensor(TouchSensor));

  const onDragEnd = (event: any) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = dashboardsArray.findIndex((d) => d.id === active.id);
      const newIndex = dashboardsArray.findIndex((d) => d.id === over.id);
      const newDashboards = arrayMove(dashboardsArray, oldIndex, newIndex);
      mutate(newDashboards, false);
    }
  };

  const deleteDashboard = async (id: string) => {
    const confirmDelete = confirm("You are about to delete this dashboard. Are you sure?");
    if (!confirmDelete) return;

    try {
      await api.delete(`/dashboard/${id}`);
      mutate(dashboardsArray.filter((d) => d.id !== id), false);

      if (dashboardsArray.length > 0) {
        router.push(`/dashboard/${encodeURIComponent(dashboardsArray[0].dashboard_name)}`);
      } else {
        router.push("/");
      }
    } catch (error) {
      console.error("Error deleting dashboard:", error);
    }
  };

  const generateUniqueName = (baseName: string): string => {
    let uniqueName = baseName;
    let counter = 1;
    while (
      dashboardsArray.some((d) => d.dashboard_name.toLowerCase() === uniqueName.toLowerCase())
    ) {
      uniqueName = `${baseName}(${counter})`;
      counter++;
    }
    return uniqueName;
  };

  const handleCreateDashboard = () => {
    const uniqueName = generateUniqueName("My Dashboard");
    router.push(`/dashboard/${encodeURIComponent(uniqueName)}`);
  };

  return (
    <Disclosure as="div" className="space-y-1" defaultOpen>
      {({ open }) => (
        <>
          <Disclosure.Button
            className={clsx(
              "w-full h-12 flex items-center px-2 text-white hover:bg-[#3a5a5b] rounded transition group",
              { "justify-between": isSidebarOpen, "justify-center": !isSidebarOpen }
            )}
          >
            <div className="flex items-center gap-2">
              <BarChart3
                size={18}
                aria-label={!isSidebarOpen ? "Dashboards" : undefined}
                className="text-white"
              />
              {isSidebarOpen && (
                <Subtitle className="text-xs font-medium uppercase tracking-wide text-white">
                  Dashboards
                </Subtitle>
              )}
            </div>

            {isSidebarOpen && (
              <div className="flex items-center">
                {/* <Badge color="white" size="xs" className={clsx(
                  "ml-2 mr-2",
                  !isSidebarOpen && "hidden"
                )}>
                  Beta
                </Badge> */}
                <ChevronsUpDown
                  className={clsx("mr-2 text-white transition-transform duration-300", {
                    "rotate-180": open,
                  })}
                />
              </div>
            )}
          </Disclosure.Button>

          <Disclosure.Panel as="ul" className="space-y-2 overflow-auto p-2 pr-4 bg-[#1E2D2F]">
            <DndContext
              sensors={sensors}
              collisionDetection={rectIntersection}
              onDragEnd={onDragEnd}
            >
              <SortableContext items={dashboardsArray.map((d) => d.id)}>
                {dashboardsArray.length > 0 ? (
                  dashboardsArray.map((dashboard) => (
                    <DashboardLink
                      key={dashboard.id}
                      dashboard={dashboard}
                      pathname={pathname}
                      deleteDashboard={deleteDashboard}
                      titleClassName="max-w-[150px] overflow-hidden overflow-ellipsis"
                    // tooltip={!isSidebarOpen ? dashboard.dashboard_name : undefined}
                    />
                  ))
                ) : (
                  <Text className={clsx(
                    "text-xs max-w-[200px] px-2 text-white",
                    !isSidebarOpen && "hidden"
                  )}>
                    Dashboards will appear here when saved.
                  </Text>
                )}
              </SortableContext>
            </DndContext>

            {isSidebarOpen && (
              <Button
                size="xs"
                variant="secondary"
                className={clsx(
                  "h-5 text-white border border-white",
                  isSidebarOpen ? "mx-1" : "mx-1 p-1 min-w-0"
                )}
                onClick={handleCreateDashboard}
                icon={PlusIcon}
                tooltip={!isSidebarOpen ? "Add Dashboard" : undefined}
              >
                {isSidebarOpen && "Add Dashboard"}
              </Button>
            )}

          </Disclosure.Panel>
          <Disclosure.Panel as="ul" className="space-y-2 overflow-auto">
            {!isSidebarOpen && (
              <Disclosure.Button
                className={clsx(
                  "w-full h-12 flex items-center px-2 text-white hover:bg-[#3a5a5b] rounded transition group",
                  { "justify-between": isSidebarOpen, "justify-center": !isSidebarOpen }
                )}
                onClick={handleCreateDashboard}              
              >
                <div className="flex items-center gap-2">
                  <PlusCircle
                    size={18}
                    aria-label={!isSidebarOpen ? "Add Dashboard" : undefined}
                    className="text-white"
                  />
                </div>

              </Disclosure.Button>
            )}
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
};
