"use client";

import { useEffect } from "react";

const LOADING_MESSAGES = [
  "Sharpening pencils",
  "Taking attendance",
  "Polishing report cards",
  "Ringing the class bell",
];

const DOTS = ["", ".", "..", "..."];

function getFaviconLink() {
  const existing = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
  if (existing) return existing;

  const link = document.createElement("link");
  link.rel = "icon";
  document.head.appendChild(link);
  return link;
}

export function TabLoadingIndicator() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const faviconLink = getFaviconLink();
    const originalFaviconHref = faviconLink.href || "/favicon.ico";
    const originalFetch = window.fetch.bind(window);
    const baseIcon = new Image();
    let baseIconReady = false;
    let pendingRequests = 0;
    let frame = 0;
    let startTimer: number | null = null;
    let stopTimer: number | null = null;
    let animationTimer: number | null = null;
    let latestTitle = document.title;

    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext("2d");

    const titleObserver = new MutationObserver(() => {
      if (pendingRequests === 0) latestTitle = document.title;
    });

    const titleEl = document.querySelector("title");
    if (titleEl) {
      titleObserver.observe(titleEl, { childList: true });
    }

    baseIcon.onload = () => {
      baseIconReady = true;
    };
    baseIcon.src = originalFaviconHref;

    const drawFrame = () => {
      if (!ctx) return;

      const size = 32;
      const center = size / 2;
      const radius = 12;
      const startAngle = (frame * 0.26) % (Math.PI * 2);
      const endAngle = startAngle + Math.PI * 0.95;

      ctx.clearRect(0, 0, size, size);

      if (baseIconReady) {
        ctx.drawImage(baseIcon, 0, 0, size, size);
      } else {
        ctx.fillStyle = "#0b1d36";
        ctx.fillRect(0, 0, size, size);
      }

      ctx.lineWidth = 2.5;
      ctx.strokeStyle = "rgba(16, 185, 129, 0.35)";
      ctx.beginPath();
      ctx.arc(center, center, radius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = "#10b981";
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(center, center, radius, startAngle, endAngle);
      ctx.stroke();

      const dotX = center + Math.cos(endAngle) * radius;
      const dotY = center + Math.sin(endAngle) * radius;
      ctx.fillStyle = "#34d399";
      ctx.beginPath();
      ctx.arc(dotX, dotY, 1.6, 0, Math.PI * 2);
      ctx.fill();

      faviconLink.href = canvas.toDataURL("image/png");
      const msg = LOADING_MESSAGES[Math.floor(frame / 8) % LOADING_MESSAGES.length];
      const dots = DOTS[frame % DOTS.length];
      document.title = `${msg}${dots} | ${latestTitle}`;
      frame += 1;
    };

    const startAnimation = () => {
      if (animationTimer !== null) return;
      frame = 0;
      animationTimer = window.setInterval(drawFrame, 120);
      drawFrame();
    };

    const stopAnimation = () => {
      if (animationTimer !== null) {
        window.clearInterval(animationTimer);
        animationTimer = null;
      }
      faviconLink.href = originalFaviconHref;
      document.title = latestTitle;
    };

    const onRequestStart = () => {
      pendingRequests += 1;
      if (pendingRequests !== 1) return;

      if (stopTimer !== null) {
        window.clearTimeout(stopTimer);
        stopTimer = null;
      }
      if (startTimer !== null) {
        window.clearTimeout(startTimer);
      }
      startTimer = window.setTimeout(() => {
        if (pendingRequests > 0) startAnimation();
      }, 180);
    };

    const onRequestEnd = () => {
      pendingRequests = Math.max(0, pendingRequests - 1);
      if (pendingRequests > 0) return;

      if (startTimer !== null) {
        window.clearTimeout(startTimer);
        startTimer = null;
      }
      if (stopTimer !== null) {
        window.clearTimeout(stopTimer);
      }
      stopTimer = window.setTimeout(stopAnimation, 220);
    };

    window.fetch = (async (...args) => {
      onRequestStart();
      try {
        return await originalFetch(...args);
      } finally {
        onRequestEnd();
      }
    }) as typeof window.fetch;

    return () => {
      window.fetch = originalFetch;
      if (startTimer !== null) window.clearTimeout(startTimer);
      if (stopTimer !== null) window.clearTimeout(stopTimer);
      stopAnimation();
      titleObserver.disconnect();
    };
  }, []);

  return null;
}
