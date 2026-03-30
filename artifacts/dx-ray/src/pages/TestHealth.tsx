import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useRepo } from '@/context/RepoContext';
import { useGetTestHealthMetrics } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ShieldCheck, ShieldAlert, Target } from 'lucide-react';

export default function TestHealth() {
  const { selectedRepoId } = useRepo();
  const { data: metrics, isLoading } = useGetTestHealthMetrics({ repositoryId: selectedRepoId || undefined });

  if (isLoading || !metrics) return <DashboardLayout><div className="animate-pulse h-full bg-card rounded-xl" /></DashboardLayout>;

  const coverageData = [
    { name: 'Covered', value: metrics.coveragePercent },
    { name: 'Uncovered', value: 100 - metrics.coveragePercent },
  ];
  const COLORS = ['hsl(var(--success))', 'hsl(var(--secondary))'];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Test Suite Pathology</h1>
          <p className="text-muted-foreground">Coverage gaps, flakiness, and suite reliability.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="col-span-1 md:col-span-1 flex flex-col justify-center items-center text-center p-6">
            <Target className="w-8 h-8 text-primary mb-2" />
            <p className="text-sm text-muted-foreground font-mono">TOTAL TESTS</p>
            <p className="text-4xl font-bold font-mono mt-1">{metrics.totalTests.toLocaleString()}</p>
          </Card>
          
          <Card className="col-span-1 md:col-span-2">
            <CardContent className="p-6 flex items-center justify-between h-full">
              <div className="w-1/3 h-[150px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={coverageData} innerRadius={50} outerRadius={70} paddingAngle={2} dataKey="value" stroke="none">
                      {coverageData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-2/3 pl-6 border-l border-border">
                <p className="text-sm text-muted-foreground font-mono mb-1">COVERAGE</p>
                <div className="flex items-end gap-3 mb-2">
                  <span className="text-5xl font-bold font-mono text-success">{metrics.coveragePercent}%</span>
                  <span className={`text-sm mb-2 ${metrics.coverageDelta >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {metrics.coverageDelta > 0 ? '+' : ''}{metrics.coverageDelta}%
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">Overall statement coverage across all monitored modules.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-1 md:col-span-1 flex flex-col justify-center items-center text-center p-6 border-destructive/30">
            <ShieldAlert className="w-8 h-8 text-destructive mb-2" />
            <p className="text-sm text-muted-foreground font-mono">FLAKY TESTS</p>
            <p className="text-4xl font-bold font-mono mt-1 text-destructive">{metrics.flakyTests}</p>
            <p className="text-xs text-muted-foreground mt-2">{metrics.flakyRate}% of suite</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Failure Patterns</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metrics.failurePatterns.map((pattern, i) => (
                  <div key={i} className="p-3 bg-secondary/30 rounded-lg border border-border">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-mono text-sm text-primary break-all">{pattern.pattern}</p>
                      {pattern.isFlaky && <StatusBadge status="warning" label="Flaky" className="ml-2 flex-shrink-0" />}
                    </div>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>Occurrences: <strong className="text-foreground">{pattern.count}</strong></span>
                      <span>Affected Tests: <strong className="text-foreground">{pattern.affectedTests}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Coverage by Module</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.coverageByModule.map((mod, i) => (
                  <div key={i}>
                    <div className="flex justify-between mb-1 text-sm">
                      <span className="font-mono">{mod.module}</span>
                      <span className="font-mono font-bold">{mod.coverage}%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${mod.status === 'critical' ? 'bg-destructive' : mod.status === 'warning' ? 'bg-warning' : 'bg-success'}`} 
                        style={{ width: `${mod.coverage}%` }}
                      />
                    </div>
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
