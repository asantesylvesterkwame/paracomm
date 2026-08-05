import type { ILanguageOption } from "./live.interface";

export const INPUT_LANGUAGES: readonly ILanguageOption[] = [
  { code: "en-US", label: "English (US)" },
  { code: "en-GB", label: "English (UK)" },
  { code: "es-ES", label: "Spanish (Spain)" },
  { code: "es-US", label: "Spanish (US)" },
  { code: "fr-FR", label: "French" },
  { code: "de-DE", label: "German" },
  { code: "it-IT", label: "Italian" },
  { code: "pt-BR", label: "Portuguese (Brazil)" },
  { code: "pt-PT", label: "Portuguese (Portugal)" },
  { code: "nl-NL", label: "Dutch" },
  { code: "pl-PL", label: "Polish" },
  { code: "ru-RU", label: "Russian" },
  { code: "tr-TR", label: "Turkish" },
  { code: "sv-SE", label: "Swedish" },
  { code: "id-ID", label: "Indonesian" },
  { code: "vi-VN", label: "Vietnamese" },
  { code: "th-TH", label: "Thai" },
  { code: "hi-IN", label: "Hindi" },
  { code: "ar-SA", label: "Arabic" },
  { code: "zh-CN", label: "Mandarin Chinese" },
  { code: "ja-JP", label: "Japanese" },
  { code: "ko-KR", label: "Korean" },
];

export const OUTPUT_LANGUAGES: readonly ILanguageOption[] = [
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
];

export const MAX_UTTERANCE_CHARS = 500;
export const MAX_RECORDING_SECONDS = 60;
export const DEFAULT_INPUT_LANGUAGE = "en-US";
export const DEFAULT_OUTPUT_LANGUAGE = "es";
