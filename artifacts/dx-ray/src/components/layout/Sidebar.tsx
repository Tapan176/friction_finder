import React from 'react';
import { Link, useLocation } from 'wouter';
import { 
  Activity, 
  GitBranch, 
  ShieldAlert, 
  Code2, 
  GitPullRequest, 
  FileText, 
  Lightbulb, 
  SplitSquareHorizontal,
  Home
} from 'lucide-react';
import { cn } from '../ui/card';

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: Activity },
  { href: '/dashboard/ci-cd', label: 'CI/CD Health', icon: GitBranch },
  { href: '/dashboard/test-health', label: 'Test Health', icon: ShieldAlert },
  { href: '/dashboard/code-quality', label: 'Code Quality', icon: Code2 },
  { href: '/dashboard/pr-review', label: 'PR Review Radar', icon: GitPullRequest },
  { href: '/dashboard/docs', label: 'Docs Freshness', icon: FileText },
  { href: '/dashboard/insights', label: 'Insights', icon: Lightbulb },
  { href: '/dashboard/before-after', label: 'Before & After', icon: SplitSquareHorizontal },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="w-64 flex-shrink-0 bg-sidebar border-r border-sidebar-border h-full flex flex-col z-20">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center border border-primary/30 neon-glow">
          <Activity className="w-5 h-5 text-primary" />
        </div>
        <span className="font-mono font-bold text-xl tracking-tight text-primary">DX-Ray</span>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive 
                  ? "bg-primary/10 text-primary neon-glow" 
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <item.icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-muted-foreground")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <Link 
          href="/"
          className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <Home className="w-4 h-4" />
          Exit Dashboard
        </Link>
      </div>
    </div>
  );
}
