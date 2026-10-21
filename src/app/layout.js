import "./globals.css";
import SessionProvider from "@/components/SessionProvider";
import Navbar from "@/components/Navbar";
import { MotionConfig } from "framer-motion";

export const metadata = {
  title: "QuizMaster - AI-Driven Quizzes",
  description:
    "Transform your documents or ideas into engaging quizzes with QuizMaster. Upload a PDF or enter an AI prompt to get started.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="font-display">
      <body className="bg-background-light antialiased flex flex-col min-h-screen">
        <MotionConfig reducedMotion="user">
          <SessionProvider>
            <Navbar />
            <div className="flex-grow">{children}</div>
            <footer className="border-t border-[#e8e1f3] bg-background-light">
            <div className="container mx-auto px-4 py-6 sm:px-6 sm:py-8">
              <div className="flex flex-col md:flex-row items-center justify-between">
                <p className="text-sm text-gray-500">
                  © 2024 QuizMaster. All rights reserved.
                </p>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 md:mt-0">
                  <a
                    href="#"
                    className="text-sm text-gray-500 hover:text-primary transition-colors"
                  >
                    Terms of Service
                  </a>
                  <a
                    href="#"
                    className="text-sm text-gray-500 hover:text-primary transition-colors"
                  >
                    Privacy Policy
                  </a>
                  <a
                    href="#contact"
                    className="text-sm text-gray-500 hover:text-primary transition-colors"
                  >
                    Contact Us
                  </a>
                </div>
              </div>
            </div>
            </footer>
          </SessionProvider>
        </MotionConfig>
      </body>
    </html>
  );
}
