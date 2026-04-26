import { useCallback, useEffect, useState } from "react";
import type { PlanData } from "../data/mockPlanData";

const HYPOTHESIS_KEY = "whitecoat_hypothesis";
const PLAN_KEY = "whitecoat_last_plan";
const CORRECTIONS_KEY = "whitecoat_corrections";

export interface Correction {
  id: string;
  experiment_type: string;
  section: "protocol" | "materials" | "budget" | "timeline" | "validation" | "literature";
  original_text: string;
  correction: string;
  timestamp: string;
}

const safeGet = (key: string) => {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};
const safeSet = (key: string, val: string) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, val);
  } catch {
    /* ignore */
  }
};
const safeRemove = (key: string) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
};

export const planStore = {
  setHypothesis: (h: string) => safeSet(HYPOTHESIS_KEY, h),
  getHypothesis: (): string | null => safeGet(HYPOTHESIS_KEY),
  clearHypothesis: () => safeRemove(HYPOTHESIS_KEY),
  setPlan: (p: PlanData) => safeSet(PLAN_KEY, JSON.stringify(p)),
  getPlan: (): PlanData | null => {
    const raw = safeGet(PLAN_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as PlanData;
    } catch {
      return null;
    }
  },
};

export function useCorrections() {
  const [corrections, setCorrections] = useState<Correction[]>([]);

  const refresh = useCallback(() => {
    const raw = safeGet(CORRECTIONS_KEY);
    if (!raw) {
      setCorrections([]);
      return;
    }
    try {
      setCorrections(JSON.parse(raw) as Correction[]);
    } catch {
      setCorrections([]);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const add = useCallback((c: Omit<Correction, "id" | "timestamp">) => {
    const next: Correction = {
      ...c,
      id: (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)),
      timestamp: new Date().toISOString(),
    };
    const raw = safeGet(CORRECTIONS_KEY);
    let arr: Correction[] = [];
    try {
      arr = raw ? (JSON.parse(raw) as Correction[]) : [];
    } catch {
      arr = [];
    }
    arr.unshift(next);
    safeSet(CORRECTIONS_KEY, JSON.stringify(arr));
    setCorrections(arr);
  }, []);

  const remove = useCallback((id: string) => {
    const raw = safeGet(CORRECTIONS_KEY);
    let arr: Correction[] = [];
    try {
      arr = raw ? (JSON.parse(raw) as Correction[]) : [];
    } catch {
      arr = [];
    }
    arr = arr.filter((c) => c.id !== id);
    safeSet(CORRECTIONS_KEY, JSON.stringify(arr));
    setCorrections(arr);
  }, []);

  return { corrections, add, remove, refresh };
}