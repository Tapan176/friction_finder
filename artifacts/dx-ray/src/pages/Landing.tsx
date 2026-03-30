import React from 'react';
import { Link } from 'wouter';
import { Activity, ShieldAlert, Zap, ArrowRight, ActivitySquare, FileText, GitPullRequest, FlaskConical, Code2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Landing() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      {/* Background Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[500px] bg-primary/20 blur-[150px] rounded-full pointer-events-none opacity-50" />
      
      <header className="px-6 py-6 flex items-center justify-between relative z-10 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center border border-primary/50 neon-glow">
            <Activity className="w-6 h-6 text-primary" />
          </div>
          <span className="font-mono font-bold text-2xl tracking-tighter text-foreground">DX-Ray</span>
        </div>
        <Link 
          href="/dashboard"
          className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-white text-black hover:bg-gray-200 transition-colors"
        >
          Open Dashboard
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 relative z-10 mt-12 mb-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8">
            <Zap className="w-4 h-4" />
            Medical-grade precision for your codebase
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight">
            Reveal the <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500">invisible friction</span><br />
            in your dev workflow.
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed">
            DX-Ray is a diagnostic platform that acts like an MRI for your engineering organization. Uncover CI bottlenecks, flaky test rot, and code-to-doc drift instantly.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/dashboard"
              className="px-8 py-4 rounded-xl font-bold text-lg bg-primary text-primary-foreground hover:bg-primary/90 hover:-translate-y-1 transition-all duration-300 shadow-[0_0_30px_rgba(0,230,255,0.3)] flex items-center gap-2"
            >
              Start Diagnostic Scan
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto text-left"
        >
          {[
            {
              icon: ActivitySquare,
              title: "CI/CD Hemodynamics",
              desc: "Track build time bloat and detect pipeline bottlenecks before they paralyze your team."
            },
            {
              icon: ShieldAlert,
              title: "Test Suite Pathology",
              desc: "Isolate flaky tests and coverage gaps. Stop merging into rotting foundations."
            },
            {
              icon: FileText,
              title: "Documentation Drift",
              desc: "Automatically detect stale docs based on code modification velocity."
            }
          ].map((feature, i) => (
            <div key={i} className="glass-panel p-6 rounded-2xl hover:border-primary/50 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 border border-primary/20 text-primary">
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.desc}</p>
            </div>
          ))}
        </motion.div>
      </main>

      {/* landing page hero conceptual codebase scan visualization */}
      <img
        src={`${import.meta.env.BASE_URL}images/hero-scan.png`}
        alt="DX-Ray Concept"
        className="absolute bottom-0 left-0 w-full h-[40vh] object-cover opacity-20 mask-image-gradient-to-t mix-blend-screen pointer-events-none"
        style={{ WebkitMaskImage: 'linear-gradient(to top, black, transparent)' }}
      />
    </div>
  );
}
