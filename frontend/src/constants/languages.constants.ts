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

export const languageLabelOf = (code: string) =>
  PREFERRED_LANGUAGES.find((language) => language.code === code)?.label ?? code;
