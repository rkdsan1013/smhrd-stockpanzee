// /frontend/src/components/Footer.tsx
import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 text-gray-300 py-8 mt-12">
      <div className="container mx-auto px-4 grid gap-8 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <h3 className="text-white text-xl font-bold mb-4">Company</h3>
          <ul>
            <li className="mb-2">
              <a href="#" className="hover:text-white">
                About Us
              </a>
            </li>
            <li className="mb-2">
              <a href="#" className="hover:text-white">
                Careers
              </a>
            </li>
            <li className="mb-2">
              <a href="#" className="hover:text-white">
                Press
              </a>
            </li>
            <li className="mb-2">
              <a href="#" className="hover:text-white">
                Blog
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="text-white text-xl font-bold mb-4">Products</h3>
          <ul>
            <li className="mb-2">
              <a href="#" className="hover:text-white">
                Pricing
              </a>
            </li>
            <li className="mb-2">
              <a href="#" className="hover:text-white">
                Features
              </a>
            </li>
            <li className="mb-2">
              <a href="#" className="hover:text-white">
                Integrations
              </a>
            </li>
            <li className="mb-2">
              <a href="#" className="hover:text-white">
                Demo
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="text-white text-xl font-bold mb-4">Support</h3>
          <ul>
            <li className="mb-2">
              <a href="#" className="hover:text-white">
                Help Center
              </a>
            </li>
            <li className="mb-2">
              <a href="#" className="hover:text-white">
                Terms of Service
              </a>
            </li>
            <li className="mb-2">
              <a href="#" className="hover:text-white">
                Privacy Policy
              </a>
            </li>
            <li className="mb-2">
              <a href="#" className="hover:text-white">
                Status
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="text-white text-xl font-bold mb-4">Connect</h3>
          <ul>
            <li className="mb-2">
              <a href="#" className="hover:text-white">
                Contact
              </a>
            </li>
            <li className="mb-2">
              <a href="#" className="hover:text-white">
                Facebook
              </a>
            </li>
            <li className="mb-2">
              <a href="#" className="hover:text-white">
                Twitter
              </a>
            </li>
            <li className="mb-2">
              <a href="#" className="hover:text-white">
                LinkedIn
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="container mx-auto px-4 mt-8 border-t border-gray-700 pt-4 pb-8">
        <p className="text-center text-sm">
          &copy; {new Date().getFullYear()} STOCKPANZEE. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
