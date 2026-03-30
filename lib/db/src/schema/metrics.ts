import { pgTable, serial, integer, text, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const repositoryMetricsTable = pgTable("repository_metrics", {
  id: serial("id").primaryKey(),
  repositoryId: integer("repository_id").notNull(),
  metricType: text("metric_type").notNull(), // 'overview' | 'ci-cd' | 'test-health' | 'code-quality' | 'pr-review' | 'docs' | 'before-after'
  data: jsonb("data").notNull(),
  computedAt: timestamp("computed_at").defaultNow().notNull(),
});

export const insertRepositoryMetricsSchema = createInsertSchema(repositoryMetricsTable).omit({ id: true, computedAt: true });
export type InsertRepositoryMetrics = z.infer<typeof insertRepositoryMetricsSchema>;
export type RepositoryMetrics = typeof repositoryMetricsTable.$inferSelect;
