"use client";

import React from "react";
import { I18nProvider } from "@/i18n/context";
import { Board } from "@/components/Board";

export default function Home() {
  return (
    <I18nProvider>
      <Board />
    </I18nProvider>
  );
}
