export interface ILanguageChoice {
  code: string;
  label: string;
}

export const PREFERRED_LANGUAGES: readonly ILanguageChoice[] = [
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "it", label: "Italian" },
  { code: "pt", label: "Portuguese" },
  { code: "nl", label: "Dutch" },
  { code: "pl", label: "Polish" },
  { code: "ru", label: "Russian" },
  { code: "tr", label: "Turkish" },
  { code: "sv", label: "Swedish" },
  { code: "id", label: "Indonesian" },
  { code: "vi", label: "Vietnamese" },
  { code: "th", label: "Thai" },
  { code: "hi", label: "Hindi" },
  { code: "ar", label: "Arabic" },
  { code: "zh", label: "Mandarin Chinese" },
  { code: "ja", label: "Japanese" },
  { code: "ko", label: "Korean" },
  { code: "sw", label: "Swahili" },
  { code: "tw", label: "Twi" },
  { code: "ee", label: "Ewe" },
  { code: "ha", label: "Hausa" },
  { code: "yo", label: "Yoruba" },
  { code: "am", label: "Amharic" },
] as const;

export const TTS_UNSUPPORTED_LANGS: readonly string[] = ["tw", "ee", "ha", "yo"];

export const isVoiceSupportedFor = (code: string) =>
  !TTS_UNSUPPORTED_LANGS.includes(code);

export const languageLabelOf = (code: string) =>
  PREFERRED_LANGUAGES.find((language) => language.code === code)?.label ?? code;

export const DEFAULT_READING_LANG = "en";

const SUPPORTED_READING_LANGS = new Set(
  PREFERRED_LANGUAGES.map((language) => language.code),
);

export const normalizeLang = (lang: string) =>
  lang.trim().toLowerCase().split("-")[0];

export const resolveReadingLang = (locale?: string | null) => {
  if (!locale) return DEFAULT_READING_LANG;
  const base = normalizeLang(locale);
  return SUPPORTED_READING_LANGS.has(base) ? base : DEFAULT_READING_LANG;
};

export const browserLocales = () => {
  if (typeof navigator === "undefined") return DEFAULT_READING_LANG;
  const locales = navigator.languages?.length
    ? navigator.languages
    : [navigator.language];
  return locales.filter(Boolean).slice(0, 5).join(",");
};
