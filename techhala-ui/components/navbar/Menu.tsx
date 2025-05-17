"use client";

import { ReactNode, useEffect } from "react";
import { Popover } from "@headlessui/react";
import { Icon } from "@tremor/react";
import { AiOutlineMenu, AiOutlineClose } from "react-icons/ai";
import { usePathname } from "next/navigation";
import { useLocalStorage } from "utils/hooks/useLocalStorage";
import { useHotkeys } from "react-hotkeys-hook";
import "./navbar-darkmode.css";
import clsx from "clsx";
import { TbChevronCompactRight, TbChevronCompactLeft } from "react-icons/tb";

type CloseMenuOnRouteChangeProps = {
  closeMenu: () => void;
};

const CloseMenuOnRouteChange = ({ closeMenu }: CloseMenuOnRouteChangeProps) => {
  const pathname = usePathname();

  useEffect(() => {
    closeMenu();
  }, [pathname, closeMenu]);

  return null;
};

type MenuButtonProps = {
  children: ReactNode;
};

export const Menu = ({ children }: MenuButtonProps) => {
  const [isMenuMinimized, setisMenuMinimized] = useLocalStorage<boolean>(
    "menu-minimized",
    false
  );

  useHotkeys(
    "[",
    () => {
      // Toggle the state based on its current value
      const newState = !isMenuMinimized;
      console.log(newState ? "Closing menu ([)" : "Opening menu ([)");
      setisMenuMinimized(newState);
    },
    [isMenuMinimized]
  );

  return (
    <Popover>
      {({ close: closeMenu }) => (
        <>
          <div className="p-3 w-full block lg:hidden bg-[#1E2D2F] text-white sidebar-header">
            <Popover.Button className="p-1 hover:bg-[#243E40]/50 font-medium rounded-lg hover:text-white focus:ring focus:ring-primary-300">
              <Icon icon={AiOutlineMenu} color="white" />
            </Popover.Button>
          </div>

          <aside
            className={clsx(
              "bg-[#2C4A4B] col-span-1 border-r border-[#2C4A4B] h-screen hidden lg:block navbar-container fixed left-0 top-16 z-40 transition-all duration-300 overflow-y-auto",
              isMenuMinimized ? "w-16" : "w-64"
            )}
            data-minimized={isMenuMinimized}
          >
            <div className="flex justify-end p-2">
              <button
                onClick={() => setisMenuMinimized(!isMenuMinimized)}
                className="p-1 text-white absolute right-[-15px] top-[15px] rounded-full bg-white shadow-lg"
              >
                <Icon icon={isMenuMinimized ? TbChevronCompactRight : TbChevronCompactLeft} size="sm" />
              </button>
            </div>
            <nav className={clsx(
              "flex flex-col h-full pb-4",
              isMenuMinimized ? "[&_span]:hidden" : ""
            )}>{children}</nav>
          </aside>

          <CloseMenuOnRouteChange closeMenu={closeMenu} />
          <Popover.Panel
            className="bg-[#1E2D2F] col-span-1 border-r border-[#243E40] z-50 h-screen fixed inset-0 navbar-container"
            as="nav"
          >
            <div className="p-3 fixed top-0 right-0">
              <Popover.Button className="p-1 hover:bg-[#243E40]/50 font-medium rounded-lg hover:text-white focus:ring focus:ring-primary-300">
                <Icon icon={AiOutlineClose} color="white" />
              </Popover.Button>
            </div>

            {children}
          </Popover.Panel>
        </>
      )}
    </Popover>
  );
};
