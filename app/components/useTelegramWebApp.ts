"use client";

import { useEffect, useState } from "react";

type TelegramUser = {
  first_name?: string;
  id?: number;
  last_name?: string;
  username?: string;
};

type TelegramWebApp = {
  colorScheme?: "light" | "dark";
  expand?: () => void;
  initData?: string;
  initDataUnsafe?: {
    user?: TelegramUser;
  };
  platform?: string;
  ready?: () => void;
};

type TelegramState = {
  colorScheme: "light" | "dark";
  initData: string;
  isTelegram: boolean;
  platform: string;
  user?: TelegramUser;
  verificationStatus: "idle" | "verified" | "failed";
};

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

export function useTelegramWebApp() {
  const [telegram, setTelegram] = useState<TelegramState>({
    colorScheme: "light",
    initData: "",
    isTelegram: false,
    platform: "unknown",
    verificationStatus: "idle",
  });

  useEffect(() => {
    const webApp = window.Telegram?.WebApp;

    if (!webApp) {
      return;
    }

    webApp.ready?.();
    webApp.expand?.();

    const initData = webApp.initData || "";
    const unsafeData = webApp.initDataUnsafe || {};

    setTelegram({
      colorScheme: webApp.colorScheme || "light",
      initData,
      isTelegram: Boolean(initData),
      platform: webApp.platform || "unknown",
      user: unsafeData.user,
      verificationStatus: "idle",
    });

    console.log(unsafeData);

    if (!initData) {
      return;
    }

    fetch("/api/telegram/verify", {
      body: JSON.stringify({ initData }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    })
      .then((response) => {
        setTelegram((current) => ({
          ...current,
          verificationStatus: response.ok ? "verified" : "failed",
        }));
      })
      .catch(() => {
        setTelegram((current) => ({ ...current, verificationStatus: "failed" }));
      });
  }, []);

  return telegram;
}
