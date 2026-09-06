import type { ILanguageOption } from "./live.interface";

export const languageLabel = (
  options: readonly ILanguageOption[],
  code: string,
) => options.find((option) => option.code === code)?.label ?? code;
