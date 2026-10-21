"use client";

import { AuthProvider } from "@/context/AuthContext";

export default function SessionProvider({ children }) {
  return <AuthProvider>{children}</AuthProvider>;
}
