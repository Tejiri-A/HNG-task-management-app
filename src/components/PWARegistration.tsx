"use client";
import { useEffect } from "react";

function registerSW() {
  navigator.serviceWorker
    .register("/sw.js")
    .then((registration) => {
      console.log("SW registered:", registration);
    })
    .catch((err) => {
      console.error("SW registration failed:", err);
    });
}

export default function PWARegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // Defer registration until after the page has fully loaded so the SW
    // install (which pre-caches shell routes) doesn't compete with the
    // page's own resource loading and block the load event.
    if (document.readyState === "complete") {
      registerSW();
    } else {
      window.addEventListener("load", registerSW, { once: true });
      return () => window.removeEventListener("load", registerSW);
    }
  }, []);

  return null;
}
