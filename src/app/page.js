"use client";

import { useAuth } from "@/context/AuthContext";
import LandingPage from "@/components/LandingPage";
import SignInPage from "@/components/SignInPage";
import Loader from "@/components/Loader";

export default function Home() {
  const { user, status } = useAuth();

  if (status === "loading") {
    return <Loader message="Loading QuizMaster" />;
  }

  if (!user) {
    return <SignInPage />;
  }

  return <LandingPage isAuthenticated={true} />;
}
