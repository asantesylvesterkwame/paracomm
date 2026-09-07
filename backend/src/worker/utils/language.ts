import { OUTPUT_LANGUAGE_CODES } from "../constants/languages";

export const DEFAULT_READING_LANG = "en";

const SUPPORTED_READING_LANGS = new Set<string>(OUTPUT_LANGUAGE_CODES);

export const normalizeLang = (lang: string) =>
	lang.trim().toLowerCase().split("-")[0];

export const isSupportedReadingLang = (lang?: string | null) =>
	Boolean(lang) && SUPPORTED_READING_LANGS.has(normalizeLang(lang as string));

export const isSameLang = (a?: string | null, b?: string | null) =>
	Boolean(a && b) && normalizeLang(a as string) === normalizeLang(b as string);

export const resolveReadingLang = (locale?: string | null) => {
	if (!locale) return DEFAULT_READING_LANG;
	for (const entry of locale.split(",")) {
		const tag = entry.split(";")[0];
		if (!tag) continue;
		const base = normalizeLang(tag);
		if (SUPPORTED_READING_LANGS.has(base)) return base;
	}
	return DEFAULT_READING_LANG;
};
