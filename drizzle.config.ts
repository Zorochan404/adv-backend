import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/modules/**/*.ts",
  out: "./src/drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});