import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useRepo } from '@/context/RepoContext';
import { useGetCodeQualityMetrics } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Code2, Hash, Copy, Bug } from 'lucide-react';

export default function CodeQuality() {
  const { selectedRepoId } = useRepo();
  const { data: metrics, isLoading } = useGetCodeQualityMetrics({ repositoryId: selectedRepoId || undefined });

  if (isLoading || !metrics) return <DashboardLayout><div className="animate-pulse h-full bg-card rounded-xl" /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Code Quality Scan</h1>
          <p className="text-muted-foreground">Static analysis, type safety, and complexity telemetry.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
              <Code2 className="w-6 h-6 text-primary mb-2" />
              <p className="text-xs text-muted-foreground font-mono">MAINTAINABILITY</p>
              <p className="text-2xl font-bold font-mono mt-1">{metrics.overallScore}<span className="text-sm text-muted-foreground font-sans">/100</span></p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
              <ShieldCheckIcon className="w-6 h-6 text-success mb-2" />
              <p className="text-xs text-muted-foreground font-mono">TYPE SAFETY</p>
              <p className="text-2xl font-bold font-mono mt-1 text-success">{metrics.typeSafetyScore}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
              <Hash className="w-6 h-6 text-warning mb-2" />
              <p className="text-xs text-muted-foreground font-mono">AVG COMPLEXITY</p>
              <p className="text-2xl font-bold font-mono mt-1 text-warning">{metrics.complexityAvg}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
              <Copy className="w-6 h-6 text-muted-foreground mb-2" />
              <p className="text-xs text-muted-foreground font-mono">DUPLICATION</p>
              <p className="text-2xl font-bold font-mono mt-1">{metrics.duplicateCodePercent}%</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Quality Trend</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metrics.qualityTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickMargin={10} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={['dataMin - 5', 'dataMax + 5']} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  />
                  <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: 'hsl(var(--primary))' }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Recurring Bug Patterns</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.bugPatterns.map((pattern, i) => (
                  <div key={i} className="border-l-2 border-primary pl-3 py-1">
                    <p className="text-sm font-semibold mb-1 flex items-center justify-between">
                      {pattern.category}
                      <span className="text-xs px-2 py-0.5 bg-secondary text-muted-foreground rounded-full">{pattern.occurrences}x</span>
                    </p>
                    <p className="text-xs text-muted-foreground font-mono bg-background p-1.5 rounded truncate">{pattern.pattern}</p>
                    <p className="text-xs text-primary mt-1 flex items-center"><Bug className="w-3 h-3 mr-1"/> Fix: {pattern.suggestedFix}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Top Issues by Severity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-secondary/50 font-mono">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg">Severity</th>
                    <th className="px-4 py-3">Rule</th>
                    <th className="px-4 py-3">File:Line</th>
                    <th className="px-4 py-3 rounded-tr-lg">Message</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.topIssues.map((issue, i) => (
                    <tr key={i} className="border-b border-border hover:bg-secondary/20 transition-colors">
                      <td className="px-4 py-3">
                        <StatusBadge status={issue.severity === 'error' ? 'critical' : issue.severity === 'warning' ? 'warning' : 'info'} />
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">{issue.rule}</td>
                      <td className="px-4 py-3 font-mono text-primary text-xs">{issue.file}{issue.line ? `:${issue.line}` : ''}</td>
                      <td className="px-4 py-3 text-muted-foreground">{issue.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

// Inline missing icon
function ShieldCheckIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>
    </svg>
  );
}
