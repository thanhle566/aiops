"use client";

import React from 'react';
import { FiMessageSquare, FiHelpCircle, FiBell } from 'react-icons/fi';
import Image from 'next/image';
import { ClientThemeControl } from './ClientThemeControl';
import { ClientUserDropdown } from './ClientUserDropdown';
import './topheader-darkmode.css';
import Link from 'next/link';
import { Search } from '../navbar/Search';
import { Session } from 'next-auth';

type TopHeaderProps = {
  title?: string;
  session: Session | null;
}

const TopHeader: React.FC<TopHeaderProps> = ({ 
  title = 'TechHala',
  session
}) => {
  return (
    <header className="bg-[#243E40] dark:bg-dark/75 text-white py-4 flex items-center justify-between px-4 w-full sticky top-0 z-50 top-header">
      <div className="flex items-center gap-3">
        <div className="text-white font-bold">
          <Image 
            src="/static/favicons/logo.png" 
            alt="Logo" 
            width={50} 
            height={40} 
            className="object-contain"
          />
        </div>
        <div className="text-sm ml-2 text-white">{title}</div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-3 ml-2">
          <Search displayMode="icon-only" />
          <button className="text-white hover:text-gray-200 top-header-icon">
            <FiMessageSquare className="h-5 w-5" />
          </button>
          <Link 
            href={process.env.NEXT_PUBLIC_KEEP_DOCS_URL || "https://docs.techhala.com"}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white hover:text-gray-200 top-header-icon flex items-center justify-center"
          >
            <FiHelpCircle className="h-5 w-5" />
          </Link>
          <button className="text-white hover:text-gray-200 top-header-icon">
            <FiBell className="h-5 w-5" />
          </button>
        </div>
        <ClientUserDropdown session={session} />
        <ClientThemeControl />
      </div>
    </header>
  );
};

export default TopHeader;
