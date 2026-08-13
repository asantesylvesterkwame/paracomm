import { defineConfig } from "drizzle-kit";

export default defineConfig({
	dialect: "sqlite",
	schema: "./src/worker/files/**/*.model.ts",
	out: "./drizzle",
});
