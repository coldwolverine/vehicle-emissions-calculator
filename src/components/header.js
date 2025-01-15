// Description: Header component for the Vehicle Lifecycle Emissions Calculator
import Link from "next/link";
import Image from "next/image";
import logo from "@/../public/block-m-logo.png";

const Header = () => {
  return (
    <div className="bg-[#00274C] ">
      {/* Main Header Content */}
      <div className="flex items-center justify-between px-4">
        {/* Logo */}
        <a
          href="https://css.umich.edu/"
          target="_blank"
          className="ml-8 flex-shrink-0 hover:cursor-pointer"
        >
          <Image src={logo} alt="Block M Logo" width={75} height={75} />
        </a>

        {/* Header Content */}
        <header className="flex-grow text-center py-8 ml-[-121px]">
          <h1 className="text-gray-100 text-3xl font-bold tracking-tight">
            Vehicle Lifecycle Emissions Calculator
          </h1>
          <p className="mt-2 text-base text-gray-300">
            Guiding consumer vehicle purchases
          </p>
        </header>
      </div>

      {/* Ribbon List */}
      <div className="bg-[#2a5993] py-2">
        <div className="text-[#fafafa] text-sm font-medium flex justify-evenly max-w-screen-md mx-auto">
          <Link href="#about-tool" className="hover:text-[#ffc107]">
            About Tool
          </Link>
          <Link href="#tool-guide" className="hover:text-[#ffc107]">
            Tool Guide
          </Link>
          <Link href="#model-info" className="hover:text-[#ffc107]">
            Model Details
          </Link>
          <Link href="#input-params" className="hover:text-[#ffc107]">
            Input Parameters
          </Link>
          <Link href="#results" className="hover:text-[#ffc107]">
            Results
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Header;
