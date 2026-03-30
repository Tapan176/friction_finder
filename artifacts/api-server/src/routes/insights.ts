import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { insightsTable, repositoriesTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";

const router: IRouter = Router();

router.get("/insights", async (req, res) => {
  const repositoryId = req.query.repositoryId ? parseInt(req.query.repositoryId as string) : undefined;
  const severity = req.query.severity as string | undefined;

  let repoId = repositoryId;
  if (!repoId) {
    const [first] = await db.select().from(repositoriesTable).limit(1);
    if (!first) { res.json([]); return; }
    repoId = first.id;
  }

  let query = db.select().from(insightsTable).where(eq(insightsTable.repositoryId, repoId));

  const rows = severity
    ? await db.select().from(insightsTable).where(and(
        eq(insightsTable.repositoryId, repoId),
        eq(insightsTable.severity, severity),
      ))
    : await db.select().from(insightsTable).where(eq(insightsTable.repositoryId, repoId));

  res.json(rows.map(r => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
  })));
});

export default router;
