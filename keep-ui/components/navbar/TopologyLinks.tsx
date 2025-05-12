"use client";

import { Subtitle } from "@tremor/react";
import { LinkWithIcon } from "components/LinkWithIcon";
import { Disclosure } from "@headlessui/react";
import { ChevronsUpDown, Cable, Workflow } from "lucide-react";
import clsx from "clsx";
import { useTopology } from "@/app/(keep)/topology/model/useTopology";

export const TopologyLinks = ({ isSidebarOpen }: { isSidebarOpen: boolean }) => {
  const { topologyData } = useTopology();

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
              <Cable
                size={18}
                aria-label={!isSidebarOpen ? "Topology" : undefined}
                className="text-white"
              />
              {isSidebarOpen && (
                <Subtitle className="text-xs font-medium uppercase tracking-wide text-white">
                  TOPOLOGY
                </Subtitle>
              )}
            </div>
            {isSidebarOpen && (
              <ChevronsUpDown
                className={clsx("mr-2 text-white transition-transform duration-300", {
                  "rotate-180": open,
                })}
              />
            )}
          </Disclosure.Button>

          <Disclosure.Panel as="ul" className="space-y-2 p-2 pr-4 bg-[#1E2D2F]">
            <li>
              <LinkWithIcon
                href="/workflows"
                icon={Workflow}
                tooltip={!isSidebarOpen ? "Workflows" : undefined}
              >
                {isSidebarOpen && <Subtitle className="text-white">Workflows</Subtitle>}
              </LinkWithIcon>
            </li>
            <li>
              <LinkWithIcon
                href="/topology"
                icon={Cable}
                isBeta={isSidebarOpen && (!topologyData || topologyData.length === 0)}
                count={topologyData?.length === 0 ? undefined : topologyData?.length}
                tooltip={!isSidebarOpen ? "Service Topology" : undefined}
              >
                {isSidebarOpen && <Subtitle className="text-white">Service Topology</Subtitle>}
              </LinkWithIcon>
            </li>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
}; 