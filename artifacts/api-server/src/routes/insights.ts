import { Router, type IRouter } from "express";

const router: IRouter = Router();

const DEMO_INSIGHTS = [
  {
    id: 1,
    track: "ci-cd",
    severity: "critical",
    title: "Monday Build Spike: 3x Slower Than Midweek",
    description: "Analysis of 300 builds over 90 days reveals build times on Mondays average 28.4 minutes — 43% slower than Wednesday peaks. This correlates with merged dependency updates and large batched PRs over weekends.",
    impact: "Each developer waits ~13 additional minutes per Monday build. With 15 developers, that's 195 developer-minutes lost every Monday.",
    recommendation: "Split the CI pipeline: move dependency install caching to a dedicated job that runs on push to main, not on every PR. Enable Nx caching or Turborepo to avoid rebuilding unchanged modules.",
    estimatedHoursSaved: 48,
  },
  {
    id: 2,
    track: "ci-cd",
    severity: "critical",
    title: "E2E Test Suite Is Your Biggest Bottleneck",
    description: "The E2E test step averages 9.8 minutes with a 14.7% failure rate. These failures are disproportionately flaky, not real regressions. The tests block the entire pipeline on every PR.",
    impact: "On a team merging 12 PRs/day, flaky E2E failures cause ~26 unnecessary re-runs per week, wasting ~4.2 hours of CI compute.",
    recommendation: "Quarantine flaky E2E tests with a retry mechanism (--retries=2). Move E2E tests to a non-blocking parallel job. Only block merges on unit and integration tests.",
    estimatedHoursSaved: 32,
  },
  {
    id: 3,
    track: "test-health",
    severity: "critical",
    title: "23% of Test Failures Are Flaky — Not Real Bugs",
    description: "Pattern analysis identified 64 tests that fail intermittently with no correlation to code changes. The top patterns are async timeouts (36%) and race conditions in state updates (28%).",
    impact: "Developers spend an estimated 2.1 hours/week investigating false-positive test failures, undermining trust in the test suite.",
    recommendation: "Implement a flaky test detector in your CI: flag tests that fail on retry as flaky, not failed. Add these to a quarantine label and file automatic issues. Use fake timers (vi.useFakeTimers) for async tests.",
    estimatedHoursSaved: 42,
  },
  {
    id: 4,
    track: "test-health",
    severity: "warning",
    title: "Payment Module Has Dangerously Low Coverage (45%)",
    description: "The payments module, which handles billing and subscriptions, has only 45.2% test coverage — the lowest of any critical module. This module saw 3 production incidents in the last quarter.",
    impact: "Each production incident in payments costs an estimated 8 hours to diagnose and fix, plus customer-facing impact. Low coverage is correlated with bug density.",
    recommendation: "Set a coverage gate of 80% for the payments module in CI. Write integration tests against a Stripe test environment. Prioritize testing the checkout and webhook handlers.",
    estimatedHoursSaved: 24,
  },
  {
    id: 5,
    track: "code-quality",
    severity: "critical",
    title: "284 Implicit `any` Types — Your Type Safety Is at 48%",
    description: "ESLint and TypeScript analysis found 284 instances of implicit `any` type — mostly in service layer code, API responses, and form handlers. This codebase is using TypeScript but not benefiting from it.",
    impact: "Of the last 20 production bugs, 7 (35%) were type-related errors that TypeScript strict mode would have caught at compile time.",
    recommendation: "Enable `strict: true` and `noImplicitAny: true` in tsconfig. Migrate file-by-file starting with the most bug-prone modules. Use `ts-migrate` to automatically add types to existing files as a starting point.",
    estimatedHoursSaved: 60,
  },
  {
    id: 6,
    track: "code-quality",
    severity: "warning",
    title: "89 Console.log Statements Leaked to Production",
    description: "Static analysis found 89 console.log, console.debug, and console.warn statements scattered across production code. These expose sensitive data and degrade performance.",
    impact: "Sensitive user data (emails, session tokens) have been observed in browser console logs in production. This is a security and compliance concern.",
    recommendation: "Add ESLint rule `no-console: error` and replace with a structured logger (pino, winston). Implement log levels so debug logs are stripped in production builds.",
    estimatedHoursSaved: 8,
  },
  {
    id: 7,
    track: "pr-review",
    severity: "critical",
    title: "PR Review Bottleneck: 80% of PRs Reviewed by 2 People",
    description: "sarah.chen and marcos.silva review 79 out of 214 PRs (37%), but sarah alone handles 22% of all reviews. This creates a single point of failure and severe review queue pressure.",
    impact: "Average time-to-first-review is 27.8 hours. PRs waiting >24 hours increase context-switching by 2.8x when authors return to address feedback.",
    recommendation: "Implement CODEOWNERS to distribute ownership. Use a load-balanced reviewer assignment tool (like Pullpo or GitHub's round-robin). Set SLA: every PR should have a first review within 4 hours during business hours.",
    estimatedHoursSaved: 38,
  },
  {
    id: 8,
    track: "pr-review",
    severity: "warning",
    title: "XL PRs Take 3.5x Longer to Review Than Medium PRs",
    description: "The 12 PRs classified as XL (>1000 lines) average 94.3 hours to merge — versus 31.4 hours for medium PRs. XL PRs also have a 4.2x higher chance of introducing bugs.",
    impact: "12 XL PRs/month × (94.3 - 31.4) hours extra = 754 hours of additional delay per month. That's nearly 4 developer-weeks.",
    recommendation: "Enforce a PR size limit: auto-label PRs over 500 lines as 'needs-splitting' and block merging until split. Introduce stacked PRs workflow (using tools like Graphite) for large features.",
    estimatedHoursSaved: 28,
  },
  {
    id: 9,
    track: "docs",
    severity: "critical",
    title: "Authentication Docs Are 19 Months Out of Date",
    description: "The authentication guide (docs/api/authentication.md) hasn't been updated since August 2023, but the auth system was overhauled in Q1 2024 to use PKCE OAuth. New developers are following wrong instructions.",
    impact: "Onboarding tickets show 6 developers in the last quarter spent an average of 3.2 hours debugging auth issues caused by stale documentation.",
    recommendation: "Immediately update authentication docs. Implement doc-code drift detection: link code changes to docs and flag when related docs haven't been updated within 7 days of a commit.",
    estimatedHoursSaved: 18,
  },
  {
    id: 10,
    track: "docs",
    severity: "warning",
    title: "34 Public APIs Have No Documentation",
    description: "API surface analysis found 34 exported functions and API endpoints with no corresponding documentation. These are primarily in the analytics and reporting modules.",
    impact: "Undocumented APIs lead to incorrect usage patterns. Analysis shows 12 of these undocumented APIs are called incorrectly in at least one place in the codebase.",
    recommendation: "Enforce documentation requirements in CI: use TypeDoc or JSDoc linting to require documentation on all public exports. Add a GitHub Action that fails the PR if public APIs are added without docs.",
    estimatedHoursSaved: 14,
  },
];

router.get("/insights", (req, res) => {
  const severity = req.query.severity as string | undefined;
  let insights = DEMO_INSIGHTS;
  if (severity) {
    insights = insights.filter(i => i.severity === severity);
  }
  res.json(insights);
});

export default router;
