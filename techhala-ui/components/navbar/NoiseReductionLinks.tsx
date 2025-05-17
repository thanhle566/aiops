"use client";

import { Subtitle } from "@tremor/react";
import { LinkWithIcon } from "components/LinkWithIcon";
import { Mapping, Rules, Workflows, ExportIcon } from "components/icons";
import { Session } from "next-auth";
import { Disclosure } from "@headlessui/react";
import { 
  ChevronsUpDown, 
  Sparkles, 
  Combine, 
  Cable, 
  Workflow, 
  CircuitBoard, 
  FileJson, 
  Clock 
} from "lucide-react";
import { useTopology } from "@/app/(keep)/topology/model/useTopology";
import clsx from "clsx";
import { AILink } from "./AILink";

type NoiseReductionLinksProps = {
  session: Session | null;
  isSidebarOpen: boolean;
};

export const NoiseReductionLinks = ({
  session,
  isSidebarOpen,
}: NoiseReductionLinksProps) => {
  const isNOCRole = session?.userRole === "noc";
  const { topologyData } = useTopology();

  if (isNOCRole) return null;

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
              <Sparkles
                size={18}
                aria-label={!isSidebarOpen ? "Noise Reduction" : undefined}
                className="text-white"
              />
              {isSidebarOpen && (
                <Subtitle className="text-xs font-medium uppercase tracking-wide text-white">
                  Noise Reduction
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
                href="/mapping"
                icon={CircuitBoard}
                tooltip={!isSidebarOpen ? "Mapping" : undefined}
              >
                {isSidebarOpen && <Subtitle className="text-white">Mapping</Subtitle>}
              </LinkWithIcon>
            </li>
            <li>
              <LinkWithIcon
                href="/extraction"
                icon={FileJson}
                tooltip={!isSidebarOpen ? "Extraction" : undefined}
              >
                {isSidebarOpen && <Subtitle className="text-white">Extraction</Subtitle>}
              </LinkWithIcon>
            </li>
            <li>
              <LinkWithIcon
                href="/maintenance"
                icon={Clock}
                tooltip={!isSidebarOpen ? "Maintenance Windows" : undefined}
              >
                {isSidebarOpen && <Subtitle className="text-white">Maintenance Windows</Subtitle>}
              </LinkWithIcon>
            </li>
            <li>
              <AILink />
            </li>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
};
