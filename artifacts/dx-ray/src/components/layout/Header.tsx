import React, { useEffect, useRef, useState } from 'react';
import { useRepo } from '@/context/RepoContext';
import { useListRepositories, useTriggerScan, useGetScan } from '@workspace/api-client-react';
import { Activity, RefreshCw, Plus, Wifi, WifiOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ConnectRepoDialog } from '@/components/ui/ConnectRepoDialog';
import { useQueryClient } from '@tanstack/react-query';

export function Header() {
  const { selectedRepoId, setSelectedRepoId } = useRepo();
  const { data: repos, isLoading, refetch: refetchRepos } = useListRepositories();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [connectOpen, setConnectOpen] = useState(false);
  const [pollingScanId, setPollingScanId] = useState<number | null>(null);

  // Poll scan status until complete
  const { data: pollingScan } = useGetScan(
    pollingScanId ?? 0,
    { query: { enabled: pollingScanId !== null, refetchInterval: 2000 } }
  );

  // When scan completes, invalidate all metric queries
  const prevStatus = useRef<string | null>(null);
  useEffect(() => {
    if (!pollingScan) return;
    if (pollingScan.status === 'completed' && prevStatus.current !== 'completed') {
      prevStatus.current = 'completed';
      setPollingScanId(null);
      queryClient.invalidateQueries();
      toast({
        title: pollingScan.isRealData ? 'Real Data Scan Complete' : 'Scan Complete',
        description: pollingScan.summary || 'Dashboard updated with latest metrics.',
      });
    } else if (pollingScan.status === 'failed' && prevStatus.current !== 'failed') {
      prevStatus.current = 'failed';
      setPollingScanId(null);
      toast({ title: 'Scan Failed', description: 'Check logs for details.', variant: 'destructive' });
    }
    if (pollingScan.status !== prevStatus.current) {
      prevStatus.current = pollingScan.status;
    }
  }, [pollingScan, queryClient, toast]);

  const scanMutation = useTriggerScan({
    mutation: {
      onSuccess: (data) => {
        prevStatus.current = 'running';
        setPollingScanId(data.id);
        toast({
          title: data.isRealData ? 'Fetching Real Data…' : 'Scan Started',
          description: data.isRealData
            ? 'Pulling live metrics from GitHub/GitLab API. This may take 30–60 seconds.'
            : 'Generating fresh DX metrics for this repository.',
        });
      },
      onError: () => {
        toast({ title: 'Scan Failed', description: 'Failed to trigger scan.', variant: 'destructive' });
      },
    },
  });

  // Auto-select first repo
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
        tracks: ['ci-cd', 'test-health', 'code-quality', 'pr-review', 'docs'],
      },
    });
  };

  const selectedRepo = repos?.find(r => r.id === selectedRepoId);
  const isScanning = scanMutation.isPending || pollingScanId !== null;
  const isRealRepo = selectedRepo?.isRealData;

  return (
    <>
      <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Target</span>
          {isLoading ? (
            <div className="h-9 w-48 bg-muted rounded animate-pulse" />
          ) : (
            <div className="flex items-center gap-2">
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

              {/* Real data indicator */}
              {selectedRepo && (
                <div
                  title={isRealRepo ? `Live data from ${selectedRepo.platform}` : 'Demo data'}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-mono border ${
                    isRealRepo
                      ? 'border-green-500/40 text-green-400 bg-green-500/10'
                      : 'border-border text-muted-foreground bg-secondary/30'
                  }`}
                >
                  {isRealRepo
                    ? <><Wifi className="w-3 h-3" /> LIVE</>
                    : <><WifiOff className="w-3 h-3" /> DEMO</>
                  }
                </div>
              )}

              {/* Add repo button */}
              <button
                onClick={() => setConnectOpen(true)}
                title="Connect a repository"
                className="flex items-center gap-1 h-9 px-3 rounded-md border border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary text-xs transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Add Repo</span>
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground bg-secondary px-3 py-1.5 rounded-md border border-border">
            <Activity className="w-3.5 h-3.5 text-success" />
            SYSTEM ONLINE
          </div>

          <button
            onClick={handleScan}
            disabled={isScanning || !selectedRepoId}
            className="flex items-center gap-2 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground border border-primary/30 px-4 py-1.5 rounded-md text-sm font-medium transition-all neon-glow disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
            {isScanning ? 'Scanning…' : isRealRepo ? 'Refresh Data' : 'Trigger Scan'}
          </button>
        </div>
      </header>

      <ConnectRepoDialog
        open={connectOpen}
        onClose={() => setConnectOpen(false)}
        onSuccess={(repoId) => {
          refetchRepos();
          setSelectedRepoId(repoId);
        }}
      />
    </>
  );
}
