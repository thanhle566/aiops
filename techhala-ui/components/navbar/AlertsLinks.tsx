"use client";

import { useState } from "react";
import { Button, Subtitle, Callout } from "@tremor/react";
import { LinkWithIcon } from "components/LinkWithIcon";
import { CustomPresetAlertLinks } from "components/navbar/CustomPresetAlertLinks";
import { AlertCircle, Tags, ChevronsUpDown, RotateCcw } from "lucide-react";
import { Disclosure } from "@headlessui/react";
import { Session } from "next-auth";
import Modal from "@/components/ui/Modal";
import CreatableMultiSelect from "@/components/ui/CreatableMultiSelect";
import { useLocalStorage } from "utils/hooks/useLocalStorage";
import { ActionMeta, MultiValue } from "react-select";
import { useTags } from "utils/hooks/useTags";
import { usePresets } from "@/entities/presets/model/usePresets";
import { useMounted } from "@/shared/lib/hooks/useMounted";
import clsx from "clsx";
import { useAlerts } from "@/utils/hooks/useAlerts";
import { SwitchIcon } from "@radix-ui/react-icons";
import { IconType } from "react-icons/lib/iconBase";

type AlertsLinksProps = {
  session: Session | null;
  isSidebarOpen: boolean;
};

export const AlertsLinks = ({ session, isSidebarOpen }: AlertsLinksProps) => {
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const isMounted = useMounted();
  const { useLastAlerts } = useAlerts();

  const [storedTags, setStoredTags] = useLocalStorage<string[]>("selectedTags", []);
  const [tempSelectedTags, setTempSelectedTags] = useState<string[]>(storedTags);

  const { data: tagsData = [] } = useTags();
  const tags = Array.isArray(tagsData) ? tagsData : [];

  const { staticPresets, error: staticPresetsError } = usePresets({
    revalidateIfStale: true,
    revalidateOnFocus: true,
  });

  const handleTagSelect = (
    newValue: MultiValue<{ value: string; label: string }>,
    actionMeta: ActionMeta<{ value: string; label: string }>
  ) => {
    setTempSelectedTags(newValue.map((tag) => tag.value));
  };

  const handleApplyTags = () => {
    setStoredTags(tempSelectedTags);
    setIsTagModalOpen(false);
  };

  const handleOpenModal = () => {
    setTempSelectedTags(storedTags);
    setIsTagModalOpen(true);
  };

  const shouldShowFeed = (() => {
    if (!isMounted || (!staticPresets && !staticPresetsError)) return true;
    return staticPresets?.some((preset) => preset.name === "feed");
  })();

  const { isLoading: isAsyncLoading, totalCount: feedAlertsTotalCount } = useLastAlerts({
    cel: shouldShowFeed ? undefined : "",
    limit: 20,
    offset: 0,
  });

  return (
    <>
      <Disclosure as="div" className="space-y-1" defaultOpen>
        {({ open }) => (
          <>
            <Disclosure.Button
              className={clsx(
                "w-full h-12 flex items-center px-2 text-white hover:bg-[#3a5a5b] rounded transition group",
                { "justify-between": isSidebarOpen, "justify-center": !isSidebarOpen }
              )}
            >
              <div className="flex items-center gap-2 relative group">
                <AlertCircle
                  size={18}
                  className="text-white"
                />
                {isSidebarOpen && (
                  <Subtitle className="text-xs font-medium uppercase tracking-wide text-white">
                    Alerts
                  </Subtitle>
                )}
                {isSidebarOpen && (
                  <Tags
                    className={clsx(
                      "ml-1 cursor-pointer text-gray-400 transition-opacity",
                      {
                        "opacity-100 text-white": storedTags.length > 0,
                        "opacity-50 group-hover:opacity-100": storedTags.length === 0,
                      }
                    )}
                    size={16}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenModal();
                    }}
                  />
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

            <Disclosure.Panel as="ul" className="space-y-2 p-2 overflow-auto bg-[#1E2D2F]">
              {shouldShowFeed && (
                <li>
                  <LinkWithIcon
                    href="/alerts/feed"
                    icon={RotateCcw}
                    count={isSidebarOpen ? feedAlertsTotalCount : undefined}
                    testId="menu-alerts-feed"
                    tooltip={!isSidebarOpen ? "Feed" : undefined}
                  >
                    {isSidebarOpen && <Subtitle className="text-white">Feed</Subtitle>}
                  </LinkWithIcon>
                </li>
              )}
              <CustomPresetAlertLinks selectedTags={storedTags} />
            </Disclosure.Panel>
          </>
        )}
      </Disclosure>

      <Modal
        isOpen={isTagModalOpen}
        onClose={() => setIsTagModalOpen(false)}
        className="w-[30%] max-w-screen-2xl max-h-[710px] transform overflow-auto ring-tremor bg-white p-6 text-left align-middle shadow-tremor transition-all"
      >
        <div className="space-y-2">
          <Subtitle className="text-white">Select tags to watch</Subtitle>
          <Callout title=""  color="red">
            Customize your presets list by watching specific tags.
          </Callout>
          <CreatableMultiSelect
            value={tempSelectedTags.map((tag) => ({
              value: tag,
              label: tag,
            }))}
            onChange={handleTagSelect}
            options={tags.map((tag) => ({
              value: tag.name,
              label: tag.name,
            }))}
            placeholder="Select or create tags"
            className="mt-4"
          />
          <div className="flex justify-end space-x-2.5">
            <Button
              size="lg"
              variant="secondary"
              className="btn-primary"
              onClick={() => setIsTagModalOpen(false)}
              tooltip="Close Modal"
            >
              Close
            </Button>
            <Button
              size="lg"
              className="btn-primary"
              onClick={handleApplyTags}
              tooltip="Apply Tags"
            >
              Apply
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
