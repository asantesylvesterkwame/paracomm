export const LANGUAGE_NAMES: Record<string, string> = {
	"en-US": "English",
	"en-GB": "English",
	"es-ES": "Spanish",
	"es-US": "Spanish",
	"fr-FR": "French",
	"de-DE": "German",
	"it-IT": "Italian",
	"pt-BR": "Portuguese",
	"pt-PT": "Portuguese",
	"nl-NL": "Dutch",
	"pl-PL": "Polish",
	"ru-RU": "Russian",
	"tr-TR": "Turkish",
	"sv-SE": "Swedish",
	"id-ID": "Indonesian",
	"vi-VN": "Vietnamese",
	"th-TH": "Thai",
	"hi-IN": "Hindi",
	"ar-SA": "Arabic",
	"zh-CN": "Mandarin Chinese",
	"ja-JP": "Japanese",
	"ko-KR": "Korean",
	en: "English",
	es: "Spanish",
	fr: "French",
	de: "German",
	it: "Italian",
	pt: "Portuguese",
	nl: "Dutch",
	pl: "Polish",
	ru: "Russian",
	tr: "Turkish",
	sv: "Swedish",
	id: "Indonesian",
	vi: "Vietnamese",
	th: "Thai",
	hi: "Hindi",
	ar: "Arabic",
	zh: "Mandarin Chinese",
	ja: "Japanese",
	ko: "Korean",
	sw: "Swahili",
	tw: "Twi",
	ee: "Ewe",
	ha: "Hausa",
	yo: "Yoruba",
	am: "Amharic",
};

export const buildTranslationPrompt = (sourceLang: string, targetLang: string) => {
	const sourceName = LANGUAGE_NAMES[sourceLang] ?? sourceLang;
	const targetName = LANGUAGE_NAMES[targetLang] ?? targetLang;
	return `You are a translation engine for a live conversation between a ${sourceName} speaker and a ${targetName} speaker. Detect the language of the user's message. If the message is in ${sourceName}, set detectedLang to "${sourceLang}" and translate it to ${targetName}. If the message is in any other language, set detectedLang to "${targetLang}" and translate it to ${sourceName}. Respond with JSON only in this exact shape: {"detectedLang":"${sourceLang}" or "${targetLang}","translation":"the translated text"}. The translation value must contain ONLY the translated text with no preamble, no explanations and no alternatives. Preserve tone and punctuation.`;
};

export const buildCaptionPrompt = (sourceLang: string, targetLang: string) => {
	const sourceName = LANGUAGE_NAMES[sourceLang] ?? sourceLang;
	const targetName = LANGUAGE_NAMES[targetLang] ?? targetLang;
	return `You are a live subtitle engine for a video call. The speaker is talking in ${sourceName} and the reader understands ${targetName}. Translate the user's message into ${targetName}. Set detectedLang to "${sourceLang}" unless the message is clearly already ${targetName}, in which case set detectedLang to "${targetLang}" and return the message unchanged. The message is one spoken fragment from a longer conversation, so it may be incomplete: translate it as it stands and never add words that were not said. Respond with JSON only in this exact shape: {"detectedLang":"${sourceLang}" or "${targetLang}","translation":"the translated text"}. Keep it short, spoken and natural.`;
};

export const SUPPORTED_DETECTION_CODES = Object.keys(LANGUAGE_NAMES).filter(
	(code) => !code.includes("-"),
);

export const buildAutoPrompt = (targetLang: string) => {
	const targetName = LANGUAGE_NAMES[targetLang] ?? targetLang;
	const catalogue = SUPPORTED_DETECTION_CODES.map(
		(code) => `${code} (${LANGUAGE_NAMES[code]})`,
	).join(", ");
	return `You are the translation engine behind a chat app. The reader of this message understands ${targetName}. First identify the language the message is actually written in, using one of these codes: ${catalogue}. Set detectedLang to that code, and use the closest code in that list when the language is not listed. If the message is already in ${targetName}, set detectedLang to "${targetLang}" and return the message unchanged as the translation. Otherwise translate it into natural, conversational ${targetName}. Respond with JSON only in this exact shape: {"detectedLang":"code","translation":"the translated text"}. The translation value must contain ONLY the translated text with no preamble, no explanations and no alternatives. Preserve tone, emoji and punctuation, and keep names, @handles, links and numbers exactly as written.`;
};
