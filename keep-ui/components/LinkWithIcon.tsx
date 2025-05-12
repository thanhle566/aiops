import { AnchorHTMLAttributes, ReactNode, useState } from "react";
import Link, { LinkProps } from "next/link";
import { IconType } from "react-icons/lib";
import { Badge, Icon } from "@tremor/react";
import { usePathname } from "next/navigation";
import { Trashcan } from "@/components/icons";
import clsx from "clsx";
import { ShortNumber } from "./ui";

type LinkWithIconProps = {
  children: ReactNode;
  icon: IconType;
  count?: number;
  isBeta?: boolean;
  isDeletable?: boolean;
  onDelete?: () => void;
  className?: string;
  testId?: string;
  isExact?: boolean;
  iconClassName?: string;
  tooltip?: string; // ✅ Added
} & LinkProps &
  AnchorHTMLAttributes<HTMLAnchorElement>;

export const LinkWithIcon = ({
  icon,
  children,
  tabIndex = 0,
  count,
  isBeta = false,
  isDeletable = false,
  onDelete,
  className,
  testId,
  isExact = false,
  iconClassName,
  tooltip,
  ...restOfLinkProps
}: LinkWithIconProps) => {
  const pathname = usePathname();
  const [isHovered, setIsHovered] = useState(false);

  const isActive = isExact
    ? decodeURIComponent(pathname || "") === restOfLinkProps.href?.toString()
    : decodeURIComponent(pathname || "").startsWith(
        restOfLinkProps.href?.toString() || ""
      );

  const iconClasses = clsx(
    "sidebar-menu-icon group-hover:text-white transition-colors duration-200",
    {
      "text-white": isActive,
      "text-gray-300": !isActive,
    },
    iconClassName
  );

  const textClasses = clsx(
    "truncate sidebar-menu-text group-hover:text-white transition-colors duration-200",
    {
      "text-white font-medium": isActive,
      "text-gray-300": !isActive,
    }
  );

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);

  const onClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (restOfLinkProps.onClick) {
      restOfLinkProps.onClick(e);
    }
  };

  return (
    <div
      title={tooltip} // ✅ Add tooltip here
      className={clsx(
        "sidebar-menu-item flex items-center justify-between p-1 font-medium rounded-lg focus:ring focus:ring-primary-300 group w-full min-w-0 relative",
        {
          "bg-[#243E40] active": isActive,
          "hover:bg-[#34595c]": !isActive,
        },
        className
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {isActive && (
        <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-yellow-300 rounded-r"></span>
      )}

      <Link
        tabIndex={tabIndex}
        {...restOfLinkProps}
        className="flex items-center space-x-2 flex-1 min-w-0 pl-1"
        onClick={onClick}
        data-testid={`${testId}-link`}
      >
        <Icon className={iconClasses} icon={icon} />
        <span className={textClasses}>{children}</span>
      </Link>

      <div className="flex items-center">
        {count !== undefined && count !== null && (
          <Badge
            size="xs"
             color="red"
            data-testid={`${testId}-badge`}
            className="sidebar-menu-badge px-1 mr-1 min-w-5 bg-[#243E40] text-white group-hover:bg-[#1a2e2f]"
          >
            <ShortNumber value={count} />
          </Badge>
        )}

        {/* {isBeta && (
          <Badge
             color="red"
            size="xs"
            className="ml-2 bg-[#243E40] text-white group-hover:bg-[#1a2e2f]"
          >
            Beta
          </Badge>
        )} */}

        {isDeletable && onDelete && (
          <button
            onClick={onDelete}
            className="flex items-center text-gray-400 hover:text-red-400 p-0"
          >
            <Trashcan className="text-gray-400 hover:text-red-400 group-hover:block hidden h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};
