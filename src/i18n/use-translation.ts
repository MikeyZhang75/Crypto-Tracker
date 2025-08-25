import { useLanguage } from "@/provider/language-provider";

export function useTranslation() {
  const { t } = useLanguage();
  return t;
}
