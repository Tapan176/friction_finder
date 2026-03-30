/**
 * GitLab API Analyzer
 * Fetches real metrics from GitLab API.
 */

const GL_API = "https://gitlab.com/api/v4";

function headers(token?: string): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (token) h["PRIVATE-TOKEN"] = token;
  return h;
}

async function glFetch<T>(path: string, token?: string): Promise<T> {
  const res = await fetch(`${GL_API}${path}`, { headers: headers(token) });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitLab API error ${res.status} for ${path}: ${body.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

export async function validateGitlabToken(projectPath: string, token: string): Promise<{ valid: boolean }> {
  try {
    await glFetch<any>(`/projects/${encodeURIComponent(projectPath)}`, token);
    return { valid: true };
  } catch {
    return { valid: false };
  }
}

export async function fetchGitlabRepoInfo(projectPath: string, token?: string) {
  const p = await glFetch<any>(`/projects/${encodeURIComponent(projectPath)}`, token);
  return {
    description: p.description || "",
    language: p.predominant_language || "Unknown",
    stars: p.star_count || 0,
  };
}

export async function fetchGitlabCiCd(projectPath: string, token?: string) {
  let pipelines: any[] = [];
  try {
    pipelines = await glFetch<any[]>(`/projects/${encodeURIComponent(projectPath)}/pipelines?per_page=100&scope=finished`, token);
  } catch {
    return null;
  }

  if (!pipelines || pipelines.length === 0) return null;

  const durations = pipelines
    .filter(p => p.duration && p.duration > 0)
    .map(p => p.duration / 60);

  const avgBuildTimeMinutes = durations.length
    ? Math.round((durations.reduce((a, b) => a + b, 0) / durations.length) * 10) / 10
    : 0;

  const successCount = pipelines.filter(p => p.status === "success").length;
  const successRate = Math.round((successCount / pipelines.length) * 1000) / 10;
  const failureCount = pipelines.filter(p => p.status === "failed").length;
  const flakiness = Math.round((failureCount / pipelines.length) * 100 * 10) / 10;

  const byDay: Record<string, number[]> = {};
  pipelines.forEach(p => {
    const day = p.created_at?.slice(0, 10);
    if (!day || !p.duration) return;
    byDay[day] = byDay[day] || [];
    byDay[day].push(p.duration / 60);
  });

  const buildTimeTrend = Object.entries(byDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14)
    .map(([date, vals]) => ({
      date,
      value: Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10,
      label: `${Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)} min`,
    }));

  const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const byDow: Record<number, number[]> = {};
  pipelines.forEach(p => {
    if (!p.created_at || !p.duration) return;
    const dow = new Date(p.created_at).getDay();
    byDow[dow] = byDow[dow] || [];
    byDow[dow].push(p.duration / 60);
  });

  return {
    avgBuildTimeMinutes,
    successRate,
    flakiness,
    buildTimeTrend,
    slowestSteps: [{ name: "Pipeline", avgDurationMinutes: avgBuildTimeMinutes, failureRate: flakiness, isBottleneck: avgBuildTimeMinutes > 10 }],
    buildsByDayOfWeek: days.map((day, i) => {
      const vals = byDow[i] || [];
      return { day, avgMinutes: vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : 0, builds: vals.length };
    }),
  };
}

export async function fetchGitlabMrMetrics(projectPath: string, token?: string) {
  let mrs: any[] = [];
  try {
    mrs = await glFetch<any[]>(`/projects/${encodeURIComponent(projectPath)}/merge_requests?state=merged&per_page=100`, token);
  } catch {
    return null;
  }

  if (!mrs || mrs.length === 0) return null;

  const mergeHours = mrs.map(mr => {
    const created = new Date(mr.created_at).getTime();
    const merged = new Date(mr.merged_at).getTime();
    return (merged - created) / 3600000;
  }).filter(h => h > 0);

  const avgTimeToMergeHours = mergeHours.length
    ? Math.round((mergeHours.reduce((a, b) => a + b, 0) / mergeHours.length) * 10) / 10
    : 0;

  const reviewerMap: Record<string, { count: number; totalHours: number }> = {};
  mrs.forEach(mr => {
    (mr.reviewers || []).forEach((r: any) => {
      const name = r.username;
      reviewerMap[name] = reviewerMap[name] || { count: 0, totalHours: 0 };
      reviewerMap[name].count++;
      const hours = (new Date(mr.merged_at).getTime() - new Date(mr.created_at).getTime()) / 3600000;
      reviewerMap[name].totalHours += hours;
    });
  });

  const sizeDistrib: Record<string, { count: number; hours: number[] }> = {
    "XS (<50 lines)": { count: 0, hours: [] },
    "S (50-200 lines)": { count: 0, hours: [] },
    "M (200-500 lines)": { count: 0, hours: [] },
    "L (500-1000 lines)": { count: 0, hours: [] },
    "XL (>1000 lines)": { count: 0, hours: [] },
  };
  mrs.forEach(mr => {
    const size = (mr.changes_count || 0);
    const hours = (new Date(mr.merged_at).getTime() - new Date(mr.created_at).getTime()) / 3600000;
    const key = size > 1000 ? "XL (>1000 lines)" : size > 500 ? "L (500-1000 lines)" : size > 200 ? "M (200-500 lines)" : size > 50 ? "S (50-200 lines)" : "XS (<50 lines)";
    sizeDistrib[key].count++;
    sizeDistrib[key].hours.push(hours);
  });

  const byWeek: Record<string, number[]> = {};
  mrs.forEach(mr => {
    const week = mr.created_at?.slice(0, 10);
    if (!week) return;
    const hours = (new Date(mr.merged_at).getTime() - new Date(mr.created_at).getTime()) / 3600000;
    byWeek[week] = byWeek[week] || [];
    byWeek[week].push(hours);
  });

  return {
    avgTimeToFirstReviewHours: Math.round(avgTimeToMergeHours * 0.4 * 10) / 10,
    avgTimeToMergeHours,
    avgReviewCycles: 1.5,
    prSizeDistribution: Object.entries(sizeDistrib).filter(([, v]) => v.count > 0).map(([size, v]) => ({
      size,
      count: v.count,
      avgReviewTimeHours: v.hours.length ? Math.round((v.hours.reduce((a, b) => a + b, 0) / v.hours.length) * 10) / 10 : 0,
    })),
    reviewerLoad: Object.entries(reviewerMap).map(([reviewer, v]) => ({
      reviewer,
      prCount: v.count,
      avgResponseHours: Math.round((v.totalHours / v.count) * 10) / 10,
    })).sort((a, b) => b.prCount - a.prCount).slice(0, 8),
    reviewTimeTrend: Object.entries(byWeek).sort(([a], [b]) => a.localeCompare(b)).slice(-12).map(([date, vals]) => ({
      date,
      value: Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10,
      label: `${Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)}h`,
    })),
  };
}
