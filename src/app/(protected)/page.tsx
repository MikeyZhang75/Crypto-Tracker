"use client";

import { useTranslation } from "@/i18n/use-translation";

export default function HomePage() {
  const t = useTranslation();
  return <h1>{t.common.language}</h1>;
}
