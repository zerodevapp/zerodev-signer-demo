import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './app/api/_db/schema.ts',
  out: './app/api/_db/drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
