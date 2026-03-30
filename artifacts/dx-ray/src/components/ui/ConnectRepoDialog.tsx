import React, { useState } from 'react';
import { useAddRepository } from '@workspace/api-client-react';
import { useToast } from '@/hooks/use-toast';
import { Github, Gitlab, X, ExternalLink, Lock, Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';

interface ConnectRepoDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (repoId: number) => void;
}

function detectPlatform(url: string): 'github' | 'gitlab' | null {
  if (url.includes('github.com')) return 'github';
  if (url.includes('gitlab.com') || url.includes('gitlab.')) return 'gitlab';
  return null;
}

export function ConnectRepoDialog({ open, onClose, onSuccess }: ConnectRepoDialogProps) {
  const { toast } = useToast();
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [step, setStep] = useState<'form' | 'connecting' | 'success'>('form');

  const platform = detectPlatform(url);

  const mutation = useAddRepository({
    mutation: {
      onSuccess: (data) => {
        setStep('success');
        setTimeout(() => {
          onSuccess(data.id);
          onClose();
          resetForm();
        }, 1200);
      },
      onError: (err: any) => {
        setStep('form');
        toast({
          title: 'Connection Failed',
          description: err?.response?.data?.error || 'Could not connect to repository. Check the URL and token.',
          variant: 'destructive',
        });
      },
    },
  });

  function resetForm() {
    setUrl('');
    setName('');
    setToken('');
    setStep('form');
  }

  function handleClose() {
    onClose();
    resetForm();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;

    // Auto-generate name from URL if not provided
    const autoName = name.trim() || url.split('/').slice(-1)[0].replace('.git', '') || 'my-repo';
    setStep('connecting');

    mutation.mutate({
      data: {
        url: url.trim(),
        name: autoName,
        accessToken: token.trim() || undefined,
        platform: platform || 'demo',
      },
    });
  }

  // Auto-fill name from URL
  function handleUrlChange(val: string) {
    setUrl(val);
    const parts = val.split('/').filter(Boolean);
    if (parts.length >= 2) {
      const autoName = parts[parts.length - 1].replace('.git', '');
      if (!name) setName(autoName);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-secondary/30">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Connect Repository</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Analyze a real GitHub or GitLab repo</p>
          </div>
          <button onClick={handleClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success state */}
        {step === 'success' && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <CheckCircle2 className="w-12 h-12 text-green-400" />
            <p className="text-foreground font-medium">Repository connected!</p>
            <p className="text-sm text-muted-foreground">Trigger a scan to pull real data.</p>
          </div>
        )}

        {/* Connecting state */}
        {step === 'connecting' && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-foreground font-medium">Verifying connection…</p>
            <p className="text-sm text-muted-foreground">Fetching repository metadata</p>
          </div>
        )}

        {/* Form */}
        {step === 'form' && (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">

            {/* Platform pills */}
            <div className="flex gap-3">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs border transition-all ${platform === 'github' ? 'border-primary text-primary bg-primary/10' : 'border-border text-muted-foreground'}`}>
                <Github className="w-3.5 h-3.5" /> GitHub
              </div>
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs border transition-all ${platform === 'gitlab' ? 'border-orange-400 text-orange-400 bg-orange-400/10' : 'border-border text-muted-foreground'}`}>
                <Gitlab className="w-3.5 h-3.5" /> GitLab
              </div>
            </div>

            {/* URL */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Repository URL</label>
              <input
                type="url"
                value={url}
                onChange={e => handleUrlChange(e.target.value)}
                placeholder="https://github.com/owner/repo"
                required
                className="w-full h-10 rounded-md border border-input bg-background/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono"
              />
            </div>

            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Display Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="my-repo"
                className="w-full h-10 rounded-md border border-input bg-background/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            {/* Token */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                Personal Access Token
                <span className="text-xs text-muted-foreground font-normal">(optional for public repos)</span>
              </label>
              <div className="relative">
                <input
                  type={showToken ? 'text' : 'password'}
                  value={token}
                  onChange={e => setToken(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  className="w-full h-10 rounded-md border border-input bg-background/50 px-3 py-2 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {platform === 'github' && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  Needs <code className="text-primary bg-primary/10 px-1 rounded">repo</code> scope for private repos.{' '}
                  <a href="https://github.com/settings/tokens/new?scopes=repo" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">
                    Create token <ExternalLink className="w-3 h-3" />
                  </a>
                </p>
              )}
              {platform === 'gitlab' && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  Needs <code className="text-orange-400 bg-orange-400/10 px-1 rounded">read_api</code> scope.{' '}
                  <a href="https://gitlab.com/-/profile/personal_access_tokens" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:underline inline-flex items-center gap-0.5">
                    Create token <ExternalLink className="w-3 h-3" />
                  </a>
                </p>
              )}
            </div>

            {/* Info box */}
            <div className="rounded-lg border border-border bg-secondary/20 p-3 text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground text-xs">What DX-Ray analyzes:</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 mt-1">
                <span>• CI/CD workflow run history</span>
                <span>• PR merge & review times</span>
                <span>• Documentation freshness</span>
                <span>• Code language & type safety</span>
                <span>• Open bug issue count</span>
                <span>• Reviewer load distribution</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 h-10 rounded-md border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!url.trim()}
                className="flex-1 h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed neon-glow"
              >
                Connect Repository
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
