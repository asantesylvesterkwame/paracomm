import { drizzle } from "drizzle-orm/d1";
import { and, eq, inArray, lt } from "drizzle-orm";
import {
	voiceNotes,
	voiceNoteDubs,
	type IVoiceNoteRow,
	type IVoiceNoteInsert,
	type IVoiceNoteDubRow,
	type IVoiceNoteDubInsert,
} from "./voice-note.model";
import {
	messages,
	type IMessageInsert,
	type IMessageRow,
} from "../message/message.model";

class VoiceNoteRepository {
	static db(env: Env) {
		return drizzle(env.DB);
	}

	static async createWithMessage(
		env: Env,
		message: IMessageInsert,
		voiceNote: IVoiceNoteInsert,
	): Promise<{ message: IMessageRow; voiceNote: IVoiceNoteRow }> {
		const db = this.db(env);
		const [messageRows, voiceRows] = await db.batch([
			db.insert(messages).values(message).returning(),
			db.insert(voiceNotes).values(voiceNote).returning(),
		]);
		return { message: messageRows[0], voiceNote: voiceRows[0] };
	}

	static async fetchOne(
		env: Env,
		roomId: string,
		voiceNoteId: string,
	): Promise<IVoiceNoteRow | null> {
		const rows = await this.db(env)
			.select()
			.from(voiceNotes)
			.where(
				and(
					eq(voiceNotes.id, voiceNoteId),
					eq(voiceNotes.roomId, roomId),
					eq(voiceNotes.isDeleted, false),
				),
			)
			.limit(1);
		return rows[0] ?? null;
	}

	static async fetchByMessageId(
		env: Env,
		messageId: string,
	): Promise<IVoiceNoteRow | null> {
		const rows = await this.db(env)
			.select()
			.from(voiceNotes)
			.where(
				and(eq(voiceNotes.messageId, messageId), eq(voiceNotes.isDeleted, false)),
			)
			.limit(1);
		return rows[0] ?? null;
	}

	static async fetchByIds(env: Env, ids: string[]): Promise<IVoiceNoteRow[]> {
		if (ids.length === 0) return [];
		return this.db(env)
			.select()
			.from(voiceNotes)
			.where(inArray(voiceNotes.id, ids));
	}

	static async update(
		env: Env,
		voiceNoteId: string,
		changes: Partial<IVoiceNoteInsert>,
	): Promise<IVoiceNoteRow | null> {
		const rows = await this.db(env)
			.update(voiceNotes)
			.set({ ...changes, updatedAt: new Date() })
			.where(eq(voiceNotes.id, voiceNoteId))
			.returning();
		return rows[0] ?? null;
	}

	static async fetchDubs(
		env: Env,
		voiceNoteId: string,
	): Promise<IVoiceNoteDubRow[]> {
		return this.db(env)
			.select()
			.from(voiceNoteDubs)
			.where(eq(voiceNoteDubs.voiceNoteId, voiceNoteId));
	}

	static async fetchDubsForMany(
		env: Env,
		voiceNoteIds: string[],
	): Promise<IVoiceNoteDubRow[]> {
		if (voiceNoteIds.length === 0) return [];
		return this.db(env)
			.select()
			.from(voiceNoteDubs)
			.where(inArray(voiceNoteDubs.voiceNoteId, voiceNoteIds));
	}

	static async fetchDub(
		env: Env,
		voiceNoteId: string,
		lang: string,
	): Promise<IVoiceNoteDubRow | null> {
		const rows = await this.db(env)
			.select()
			.from(voiceNoteDubs)
			.where(
				and(
					eq(voiceNoteDubs.voiceNoteId, voiceNoteId),
					eq(voiceNoteDubs.lang, lang),
				),
			)
			.limit(1);
		return rows[0] ?? null;
	}

	static async upsertDub(
		env: Env,
		values: IVoiceNoteDubInsert,
	): Promise<IVoiceNoteDubRow> {
		const rows = await this.db(env)
			.insert(voiceNoteDubs)
			.values(values)
			.onConflictDoUpdate({
				target: [voiceNoteDubs.voiceNoteId, voiceNoteDubs.lang],
				set: {
					status: "pending",
					error: null,
					requestedBy: values.requestedBy,
					updatedAt: values.updatedAt,
				},
			})
			.returning();
		return rows[0];
	}

	static async updateDub(
		env: Env,
		dubId: string,
		changes: Partial<IVoiceNoteDubInsert>,
	): Promise<IVoiceNoteDubRow | null> {
		const rows = await this.db(env)
			.update(voiceNoteDubs)
			.set({ ...changes, updatedAt: new Date() })
			.where(eq(voiceNoteDubs.id, dubId))
			.returning();
		return rows[0] ?? null;
	}

	static async fetchStalePendingDubs(
		env: Env,
		before: Date,
	): Promise<IVoiceNoteDubRow[]> {
		return this.db(env)
			.select()
			.from(voiceNoteDubs)
			.where(
				and(
					eq(voiceNoteDubs.status, "pending"),
					lt(voiceNoteDubs.updatedAt, before),
				),
			);
	}

	static async fetchStalePendingNotes(
		env: Env,
		before: Date,
	): Promise<IVoiceNoteRow[]> {
		return this.db(env)
			.select()
			.from(voiceNotes)
			.where(
				and(
					eq(voiceNotes.transcriptionStatus, "pending"),
					lt(voiceNotes.updatedAt, before),
				),
			);
	}
}

export default VoiceNoteRepository;
