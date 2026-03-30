import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { repositoriesTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { validateGithubToken, fetchRepoInfo } from "../lib/github-analyzer.js";
import { validateGitlabToken, fetchGitlabRepoInfo } from "../lib/gitlab-analyzer.js";

const router: IRouter = Router();

function parseRepoUrl(url: string): { platform: string; owner: string; repoName: string } | null {
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    const parts = u.pathname.replace(/^\//, "").replace(/\.git$/, "").split("/");
    if (parts.length < 2) return null;
    const owner = parts[0];
    const repoName = parts[1];
    if (u.hostname.includes("gitlab")) return { platform: "gitlab", owner, repoName };
    if (u.hostname.includes("github")) return { platform: "github", owner, repoName };
    return null;
  } catch {
    return null;
  }
}

function serializeRepo(r: typeof repositoriesTable.$inferSelect) {
  return {
    id: r.id,
    name: r.name,
    url: r.url,
    description: r.description,
    language: r.language,
    stars: r.stars,
    dxScore: r.dxScore,
    platform: r.platform,
    repoOwner: r.repoOwner,
    repoName: r.repoName,
    isRealData: r.platform !== "demo",
    lastScanAt: r.lastScanAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
  };
}

router.get("/repositories", async (_req, res) => {
  const repos = await db.select().from(repositoriesTable).orderBy(repositoriesTable.createdAt);
  res.json(repos.map(serializeRepo));
});

router.post("/repositories", async (req, res) => {
  const { url, name, accessToken, platform: explicitPlatform } = req.body as {
    url: string;
    name: string;
    accessToken?: string;
    platform?: string;
  };

  if (!url || !name) {
    res.status(400).json({ error: "url and name are required" });
    return;
  }

  // Parse the URL to detect platform
  const parsed = parseRepoUrl(url);
  const platform = explicitPlatform || parsed?.platform || "demo";
  const owner = parsed?.owner;
  const repoName = parsed?.repoName;

  let description = "";
  let language = "Unknown";
  let stars = 0;
  let validationError: string | null = null;

  // Validate token and fetch real repo info
  if (accessToken && owner && repoName) {
    try {
      if (platform === "github") {
        const { valid } = await validateGithubToken(owner, repoName, accessToken);
        if (!valid) {
          validationError = "GitHub token is invalid or repo not found. Check the token has 'repo' scope.";
        } else {
          const info = await fetchRepoInfo(owner, repoName, accessToken);
          description = info.description;
          language = info.language;
          stars = info.stars;
        }
      } else if (platform === "gitlab") {
        const projectPath = `${owner}/${repoName}`;
        const { valid } = await validateGitlabToken(projectPath, accessToken);
        if (!valid) {
          validationError = "GitLab token is invalid or project not found.";
        } else {
          const info = await fetchGitlabRepoInfo(projectPath, accessToken);
          description = info.description;
          language = info.language;
          stars = info.stars;
        }
      }
    } catch (e: any) {
      validationError = e.message || "Failed to connect to repository";
    }

    if (validationError) {
      res.status(400).json({ error: validationError });
      return;
    }
  } else if (!accessToken && owner && repoName && (platform === "github" || platform === "gitlab")) {
    // Public repo — try to fetch info without token
    try {
      if (platform === "github") {
        const info = await fetchRepoInfo(owner, repoName, undefined);
        description = info.description;
        language = info.language;
        stars = info.stars;
      }
    } catch {
      // Ignore — might be a rate limit or private repo
    }
  }

  const [repo] = await db.insert(repositoriesTable).values({
    name,
    url: url.startsWith("http") ? url : `https://${url}`,
    description: description || null,
    language: language || null,
    stars,
    dxScore: 0,
    platform,
    repoOwner: owner || null,
    repoName: repoName || null,
    accessToken: accessToken || null,
  }).returning();

  res.status(201).json(serializeRepo(repo));
});

router.get("/repositories/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [repo] = await db.select().from(repositoriesTable).where(eq(repositoriesTable.id, id));
  if (!repo) {
    res.status(404).json({ error: "Repository not found" });
    return;
  }
  res.json(serializeRepo(repo));
});

router.delete("/repositories/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(repositoriesTable).where(eq(repositoriesTable.id, id));
  res.status(204).send();
});

export default router;
