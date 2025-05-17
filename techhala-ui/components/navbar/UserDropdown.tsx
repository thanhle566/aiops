"use client";

import { Menu } from "@headlessui/react";
import { Session } from "next-auth";
import { useConfig } from "utils/hooks/useConfig";
import { AuthType } from "@/utils/authenticationType";
import Link from "next/link";
import { useFloating } from "@floating-ui/react";
import { Subtitle } from "@tremor/react";
import UserAvatar from "./UserAvatar";
import { useSignOut } from "@/shared/lib/hooks/useSignOut";

type UserDropdownProps = {
  session: Session;
};

export const UserDropdown = ({ session }: UserDropdownProps) => {
  const { data: configData } = useConfig();
  const signOut = useSignOut();
  const { refs, floatingStyles } = useFloating({
    placement: "bottom-end",
    strategy: "fixed",
  });

  if (!session || !session.user) {
    return null;
  }
  const { userRole, user } = session;
  const { name, image, email } = user;

  const isNoAuth = configData?.AUTH_TYPE === AuthType.NOAUTH;
  return (
    <Menu as="li" ref={refs.setReference} className="w-full list-none">
      <Menu.Button className="flex items-center justify-between w-full text-sm pl-2.5 pr-2 py-1 text-gray-700 hover:bg-stone-200/50 font-medium rounded-lg hover:text-primary focus:ring focus:ring-primary/30 group capitalize">
        <span className="space-x-3 flex items-center w-full">
          <UserAvatar image={image} name={name ?? email} />{" "}
          <Subtitle className="truncate text-white">{name ?? email}</Subtitle>
        </span>
      </Menu.Button>

      <Menu.Items
        className="w-48 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none z-10"
        style={floatingStyles}
        ref={refs.setFloating}
        as="ul"
      >
        <div className="px-1 py-1 ">
          {userRole !== "noc" && (
            <li>
              <Menu.Item
                as={Link}
                href="/settings"
                className="ui-active:bg-primary ui-active:text-white ui-not-active:text-gray-900 group flex w-full items-center rounded-md px-2 py-2 text-sm"
              >
                Settings
              </Menu.Item>
            </li>
          )}
          {!isNoAuth && (
            <li>
              <Menu.Item
                as="button"
                className="ui-active:bg-primary ui-active:text-white ui-not-active:text-gray-900 group flex w-full items-center rounded-md px-2 py-2 text-sm"
                onClick={signOut}
              >
                Sign out
              </Menu.Item>
            </li>
          )}
        </div>
      </Menu.Items>
    </Menu>
  );
};

export default UserDropdown; 