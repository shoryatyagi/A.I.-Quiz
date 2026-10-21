"use client";

import { motion } from "framer-motion";
import { Mail, MessageSquare } from "lucide-react";

export default function ContactPage() {
  return (
    <main className="flex-grow bg-[#f5f2fc]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h1 className="mb-4 text-3xl font-extrabold tracking-tight text-[#101622] sm:text-4xl md:text-5xl">
            Get in Touch
          </h1>
          <p className="mx-auto max-w-2xl text-base text-[#4a5568] sm:text-lg">
            We&apos;d love to hear from you! Whether you have a question about
            features, need support, or just want to say hello, feel free to
            reach out.
          </p>
        </motion.div>

        {/* Contact Cards */}
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-center gap-5 sm:gap-8 md:flex-row">
          {/* Email Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="w-full max-w-md rounded-[1.75rem] border border-[#e9e0f7] bg-white p-5 shadow-[0_20px_50px_-38px_rgba(61,34,110,0.45)] transition-all duration-300 hover:shadow-xl sm:p-8"
          >
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#eee7ff]">
                <Mail className="w-8 h-8 text-[#7438dc]" />
              </div>
              <h3 className="text-xl font-bold text-[#101622] mb-2">
                Email Us
              </h3>
              <p className="text-[#4a5568] mb-4">
                Send us an email and we&apos;ll respond within 24 hours
              </p>
              <a
                href="mailto:support@quizmaster.com"
                className="text-[#7438dc] hover:underline font-medium"
              >
                support@quizmaster.com
              </a>
            </div>
          </motion.div>

          {/* Support Card */}
          {/* <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white p-8 rounded-xl shadow-lg border border-[#e2e8f0] hover:shadow-xl transition-all duration-300"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <MessageSquare className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-[#101622] mb-2">
                Live Chat
              </h3>
              <p className="text-[#4a5568] mb-4">
                Chat with our team in real-time during business hours
              </p>
              <button className="text-[#7438dc] hover:underline font-medium">
                Start Chat
              </button>
            </div>
          </motion.div> */}

          {/* FAQ Card */}
          {/* <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white p-8 rounded-xl shadow-lg border border-[#e2e8f0] hover:shadow-xl transition-all duration-300"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.79 4 4s-1.79 4-4 4-4-1.79-4-4c0-1.166.388-2.235 1.054-3.078m3.946-2.922a2 2 0 11-4 0m4 0a2 2 0 10-4 0m4 0h-4m-1 4v.01"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[#101622] mb-2">
                Help Center
              </h3>
              <p className="text-[#4a5568] mb-4">
                Browse our FAQ section for quick answers
              </p>
              <a
                href="#"
                className="text-[#7438dc] hover:underline font-medium"
              >
                Visit FAQ
              </a>
            </div>
          </motion.div> */}
        </div>

        {/* Additional Info Section
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-16 max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-lg border border-[#e2e8f0]"
        >
          <h2 className="text-2xl font-bold text-[#101622] mb-4 text-center">
            Office Hours
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-center md:text-left">
            <div>
              <p className="text-[#4a5568] mb-2">
                <span className="font-semibold text-[#101622]">
                  Monday - Friday:
                </span>
              </p>
              <p className="text-[#4a5568]">9:00 AM - 6:00 PM EST</p>
            </div>
            <div>
              <p className="text-[#4a5568] mb-2">
                <span className="font-semibold text-[#101622]">Weekend:</span>
              </p>
              <p className="text-[#4a5568]">Closed</p>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-[#e2e8f0] text-center">
            <p className="text-[#4a5568]">
              For urgent issues outside business hours, please email us and
              we&apos;ll get back to you as soon as possible.
            </p>
          </div>
        </motion.div> */}
      </div>
    </main>
  );
}
