import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useRepo } from '@/context/RepoContext';
import { useGetMetricsOverview, useListInsights } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Gauge } from '@/components/ui/gauge';
import { StatusBadge } from '@/components/ui/status-badge';
import { ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import { Link } from 'wouter';

export default function Dashboard() {
  const { selectedRepoId } = useRepo();
  const { data: metrics, isLoading: loadingMetrics } = useGetMetricsOverview({ repositoryId: selectedRepoId || undefined });
  const { data: insights, isLoading: loadingInsights } = useListInsights({ repositoryId: selectedRepoId || undefined });

  if (!selectedRepoId) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh] text-muted-foreground font-mono">
          <Activity className="w-5 h-5 mr-2 animate-pulse" />
          AWAITING TARGET SELECTION...
        </div>
      </DashboardLayout>
    );
  }

  if (loadingMetrics || !metrics) {
    return (
      <DashboardLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-64 bg-card rounded-xl border border-border" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <div key={i} className="h-40 bg-card rounded-xl border border-border" />)}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">DX Diagnostic Overview</h1>
          <p className="text-muted-foreground">High-level telemetry of your engineering ecosystem.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main DX Score */}
          <Card className="lg:col-span-1 border-primary/20 neon-glow bg-card/40">
            <CardContent className="pt-8 flex flex-col items-center">
              <Gauge value={metrics.dxScore} label="Overall DX Score" size={240} />
              
              <div className="flex gap-8 mt-8 w-full justify-center text-center">
                <div>
                  <p className="text-sm text-muted-foreground font-mono mb-1">DELTA</p>
                  <p className={`text-xl font-bold flex items-center justify-center ${metrics.dxScoreDelta >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {metrics.dxScoreDelta >= 0 ? <ArrowUpRight className="w-5 h-5 mr-1" /> : <ArrowDownRight className="w-5 h-5 mr-1" />}
                    {Math.abs(metrics.dxScoreDelta)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-mono mb-1">CRITICAL</p>
                  <p className="text-xl font-bold text-destructive">{metrics.criticalIssues}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Track Summaries */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {metrics.tracks.map((track) => (
              <Link key={track.id} href={`/dashboard/${track.id}`}>
                <Card className="h-full hover:border-primary/50 cursor-pointer group transition-colors">
                  <CardContent className="p-5 flex flex-col justify-between h-full">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="font-semibold text-lg">{track.name}</h3>
                      <StatusBadge status={track.status} />
                    </div>
                    <div>
                      <div className="flex items-end gap-2 mb-2">
                        <span className="text-3xl font-mono font-bold text-foreground">{track.score}</span>
                        <span className="text-sm text-muted-foreground mb-1">/100</span>
                      </div>
                      {track.topIssue && (
                        <p className="text-sm text-muted-foreground border-t border-border/50 pt-2 mt-2 truncate">
                          <span className="text-warning mr-1">Alert:</span> {track.topIssue}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Actionable Insights */}
        <div>
          <div className="flex justify-between items-end mb-4">
            <h2 className="text-xl font-bold font-mono tracking-tight">Active Prescriptions</h2>
            <Link href="/dashboard/insights" className="text-primary text-sm hover:underline">View All</Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loadingInsights ? (
               <div className="h-24 bg-card rounded-xl border border-border animate-pulse col-span-2" />
            ) : insights?.slice(0, 4).map(insight => (
              <Card key={insight.id} className="bg-card/30">
                <CardContent className="p-4 flex gap-4">
                  <div className="mt-1">
                    <StatusBadge status={insight.severity} showIcon={true} label="" className="px-1.5 py-1.5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-1">{insight.title}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-2">{insight.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
