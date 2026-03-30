import { Router, type IRouter } from "express";

const router: IRouter = Router();

router.get("/before-after", (_req, res) => {
  res.json({
    period: "90 days after applying DX-Ray recommendations",
    metrics: [
      { label: "Avg Build Time", before: 22.3, after: 11.8, unit: "min", improvement: -47.1, isPositiveWhenIncreasing: false },
      { label: "Flaky Test Rate", before: 22.5, after: 4.2, unit: "%", improvement: -81.3, isPositiveWhenIncreasing: false },
      { label: "Test Coverage", before: 68.4, after: 84.7, unit: "%", improvement: 23.8, isPositiveWhenIncreasing: true },
      { label: "Time to First Review", before: 27.8, after: 6.4, unit: "hrs", improvement: -77.0, isPositiveWhenIncreasing: false },
      { label: "Time to Merge", before: 68.4, after: 22.1, unit: "hrs", improvement: -67.7, isPositiveWhenIncreasing: false },
      { label: "Type Safety Score", before: 48.2, after: 91.4, unit: "%", improvement: 89.6, isPositiveWhenIncreasing: true },
      { label: "Stale Docs", before: 42.2, after: 11.3, unit: "%", improvement: -73.2, isPositiveWhenIncreasing: false },
      { label: "CI Success Rate", before: 87.4, after: 97.8, unit: "%", improvement: 11.9, isPositiveWhenIncreasing: true },
      { label: "DX Score", before: 48, after: 82, unit: "pts", improvement: 70.8, isPositiveWhenIncreasing: true },
      { label: "Deploy Frequency", before: 3.2, after: 8.7, unit: "/week", improvement: 171.9, isPositiveWhenIncreasing: true },
    ],
  });
});

export default router;
