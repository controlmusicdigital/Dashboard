"use client";

import { createContext, useContext, useState } from "react";

export type NeuralState = "idle" | "thinking" | "generating";

interface NeuralContextValue {
  state: NeuralState;
  setState: (s: NeuralState) => void;
  pendingPrompt: string | null;
  requestPrompt: (text: string) => void;
  clearPendingPrompt: () => void;
}

const NeuralStateContext = createContext<NeuralContextValue>({
  state: "idle",
  setState: () => {},
  pendingPrompt: null,
  requestPrompt: () => {},
  clearPendingPrompt: () => {},
});

export function NeuralStateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<NeuralState>("idle");
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);

  return (
    <NeuralStateContext.Provider
      value={{
        state,
        setState,
        pendingPrompt,
        requestPrompt: setPendingPrompt,
        clearPendingPrompt: () => setPendingPrompt(null),
      }}
    >
      {children}
    </NeuralStateContext.Provider>
  );
}

export function useNeuralState() {
  return useContext(NeuralStateContext);
}
