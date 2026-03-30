import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { RepoProvider } from "@/context/RepoContext";

import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import CiCd from "@/pages/CiCd";
import TestHealth from "@/pages/TestHealth";
import CodeQuality from "@/pages/CodeQuality";
import PrReview from "@/pages/PrReview";
import Docs from "@/pages/Docs";
import Insights from "@/pages/Insights";
import BeforeAfter from "@/pages/BeforeAfter";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/dashboard/ci-cd" component={CiCd} />
      <Route path="/dashboard/test-health" component={TestHealth} />
      <Route path="/dashboard/code-quality" component={CodeQuality} />
      <Route path="/dashboard/pr-review" component={PrReview} />
      <Route path="/dashboard/docs" component={Docs} />
      <Route path="/dashboard/insights" component={Insights} />
      <Route path="/dashboard/before-after" component={BeforeAfter} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RepoProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </RepoProvider>
    </QueryClientProvider>
  );
}

export default App;
