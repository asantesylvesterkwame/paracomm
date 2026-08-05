export class AppError extends Error {
	status: number;
	headers?: Record<string, string>;

	constructor(message: string, status = 400, headers?: Record<string, string>) {
		super(message);
		this.status = status;
		this.headers = headers;
	}
}
