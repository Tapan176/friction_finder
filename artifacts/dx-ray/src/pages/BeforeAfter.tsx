import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useRepo } from '@/context/RepoContext';
import { useGetBeforeAfterComparison } from '@workspace/api-client-react';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';

export default function BeforeAfter() {
  const { selectedRepoId } = useRepo();
  const { data: comparison, isLoading } = useGetBeforeAfterComparison({ repositoryId: selectedRepoId || undefined });

  if (isLoading || !comparison) return <DashboardLayout><div className="animate-pulse h-full bg-card rounded-xl" /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h1 className="text-4xl font-extrabold tracking-tight mb-4">DX Transformation Impact</h1>
          <p className="text-muted-foreground text-lg">Measuring the ROI of applying DX-Ray recommendations over the period: <strong className="text-foreground">{comparison.period}</strong>.</p>
        </div>

        <div className="grid grid-cols-1 gap-6 max-w-5xl mx-auto">
          {comparison.metrics.map((metric, i) => {
            const isImprovementPositive = metric.improvement > 0;
            // E.g. build time going down is good, but test coverage going up is good.
            const isGood = metric.isPositiveWhenIncreasing ? isImprovementPositive : !isImprovementPositive;
            
            return (
              <Card key={i} className="overflow-hidden hover:border-primary/50 transition-colors bg-card/60 backdrop-blur-sm">
                <CardContent className="p-0">
                  <div className="grid grid-cols-1 md:grid-cols-4 items-center">
                    
                    <div className="p-6 md:col-span-1 bg-secondary/30 border-b md:border-b-0 md:border-r border-border h-full flex flex-col justify-center">
                      <h3 className="font-bold text-lg">{metric.label}</h3>
                      <p className="text-sm text-muted-foreground mt-1">Key DX Indicator</p>
                    </div>
                    
                    <div className="p-6 md:col-span-3 flex items-center justify-between">
                      <div className="text-center flex-1">
                        <p className="text-sm text-muted-foreground uppercase tracking-widest font-mono mb-2">Before</p>
                        <p className="text-3xl font-mono text-muted-foreground">{metric.before}<span className="text-lg ml-1">{metric.unit}</span></p>
                      </div>
                      
                      <div className="flex-shrink-0 px-4 text-primary opacity-50">
                        <ArrowRight className="w-8 h-8" />
                      </div>
                      
                      <div className="text-center flex-1">
                        <p className="text-sm text-primary uppercase tracking-widest font-mono mb-2 neon-glow rounded px-2 inline-block">After</p>
                        <p className="text-4xl font-mono font-bold">{metric.after}<span className="text-lg text-muted-foreground ml-1">{metric.unit}</span></p>
                      </div>
                      
                      <div className={`text-center flex-1 border-l border-border pl-6 ${isGood ? 'text-success' : 'text-destructive'}`}>
                        <div className="flex items-center justify-center gap-1 mb-1">
                          {isImprovementPositive ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                        </div>
                        <p className="text-2xl font-mono font-bold">
                          {Math.abs(metric.improvement)}%
                        </p>
                        <p className="text-xs uppercase tracking-widest mt-1 opacity-80">Change</p>
                      </div>
                      
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
