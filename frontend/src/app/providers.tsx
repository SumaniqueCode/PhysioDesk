"use client";

import { type ReactNode } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// App-wide client providers; the query client is added here in Part 2.
export function Providers({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <ToastContainer position="top-right" autoClose={3500} newestOnTop closeOnClick pauseOnHover theme="light" />
    </>
  );
}
