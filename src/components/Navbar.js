"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Menu, X, Home, History, Mail, User, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import GoogleAuthButton from "./GoogleAuthButton";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleHomeClick = () => {
    router.push("/");
    setMobileMenuOpen(false);
  };

  const handleHistoryClick = () => {
    router.push("/history");
    setMobileMenuOpen(false);
  };

  const handleContactClick = () => {
    router.push("/contacts");
    setMobileMenuOpen(false);
  };

  const isActive = (path) => {
    if (path === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(path);
  };

  return (
    <>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div
            className="flex items-center gap-3 cursor-pointer transform transition-transform hover:scale-105"
            onClick={handleHomeClick}
          >
            <div className="w-8 h-8 text-[#135bec]">
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
            <h2 className="text-xl font-bold text-gray-900">QuizMaster</h2>
          </div>

          {/* Desktop Navigation */}
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
            {/* Desktop Auth Button */}
            <div className="hidden md:block">
              {!session ? (
                <GoogleAuthButton variant="primary" />
              ) : (
                <GoogleAuthButton />
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-all duration-200 cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay and Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Slide-out Menu */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-80 bg-white shadow-2xl z-50 md:hidden"
            >
              <div className="flex flex-col h-full">
                {/* Header */}

                {/* User Info */}
                {session && (
                  <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      {session.user?.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={session.user.image}
                          alt={session.user.name || "User"}
                          className="w-12 h-12 rounded-full ring-2 ring-[#135bec]"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {session.user?.name?.charAt(0).toUpperCase() || "U"}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">
                          {session.user?.name}
                        </p>
                        <p className="text-sm text-gray-600 truncate">
                          {session.user?.email}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation Links */}
                <nav className="flex-1 overflow-y-auto p-4">
                  <div className="space-y-2">
                    <button
                      onClick={handleHomeClick}
                      className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                        isActive("/")
                          ? "bg-[#135bec] text-white shadow-lg"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <Home className="w-5 h-5" />
                      <span>Home</span>
                    </button>

                    {session && (
                      <button
                        onClick={handleHistoryClick}
                        className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                          isActive("/history")
                            ? "bg-[#135bec] text-white shadow-lg"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        <History className="w-5 h-5" />
                        <span>My Quizzes</span>
                      </button>
                    )}

                    <button
                      onClick={handleContactClick}
                      className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                        isActive("/contacts")
                          ? "bg-[#135bec] text-white shadow-lg"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <Mail className="w-5 h-5" />
                      <span>Contact</span>
                    </button>

                    {/* Logout Button */}
                    {session && (
                      <button
                        onClick={() => {
                          signOut({ callbackUrl: "/" });
                          setMobileMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-500 hover:bg-red-500/10 font-medium transition-all duration-200"
                      >
                        <LogOut className="w-5 h-5" />
                        <span className="text-sm font-medium">Log out</span>
                      </button>
                    )}
                  </div>
                </nav>

                {/* Auth Section */}
                <div className="p-6 border-t border-gray-200 bg-gray-50">
                  {!session && <GoogleAuthButton variant="large" />}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
