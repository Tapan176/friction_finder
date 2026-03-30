import React, { createContext, useContext, useState, ReactNode } from 'react';

interface RepoContextType {
  selectedRepoId: number | null;
  setSelectedRepoId: (id: number | null) => void;
}

const RepoContext = createContext<RepoContextType | undefined>(undefined);

export function RepoProvider({ children }: { children: ReactNode }) {
  const [selectedRepoId, setSelectedRepoId] = useState<number | null>(null);

  return (
    <RepoContext.Provider value={{ selectedRepoId, setSelectedRepoId }}>
      {children}
    </RepoContext.Provider>
  );
}

export function useRepo() {
  const context = useContext(RepoContext);
  if (context === undefined) {
    throw new Error('useRepo must be used within a RepoProvider');
  }
  return context;
}
