import type { ILanguageOption } from "./live.interface";

export const languageLabel = (
  options: readonly ILanguageOption[],
  code: string,
) => options.find((option) => option.code === code)?.label ?? code;

export const splitOversizedUtterance = (text: string, maxChars: number) => {
  if (text.length <= maxChars) return [text];
  const pieces: string[] = [];
  let rest = text;
  while (rest.length > maxChars) {
    const window = rest.slice(0, maxChars);
    const sentenceBreak = Math.max(
      window.lastIndexOf(". "),
      window.lastIndexOf("? "),
      window.lastIndexOf("! "),
    );
    const spaceBreak = window.lastIndexOf(" ");
    const cut = sentenceBreak > 0 ? sentenceBreak + 1 : spaceBreak > 0 ? spaceBreak : maxChars;
    pieces.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  if (rest) pieces.push(rest);
  return pieces.filter(Boolean);
};
