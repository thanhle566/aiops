"use client";

import { Subtitle } from "@tremor/react";
import { LinkWithIcon } from "components/LinkWithIcon";
import { Session } from "next-auth";
import { Disclosure } from "@headlessui/react";
import { ChevronsUpDown, AlertTriangle, FlameKindling, Combine, Ruler } from "lucide-react";
import { useIncidents, usePollIncidents } from "utils/hooks/useIncidents";
import clsx from "clsx";
import {
  DEFAULT_INCIDENTS_PAGE_SIZE,
  DEFAULT_INCIDENTS_CEL,
  DEFAULT_INCIDENTS_SORTING,
} from "@/entities/incidents/model/models";

type IncidentsLinksProps = {
  session: Session | null;
  isSidebarOpen: boolean;
};

export const IncidentsLinks = ({ session, isSidebarOpen }: IncidentsLinksProps) => {
  const isNOCRole = session?.userRole === "noc";
  const { data: incidents, mutate } = useIncidents(
    false,
    null,
    DEFAULT_INCIDENTS_PAGE_SIZE,
    0,
    DEFAULT_INCIDENTS_SORTING,
    DEFAULT_INCIDENTS_CEL,
    {}
  );
  usePollIncidents(mutate);

  if (isNOCRole) return null;

  return (
    <Disclosure as="div" className="space-y-1" defaultOpen>
      <Disclosure.Button
        className={clsx(
          "w-full h-12 flex items-center px-2 text-white hover:bg-[#3a5a5b] rounded transition group",
          { "justify-between": isSidebarOpen, "justify-center": !isSidebarOpen }
        )}
      >
        {({ open }) => (
          <>
            <div className="flex items-center gap-2">
              <AlertTriangle 
                size={18} 
                aria-label={!isSidebarOpen ? "Incidents" : undefined} 
                className="text-white" 
              />
              {isSidebarOpen && (
                <Subtitle className="text-xs font-medium uppercase tracking-wide text-white">
                  INCIDENTS
                </Subtitle>
              )}
            </div>
            {isSidebarOpen && (
              <ChevronsUpDown
                className={clsx(
                  "text-white transition-transform duration-300",
                  { "rotate-180": open },
                  "mr-2"
                )}
              />
            )}
          </>
        )}
      </Disclosure.Button>

      <Disclosure.Panel as="ul" className="space-y-2 p-2 relative bg-[#1E2D2F]">
        <li className="relative group">
          <LinkWithIcon
            href="/incidents"
            icon={FlameKindling}
            count={isSidebarOpen ? incidents?.count : undefined}
            tooltip={!isSidebarOpen ? "Incidents" : undefined}
          >
            {isSidebarOpen && (
              <Subtitle className="text-inherit">Incidents</Subtitle>
            )}
          </LinkWithIcon>
        </li>
        <li>
          <LinkWithIcon
            href="/deduplication"
            icon={Combine}
            tooltip={!isSidebarOpen ? "Deduplication" : undefined}
          >
            {isSidebarOpen && <Subtitle className="text-white">Deduplication</Subtitle>}
          </LinkWithIcon>
        </li>
        <li>
          <LinkWithIcon
            href="/rules"
            icon={Ruler}
            tooltip={!isSidebarOpen ? "Correlations" : undefined}
          >
            {isSidebarOpen && <Subtitle className="text-white">Correlations</Subtitle>}
          </LinkWithIcon>
        </li>
      </Disclosure.Panel>
    </Disclosure>
  );
};
