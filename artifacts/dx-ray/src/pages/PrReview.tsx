import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useRepo } from '@/context/RepoContext';
import { useGetPrReviewMetrics } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { GitPullRequest, Clock, Users, IterationCw } from 'lucide-react';

export default function PrReview() {
  const { selectedRepoId } = useRepo();
  const { data: metrics, isLoading } = useGetPrReviewMetrics({ repositoryId: selectedRepoId || undefined });

  if (isLoading || !metrics) return <DashboardLayout><div className="animate-pulse h-full bg-card rounded-xl" /></DashboardLayout>;

  const PIE_COLORS = ['hsl(var(--success))', 'hsl(var(--primary))', 'hsl(var(--warning))', 'hsl(var(--destructive))'];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">PR Review Radar</h1>
          <p className="text-muted-foreground">Collaboration velocity and review bottlenecks.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10 text-primary"><Clock className="w-6 h-6" /></div>
              <div>
                <p className="text-xs text-muted-foreground font-mono">TIME TO FIRST REVIEW</p>
                <p className="text-3xl font-bold font-mono mt-1">{metrics.avgTimeToFirstReviewHours}<span className="text-sm text-muted-foreground ml-1">hrs</span></p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-success/10 text-success"><GitPullRequest className="w-6 h-6" /></div>
              <div>
                <p className="text-xs text-muted-foreground font-mono">TIME TO MERGE</p>
                <p className="text-3xl font-bold font-mono mt-1">{metrics.avgTimeToMergeHours}<span className="text-sm text-muted-foreground ml-1">hrs</span></p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-warning/10 text-warning"><IterationCw className="w-6 h-6" /></div>
              <div>
                <p className="text-xs text-muted-foreground font-mono">AVG REVIEW CYCLES</p>
                <p className="text-3xl font-bold font-mono mt-1">{metrics.avgReviewCycles}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center"><Users className="w-5 h-5 mr-2 text-primary"/> Reviewer Load (Top 5)</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.reviewerLoad.slice(0, 5)} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis dataKey="reviewer" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} width={100} />
                  <Tooltip 
                    cursor={{ fill: 'hsl(var(--secondary))' }}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                  />
                  <Bar dataKey="prCount" name="PRs Reviewed" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>PR Size Distribution vs Merge Time</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px] flex items-center">
              <div className="w-1/2 h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={metrics.prSizeDistribution} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="count" nameKey="size">
                      {metrics.prSizeDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-1/2 pl-4 space-y-4">
                {metrics.prSizeDistribution.map((item, i) => (
                  <div key={i} className="flex flex-col border-b border-border/50 pb-2 last:border-0">
                    <span className="text-xs text-muted-foreground uppercase">{item.size} PRs</span>
                    <span className="font-mono text-sm">Avg Merge: <span className={item.avgReviewTimeHours > 48 ? 'text-destructive' : 'text-success'}>{item.avgReviewTimeHours}h</span></span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
