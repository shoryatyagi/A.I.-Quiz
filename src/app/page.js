"use client";

import { useSession } from "next-auth/react";
import LandingPage from "@/components/LandingPage";
import SignInPage from "@/components/SignInPage";
import Loader from "@/components/Loader";

export default function Home() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <Loader message="Loading QuizMaster" />;
  }

  if (!session) {
    return <SignInPage />;
  }

  return <LandingPage isAuthenticated={true} />;
}
