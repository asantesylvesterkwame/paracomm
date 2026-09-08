type LogLevel = "log" | "warn" | "error";

const stamp = () => new Date().toISOString().slice(11, 23);

const emit = (
	level: LogLevel,
	scope: string,
	message: string,
	detail?: unknown,
) => {
	const line = `${stamp()} [${scope}] ${message}`;
	if (detail === undefined) {
		console[level](line);
		return;
	}
	console[level](line, JSON.stringify(detail));
};

export const createLogger = (scope: string) => ({
	log: (message: string, detail?: unknown) =>
		emit("log", scope, message, detail),
	warn: (message: string, detail?: unknown) =>
		emit("warn", scope, message, detail),
	error: (message: string, detail?: unknown) =>
		emit("error", scope, message, detail),
});
