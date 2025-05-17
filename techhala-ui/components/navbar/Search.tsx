"use client";

import { ElementRef, Fragment, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon, List, ListItem, TextInput, Subtitle } from "@tremor/react";
import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
  Transition,
} from "@headlessui/react";
import {
  GitHubLogoIcon,
  FileTextIcon,
  TwitterLogoIcon,
} from "@radix-ui/react-icons";
import {
  GlobeAltIcon,
  UserGroupIcon,
  EnvelopeIcon,
  KeyIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { VscDebugDisconnect } from "react-icons/vsc";
import { LuWorkflow } from "react-icons/lu";
import { AiOutlineAlert, AiOutlineGroup } from "react-icons/ai";
import { MdOutlineEngineering, MdOutlineSearchOff } from "react-icons/md";
import { useConfig } from "utils/hooks/useConfig";

const NAVIGATION_OPTIONS = [
  {
    icon: VscDebugDisconnect,
    label: "Go to the providers page",
    shortcut: ["p"],
    navigate: "/providers",
  },
  {
    icon: AiOutlineAlert,
    label: "Go to alert console",
    shortcut: ["g"],
    navigate: "/alerts/feed",
  },
  {
    icon: AiOutlineGroup,
    label: "Go to alert quality",
    shortcut: ["q"],
    navigate: "/alerts/quality",
  },
  {
    icon: MdOutlineEngineering,
    label: "Go to alert groups",
    shortcut: ["g"],
    navigate: "/rules",
  },
  {
    icon: LuWorkflow,
    label: "Go to the workflows page",
    shortcut: ["wf"],
    navigate: "/workflows",
  },
  {
    icon: UserGroupIcon,
    label: "Go to users management",
    shortcut: ["u"],
    navigate: "/settings?selectedTab=users",
  },
  {
    icon: GlobeAltIcon,
    label: "Go to generic webhook",
    shortcut: ["w"],
    navigate: "/settings?selectedTab=webhook",
  },
  {
    icon: EnvelopeIcon,
    label: "Go to SMTP settings",
    shortcut: ["s"],
    navigate: "/settings?selectedTab=smtp",
  },
  {
    icon: KeyIcon,
    label: "Go to API key",
    shortcut: ["a"],
    navigate: "/settings?selectedTab=users&userSubTab=api-keys",
  },
];

export type SearchProps = {
  displayMode?: 'icon-only' | 'full';
};

export const Search = ({ displayMode = 'full' }: SearchProps) => {
  const [query, setQuery] = useState<string>("");
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const router = useRouter();
  const comboboxBtnRef = useRef<ElementRef<"button">>(null);
  const comboboxInputRef = useRef<ElementRef<"input">>(null);
  const { data: configData } = useConfig();
  const docsUrl = configData?.KEEP_DOCS_URL || "https://docs.techhala.com";

  const EXTERNAL_OPTIONS = [
    {
      icon: FileTextIcon,
      label: "TechHala Docs",
      shortcut: ["⇧", "D"],
      navigate: docsUrl,
    },
    {
      icon: GitHubLogoIcon,
      label: "TechHala Source code",
      shortcut: ["⇧", "C"],
      navigate: "https://github.com/techhala",
    },
    {
      icon: TwitterLogoIcon,
      label: "TechHala Twitter",
      shortcut: ["⇧", "T"],
      navigate: "https://twitter.com/techhala",
    },
  ];

  const OPTIONS = [...NAVIGATION_OPTIONS, ...EXTERNAL_OPTIONS];

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (comboboxBtnRef.current) {
          comboboxBtnRef.current.click();
        }
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const onOptionSelection = (value: string | null) => {
    setSelectedOption(value);
    if (value && comboboxInputRef.current) {
      comboboxInputRef.current.blur();
      router.push(value);
    }
  };

  const onLeave = () => {
    setQuery("");
    if (comboboxInputRef.current) {
      comboboxInputRef.current.blur();
    }
  };

  // Thêm hàm để focus vào input khi dropdown mở
  const onComboboxOpen = () => {
    // Sử dụng setTimeout để đảm bảo focus sau khi dropdown đã render
    setTimeout(() => {
      if (comboboxInputRef.current) {
        comboboxInputRef.current.focus();
      }
    }, 10);
  };

  const queriedOptions = query.length
    ? OPTIONS.filter((option) =>
        option.label
          .toLowerCase()
          .replace(/\s+/g, "")
          .includes(query.toLowerCase().replace(/\s+/g, ""))
      )
    : OPTIONS;

  const NoQueriesFoundResult = () => {
    if (query.length && queriedOptions.length === 0) {
      return (
        <ListItem className="flex flex-col items-center justify-center cursor-default select-none px-4 py-2 text-gray-700 h-72">
          <Icon size="xl" icon={MdOutlineSearchOff} />
          Nothing found.
        </ListItem>
      );
    }

    return null;
  };

  const FilteredResults = () => {
    if (query.length && queriedOptions.length) {
      return (
        <>
          {queriedOptions.map((option) => (
            <ComboboxOption
              key={option.label}
              value={option.navigate}
              className="cursor-pointer"
            >
              {({ active }) => (
                <ListItem className="flex items-center justify-start space-x-3 select-none p-2 ui-active:bg-[#243E40] ui-active:text-white ui-not-active:text-gray-900">
                  <Icon
                    className={`py-2 px-0 ${
                      active ? "bg-[#243E40] text-white" : "text-gray-900"
                    }`}
                    icon={option.icon}
                    color="primary"
                  />
                  <span className={`text-left ${active ? 'text-white':''}`}>{option.label}</span>
                </ListItem>
              )}
            </ComboboxOption>
          ))}
        </>
      );
    }

    return null;
  };

  const DefaultResults = () => {
    if (query.length) {
      return null;
    }

    return (
      <ListItem className="flex flex-col">
        <List>
          <ListItem className="pl-2">
            <Subtitle>Navigate</Subtitle>
          </ListItem>
          {NAVIGATION_OPTIONS.map((option) => (
            <ComboboxOption
              key={option.label}
              value={option.navigate}
              className="cursor-pointer"
            >
              {({ active }) => (
                <ListItem className="flex items-center justify-start space-x-3 select-none p-2 ui-active:bg-[#243E40] ui-active:text-white ui-not-active:text-gray-900">
                  <Icon
                    className={`py-2 px-0 ${
                      active ? "bg-[#243E40] text-white" : "text-gray-900"
                    }`}
                    icon={option.icon}
                    color="primary"
                  />
                  <span className={`text-left ${active ? 'text-white':''}`}>{option.label}</span>
                </ListItem>
              )}
            </ComboboxOption>
          ))}
        </List>
        <List>
          <ListItem className="pl-2">
            <Subtitle>External Sources</Subtitle>
          </ListItem>
          {EXTERNAL_OPTIONS.map((option) => (
            <ComboboxOption
              key={option.label}
              value={option.navigate}
              className="cursor-pointer"
            >
              {({ active }) => (
                <ListItem className="flex items-center justify-start space-x-3 cursor-pointer select-none p-2 ui-active:bg-[#243E40] ui-active:text-white ui-not-active:text-gray-900">
                  <Icon
                    className={`py-2 px-0 ${
                      active ? "bg-[#243E40] text-white" : "text-gray-900"
                    }`}
                    icon={option.icon}
                    color="primary"
                  />
                  <span className={`text-left ${active ? 'text-white':''}`}>{option.label}</span>
                </ListItem>
              )}
            </ComboboxOption>
          ))}
        </List>
      </ListItem>
    );
  };

  const isMac = () => {
    const platform = navigator.platform.toLowerCase();
    const userAgent = navigator.userAgent.toLowerCase();
    return (
      platform.includes("mac") ||
      (platform.includes("iphone") && !userAgent.includes("windows"))
    );
  };

  const [placeholderText, setPlaceholderText] = useState("Search");

  // Using effect to avoid mismatch on hydration. TODO: context provider for user agent
  useEffect(function updatePlaceholderText() {
    if (!isMac()) {
      return;
    }
    setPlaceholderText("Search or start with ⌘K");
  }, []);

  // Render icon only mode
  if (displayMode === 'icon-only') {
    return (
      <div className="flex items-center relative">
        <button 
          onClick={() => comboboxBtnRef.current?.click()}
          className="text-white hover:text-gray-200 top-header-icon"
        >
          <MagnifyingGlassIcon className="h-5 w-5" />
        </button>
        
        <Combobox value={selectedOption} onChange={onOptionSelection}>
          {({ open }) => {
            // Focus vào input khi dropdown mở
            if (open) {
              onComboboxOpen();
            }
            
            return (
              <div className="relative">
                <ComboboxButton className="sr-only" ref={comboboxBtnRef} />
                <Transition
                  enter="transition duration-100 ease-out"
                  enterFrom="transform scale-95 opacity-0"
                  enterTo="transform scale-100 opacity-100"
                  leave="transition duration-75 ease-out"
                  leaveFrom="transform scale-100 opacity-100"
                  leaveTo="transform scale-95 opacity-0"
                  afterLeave={onLeave}
                  show={open}
                  as="div"
                >
                  <div className="absolute right-0 top-full mt-1 w-96 rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none overflow-y-auto z-50">
                    <div className="p-2 w-full border-b border-gray-200">
                      <TextInput
                        ref={comboboxInputRef}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={`Filter navigator`}
                        icon={GlobeAltIcon}
                        className="search-input dark-input rounded-full"
                      />
                    </div>
                    <ComboboxOptions className="">
                      <FilteredResults />
                      <DefaultResults />
                      <NoQueriesFoundResult />
                    </ComboboxOptions>
                  </div>
                </Transition>
              </div>
            );
          }}
        </Combobox>
      </div>
    );
  }
  
  // Render full search
  return (
    <div className="flex items-center space-x-3 py-3 px-2 border-b border-[#fff]/30 bg-[#2C4A4B]">
      <div className="p-2 w-full">
        <Combobox value={selectedOption} onChange={onOptionSelection}>
          {({ open }) => {
            // Focus vào input khi dropdown mở
            if (open) {
              onComboboxOpen();
            }
            
            return (
              <div className="relative w-full navbar-search-container">
                <div className="relative w-full">
                  <ComboboxButton className="w-full" ref={comboboxBtnRef}>
                    <TextInput
                      onFocus={() => comboboxBtnRef.current?.click()}
                      ref={comboboxInputRef}
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder={`Filter navigator`}
                      icon={GlobeAltIcon}
                      className="search-input dark-input text-white rounded-full border border-[#34595c]/70 sidebar-search-input bg-[#243E40]/10 focus:border-[#34595c] focus:ring-[#34595c]/40"
                    />
                  </ComboboxButton>
                </div>
                <Transition
                  enter="transition duration-100 ease-out"
                  enterFrom="transform scale-95 opacity-0"
                  enterTo="transform scale-100 opacity-100"
                  leave="transition duration-75 ease-out"
                  leaveFrom="transform scale-100 opacity-100"
                  leaveTo="transform scale-95 opacity-0"
                  afterLeave={onLeave}
                  show={open}
                  as="div"
                >
                  <div className="absolute mt-1 w-full rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none overflow-y-auto z-50">
                    <ComboboxOptions className="">
                      <FilteredResults />
                      <DefaultResults />
                      <NoQueriesFoundResult />
                    </ComboboxOptions>
                  </div>
                </Transition>
              </div>
            );
          }}
        </Combobox>
      </div>
    </div>
  );
};
