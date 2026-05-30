"use client";

import { useTelegramWebApp } from "@/app/components/useTelegramWebApp";
import { AppLayout } from "./AppLayout";
import { useVerificationApp } from "./useVerificationApp";

export function VerificationApp() {
  const state = useVerificationApp();
  const telegram = useTelegramWebApp();

  return (
    <AppLayout
      colorScheme={telegram.colorScheme}
      platform={telegram.platform}
      state={state}
      username={telegram.user?.username || telegram.user?.first_name}
    />
  );
}
