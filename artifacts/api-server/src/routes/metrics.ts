import { Router, type IRouter } from "express";

const router: IRouter = Router();

function generateDates(days: number): string[] {
  const dates: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split("T")[0]);
  }
  return dates;
}

router.get("/metrics/overview", (_req, res) => {
  res.json({
    dxScore: 62,
    dxScoreDelta: 14,
    criticalIssues: 3,
    warnings: 7,
    improvements: 12,
    tracks: [
      { id: "ci-cd", name: "CI/CD Pipeline", score: 45, status: "critical", topIssue: "Avg build time 22 min (target: <15 min)" },
      { id: "test-health", name: "Test Health", score: 58, status: "warning", topIssue: "23% of failures are flaky tests" },
      { id: "code-quality", name: "Code Quality", score: 71, status: "warning", topIssue: "847 type safety violations found" },
      { id: "pr-review", name: "PR Review", score: 52, status: "critical", topIssue: "Avg time-to-first-review: 28 hours" },
      { id: "docs", name: "Documentation", score: 38, status: "critical", topIssue: "42% of docs not updated in 6+ months" },
      { id: "dependencies", name: "Dependencies", score: 74, status: "warning", topIssue: "12 packages with known vulnerabilities" },
    ],
  });
});

router.get("/metrics/ci-cd", (_req, res) => {
  const dates = generateDates(30);
  const buildTimeTrend = dates.map((date, i) => ({
    date,
    value: parseFloat((22 - Math.sin(i * 0.3) * 3 + Math.random() * 2).toFixed(1)),
    label: `${(22 - Math.sin(i * 0.3) * 3).toFixed(1)} min`,
  }));

  res.json({
    avgBuildTimeMinutes: 22.3,
    avgBuildTimeDelta: -3.2,
    successRate: 87.4,
    flakiness: 12.6,
    buildTimeTrend,
    slowestSteps: [
      { name: "Install dependencies", avgDurationMinutes: 4.8, failureRate: 2.1, isBottleneck: false },
      { name: "Run unit tests", avgDurationMinutes: 7.2, failureRate: 8.4, isBottleneck: true },
      { name: "Build production bundle", avgDurationMinutes: 5.1, failureRate: 1.2, isBottleneck: false },
      { name: "Run E2E tests", avgDurationMinutes: 9.8, failureRate: 14.7, isBottleneck: true },
      { name: "Docker build & push", avgDurationMinutes: 3.4, failureRate: 0.8, isBottleneck: false },
      { name: "Lint & typecheck", avgDurationMinutes: 2.1, failureRate: 5.3, isBottleneck: false },
    ],
    buildsByDayOfWeek: [
      { day: "Monday", avgMinutes: 28.4, builds: 47 },
      { day: "Tuesday", avgMinutes: 21.2, builds: 63 },
      { day: "Wednesday", avgMinutes: 19.8, builds: 71 },
      { day: "Thursday", avgMinutes: 20.5, builds: 68 },
      { day: "Friday", avgMinutes: 24.1, builds: 52 },
      { day: "Saturday", avgMinutes: 16.3, builds: 12 },
      { day: "Sunday", avgMinutes: 15.9, builds: 8 },
    ],
  });
});

router.get("/metrics/test-health", (_req, res) => {
  res.json({
    totalTests: 2847,
    flakyTests: 64,
    flakyRate: 22.5,
    coveragePercent: 68.4,
    coverageDelta: 4.2,
    failurePatterns: [
      { pattern: "Timeout in async operations", count: 23, affectedTests: 31, isFlaky: true },
      { pattern: "Race condition in state updates", count: 18, affectedTests: 24, isFlaky: true },
      { pattern: "Missing mock for external API", count: 12, affectedTests: 12, isFlaky: false },
      { pattern: "Snapshot mismatch after dependency update", count: 8, affectedTests: 8, isFlaky: false },
      { pattern: "Network request not intercepted", count: 7, affectedTests: 11, isFlaky: true },
    ],
    coverageByModule: [
      { module: "auth", coverage: 92.3, status: "good" },
      { module: "api/users", coverage: 84.1, status: "good" },
      { module: "components/ui", coverage: 71.5, status: "warning" },
      { module: "api/payments", coverage: 45.2, status: "critical" },
      { module: "utils/analytics", coverage: 38.7, status: "critical" },
      { module: "hooks", coverage: 61.4, status: "warning" },
      { module: "pages", coverage: 53.8, status: "warning" },
      { module: "services", coverage: 79.1, status: "warning" },
    ],
  });
});

router.get("/metrics/code-quality", (_req, res) => {
  const dates = generateDates(30);
  const qualityTrend = dates.map((date, i) => ({
    date,
    value: parseFloat((58 + i * 0.4 + Math.random() * 2).toFixed(1)),
  }));

  res.json({
    overallScore: 71.3,
    typeSafetyScore: 48.2,
    complexityAvg: 14.7,
    duplicateCodePercent: 8.3,
    bugPatterns: [
      {
        pattern: "Unhandled Promise rejection",
        occurrences: 47,
        category: "Error Handling",
        suggestedFix: "Add .catch() handlers or use async/await with try-catch",
      },
      {
        pattern: "Missing TypeScript types (implicit any)",
        occurrences: 284,
        category: "Type Safety",
        suggestedFix: "Enable strict mode in tsconfig and add explicit types",
      },
      {
        pattern: "Unused variables / imports",
        occurrences: 132,
        category: "Code Cleanliness",
        suggestedFix: "Run ESLint with no-unused-vars rule and clean up",
      },
      {
        pattern: "Mutating function arguments",
        occurrences: 23,
        category: "Immutability",
        suggestedFix: "Use spread operator or Object.assign to create copies",
      },
      {
        pattern: "Console.log in production code",
        occurrences: 89,
        category: "Debug Artifacts",
        suggestedFix: "Remove or replace with proper logging framework",
      },
    ],
    qualityTrend,
    topIssues: [
      { file: "src/services/payment.ts", line: 142, severity: "error", rule: "no-explicit-any", message: "Unexpected any. Specify a different type." },
      { file: "src/components/UserProfile.tsx", line: 67, severity: "error", rule: "react-hooks/exhaustive-deps", message: "React Hook useEffect has missing dependencies: 'userId'" },
      { file: "src/utils/format.js", severity: "warning", rule: "complexity", message: "Function complexity (24) exceeds limit (20)" },
      { file: "src/api/client.ts", line: 89, severity: "error", rule: "@typescript-eslint/no-floating-promises", message: "Floating promises are not allowed" },
      { file: "src/pages/Dashboard.tsx", line: 211, severity: "warning", rule: "sonarjs/cognitive-complexity", message: "Cognitive complexity of this function is 18 (allowed: 15)" },
    ],
  });
});

router.get("/metrics/pr-review", (_req, res) => {
  const dates = generateDates(30);
  const reviewTimeTrend = dates.map((date, i) => ({
    date,
    value: parseFloat((28 - i * 0.3 + Math.random() * 4).toFixed(1)),
  }));

  res.json({
    avgTimeToFirstReviewHours: 27.8,
    avgTimeToMergeHours: 68.4,
    avgReviewCycles: 2.3,
    prSizeDistribution: [
      { size: "XS (< 10 lines)", count: 23, avgReviewTimeHours: 4.2 },
      { size: "S (10-100 lines)", count: 87, avgReviewTimeHours: 12.7 },
      { size: "M (100-500 lines)", count: 64, avgReviewTimeHours: 31.4 },
      { size: "L (500-1000 lines)", count: 28, avgReviewTimeHours: 52.8 },
      { size: "XL (> 1000 lines)", count: 12, avgReviewTimeHours: 94.3 },
    ],
    reviewerLoad: [
      { reviewer: "sarah.chen", prCount: 48, avgResponseHours: 6.2 },
      { reviewer: "marcos.silva", prCount: 31, avgResponseHours: 18.4 },
      { reviewer: "alex.park", prCount: 27, avgResponseHours: 22.1 },
      { reviewer: "priya.patel", prCount: 19, avgResponseHours: 31.7 },
      { reviewer: "james.okafor", prCount: 14, avgResponseHours: 48.2 },
    ],
    reviewTimeTrend,
  });
});

router.get("/metrics/docs", (_req, res) => {
  res.json({
    totalDocs: 287,
    staleDocsPercent: 42.2,
    avgAgeMonths: 8.3,
    missingDocs: 34,
    docsByFreshness: [
      { category: "Fresh (< 1 month)", count: 38 },
      { category: "Recent (1-3 months)", count: 54 },
      { category: "Aging (3-6 months)", count: 74 },
      { category: "Stale (6-12 months)", count: 81 },
      { category: "Very Stale (> 12 months)", count: 40 },
    ],
    mostStale: [
      { path: "docs/api/authentication.md", lastUpdated: "2023-08-14", monthsOld: 19.5, category: "API Reference" },
      { path: "docs/setup/environment-variables.md", lastUpdated: "2023-09-02", monthsOld: 18.9, category: "Setup" },
      { path: "docs/architecture/data-flow.md", lastUpdated: "2023-10-17", monthsOld: 17.4, category: "Architecture" },
      { path: "docs/api/webhooks.md", lastUpdated: "2023-11-05", monthsOld: 16.8, category: "API Reference" },
      { path: "CONTRIBUTING.md", lastUpdated: "2023-12-01", monthsOld: 15.9, category: "Contributing" },
      { path: "docs/deployment/kubernetes.md", lastUpdated: "2024-01-15", monthsOld: 14.5, category: "Deployment" },
    ],
  });
});

export default router;
