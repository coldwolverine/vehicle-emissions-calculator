// Description: Header component for the Vehicle Lifecycle Emissions Calculator
import Link from "next/link";
import Image from "next/image";
import logo from "@/../public/block-m-logo.png";

const Header = () => {
  return (
    <header className="bg-[#00274C] mb-1 pb-2">
      {/* Main Header Content */}
      <div className="mt-8 flex items-center justify-center max-w-screen-md mx-auto gap-8">
        {/* Logo */}
        <a
          href="https://css.umich.edu/"
          target="_blank"
          className="flex-shrink-0 hover:cursor-pointer"
        >
          <Image src={logo} alt="Block M Logo" width={50} height={50} />
        </a>

        {/* Header Content */}
        <div className="text-center">
          <h1 className="text-gray-100 text-3xl font-bold tracking-tight">
            Vehicle Lifecycle Emissions Calculator
          </h1>
        </div>
      </div>

      {/* <div className="mt-3 text-center text-lg text-white text-opacity-85">
        Guiding consumer vehicle purchases
      </div> */}

      {/* Ribbon List bg-[#2a5993] */}
      <div className="mt-6 mb-5">
        <div className="text-white text-opacity-60 text-base font-medium flex justify-evenly max-w-screen-md mx-auto">
          <Link href="#about-tool" className="hover:text-[#ffc107]">
            About Tool
          </Link>
          <Link href="#tool-guide" className="hover:text-[#ffc107]">
            Tool Guide
          </Link>
          <Link href="#model-info" className="hover:text-[#ffc107]">
            Calculation Details
          </Link>
          <Link href="#input-params" className="hover:text-[#ffc107]">
            Input Parameters
          </Link>
          <Link href="#results" className="hover:text-[#ffc107]">
            Results
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
