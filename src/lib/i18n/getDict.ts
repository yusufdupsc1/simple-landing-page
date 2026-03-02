import bnCommon from "../../../locales/bn/common.json";
import enCommon from "../../../locales/en/common.json";
import bnGovtPrimary from "../../../locales/bn/govtPrimary.json";
import enGovtPrimary from "../../../locales/en/govtPrimary.json";

export const SUPPORTED_LOCALES = ["bn", "en"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export type TranslationDict = {
  common: Record<string, string>;
  govtPrimary: Record<string, string>;
};

const DICTIONARIES: Record<SupportedLocale, TranslationDict> = {
  bn: {
    common: bnCommon as Record<string, string>,
    govtPrimary: bnGovtPrimary as Record<string, string>,
  },
  en: {
    common: enCommon as Record<string, string>,
    govtPrimary: enGovtPrimary as Record<string, string>,
  },
};

export type TranslationNamespace = keyof TranslationDict;

export function normalizeLocale(value?: string | null): SupportedLocale {
  if (!value) return "bn";
  const normalized = value.toLowerCase();
  if (normalized.startsWith("bn")) return "bn";
  if (normalized.startsWith("en")) return "en";
  return "bn";
}

export function getDict(locale?: string | null): TranslationDict {
  const normalized = normalizeLocale(locale);
  return DICTIONARIES[normalized];
}

export function getCommonDict(locale?: string | null): Record<string, string> {
  return getDict(locale).common;
}

export function getNamespaceDict(
  locale: string | null | undefined,
  namespace: TranslationNamespace,
): Record<string, string> {
  return getDict(locale)[namespace];
}
