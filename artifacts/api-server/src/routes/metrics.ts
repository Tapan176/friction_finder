import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { repositoryMetricsTable, repositoriesTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";

const router: IRouter = Router();

async function getMetric(repositoryId: number | undefined, metricType: string) {
  // If no repositoryId given, pick the first repo
  let repoId = repositoryId;
  if (!repoId) {
    const [first] = await db.select().from(repositoriesTable).limit(1);
    if (!first) return null;
    repoId = first.id;
  }

  const [row] = await db
    .select()
    .from(repositoryMetricsTable)
    .where(and(
      eq(repositoryMetricsTable.repositoryId, repoId),
      eq(repositoryMetricsTable.metricType, metricType),
    ))
    .orderBy(repositoryMetricsTable.computedAt)
    .limit(1);

  return row?.data ?? null;
}

router.get("/metrics/overview", async (req, res) => {
  const repositoryId = req.query.repositoryId ? parseInt(req.query.repositoryId as string) : undefined;
  const data = await getMetric(repositoryId, "overview");
  if (!data) { res.status(404).json({ error: "No metrics found. Trigger a scan first." }); return; }
  res.json(data);
});

router.get("/metrics/ci-cd", async (req, res) => {
  const repositoryId = req.query.repositoryId ? parseInt(req.query.repositoryId as string) : undefined;
  const data = await getMetric(repositoryId, "ci-cd");
  if (!data) { res.status(404).json({ error: "No CI/CD metrics found." }); return; }
  res.json(data);
});

router.get("/metrics/test-health", async (req, res) => {
  const repositoryId = req.query.repositoryId ? parseInt(req.query.repositoryId as string) : undefined;
  const data = await getMetric(repositoryId, "test-health");
  if (!data) { res.status(404).json({ error: "No test health metrics found." }); return; }
  res.json(data);
});

router.get("/metrics/code-quality", async (req, res) => {
  const repositoryId = req.query.repositoryId ? parseInt(req.query.repositoryId as string) : undefined;
  const data = await getMetric(repositoryId, "code-quality");
  if (!data) { res.status(404).json({ error: "No code quality metrics found." }); return; }
  res.json(data);
});

router.get("/metrics/pr-review", async (req, res) => {
  const repositoryId = req.query.repositoryId ? parseInt(req.query.repositoryId as string) : undefined;
  const data = await getMetric(repositoryId, "pr-review");
  if (!data) { res.status(404).json({ error: "No PR review metrics found." }); return; }
  res.json(data);
});

router.get("/metrics/docs", async (req, res) => {
  const repositoryId = req.query.repositoryId ? parseInt(req.query.repositoryId as string) : undefined;
  const data = await getMetric(repositoryId, "docs");
  if (!data) { res.status(404).json({ error: "No docs metrics found." }); return; }
  res.json(data);
});

export default router;
