"use client";

import GoogleAuthButton from "./GoogleAuthButton";

export default function SignInPage() {
  return (
    <main className="flex w-full flex-grow items-center justify-center px-4 py-10 sm:px-6 sm:py-16">
      <div className="w-full max-w-md space-y-8 rounded-[1.75rem] border border-[#e9e0f7] bg-white p-6 shadow-[0_20px_60px_-38px_rgba(61,34,110,0.5)] sm:p-10">
        {/* Header */}
        <div className="text-center">
          {/* Logo */}
          <svg
            className="mx-auto h-12 w-12 rounded-2xl bg-[#f0e9ff] p-2 text-[#7438dc]"
            fill="none"
            viewBox="0 0 48 48"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M36.7273 44C33.9891 44 31.6043 39.8386 30.3636 33.69C29.123 39.8386 26.7382 44 24 44C21.2618 44 18.877 39.8386 17.6364 33.69C16.3957 39.8386 14.0109 44 11.2727 44C7.25611 44 4 35.0457 4 24C4 12.9543 7.25611 4 11.2727 4C14.0109 4 16.3957 8.16144 17.6364 14.31C18.877 8.16144 21.2618 4 24 4C26.7382 4 29.123 8.16144 30.3636 14.31C31.6043 8.16144 33.9891 4 36.7273 4C40.7439 4 44 12.9543 44 24C44 35.0457 40.7439 44 36.7273 44Z"
              fill="currentColor"
            ></path>
          </svg>

          {/* Title */}
          <h2 className="mt-6 text-2xl font-extrabold tracking-tight text-[#211b43] sm:text-3xl">
            Sign in to QuizMaster
          </h2>

          {/* Subtitle */}
          <p className="mt-2 text-base font-semibold text-[#77718b] sm:text-lg">
            Unlock Unlimited Quizzes and Compete with Friends!
          </p>
        </div>

        {/* Sign In Button */}
        <div className="flex flex-col items-center space-y-4">
          <GoogleAuthButton variant="large" />
        </div>

        {/* Terms */}
        <p className="mt-8 text-center text-sm text-slate-500">
          By continuing, you agree to our{" "}
          <a
            className="font-medium text-primary hover:underline cursor-pointer"
            href="#"
          >
            Terms of Service
          </a>{" "}
          and{" "}
          <a
            className="font-medium text-primary hover:underline cursor-pointer"
            href="#"
          >
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </main>
  );
}
