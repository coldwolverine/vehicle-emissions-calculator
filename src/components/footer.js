// components/Footer.js
import Link from "next/link";
import Image from "next/image";
import logo from "@/../public/css-logo-white-long.png";

const Footer = () => {
  return (
    <footer className="bg-[#00274C] text-gray-200 py-8">
      <div className="flex justify-center items-center gap-40 text-lg max-w-screen-lg mx-auto">
        <div className="flex justify-center space-x-12">
          <Link
            href="mailto:gregak@umich.edu"
            className="text-gray-300 hover:text-[#ffc107]"
            target="external"
          >
            Contact
          </Link>
          <Link
            href="https://pubs.acs.org/doi/10.1021/acs.est.5c05406"
            className="text-gray-300 hover:text-[#ffc107]"
            target="external"
          >
            Smith et al. 2025
          </Link>
        </div>
        <div className="flex justify-center order-[-1]">
          <Link
            href="https://css.umich.edu/"
            target="external"
            className="hover:cursor-pointer"
          >
            <Image src={logo} alt="CSS Logo" width={400} height={200} />
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
