import { db } from "@workspace/db";
import { repositoriesTable, repositoryMetricsTable, insightsTable, scansTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

function generateDates(days: number): Array<{ date: string; value: number }> {
  const dates = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push({ date: d.toISOString().split("T")[0], value: 0 });
  }
  return dates;
}

function vary(base: number, pct: number): number {
  return parseFloat((base * (1 + (Math.random() - 0.5) * 2 * pct)).toFixed(1));
}

function buildMetrics(repoId: number, variant: "platform" | "mobile" | "pipeline") {
  const cfgs = {
    platform: { buildMin: 22.3, buildDelta: -3.2, successRate: 87.4, flakiness: 12.6, dxScore: 62, flakyRate: 22.5, coverage: 68.4, qualityScore: 71.3, typeSafety: 48.2, prTime: 27.8, stalePercent: 42.2 },
    mobile:   { buildMin: 14.7, buildDelta: -1.1, successRate: 93.2, flakiness: 6.3,  dxScore: 74, flakyRate: 9.4,  coverage: 81.2, qualityScore: 83.1, typeSafety: 76.8, prTime: 14.1, stalePercent: 28.7 },
    pipeline: { buildMin: 31.5, buildDelta: -8.4, successRate: 79.1, flakiness: 21.2, dxScore: 51, flakyRate: 31.8, coverage: 54.3, qualityScore: 58.7, typeSafety: 32.1, prTime: 41.2, stalePercent: 61.4 },
  };
  const cfg = cfgs[variant];
  const dates30 = generateDates(30);

  // ── CI/CD ──
  const buildTimeTrend = dates30.map(({ date }, i) => ({
    date,
    value: parseFloat((cfg.buildMin + Math.sin(i * 0.4) * 2.5 + (Math.random() - 0.5) * 1.5).toFixed(1)),
  }));

  const ciCd = {
    avgBuildTimeMinutes: cfg.buildMin,
    avgBuildTimeDelta: cfg.buildDelta,
    successRate: cfg.successRate,
    flakiness: cfg.flakiness,
    buildTimeTrend,
    slowestSteps: variant === "platform"
      ? [
          { name: "Install dependencies", avgDurationMinutes: 4.8, failureRate: 2.1, isBottleneck: false },
          { name: "Run unit tests",        avgDurationMinutes: 7.2, failureRate: 8.4, isBottleneck: true  },
          { name: "Build production bundle", avgDurationMinutes: 5.1, failureRate: 1.2, isBottleneck: false },
          { name: "Run E2E tests",         avgDurationMinutes: 9.8, failureRate: 14.7, isBottleneck: true },
          { name: "Docker build & push",   avgDurationMinutes: 3.4, failureRate: 0.8, isBottleneck: false },
          { name: "Lint & typecheck",      avgDurationMinutes: 2.1, failureRate: 5.3, isBottleneck: false },
        ]
      : variant === "mobile"
      ? [
          { name: "Install dependencies",  avgDurationMinutes: 3.1, failureRate: 1.2, isBottleneck: false },
          { name: "Jest unit tests",        avgDurationMinutes: 4.4, failureRate: 3.8, isBottleneck: false },
          { name: "Expo build (iOS)",       avgDurationMinutes: 7.2, failureRate: 5.1, isBottleneck: true  },
          { name: "Detox E2E",             avgDurationMinutes: 5.3, failureRate: 8.2, isBottleneck: true  },
        ]
      : [
          { name: "Dependency resolution",  avgDurationMinutes: 7.8, failureRate: 4.3, isBottleneck: true  },
          { name: "Data validation step",   avgDurationMinutes: 12.4, failureRate: 17.2, isBottleneck: true },
          { name: "Model training (GPU)",   avgDurationMinutes: 18.1, failureRate: 9.1, isBottleneck: true  },
          { name: "Schema migration check", avgDurationMinutes: 2.3, failureRate: 6.4, isBottleneck: false },
          { name: "Data quality tests",     avgDurationMinutes: 4.8, failureRate: 22.1, isBottleneck: false },
        ],
    buildsByDayOfWeek: [
      { day: "Monday",    avgMinutes: vary(cfg.buildMin * 1.27, 0.08), builds: Math.round(vary(47, 0.2)) },
      { day: "Tuesday",   avgMinutes: vary(cfg.buildMin * 0.95, 0.08), builds: Math.round(vary(63, 0.2)) },
      { day: "Wednesday", avgMinutes: vary(cfg.buildMin * 0.89, 0.08), builds: Math.round(vary(71, 0.2)) },
      { day: "Thursday",  avgMinutes: vary(cfg.buildMin * 0.92, 0.08), builds: Math.round(vary(68, 0.2)) },
      { day: "Friday",    avgMinutes: vary(cfg.buildMin * 1.08, 0.08), builds: Math.round(vary(52, 0.2)) },
      { day: "Saturday",  avgMinutes: vary(cfg.buildMin * 0.73, 0.08), builds: Math.round(vary(12, 0.3)) },
      { day: "Sunday",    avgMinutes: vary(cfg.buildMin * 0.71, 0.08), builds: Math.round(vary(8,  0.3)) },
    ],
  };

  // ── Test Health ──
  const totalTests = variant === "platform" ? 2847 : variant === "mobile" ? 1243 : 682;
  const flakyCount = Math.round(totalTests * cfg.flakyRate / 100);
  const testHealth = {
    totalTests,
    flakyTests: flakyCount,
    flakyRate: cfg.flakyRate,
    coveragePercent: cfg.coverage,
    coverageDelta: vary(4.2, 0.5),
    failurePatterns: variant === "pipeline"
      ? [
          { pattern: "Schema validation failures", count: 18, affectedTests: 24, isFlaky: false },
          { pattern: "Timeout in remote API calls", count: 31, affectedTests: 38, isFlaky: true },
          { pattern: "Missing fixture data",        count: 14, affectedTests: 14, isFlaky: false },
        ]
      : [
          { pattern: "Timeout in async operations",     count: Math.round(vary(23, 0.3)), affectedTests: Math.round(vary(31, 0.3)), isFlaky: true  },
          { pattern: "Race condition in state updates",  count: Math.round(vary(18, 0.3)), affectedTests: Math.round(vary(24, 0.3)), isFlaky: true  },
          { pattern: "Missing mock for external API",    count: Math.round(vary(12, 0.3)), affectedTests: Math.round(vary(12, 0.3)), isFlaky: false },
          { pattern: "Snapshot mismatch after dep update", count: Math.round(vary(8, 0.4)), affectedTests: Math.round(vary(8, 0.4)), isFlaky: false },
          { pattern: "Network request not intercepted",  count: Math.round(vary(7, 0.3)),  affectedTests: Math.round(vary(11, 0.3)), isFlaky: true  },
        ],
    coverageByModule: variant === "mobile"
      ? [
          { module: "screens",        coverage: 88.2, status: "good"     },
          { module: "components",     coverage: 74.6, status: "warning"  },
          { module: "hooks",          coverage: 91.3, status: "good"     },
          { module: "services/api",   coverage: 62.1, status: "warning"  },
          { module: "navigation",     coverage: 55.4, status: "warning"  },
          { module: "store/payments", coverage: 41.8, status: "critical" },
        ]
      : variant === "pipeline"
      ? [
          { module: "ingestion",    coverage: 72.3, status: "warning"  },
          { module: "transforms",   coverage: 43.1, status: "critical" },
          { module: "models",       coverage: 38.9, status: "critical" },
          { module: "validation",   coverage: 61.4, status: "warning"  },
          { module: "outputs",      coverage: 29.7, status: "critical" },
        ]
      : [
          { module: "auth",            coverage: 92.3, status: "good"     },
          { module: "api/users",       coverage: 84.1, status: "good"     },
          { module: "components/ui",   coverage: 71.5, status: "warning"  },
          { module: "api/payments",    coverage: 45.2, status: "critical" },
          { module: "utils/analytics", coverage: 38.7, status: "critical" },
          { module: "hooks",           coverage: 61.4, status: "warning"  },
          { module: "pages",           coverage: 53.8, status: "warning"  },
          { module: "services",        coverage: 79.1, status: "warning"  },
        ],
  };

  // ── Code Quality ──
  const qualityTrend = dates30.map(({ date }, i) => ({
    date,
    value: parseFloat((cfg.qualityScore - 8 + i * 0.27 + (Math.random() - 0.5) * 1.5).toFixed(1)),
  }));
  const codeQuality = {
    overallScore: cfg.qualityScore,
    typeSafetyScore: cfg.typeSafety,
    complexityAvg: vary(14.7, 0.3),
    duplicateCodePercent: vary(8.3, 0.4),
    bugPatterns: variant === "pipeline"
      ? [
          { pattern: "Unhandled dataframe exceptions", occurrences: 34, category: "Error Handling", suggestedFix: "Wrap pandas ops in try/except and validate dtypes before processing" },
          { pattern: "Missing type annotations (Python)", occurrences: 187, category: "Type Safety", suggestedFix: "Add mypy to CI and annotate all public functions" },
          { pattern: "Mutable default arguments",      occurrences: 29,  category: "Python Anti-patterns", suggestedFix: "Replace mutable defaults (list/dict) with None sentinel" },
        ]
      : [
          { pattern: "Unhandled Promise rejection",          occurrences: Math.round(vary(47, 0.3)),  category: "Error Handling", suggestedFix: "Add .catch() handlers or use async/await with try-catch" },
          { pattern: "Missing TypeScript types (implicit any)", occurrences: Math.round(vary(284, 0.2)), category: "Type Safety",    suggestedFix: "Enable strict mode in tsconfig and add explicit types" },
          { pattern: "Unused variables / imports",           occurrences: Math.round(vary(132, 0.3)), category: "Code Cleanliness", suggestedFix: "Run ESLint with no-unused-vars rule and clean up" },
          { pattern: "Mutating function arguments",          occurrences: Math.round(vary(23, 0.4)),  category: "Immutability",    suggestedFix: "Use spread operator or Object.assign to create copies" },
          { pattern: "Console.log in production code",       occurrences: Math.round(vary(89, 0.3)),  category: "Debug Artifacts", suggestedFix: "Remove or replace with proper logging framework" },
        ],
    qualityTrend,
    topIssues: [
      { file: variant === "pipeline" ? "src/transforms/normalize.py" : "src/services/payment.ts", line: 142, severity: "error",   rule: variant === "pipeline" ? "no-untyped-def" : "no-explicit-any",              message: variant === "pipeline" ? "Function is missing a type annotation" : "Unexpected any. Specify a different type." },
      { file: variant === "mobile"   ? "src/screens/CheckoutScreen.tsx" : "src/components/UserProfile.tsx", line: 67, severity: "error", rule: "react-hooks/exhaustive-deps", message: "React Hook useEffect has missing dependencies" },
      { file: variant === "pipeline" ? "src/models/train.py"           : "src/utils/format.js",  severity: "warning", rule: "complexity",   message: `Function complexity (${variant === "pipeline" ? 31 : 24}) exceeds limit (20)` },
    ],
  };

  // ── PR Review ──
  const reviewTimeTrend = dates30.map(({ date }, i) => ({
    date,
    value: parseFloat((cfg.prTime - i * 0.3 + (Math.random() - 0.5) * 4).toFixed(1)),
  }));
  const prReview = {
    avgTimeToFirstReviewHours: cfg.prTime,
    avgTimeToMergeHours: vary(cfg.prTime * 2.46, 0.15),
    avgReviewCycles: vary(2.3, 0.3),
    prSizeDistribution: [
      { size: "XS (< 10 lines)",      count: Math.round(vary(23, 0.3)), avgReviewTimeHours: vary(4.2,  0.3) },
      { size: "S (10-100 lines)",     count: Math.round(vary(87, 0.2)), avgReviewTimeHours: vary(12.7, 0.3) },
      { size: "M (100-500 lines)",    count: Math.round(vary(64, 0.2)), avgReviewTimeHours: vary(31.4, 0.3) },
      { size: "L (500-1000 lines)",   count: Math.round(vary(28, 0.3)), avgReviewTimeHours: vary(52.8, 0.3) },
      { size: "XL (> 1000 lines)",    count: Math.round(vary(12, 0.4)), avgReviewTimeHours: vary(94.3, 0.3) },
    ],
    reviewerLoad: [
      { reviewer: variant === "mobile" ? "li.wei"      : "sarah.chen",   prCount: Math.round(vary(48, 0.2)), avgResponseHours: vary(6.2,  0.3) },
      { reviewer: variant === "mobile" ? "ananya.k"    : "marcos.silva", prCount: Math.round(vary(31, 0.2)), avgResponseHours: vary(18.4, 0.3) },
      { reviewer: variant === "mobile" ? "mike.torres" : "alex.park",    prCount: Math.round(vary(27, 0.3)), avgResponseHours: vary(22.1, 0.3) },
      { reviewer: variant === "mobile" ? "nadia.b"     : "priya.patel",  prCount: Math.round(vary(19, 0.3)), avgResponseHours: vary(31.7, 0.3) },
      { reviewer: variant === "mobile" ? "ryo.t"       : "james.okafor", prCount: Math.round(vary(14, 0.3)), avgResponseHours: vary(48.2, 0.3) },
    ],
    reviewTimeTrend,
  };

  // ── Docs ──
  const totalDocs = variant === "platform" ? 287 : variant === "mobile" ? 143 : 96;
  const docs = {
    totalDocs,
    staleDocsPercent: cfg.stalePercent,
    avgAgeMonths: vary(8.3, 0.3),
    missingDocs: Math.round(vary(34, 0.4)),
    docsByFreshness: [
      { category: "Fresh (< 1 month)",       count: Math.round(totalDocs * 0.133) },
      { category: "Recent (1-3 months)",     count: Math.round(totalDocs * 0.188) },
      { category: "Aging (3-6 months)",      count: Math.round(totalDocs * 0.258) },
      { category: "Stale (6-12 months)",     count: Math.round(totalDocs * 0.282) },
      { category: "Very Stale (> 12 months)", count: Math.round(totalDocs * 0.139) },
    ],
    mostStale: variant === "mobile"
      ? [
          { path: "docs/release-process.md",          lastUpdated: "2023-09-11", monthsOld: 18.6, category: "Process"      },
          { path: "docs/push-notifications.md",       lastUpdated: "2023-10-03", monthsOld: 17.9, category: "API Reference" },
          { path: "docs/deep-linking.md",             lastUpdated: "2023-11-18", monthsOld: 16.4, category: "Architecture"  },
        ]
      : variant === "pipeline"
      ? [
          { path: "docs/pipeline-architecture.md",    lastUpdated: "2023-07-05", monthsOld: 20.8, category: "Architecture"  },
          { path: "docs/model-training-guide.md",     lastUpdated: "2023-08-22", monthsOld: 19.3, category: "Guides"        },
          { path: "docs/data-schema-v2.md",           lastUpdated: "2023-10-01", monthsOld: 17.9, category: "API Reference" },
        ]
      : [
          { path: "docs/api/authentication.md",       lastUpdated: "2023-08-14", monthsOld: 19.5, category: "API Reference" },
          { path: "docs/setup/environment-variables.md", lastUpdated: "2023-09-02", monthsOld: 18.9, category: "Setup"      },
          { path: "docs/architecture/data-flow.md",   lastUpdated: "2023-10-17", monthsOld: 17.4, category: "Architecture"  },
          { path: "docs/api/webhooks.md",             lastUpdated: "2023-11-05", monthsOld: 16.8, category: "API Reference" },
          { path: "CONTRIBUTING.md",                  lastUpdated: "2023-12-01", monthsOld: 15.9, category: "Contributing"  },
          { path: "docs/deployment/kubernetes.md",    lastUpdated: "2024-01-15", monthsOld: 14.5, category: "Deployment"    },
        ],
  };

  // ── Overview ──
  const score = cfg.dxScore;
  function scoreStatus(s: number) { return s < 50 ? "critical" : s < 70 ? "warning" : "good"; }
  const overview = {
    dxScore: score,
    dxScoreDelta: vary(14, 0.4),
    criticalIssues: variant === "pipeline" ? 5 : variant === "mobile" ? 2 : 3,
    warnings:       variant === "pipeline" ? 9 : variant === "mobile" ? 5 : 7,
    improvements:   variant === "pipeline" ? 8 : variant === "mobile" ? 14 : 12,
    tracks: [
      { id: "ci-cd",         name: "CI/CD Pipeline",  score: vary(45, 0.15), status: scoreStatus(vary(45, 0.15)), topIssue: `Avg build time ${ciCd.avgBuildTimeMinutes} min` },
      { id: "test-health",   name: "Test Health",     score: vary(58, 0.15), status: scoreStatus(vary(58, 0.15)), topIssue: `${cfg.flakyRate}% flaky test rate`              },
      { id: "code-quality",  name: "Code Quality",    score: vary(71, 0.15), status: scoreStatus(vary(71, 0.15)), topIssue: `Type safety score: ${cfg.typeSafety}%`           },
      { id: "pr-review",     name: "PR Review",       score: vary(52, 0.15), status: scoreStatus(vary(52, 0.15)), topIssue: `Avg first review: ${cfg.prTime}h`                },
      { id: "docs",          name: "Documentation",   score: vary(38, 0.15), status: scoreStatus(vary(38, 0.15)), topIssue: `${cfg.stalePercent}% docs stale`                 },
      { id: "dependencies",  name: "Dependencies",    score: vary(74, 0.15), status: scoreStatus(vary(74, 0.15)), topIssue: "Vulnerability scan pending"                      },
    ],
  };

  // ── Before/After ──
  const beforeAfter = {
    period: "90 days after applying DX-Ray recommendations",
    metrics: [
      { label: "Avg Build Time",        before: cfg.buildMin,       after: parseFloat((cfg.buildMin * 0.53).toFixed(1)),  unit: "min",    improvement: -47.1, isPositiveWhenIncreasing: false },
      { label: "Flaky Test Rate",       before: cfg.flakyRate,      after: parseFloat((cfg.flakyRate * 0.19).toFixed(1)), unit: "%",      improvement: -81.3, isPositiveWhenIncreasing: false },
      { label: "Test Coverage",         before: cfg.coverage,       after: parseFloat((Math.min(cfg.coverage * 1.24, 99)).toFixed(1)), unit: "%", improvement: 23.8, isPositiveWhenIncreasing: true },
      { label: "Time to First Review",  before: cfg.prTime,         after: parseFloat((cfg.prTime * 0.23).toFixed(1)),   unit: "hrs",    improvement: -77.0, isPositiveWhenIncreasing: false },
      { label: "Time to Merge",         before: parseFloat((cfg.prTime * 2.46).toFixed(1)), after: parseFloat((cfg.prTime * 2.46 * 0.32).toFixed(1)), unit: "hrs", improvement: -67.7, isPositiveWhenIncreasing: false },
      { label: "Type Safety Score",     before: cfg.typeSafety,     after: parseFloat((Math.min(cfg.typeSafety * 1.9, 99)).toFixed(1)), unit: "%", improvement: 89.6, isPositiveWhenIncreasing: true },
      { label: "Stale Docs",           before: cfg.stalePercent,   after: parseFloat((cfg.stalePercent * 0.27).toFixed(1)), unit: "%", improvement: -73.2, isPositiveWhenIncreasing: false },
      { label: "CI Success Rate",       before: cfg.successRate,    after: parseFloat((Math.min(cfg.successRate * 1.12, 99.5)).toFixed(1)), unit: "%", improvement: 11.9, isPositiveWhenIncreasing: true },
      { label: "DX Score",              before: cfg.dxScore,        after: Math.min(cfg.dxScore + 34, 98),                unit: "pts",   improvement: 70.8, isPositiveWhenIncreasing: true  },
      { label: "Deploy Frequency",      before: vary(3.2, 0.3),     after: vary(8.7, 0.3),                                unit: "/week", improvement: 171.9, isPositiveWhenIncreasing: true },
    ],
  };

  return { ciCd, testHealth, codeQuality, prReview, docs, overview, beforeAfter };
}

async function seed() {
  console.log("Fetching repositories...");
  const repos = await db.select().from(repositoriesTable);
  if (repos.length === 0) {
    console.log("No repositories found. Run the app first to seed repos.");
    process.exit(1);
  }

  const variantMap: Record<string, "platform" | "mobile" | "pipeline"> = {
    "acme-platform":      "platform",
    "acme-mobile":        "mobile",
    "acme-data-pipeline": "pipeline",
  };

  for (const repo of repos) {
    const variant = variantMap[repo.name] ?? "platform";
    const metrics = buildMetrics(repo.id, variant);
    console.log(`Seeding metrics for: ${repo.name} (variant: ${variant})`);

    // Wipe existing metrics for this repo
    await db.delete(repositoryMetricsTable).where(eq(repositoryMetricsTable.repositoryId, repo.id));

    // Insert all metric types
    for (const [type, data] of Object.entries({
      "ci-cd":        metrics.ciCd,
      "test-health":  metrics.testHealth,
      "code-quality": metrics.codeQuality,
      "pr-review":    metrics.prReview,
      "docs":         metrics.docs,
      "overview":     metrics.overview,
      "before-after": metrics.beforeAfter,
    })) {
      await db.insert(repositoryMetricsTable).values({ repositoryId: repo.id, metricType: type, data });
    }

    // Update repo dxScore
    await db.update(repositoriesTable)
      .set({ dxScore: metrics.overview.dxScore, lastScanAt: new Date() })
      .where(eq(repositoriesTable.id, repo.id));

    console.log(`  ✓ ${repo.name} seeded`);
  }

  // Seed insights for each repo
  console.log("Seeding insights...");
  await db.delete(insightsTable);
  for (const repo of repos) {
    const variant = variantMap[repo.name] ?? "platform";
    const cfg = { platform: { buildMin: 22.3, prTime: 27.8, flakyRate: 22.5, typeSafety: 48.2 }, mobile: { buildMin: 14.7, prTime: 14.1, flakyRate: 9.4, typeSafety: 76.8 }, pipeline: { buildMin: 31.5, prTime: 41.2, flakyRate: 31.8, typeSafety: 32.1 } }[variant];
    await db.insert(insightsTable).values([
      {
        repositoryId: repo.id,
        track: "ci-cd",
        severity: "critical",
        title: "Monday Build Spike: 3x Slower Than Midweek",
        description: `Analysis of 300 builds over 90 days reveals build times on Mondays average ${(cfg.buildMin * 1.27).toFixed(1)} minutes — 27% slower than midweek. Batched weekend PRs cause large dependency installs.`,
        impact: `Each developer waits ~${(cfg.buildMin * 0.27).toFixed(0)} extra minutes per Monday build.`,
        recommendation: "Split the CI pipeline: move dependency install caching to a dedicated job on push to main. Enable module-level caching (Nx/Turborepo) to skip rebuilding unchanged packages.",
        estimatedHoursSaved: 48,
      },
      {
        repositoryId: repo.id,
        track: "test-health",
        severity: "critical",
        title: `${cfg.flakyRate}% of Test Failures Are Flaky — Not Real Bugs`,
        description: `Pattern analysis identified ${Math.round(cfg.flakyRate * 2.8)} tests failing intermittently with no correlation to code changes. Top patterns: async timeouts (36%) and race conditions (28%).`,
        impact: "Developers spend an estimated 2.1 hours/week investigating false-positive failures, eroding trust in the test suite.",
        recommendation: "Flag tests that pass on retry as flaky (not failed). Add quarantine labels. Use fake timers for async tests.",
        estimatedHoursSaved: 42,
      },
      {
        repositoryId: repo.id,
        track: "code-quality",
        severity: "critical",
        title: `Type Safety Score Is Only ${cfg.typeSafety}% — ${Math.round((100 - cfg.typeSafety) * 2.8)} Implicit \`any\` Types Found`,
        description: `ESLint + TypeScript analysis found widespread implicit \`any\` — mostly in service layer, API responses, and form handlers. You're using TypeScript but not benefiting from it.`,
        impact: `${Math.round((100 - cfg.typeSafety) * 0.07)}% of recent production bugs were type-related errors strict mode would catch at compile time.`,
        recommendation: "Enable `strict: true` + `noImplicitAny: true` in tsconfig. Migrate file-by-file starting with the most bug-prone modules.",
        estimatedHoursSaved: 60,
      },
      {
        repositoryId: repo.id,
        track: "pr-review",
        severity: "critical",
        title: `PR Review Bottleneck: Avg First Review Takes ${cfg.prTime}h`,
        description: `Analysis shows 80% of PRs are reviewed by just 2 engineers. This creates a single point of failure and forces authors back into context hours later.`,
        impact: `PRs waiting >${Math.round(cfg.prTime * 0.8)}h increase context-switching overhead by 2.8x when authors return to address feedback.`,
        recommendation: "Implement CODEOWNERS for distributed ownership. Set a 4-hour SLA for first review during business hours. Use round-robin assignment.",
        estimatedHoursSaved: 38,
      },
      {
        repositoryId: repo.id,
        track: "docs",
        severity: "warning",
        title: "Critical Setup Docs Are Outdated by 18+ Months",
        description: "Environment setup and authentication guides haven't been updated since 2023 Q3 but the systems they describe have been overhauled twice since.",
        impact: "New developers spend an average of 3.2 hours debugging issues caused by stale documentation before their first commit.",
        recommendation: "Link docs to code via doc-drift detector. Flag any doc not updated within 30 days of a related code change. Automate changelogs for public APIs.",
        estimatedHoursSaved: 18,
      },
    ]);
  }

  // Seed historical scans
  console.log("Seeding scan history...");
  await db.delete(scansTable);
  for (const repo of repos) {
    for (let i = 0; i < 5; i++) {
      const daysAgo = (5 - i) * 14;
      const started = new Date(); started.setDate(started.getDate() - daysAgo);
      const completed = new Date(started); completed.setMinutes(completed.getMinutes() + 8);
      await db.insert(scansTable).values({
        repositoryId: repo.id,
        status: "completed",
        tracks: JSON.stringify(["ci-cd", "test-health", "code-quality", "pr-review", "docs"]),
        startedAt: started,
        completedAt: completed,
        summary: `Full DX scan completed. Found ${3 + i} critical issues and ${6 + i} warnings.`,
        dxScoreBefore: parseFloat((48 + i * 2.5 + Math.random() * 2).toFixed(1)),
        dxScoreAfter: parseFloat((52 + i * 2.5 + Math.random() * 2).toFixed(1)),
      });
    }
  }

  console.log("✅ Seed complete!");
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
