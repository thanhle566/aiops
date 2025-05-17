import React from 'react';
import Link from 'next/link';
import { Icon } from '@tremor/react';
import clsx from 'clsx';
import { BiInfoCircle } from 'react-icons/bi';

type SidebarMenuItemProps = {
  href: string;
  children: React.ReactNode;
  iconElement?: React.ReactNode;
  isInfoIcon?: boolean;
  isActive?: boolean;
  className?: string;
};

export const SidebarMenuItem: React.FC<SidebarMenuItemProps> = ({
  href,
  children,
  iconElement,
  isInfoIcon = false,
  isActive = false,
  className,
}) => {
  return (
    <Link
      href={href}
      className={clsx(
        'cursor-pointer flex items-center py-2 px-4 w-full text-white hover:bg-[#34595c] transition-all duration-200 hover:text-white hover:font-medium relative group',
        isActive && 'bg-[#243E40] font-medium',
        className
      )}
    >
      {/* Active indicator */}
      {isActive && (
        <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-yellow-300"></span>
      )}
      
      <div className="w-5 h-5 mr-3 flex-shrink-0">
        {iconElement || (isInfoIcon && <BiInfoCircle className="w-full h-full text-yellow-300" />)}
      </div>
      <span className="text-sm">{children}</span>
    </Link>
  );
}; 