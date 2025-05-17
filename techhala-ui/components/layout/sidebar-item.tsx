import { ReactNode, useState } from "react";
import Link from "next/link";

export type SidebarItemData = {
    icon: ReactNode;
    label: string;
    href?: string;
    children?: SidebarItemData[];
  };
interface SidebarItemProps {
  item: SidebarItemData;
  isOpen: boolean;
}

export function SidebarItem({ item, isOpen }: SidebarItemProps) {
  const [open, setOpen] = useState(false);

  const hasChildren = item.children && item.children.length > 0;

  return (
    <div>
      <div
        onClick={() => {
          if (hasChildren) setOpen(!open);
        }}
        className="flex items-center justify-between hover:bg-[#2e3b3e] px-3 py-2 rounded cursor-pointer transition"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">{item.icon}</span>
          {isOpen && <span>{item.label}</span>}
        </div>

        {hasChildren && isOpen && (
          <span className="text-sm">{open ? "▾" : "▸"}</span>
        )}
      </div>

      {hasChildren && open && isOpen && (
        <div className="ml-8 mt-1 flex flex-col gap-1">
          {item.children!.map((child) => (
            <Link
              href={child.href || "#"}
              key={child.label}
              className="flex items-center gap-2 text-sm hover:bg-[#2e3b3e] px-2 py-1 rounded"
            >
              <span className="text-base">{child.icon}</span>
              <span>{child.label}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
