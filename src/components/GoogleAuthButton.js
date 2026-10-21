"use client";

import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { LogOut } from "lucide-react";
import { useState } from "react";

export default function GoogleAuthButton({
  variant = "default",
  showNameOnDesktop = true,
}) {
  const { user, loading, signIn, signOut } = useAuth();
  const [imageError, setImageError] = useState(false);

  if (loading) {
    return (
      <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        {/* Only show circular profile picture */}
        <div className="relative group">
          {user?.image && !imageError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.image}
              alt={user.name || "User"}
              className="w-10 h-10 rounded-full cursor-pointer ring-2 ring-gray-200 hover:ring-[#135bec] transition-all duration-200 transform hover:scale-105"
              title={user.name}
              onError={() => setImageError(true)}
              referrerPolicy="no-referrer"
            />
          ) : (
            <div
              className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold cursor-pointer ring-2 ring-gray-200 hover:ring-[#135bec] transition-all duration-200 transform hover:scale-105"
              title={user.name}
            >
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
          )}

          {/* Dropdown menu on hover */}
          <div className="absolute right-0 top-12 w-48 bg-white rounded-lg shadow-xl border border-gray-200 opacity-0 invisible overflow-hidden group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 animate-fadeIn">
            <div className="p-3 border-b border-gray-100">
              <p className="font-semibold text-gray-800 text-sm">
                {user?.name}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.email}
              </p>
            </div>
            <button
              onClick={() => signOut()}
              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-all duration-200 flex items-center gap-2 transform cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Primary variant for Get Started button (when not authenticated)
  if (variant === "primary") {
    return (
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => signIn()}
        className="bg-[#135bec] text-white text-sm font-bold px-4 py-2 rounded-lg hover:opacity-90 transition-all duration-200 shadow-md hover:shadow-lg"
      >
        Get Started
      </motion.button>
    );
  }

  // Large variant for sign-in page
  if (variant === "large") {
    return (
      <button
        onClick={() => signIn()}
        className="flex w-full items-center justify-center gap-3 rounded-lg bg-[#135bec] px-4 py-3 text-white font-semibold shadow-sm hover:bg-[#0d47c4] focus:outline-none focus:ring-2 focus:ring-[#135bec] focus:ring-offset-2 transition-all cursor-pointer"
      >
        <svg
          className="h-6 w-6"
          height="48px"
          viewBox="0 0 48 48"
          width="48px"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
            fill="#FFC107"
          />
          <path
            d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
            fill="#FF3D00"
          />
          <path
            d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
            fill="#4CAF50"
          />
          <path
            d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C42.012,35.846,44,30.138,44,24C44,22.659,43.862,21.35,43.611,20.083z"
            fill="#1976D2"
          />
        </svg>
        <span>Sign in with Google</span>
      </button>
    );
  }

  // Default variant
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => signIn()}
      className="px-6 py-3 bg-white border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all flex items-center gap-2 shadow-sm"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
      <span className="font-medium text-gray-700">Sign in with Google</span>
    </motion.button>
  );
}
