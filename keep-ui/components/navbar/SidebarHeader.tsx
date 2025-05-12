import React from "react";
import { AiOutlineStar } from "react-icons/ai";
import { BiTime } from "react-icons/bi";
import { FiInbox } from "react-icons/fi";

type SidebarHeaderProps = {
  title: string;
};

export const SidebarHeader: React.FC<SidebarHeaderProps> = ({ title }) => {
  return (
    <div className="px-2 py-4 border-b border-[#fff]/50">
      {/* <div className="flex justify-between mb-3 px-2">
        <button className="w-8 h-8 flex items-center justify-center text-white opacity-80 hover:opacity-100 hover:bg-[#243E40]/30 rounded transition-all">
          <FiInbox className="w-5 h-5 transition-transform hover:scale-110" />
        </button>
        <button className="w-8 h-8 flex items-center justify-center text-white opacity-80 hover:opacity-100 hover:bg-[#243E40]/30 rounded transition-all">
          <AiOutlineStar className="w-5 h-5 transition-transform hover:scale-110" />
        </button>
        <button className="w-8 h-8 flex items-center justify-center text-white opacity-80 hover:opacity-100 hover:bg-[#243E40]/30 rounded transition-all">
          <BiTime className="w-5 h-5 transition-transform hover:scale-110" />
        </button>
      </div> */}
      <h2 className="text-white font-medium text-base px-2">{title}</h2>
    </div>
  );
};
