import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useRepo } from '@/context/RepoContext';
import { useGetCiCdMetrics } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { Activity, Clock, Zap, AlertTriangle } from 'lucide-react';

export default function CiCd() {
  const { selectedRepoId } = useRepo();
  const { data: metrics, isLoading } = useGetCiCdMetrics({ repositoryId: selectedRepoId || undefined });

  if (isLoading || !metrics) return <DashboardLayout><div className="animate-pulse h-full bg-card rounded-xl" /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">CI/CD Hemodynamics</h1>
          <p className="text-muted-foreground">Pipeline throughput, velocity, and reliability metrics.</p>
        </div>

        {/* Top KPI row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10 text-primary"><Clock className="w-6 h-6" /></div>
              <div>
                <p className="text-sm text-muted-foreground font-mono">AVG BUILD TIME</p>
                <div className="flex items-end gap-2">
                  <p className="text-3xl font-bold font-mono">{metrics.avgBuildTimeMinutes}<span className="text-lg text-muted-foreground ml-1">min</span></p>
                  <span className={`text-sm mb-1 ${metrics.avgBuildTimeDelta <= 0 ? 'text-success' : 'text-destructive'}`}>
                    {metrics.avgBuildTimeDelta > 0 ? '+' : ''}{metrics.avgBuildTimeDelta}m
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-success/10 text-success"><Zap className="w-6 h-6" /></div>
              <div>
                <p className="text-sm text-muted-foreground font-mono">SUCCESS RATE</p>
                <p className="text-3xl font-bold font-mono text-success">{metrics.successRate}%</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-warning/10 text-warning"><AlertTriangle className="w-6 h-6" /></div>
              <div>
                <p className="text-sm text-muted-foreground font-mono">FLAKINESS INDEX</p>
                <p className="text-3xl font-bold font-mono text-warning">{metrics.flakiness}%</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Trend Chart */}
          <Card className="col-span-1 lg:col-span-2">
            <CardHeader>
              <CardTitle>Build Time Trend (30 Days)</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metrics.buildTimeTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickMargin={10} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(val) => `${val}m`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    itemStyle={{ color: 'hsl(var(--primary))' }}
                  />
                  <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4, fill: 'hsl(var(--background))' }} activeDot={{ r: 6, fill: 'hsl(var(--primary))' }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Slowest Steps */}
          <Card>
            <CardHeader>
              <CardTitle>Bottleneck Detection</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.slowestSteps.map((step, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border">
                    <div>
                      <p className="font-mono text-sm text-primary">{step.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">Fail rate: {step.failureRate}%</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold">{step.avgDurationMinutes}m</p>
                      {step.isBottleneck && <span className="text-[10px] uppercase bg-destructive/20 text-destructive px-1.5 py-0.5 rounded border border-destructive/30">Bottleneck</span>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Heatmap / Builds by Day */}
          <Card>
            <CardHeader>
              <CardTitle>Volume by Day</CardTitle>
            </CardHeader>
            <CardContent className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.buildsByDayOfWeek}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip 
                    cursor={{ fill: 'hsl(var(--secondary))' }}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                  />
                  <Bar dataKey="builds" radius={[4, 4, 0, 0]}>
                    {metrics.buildsByDayOfWeek.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={`hsl(var(--primary) / ${Math.max(0.3, entry.builds / 50)})`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
