import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { repositoriesTable, insertRepositorySchema } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { AddRepositoryBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/repositories", async (req, res) => {
  const repos = await db.select().from(repositoriesTable).orderBy(repositoriesTable.createdAt);
  res.json(repos.map(r => ({
    ...r,
    lastScanAt: r.lastScanAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
  })));
});

router.post("/repositories", async (req, res) => {
  const body = AddRepositoryBody.parse(req.body);
  const [repo] = await db.insert(repositoriesTable).values({
    name: body.name,
    url: body.url,
    dxScore: 0,
  }).returning();
  res.status(201).json({
    ...repo,
    lastScanAt: repo.lastScanAt?.toISOString() ?? null,
    createdAt: repo.createdAt.toISOString(),
  });
});

router.get("/repositories/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [repo] = await db.select().from(repositoriesTable).where(eq(repositoriesTable.id, id));
  if (!repo) {
    res.status(404).json({ error: "Repository not found" });
    return;
  }
  res.json({
    ...repo,
    lastScanAt: repo.lastScanAt?.toISOString() ?? null,
    createdAt: repo.createdAt.toISOString(),
  });
});

export default router;
