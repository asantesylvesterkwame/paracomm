export interface ICursor {
	createdAtMs: number;
	id: string;
}

export const encodeCursor = (createdAtMs: number, id: string) =>
	btoa(`${createdAtMs}:${id}`);

export const decodeCursor = (raw: string): ICursor | null => {
	try {
		const [ms, id] = atob(raw).split(":");
		const createdAtMs = Number(ms);
		if (!Number.isFinite(createdAtMs) || !id) return null;
		return { createdAtMs, id };
	} catch {
		return null;
	}
};
