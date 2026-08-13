export const normalizeLang = (lang: string) =>
	lang.trim().toLowerCase().split("-")[0];
