// components/Footer.js
import Link from "next/link";

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-gray-300 py-5">
      <div className="max-w-screen-xl mx-auto text-center">
        <div className="flex justify-center space-x-8">
          <Link
            href="mailto:gregak@umich.edu"
            className="text-gray-400 hover:text-white"
            target="external"
          >
            Contact
          </Link>
          <Link
            href="/"
            className="text-gray-400 hover:text-white"
            target="external"
          >
            Smith et al. 2025
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
