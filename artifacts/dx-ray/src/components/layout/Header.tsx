import React, { useEffect } from 'react';
import { useRepo } from '@/context/RepoContext';
import { useListRepositories, useTriggerScan } from '@workspace/api-client-react';
import { Activity, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function Header() {
  const { selectedRepoId, setSelectedRepoId } = useRepo();
  const { data: repos, isLoading } = useListRepositories();
  const { toast } = useToast();
  
  const scanMutation = useTriggerScan({
    mutation: {
      onSuccess: () => {
        toast({
          title: "Scan Started",
          description: "DX-Ray is analyzing the repository.",
        });
      },
      onError: () => {
        toast({
          title: "Scan Failed",
          description: "Failed to trigger scan.",
          variant: "destructive"
        });
      }
    }
  });

  // Auto-select first repo if none selected
  useEffect(() => {
    if (!selectedRepoId && repos && repos.length > 0) {
      setSelectedRepoId(repos[0].id);
    }
  }, [repos, selectedRepoId, setSelectedRepoId]);

  const handleScan = () => {
    if (!selectedRepoId) return;
    scanMutation.mutate({
      data: {
        repositoryId: selectedRepoId,
        tracks: ["ci-cd", "test-health", "code-quality", "pr-review", "docs"]
      }
    });
  };

  return (
    <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Target</span>
        {isLoading ? (
          <div className="h-9 w-48 bg-muted rounded animate-pulse" />
        ) : (
          <select 
            value={selectedRepoId || ''} 
            onChange={(e) => setSelectedRepoId(Number(e.target.value))}
            className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-primary font-mono text-primary"
          >
            {repos?.map(repo => (
              <option key={repo.id} value={repo.id} className="bg-background text-foreground">
                {repo.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground bg-secondary px-3 py-1.5 rounded-md border border-border">
          <Activity className="w-3.5 h-3.5 text-success" />
          SYSTEM ONLINE
        </div>
        
        <button 
          onClick={handleScan}
          disabled={scanMutation.isPending || !selectedRepoId}
          className="flex items-center gap-2 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground border border-primary/30 px-4 py-1.5 rounded-md text-sm font-medium transition-all neon-glow disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-4 h-4 ${scanMutation.isPending ? 'animate-spin' : ''}`} />
          {scanMutation.isPending ? 'Scanning...' : 'Trigger Scan'}
        </button>
      </div>
    </header>
  );
}
