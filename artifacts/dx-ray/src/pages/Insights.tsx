import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useRepo } from '@/context/RepoContext';
import { useListInsights } from '@workspace/api-client-react';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Lightbulb, Wrench, Clock, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Insights() {
  const { selectedRepoId } = useRepo();
  const { data: insights, isLoading } = useListInsights({ repositoryId: selectedRepoId || undefined });

  if (isLoading || !insights) return <DashboardLayout><div className="animate-pulse h-full bg-card rounded-xl" /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">AI Prescriptions & Insights</h1>
          <p className="text-muted-foreground">Actionable recommendations generated from telemetry data.</p>
        </div>

        <div className="grid gap-4">
          {insights.map((insight, i) => (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="overflow-hidden border-l-4" style={{ 
                borderLeftColor: insight.severity === 'critical' ? 'hsl(var(--destructive))' : 
                                 insight.severity === 'warning' ? 'hsl(var(--warning))' : 'hsl(var(--primary))' 
              }}>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <StatusBadge status={insight.severity} />
                        <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground bg-secondary px-2 py-1 rounded">
                          Track: {insight.track}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold mb-2">{insight.title}</h3>
                      <p className="text-muted-foreground mb-4">{insight.description}</p>
                      
                      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mt-4">
                        <h4 className="flex items-center text-primary font-semibold text-sm mb-2"><Wrench className="w-4 h-4 mr-2" /> Recommendation</h4>
                        <p className="text-sm">{insight.recommendation}</p>
                      </div>
                    </div>
                    
                    <div className="md:w-64 flex flex-col gap-4 border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6">
                      {insight.impact && (
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1 flex items-center"><Activity className="w-3 h-3 mr-1"/> Impact</p>
                          <p className="text-sm font-medium">{insight.impact}</p>
                        </div>
                      )}
                      {insight.estimatedHoursSaved && (
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1 flex items-center"><Clock className="w-3 h-3 mr-1"/> Est. Time Saved</p>
                          <p className="text-2xl font-mono font-bold text-success">
                            {insight.estimatedHoursSaved}<span className="text-sm font-sans font-normal ml-1 text-muted-foreground">hrs/mo</span>
                          </p>
                        </div>
                      )}
                      <button className="mt-auto w-full py-2 bg-secondary hover:bg-secondary/80 text-foreground text-sm font-medium rounded-md transition-colors border border-border">
                        Create Jira Issue
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
          
          {insights.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Lightbulb className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No actionable insights found. DX telemetry looks optimal.</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
