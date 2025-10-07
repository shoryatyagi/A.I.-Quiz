"use client";

import { useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Menu } from "lucide-react";
import GoogleAuthButton from "./GoogleAuthButton";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();

  const handleHomeClick = () => {
    router.push("/");
  };

  const handleHistoryClick = () => {
    router.push("/history");
  };
  const handleContactClick = () =>{
    router.push("/contacts");
  }

  const isActive = (path) => {
    if (path === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(path);
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <div
          className="flex items-center gap-3 cursor-pointer transform transition-transform hover:scale-105"
          onClick={handleHomeClick}
        >
          <div className="w-8 h-8 text-primary">
            <svg
              fill="none"
              viewBox="0 0 48 48"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M36.7273 44C33.9891 44 31.6043 39.8386 30.3636 33.69C29.123 39.8386 26.7382 44 24 44C21.2618 44 18.877 39.8386 17.6364 33.69C16.3957 39.8386 14.0109 44 11.2727 44C7.25611 44 4 35.0457 4 24C4 12.9543 7.25611 4 11.2727 4C14.0109 4 16.3957 8.16144 17.6364 14.31C18.877 8.16144 21.2618 4 24 4C26.7382 4 29.123 8.16144 30.3636 14.31C31.6043 8.16144 33.9891 4 36.7273 4C40.7439 4 44 12.9543 44 24C44 35.0457 40.7439 44 36.7273 44Z"
                fill="currentColor"
              ></path>
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900">QuizGenius</h2>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          <button
            onClick={handleHomeClick}
            className={`text-sm font-medium transition-all duration-200 transform hover:scale-105 cursor-pointer relative pb-1 ${
              isActive("/")
                ? "text-[#135bec] after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[#135bec]"
                : "text-gray-600 hover:text-[#135bec]"
            }`}
          >
            Home
          </button>
          {session && (
            <button
              onClick={handleHistoryClick}
              className={`text-sm font-medium transition-all duration-200 transform hover:scale-105 cursor-pointer relative pb-1 ${
                isActive("/history")
                  ? "text-[#135bec] after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[#135bec]"
                  : "text-gray-600 hover:text-[#135bec]"
              }`}
            >
              My Quizzes
            </button>
          )}
          <button
          onClick={handleContactClick}
            className={`text-sm font-medium transition-all duration-200 transform hover:scale-105 cursor-pointer relative pb-1 ${
              isActive("/contacts")
                ? "text-[#135bec] after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[#135bec]"
                : "text-gray-600 hover:text-[#135bec]"
            }`}
          >
            Contact
          </button>
        </nav>

        <div className="flex items-center gap-4">
          {!session ? (
            <GoogleAuthButton variant="primary" />
          ) : (
            <GoogleAuthButton />
          )}
          <button className="md:hidden p-2 rounded-md text-gray-600 hover:bg-gray-200 transition-all duration-200 transform hover:scale-110 cursor-pointer">
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>
    </header>
  );
}
