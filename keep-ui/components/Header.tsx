import { auth } from "@/auth";
import Image from "next/image";
import { TbMessages } from "react-icons/tb";
import { FaRegQuestionCircle } from "react-icons/fa";
import { IoSettingsOutline } from "react-icons/io5";


export default async function NavbarInner() {
  return (
    <>
      <header className="bg-[#233e43] border-b-[5px] border-b-[#446260] flex items-center justify-between h-[50px] w-full col-span-3 row-start-1 z-10 ">
        <div className="flex">
          {/* <Image className="w-14" src={TcbIcon} alt="Techcombank Logo" /> */}
          <span className="font-extrabold text-3xl text-[#ebfffc] ml-[20px]">SERVICENOW</span>
        </div>
        <div className="flex items-center space-x-4 mr-[20px]">
          <img
            src="https://randomuser.me/api/portraits/men/32.jpg"
            alt="User Avatar"
            className="w-8 h-8 rounded-full object-cover border-2 border-white shadow"
          />
          <span className="text-sm font-medium text-[#ebfffc]">Alejandro M</span>
          <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-white"></div>
          <TbMessages className="text-2xl text-[#ebfffc] ml-[20px]"/>
          <FaRegQuestionCircle className="text-2xl text-[#ebfffc] ml-[20px]"/>
          <IoSettingsOutline className="text-2xl text-[#ebfffc] ml-[20px] mr-[20px]"/>
        </div>
           
        
      </header>
    </>
  );
}
