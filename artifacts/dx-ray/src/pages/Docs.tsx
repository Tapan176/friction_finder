import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useRepo } from '@/context/RepoContext';
import { useGetDocsMetrics } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { FileText, CalendarClock, SearchX } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export default function Docs() {
  const { selectedRepoId } = useRepo();
  const { data: metrics, isLoading } = useGetDocsMetrics({ repositoryId: selectedRepoId || undefined });

  if (isLoading || !metrics) return <DashboardLayout><div className="animate-pulse h-full bg-card rounded-xl" /></DashboardLayout>;

  const pieData = metrics.docsByFreshness.map(d => ({ name: d.category, value: d.count }));
  const COLORS = ['hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))'];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Documentation Freshness</h1>
          <p className="text-muted-foreground">Detect code-to-doc drift and institutional knowledge rot.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="col-span-1 p-6 flex flex-col justify-center items-center text-center">
            <FileText className="w-8 h-8 text-primary mb-2" />
            <p className="text-sm text-muted-foreground font-mono">TOTAL DOCS</p>
            <p className="text-4xl font-bold font-mono mt-1">{metrics.totalDocs}</p>
          </Card>
          
          <Card className="col-span-1 p-6 flex flex-col justify-center items-center text-center">
            <CalendarClock className="w-8 h-8 text-warning mb-2" />
            <p className="text-sm text-muted-foreground font-mono">AVG AGE</p>
            <p className="text-4xl font-bold font-mono mt-1 text-warning">{metrics.avgAgeMonths}<span className="text-lg text-muted-foreground ml-1">mo</span></p>
          </Card>

          <Card className="col-span-1 p-6 flex flex-col justify-center items-center text-center">
            <SearchX className="w-8 h-8 text-destructive mb-2" />
            <p className="text-sm text-muted-foreground font-mono">MISSING DOCS</p>
            <p className="text-4xl font-bold font-mono mt-1 text-destructive">{metrics.missingDocs}</p>
            <p className="text-xs text-muted-foreground mt-2">Exported symbols</p>
          </Card>

          <Card className="col-span-1 p-6 flex flex-col justify-center items-center text-center border-primary/20">
            <div className="text-sm text-muted-foreground font-mono mb-2">STALENESS RATE</div>
            <p className="text-5xl font-bold font-mono text-primary">{metrics.staleDocsPercent}%</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Freshness Distribution</CardTitle>
            </CardHeader>
            <CardContent className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-2">
                {pieData.map((d, i) => (
                  <div key={i} className="flex items-center text-xs">
                    <div className="w-3 h-3 rounded-full mr-1.5" style={{ backgroundColor: COLORS[i] }} />
                    <span className="text-muted-foreground">{d.name} ({d.value})</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Most Stale Documentation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-secondary/50 font-mono">
                    <tr>
                      <th className="px-4 py-3 rounded-tl-lg">File Path</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Last Updated</th>
                      <th className="px-4 py-3 rounded-tr-lg">Age</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.mostStale.map((doc, i) => (
                      <tr key={i} className="border-b border-border hover:bg-secondary/20 transition-colors">
                        <td className="px-4 py-3 font-mono text-primary text-xs">{doc.path}</td>
                        <td className="px-4 py-3"><StatusBadge status={doc.category === 'Architecture' ? 'warning' : 'info'} label={doc.category} showIcon={false} /></td>
                        <td className="px-4 py-3 text-muted-foreground">{new Date(doc.lastUpdated).toLocaleDateString()}</td>
                        <td className="px-4 py-3 font-mono text-destructive font-semibold">{doc.monthsOld} mo</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
