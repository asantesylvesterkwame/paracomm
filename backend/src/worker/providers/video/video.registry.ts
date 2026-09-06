import type { IVideoProvider } from "./video.provider";
import { DailyProvider } from "./daily.provider";

export const getVideoProviders = (env: Env): IVideoProvider[] => {
	if (env.DAILY_API_KEY && env.DAILY_API_KEY.length > 0) {
		return [DailyProvider];
	}
	return [];
};
