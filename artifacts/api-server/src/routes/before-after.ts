import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { repositoryMetricsTable, repositoriesTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";

const router: IRouter = Router();

router.get("/before-after", async (req, res) => {
  const repositoryId = req.query.repositoryId ? parseInt(req.query.repositoryId as string) : undefined;

  let repoId = repositoryId;
  if (!repoId) {
    const [first] = await db.select().from(repositoriesTable).limit(1);
    if (!first) { res.status(404).json({ error: "No repositories found." }); return; }
    repoId = first.id;
  }

  const [row] = await db
    .select()
    .from(repositoryMetricsTable)
    .where(and(
      eq(repositoryMetricsTable.repositoryId, repoId),
      eq(repositoryMetricsTable.metricType, "before-after"),
    ))
    .limit(1);

  if (!row) { res.status(404).json({ error: "No before/after data found." }); return; }
  res.json(row.data);
});

export default router;
