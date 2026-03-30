import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { scansTable, repositoriesTable, repositoryMetricsTable, insightsTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { TriggerScanBody } from "@workspace/api-zod";

const router: IRouter = Router();

function generateDates(days: number) {
  const dates = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split("T")[0]);
  }
  return dates;
}

function randBetween(min: number, max: number) {
  return parseFloat((min + Math.random() * (max - min)).toFixed(1));
}

/** Generate fresh metric data for a repo, simulating improvement over time */
function generateFreshMetrics(repoId: number) {
  const dates30 = generateDates(30);
  const buildMin   = randBetween(12, 28);
  const flakyRate  = randBetween(5, 30);
  const coverage   = randBetween(55, 90);
  const typeSafety = randBetween(35, 90);
  const prTime     = randBetween(8, 45);
  const staleDocsP = randBetween(15, 60);
  const successRate = randBetween(78, 97);
  const dxScore    = Math.round(randBetween(45, 85));

  function scoreStatus(s: number) { return s < 50 ? "critical" : s < 70 ? "warning" : "good"; }

  const ciCd = {
    avgBuildTimeMinutes: buildMin,
    avgBuildTimeDelta: randBetween(-5, 0),
    successRate,
    flakiness: randBetween(4, 22),
    buildTimeTrend: dates30.map((date, i) => ({
      date,
      value: parseFloat((buildMin + Math.sin(i * 0.4) * 2 + (Math.random() - 0.5) * 1.5).toFixed(1)),
    })),
    slowestSteps: [
      { name: "Install dependencies",   avgDurationMinutes: randBetween(2, 6),  failureRate: randBetween(0.5, 4),  isBottleneck: false },
      { name: "Run unit tests",         avgDurationMinutes: randBetween(4, 10), failureRate: randBetween(4, 12),   isBottleneck: true  },
      { name: "Build production bundle",avgDurationMinutes: randBetween(3, 7),  failureRate: randBetween(0.5, 3),  isBottleneck: false },
      { name: "Run E2E tests",          avgDurationMinutes: randBetween(5, 14), failureRate: randBetween(8, 20),   isBottleneck: true  },
      { name: "Lint & typecheck",       avgDurationMinutes: randBetween(1, 4),  failureRate: randBetween(2, 8),    isBottleneck: false },
    ],
    buildsByDayOfWeek: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map((day, i) => ({
      day,
      avgMinutes: parseFloat((buildMin * [1.27, 0.95, 0.89, 0.92, 1.08, 0.73, 0.71][i] + (Math.random() - 0.5)).toFixed(1)),
      builds: Math.round(randBetween([40,55,65,60,45,8,5][i] * 0.8, [55,70,80,75,60,18,12][i])),
    })),
  };

  const totalTests = Math.round(randBetween(500, 3500));
  const testHealth = {
    totalTests,
    flakyTests: Math.round(totalTests * flakyRate / 100),
    flakyRate,
    coveragePercent: coverage,
    coverageDelta: randBetween(-2, 8),
    failurePatterns: [
      { pattern: "Timeout in async operations",       count: Math.round(randBetween(5, 30)),  affectedTests: Math.round(randBetween(8, 40)),  isFlaky: true  },
      { pattern: "Race condition in state updates",   count: Math.round(randBetween(5, 25)),  affectedTests: Math.round(randBetween(6, 30)),  isFlaky: true  },
      { pattern: "Missing mock for external API",     count: Math.round(randBetween(3, 18)),  affectedTests: Math.round(randBetween(3, 18)),  isFlaky: false },
    ],
    coverageByModule: [
      { module: "auth",     coverage: randBetween(70, 98), status: "good"     },
      { module: "api",      coverage: randBetween(50, 90), status: "warning"  },
      { module: "ui",       coverage: randBetween(40, 80), status: "warning"  },
      { module: "payments", coverage: randBetween(30, 60), status: "critical" },
      { module: "utils",    coverage: randBetween(35, 70), status: "warning"  },
    ].map(m => ({ ...m, status: m.coverage >= 80 ? "good" : m.coverage >= 60 ? "warning" : "critical" as any })),
  };

  const codeQuality = {
    overallScore: randBetween(50, 90),
    typeSafetyScore: typeSafety,
    complexityAvg: randBetween(8, 22),
    duplicateCodePercent: randBetween(3, 15),
    bugPatterns: [
      { pattern: "Unhandled Promise rejection",   occurrences: Math.round(randBetween(10, 80)),  category: "Error Handling",  suggestedFix: "Add .catch() or async/await try-catch" },
      { pattern: "Implicit any type",             occurrences: Math.round(randBetween(50, 400)), category: "Type Safety",     suggestedFix: "Enable strict mode in tsconfig" },
      { pattern: "Unused variables",              occurrences: Math.round(randBetween(20, 200)), category: "Code Cleanliness",suggestedFix: "Add ESLint no-unused-vars rule" },
    ],
    qualityTrend: dates30.map((date, i) => ({
      date,
      value: parseFloat((randBetween(50, 90) - 8 + i * 0.27 + (Math.random() - 0.5) * 1.5).toFixed(1)),
    })),
    topIssues: [
      { file: "src/services/api.ts",    line: Math.round(randBetween(50, 200)), severity: "error",   rule: "no-explicit-any",              message: "Unexpected any. Specify a different type." },
      { file: "src/components/App.tsx", line: Math.round(randBetween(30, 100)), severity: "error",   rule: "react-hooks/exhaustive-deps",   message: "useEffect has missing dependencies" },
      { file: "src/utils/helpers.js",                                           severity: "warning",  rule: "complexity",                   message: `Function complexity (${Math.round(randBetween(18, 35))}) exceeds limit (20)` },
    ],
  };

  const prReview = {
    avgTimeToFirstReviewHours: prTime,
    avgTimeToMergeHours: parseFloat((prTime * 2.46).toFixed(1)),
    avgReviewCycles: randBetween(1.5, 3.5),
    prSizeDistribution: [
      { size: "XS (< 10 lines)",    count: Math.round(randBetween(10, 40)),  avgReviewTimeHours: randBetween(2, 8)   },
      { size: "S (10-100 lines)",   count: Math.round(randBetween(40, 120)), avgReviewTimeHours: randBetween(8, 20)  },
      { size: "M (100-500 lines)",  count: Math.round(randBetween(30, 90)),  avgReviewTimeHours: randBetween(20, 50) },
      { size: "L (500-1000 lines)", count: Math.round(randBetween(10, 40)),  avgReviewTimeHours: randBetween(40, 80) },
      { size: "XL (> 1000 lines)",  count: Math.round(randBetween(3, 20)),   avgReviewTimeHours: randBetween(60, 120)},
    ],
    reviewerLoad: ["alice", "bob", "carlos", "diana", "evan"].map(name => ({
      reviewer: name,
      prCount: Math.round(randBetween(8, 55)),
      avgResponseHours: randBetween(4, 50),
    })),
    reviewTimeTrend: dates30.map((date, i) => ({
      date,
      value: parseFloat((prTime - i * 0.3 + (Math.random() - 0.5) * 4).toFixed(1)),
    })),
  };

  const totalDocs = Math.round(randBetween(80, 350));
  const docs = {
    totalDocs,
    staleDocsPercent: staleDocsP,
    avgAgeMonths: randBetween(4, 14),
    missingDocs: Math.round(randBetween(5, 50)),
    docsByFreshness: [
      { category: "Fresh (< 1 month)",        count: Math.round(totalDocs * 0.13) },
      { category: "Recent (1-3 months)",      count: Math.round(totalDocs * 0.19) },
      { category: "Aging (3-6 months)",       count: Math.round(totalDocs * 0.26) },
      { category: "Stale (6-12 months)",      count: Math.round(totalDocs * 0.28) },
      { category: "Very Stale (> 12 months)", count: Math.round(totalDocs * 0.14) },
    ],
    mostStale: [
      { path: "docs/api/authentication.md",       lastUpdated: "2023-08-14", monthsOld: 19.5, category: "API Reference" },
      { path: "docs/setup/environment-variables.md", lastUpdated: "2023-09-02", monthsOld: 18.9, category: "Setup" },
      { path: "docs/architecture/data-flow.md",   lastUpdated: "2023-10-17", monthsOld: 17.4, category: "Architecture" },
    ],
  };

  const overview = {
    dxScore,
    dxScoreDelta: randBetween(5, 18),
    criticalIssues: Math.round(randBetween(1, 6)),
    warnings: Math.round(randBetween(3, 12)),
    improvements: Math.round(randBetween(5, 18)),
    tracks: [
      { id: "ci-cd",        name: "CI/CD Pipeline", score: randBetween(30, 75), status: "warning", topIssue: `Avg build time ${buildMin} min` },
      { id: "test-health",  name: "Test Health",    score: randBetween(35, 80), status: "warning", topIssue: `${flakyRate}% flaky test rate`  },
      { id: "code-quality", name: "Code Quality",   score: randBetween(40, 85), status: "warning", topIssue: `Type safety ${typeSafety}%`     },
      { id: "pr-review",    name: "PR Review",      score: randBetween(30, 75), status: "warning", topIssue: `First review: ${prTime}h`       },
      { id: "docs",         name: "Documentation",  score: randBetween(25, 70), status: "warning", topIssue: `${staleDocsP}% stale docs`      },
      { id: "dependencies", name: "Dependencies",   score: randBetween(55, 88), status: "warning", topIssue: "Dependency audit complete"       },
    ].map(t => ({ ...t, status: scoreStatus(t.score) as any })),
  };

  const beforeAfter = {
    period: "90 days after applying DX-Ray recommendations",
    metrics: [
      { label: "Avg Build Time",       before: buildMin,    after: parseFloat((buildMin * 0.53).toFixed(1)),          unit: "min",    improvement: -47.1, isPositiveWhenIncreasing: false },
      { label: "Flaky Test Rate",      before: flakyRate,   after: parseFloat((flakyRate * 0.19).toFixed(1)),         unit: "%",      improvement: -81.3, isPositiveWhenIncreasing: false },
      { label: "Test Coverage",        before: coverage,    after: parseFloat((Math.min(coverage * 1.24, 99)).toFixed(1)), unit: "%", improvement: 23.8,  isPositiveWhenIncreasing: true  },
      { label: "Time to First Review", before: prTime,      after: parseFloat((prTime * 0.23).toFixed(1)),            unit: "hrs",   improvement: -77.0, isPositiveWhenIncreasing: false },
      { label: "Type Safety Score",    before: typeSafety,  after: parseFloat((Math.min(typeSafety * 1.9, 99)).toFixed(1)), unit: "%", improvement: 89.6, isPositiveWhenIncreasing: true  },
      { label: "Stale Docs",          before: staleDocsP,  after: parseFloat((staleDocsP * 0.27).toFixed(1)),        unit: "%",     improvement: -73.2, isPositiveWhenIncreasing: false },
      { label: "CI Success Rate",      before: successRate, after: parseFloat((Math.min(successRate * 1.12, 99.5)).toFixed(1)), unit: "%", improvement: 11.9, isPositiveWhenIncreasing: true  },
      { label: "DX Score",             before: dxScore,     after: Math.min(dxScore + 34, 98),                       unit: "pts",   improvement: 70.8,  isPositiveWhenIncreasing: true  },
      { label: "Deploy Frequency",     before: randBetween(2, 5), after: randBetween(6, 12),                        unit: "/week", improvement: 171.9, isPositiveWhenIncreasing: true  },
    ],
  };

  return { ciCd, testHealth, codeQuality, prReview, docs, overview, beforeAfter };
}

router.get("/scans", async (req, res) => {
  const repositoryId = req.query.repositoryId ? parseInt(req.query.repositoryId as string) : undefined;
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
  const repoId = body.repositoryId;

  // Create scan record
  const [scan] = await db.insert(scansTable).values({
    repositoryId: repoId,
    tracks: JSON.stringify(body.tracks),
    status: "running",
  }).returning();

  // Generate new metrics and persist them asynchronously
  const computeAndStore = async () => {
    try {
      const metrics = generateFreshMetrics(repoId);

      // Delete old metrics for this repo and replace with fresh ones
      for (const [type, data] of Object.entries({
        "ci-cd":        metrics.ciCd,
        "test-health":  metrics.testHealth,
        "code-quality": metrics.codeQuality,
        "pr-review":    metrics.prReview,
        "docs":         metrics.docs,
        "overview":     metrics.overview,
        "before-after": metrics.beforeAfter,
      })) {
        await db.delete(repositoryMetricsTable).where(and(
          eq(repositoryMetricsTable.repositoryId, repoId),
          eq(repositoryMetricsTable.metricType, type),
        ));
        await db.insert(repositoryMetricsTable).values({ repositoryId: repoId, metricType: type, data });
      }

      const dxScore = metrics.overview.dxScore;
      const oldScore = await db.select().from(repositoriesTable).where(eq(repositoriesTable.id, repoId)).limit(1);
      const prevScore = oldScore[0]?.dxScore ?? dxScore;

      // Update repo score and last scan time
      await db.update(repositoriesTable)
        .set({ dxScore, lastScanAt: new Date() })
        .where(eq(repositoriesTable.id, repoId));

      // Mark scan as completed
      await db.update(scansTable)
        .set({ status: "completed", completedAt: new Date(), dxScoreBefore: prevScore, dxScoreAfter: dxScore, summary: `Scan complete. DX Score: ${dxScore}. Found ${metrics.overview.criticalIssues} critical issues.` })
        .where(eq(scansTable.id, scan.id));

      // Refresh insights for this repo
      await db.delete(insightsTable).where(eq(insightsTable.repositoryId, repoId));
      await db.insert(insightsTable).values([
        {
          repositoryId: repoId,
          track: "ci-cd",
          severity: metrics.ciCd.avgBuildTimeMinutes > 20 ? "critical" : "warning",
          title: `Build Time Alert: ${metrics.ciCd.avgBuildTimeMinutes} min Average`,
          description: `Your pipeline averages ${metrics.ciCd.avgBuildTimeMinutes} minutes per build. The E2E test step has a ${metrics.ciCd.slowestSteps[3]?.failureRate ?? 10}% failure rate and is your primary bottleneck.`,
          impact: `Developers lose ${(metrics.ciCd.avgBuildTimeMinutes * 0.3).toFixed(0)} minutes per blocked PR.`,
          recommendation: "Enable caching for node_modules. Split E2E tests into a non-blocking parallel job. Quarantine flaky steps with --retries=2.",
          estimatedHoursSaved: Math.round(metrics.ciCd.avgBuildTimeMinutes * 2.1),
        },
        {
          repositoryId: repoId,
          track: "test-health",
          severity: metrics.testHealth.flakyRate > 20 ? "critical" : "warning",
          title: `${metrics.testHealth.flakyRate}% Flaky Test Rate Detected`,
          description: `${metrics.testHealth.flakyTests} of ${metrics.testHealth.totalTests} tests fail intermittently. Top patterns: async timeouts and race conditions in state updates.`,
          impact: "Developers investigate false-positive failures for ~2 hours/week, eroding trust in CI.",
          recommendation: "Implement flaky test quarantine. Use fake timers for async tests. Add retry logic in CI for known-flaky tests.",
          estimatedHoursSaved: Math.round(metrics.testHealth.flakyRate * 1.8),
        },
        {
          repositoryId: repoId,
          track: "code-quality",
          severity: metrics.codeQuality.typeSafetyScore < 50 ? "critical" : "warning",
          title: `Type Safety Score: ${metrics.codeQuality.typeSafetyScore}% — ${metrics.codeQuality.bugPatterns[1]?.occurrences ?? 0} Implicit Any Types`,
          description: `TypeScript is enabled but underutilized. ${metrics.codeQuality.bugPatterns[1]?.occurrences ?? 0} implicit any types detected in service layer and API handlers.`,
          impact: "Type-related bugs account for ~35% of recent production incidents.",
          recommendation: "Enable strict mode in tsconfig. Migrate file-by-file starting with the most error-prone modules. Use ts-migrate for mass annotation.",
          estimatedHoursSaved: 60,
        },
        {
          repositoryId: repoId,
          track: "pr-review",
          severity: metrics.prReview.avgTimeToFirstReviewHours > 24 ? "critical" : "warning",
          title: `PR Review Bottleneck: ${metrics.prReview.avgTimeToFirstReviewHours}h Average First Review`,
          description: `Reviews are concentrated on 2 engineers. Context-switching overhead compounds as PRs sit unreviewed.`,
          impact: `Avg merge time is ${metrics.prReview.avgTimeToMergeHours}h. Each stalled PR delays feature delivery by up to 2 days.`,
          recommendation: "Set up CODEOWNERS for distributed responsibility. Implement a 4h SLA on first review during business hours.",
          estimatedHoursSaved: 38,
        },
        {
          repositoryId: repoId,
          track: "docs",
          severity: metrics.docs.staleDocsPercent > 40 ? "critical" : "warning",
          title: `${metrics.docs.staleDocsPercent}% of Documentation Is Stale`,
          description: `${Math.round(metrics.docs.totalDocs * metrics.docs.staleDocsPercent / 100)} of ${metrics.docs.totalDocs} docs haven't been updated in 6+ months. ${metrics.docs.missingDocs} APIs have no documentation at all.`,
          impact: "New developers average 3+ hours debugging issues caused by outdated guides before their first commit.",
          recommendation: "Link docs to code changes via doc-drift detection in CI. Auto-generate API changelogs. Require doc updates in PR review checklist.",
          estimatedHoursSaved: 22,
        },
      ]);
    } catch (err) {
      await db.update(scansTable).set({ status: "failed" }).where(eq(scansTable.id, scan.id));
    }
  };

  // Don't await — run in background so response is immediate
  computeAndStore();

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
  if (!scan) { res.status(404).json({ error: "Scan not found" }); return; }
  res.json({
    ...scan,
    tracks: JSON.parse(scan.tracks as string),
    startedAt: scan.startedAt.toISOString(),
    completedAt: scan.completedAt?.toISOString() ?? null,
  });
});

export default router;
