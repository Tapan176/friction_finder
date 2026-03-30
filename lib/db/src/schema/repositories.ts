import { pgTable, serial, text, integer, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const repositoriesTable = pgTable("repositories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  description: text("description"),
  language: text("language"),
  stars: integer("stars").default(0),
  dxScore: real("dx_score").default(0).notNull(),
  lastScanAt: timestamp("last_scan_at"),
  platform: text("platform").default("demo"),       // 'github' | 'gitlab' | 'demo'
  repoOwner: text("repo_owner"),
  repoName: text("repo_name"),
  accessToken: text("access_token"),                // stored encrypted-at-rest via pg
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertRepositorySchema = createInsertSchema(repositoriesTable).omit({ id: true, createdAt: true });
export type InsertRepository = z.infer<typeof insertRepositorySchema>;
export type Repository = typeof repositoriesTable.$inferSelect;
