import { languageLabelOf } from "@/constants/languages.constants";
import { DUBBING_COPY, DUBBING_SUPPORTED_LANGS } from "./dubbing.constants";

export const isDubbingSupportedFor = (lang: string) =>
  DUBBING_SUPPORTED_LANGS.includes(lang);

export const dubbingUnavailableReason = (myLang: string, otherLang: string) => {
  if (!isDubbingSupportedFor(myLang)) {
    return `${DUBBING_COPY.UNSUPPORTED_LANGUAGE.replace(
      "this language",
      languageLabelOf(myLang),
    )}`;
  }
  if (!isDubbingSupportedFor(otherLang)) {
    return `${DUBBING_COPY.UNSUPPORTED_LANGUAGE.replace(
      "this language",
      languageLabelOf(otherLang),
    )}`;
  }
  return null;
};

export const nextBackoffMs = (attempt: number, base: number, max: number) =>
  Math.min(max, base * 2 ** Math.max(0, attempt - 1));
