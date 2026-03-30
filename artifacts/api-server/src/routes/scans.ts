import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { scansTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { TriggerScanBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/scans", async (req, res) => {
  const repositoryId = req.query.repositoryId ? parseInt(req.query.repositoryId as string) : undefined;
  let query = db.select().from(scansTable);
  const scans = repositoryId
    ? await db.select().from(scansTable).where(eq(scansTable.repositoryId, repositoryId))
    : await db.select().from(scansTable);
  res.json(scans.map(s => ({
    ...s,
    tracks: JSON.parse(s.tracks as string),
    startedAt: s.startedAt.toISOString(),
    completedAt: s.completedAt?.toISOString() ?? null,
  })));
});

router.post("/scans", async (req, res) => {
  const body = TriggerScanBody.parse(req.body);
  const [scan] = await db.insert(scansTable).values({
    repositoryId: body.repositoryId,
    tracks: JSON.stringify(body.tracks),
    status: "running",
  }).returning();
  res.status(201).json({
    ...scan,
    tracks: JSON.parse(scan.tracks as string),
    startedAt: scan.startedAt.toISOString(),
    completedAt: null,
  });
});

router.get("/scans/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [scan] = await db.select().from(scansTable).where(eq(scansTable.id, id));
  if (!scan) {
    res.status(404).json({ error: "Scan not found" });
    return;
  }
  res.json({
    ...scan,
    tracks: JSON.parse(scan.tracks as string),
    startedAt: scan.startedAt.toISOString(),
    completedAt: scan.completedAt?.toISOString() ?? null,
  });
});

export default router;
