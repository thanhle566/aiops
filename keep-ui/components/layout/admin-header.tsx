"use client";

import React from 'react';
import { FiMessageSquare, FiHelpCircle, FiBell } from 'react-icons/fi';
import Image from 'next/image';
import { ClientThemeControl } from '../top-header/ClientThemeControl';
import { ClientUserDropdown } from '../top-header/ClientUserDropdown';
import Link from 'next/link';
import { Session } from 'next-auth';

type AdminHeaderProps = {
  title?: string;
  session: Session | null;
};

const AdminHeader: React.FC<AdminHeaderProps> = ({
  title = 'TechHala',
  session,
}) => {
  return (
    <header className="h-12 sticky top-0 z-50 w-full flex items-center justify-between px-4 shadow-sm bg-[#243E40] text-white dark:bg-gray-900 dark:text-gray-100">
      {/* Left: Logo + Title */}
      <div className="flex items-center gap-3 min-w-0">
        <Image
          src="/static/favicons/logo.png"
          alt="Logo"
          width={36}
          height={36}
          className="object-contain rounded-sm"
        />
        <span className="text-sm font-semibold truncate whitespace-nowrap">
          {title}
        </span>
      </div>

      {/* Right: Icons + User */}
      <div className="flex items-center gap-4">
        {/* <button
          type="button"
          className="hover:text-gray-300 dark:hover:text-gray-200 transition-colors"
          aria-label="Messages"
        >
          <FiMessageSquare className="w-5 h-5" />
        </button>

        <Link
          href={process.env.NEXT_PUBLIC_KEEP_DOCS_URL || 'https://docs.techhala.com'}
          target="_blank"
          rel="noopener noreferrer"
          className="text-white hover:text-gray-300 dark:hover:text-gray-200 transition-colors"
          aria-label="Docs"
        >
          <FiHelpCircle className="w-5 h-5" />
        </Link>

        <button
          type="button"
          className="hover:text-gray-300 dark:hover:text-gray-200 transition-colors"
          aria-label="Notifications"
        >
          <FiBell className="w-5 h-5" />
        </button> */}

        <ClientUserDropdown session={session} />
        <ClientThemeControl />
      </div>
    </header>
  );
};

export default AdminHeader;
