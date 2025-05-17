"use client";

import { LinkWithIcon } from "components/LinkWithIcon";
import { Session } from "next-auth";
import { useConfig } from "utils/hooks/useConfig";
import { VscDebugDisconnect } from "react-icons/vsc";
import * as Frigade from "@frigade/react";
import { useState } from "react";
import Onboarding from "./Onboarding";
import { FaSlack } from "react-icons/fa";
import { ThemeControl } from "@/shared/ui";
import { HiOutlineDocumentText } from "react-icons/hi2";
import { useMounted } from "@/shared/lib/hooks/useMounted";
import UserDropdown from "./UserDropdown";
import "./frigade-overrides.css";
import { FiExternalLink } from "react-icons/fi";
import { MockDataToggle } from "./MockDataToggle";

const ONBOARDING_FLOW_ID = "flow_FHDz1hit";

type UserInfoProps = {
  session: Session | null;
};

export const UserInfo = ({ session }: UserInfoProps) => {
  const { data: config } = useConfig();

  const docsUrl = config?.KEEP_DOCS_URL || "https://docs.techhala.com";
  const { flow } = Frigade.useFlow(ONBOARDING_FLOW_ID);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const isMounted = useMounted();

  return (
    <div className="flex flex-col justify-end items-center md:items-end space-y-1">
      <ul className="space-y-2 p-2">
        {isMounted &&
          !config?.FRIGADE_DISABLED &&
          flow?.isCompleted === false && (
            <li>
              <Frigade.ProgressBadge
                className="get-started-badge"
                flowId={ONBOARDING_FLOW_ID}
                onClick={() => setIsOnboardingOpen(true)}
              />
              <Onboarding
                isOpen={isOnboardingOpen}
                toggle={() => setIsOnboardingOpen(false)}
                variables={{
                  name: session?.user?.name ?? session?.user?.email,
                }}
              />
            </li>
          )}
        <li>
          <LinkWithIcon href="/providers" icon={VscDebugDisconnect}>
            Providers
          </LinkWithIcon>
        </li>
        <li className="flex items-center gap-2">
          <LinkWithIcon
            icon={FaSlack}
            href="https://slack.techhala.com/"
            className="w-auto pr-3.5"
            target="_blank"
          >
            Slack
          </LinkWithIcon>
          <LinkWithIcon
            icon={HiOutlineDocumentText}
            iconClassName="w-4"
            href={docsUrl}
            className="w-auto px-3.5"
            target="_blank"
          >
            Docs
          </LinkWithIcon>
        </li>
        <div className="flex items-center justify-between">
          {session && (
            <div className="flex flex-col items-start w-full gap-2">
              <UserDropdown session={session} />
              <MockDataToggle />
            </div>
          )}
          <ThemeControl className="text-sm size-10 flex items-center justify-center font-medium rounded-lg focus:ring focus:ring-primary/30 hover:!bg-stone-200/50" />
        </div>
      </ul>
    </div>
  );
};
