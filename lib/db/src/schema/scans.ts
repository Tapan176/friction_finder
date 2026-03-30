import { pgTable, serial, integer, text, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const scansTable = pgTable("scans", {
  id: serial("id").primaryKey(),
  repositoryId: integer("repository_id").notNull(),
  status: text("status").notNull().default("pending"),
  tracks: text("tracks").notNull().default("[]"),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  summary: text("summary"),
  dxScoreBefore: real("dx_score_before"),
  dxScoreAfter: real("dx_score_after"),
  isRealData: text("is_real_data"),
});

export const insertScanSchema = createInsertSchema(scansTable).omit({ id: true, startedAt: true });
export type InsertScan = z.infer<typeof insertScanSchema>;
export type Scan = typeof scansTable.$inferSelect;
