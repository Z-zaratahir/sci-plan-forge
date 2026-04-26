import { useCallback, useEffect, useRef, useState } from "react";

/*
 * PDC FORK-JOIN PARALLEL THREAD MODEL
 * =====================================
 * Fork point: Threads 0,1,3,4,5 start simultaneously via Promise.all()
 * Sequential dependency: Thread 2 (Materials) waits for Thread 1 (Protocol)
 *   — this is an intentional data dependency, not a performance choice
 * Join barrier: Thread 6 (Recombiner) waits for ALL 6 threads to complete
 *   — synchronization point where cross-thread conflicts are detected
 * Critical path: computed in TimelineCard using Kahn's topological sort
 *   on the task dependency DAG returned by /api/timeline
 */

export interface Thread {
  id: number;
  name: string;
  status: "pending" | "running" | "done" | "error";
  color: string;
}

export interface PlanData {
  parsed: any;
  literature: any;
  protocol: any[];
  materials: any[];
  budget: any;
  timeline: any;
  validation: any;
  conflicts: any[];
  trustLevel: string | null;
}

const INITIAL_THREADS: Thread[] = [
  { id: 0, name: "Literature QC", status: "pending", color: "#7C3AED" },
  { id: 1, name: "Protocol", status: "pending", color: "#2563EB" },
  { id: 2, name: "Materials", status: "pending", color: "#D97706" },
  { id: 3, name: "Budget", status: "pending", color: "#16A34A" },
  { id: 4, name: "Timeline", status: "pending", color: "#DC2626" },
  { id: 5, name: "Validation", status: "pending", color: "#0891B2" },
  { id: 6, name: "Recombiner", status: "pending", color: "#0D0D0D" },
];

const EMPTY_PLAN: PlanData = {
  parsed: null,
  literature: null,
  protocol: [],
  materials: [],
  budget: null,
  timeline: null,
  validation: null,
  conflicts: [],
  trustLevel: null,
};

export function useThreadSimulator() {
  const [threads, setThreads] = useState<Thread[]>(INITIAL_THREADS);
  const [planData, setPlanData] = useState<PlanData>(EMPTY_PLAN);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [allComplete, setAllComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const setThreadStatus = useCallback((id: number, status: Thread["status"]) => {
    setThreads((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
  }, []);

  const api = useCallback(async (endpoint: string, body: object) => {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`${endpoint} failed: ${res.status}`);
    return res.json();
  }, []);

  const startGeneration = useCallback(
    async (hypothesis: string) => {
      const clean = (hypothesis || "").trim();
      if (!clean) return;

      setError(null);
      setThreads(INITIAL_THREADS);
      setPlanData(EMPTY_PLAN);
      setElapsedSeconds(0);
      setAllComplete(false);

      if (timerRef.current) clearInterval(timerRef.current);
      const interval = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
      timerRef.current = interval;

      const corrections = JSON.parse(localStorage.getItem("whitecoat_corrections") || "[]");
      localStorage.setItem("whitecoat_hypothesis", clean);

      let parsed: any = null;
      try {
        parsed = await api("/api/parse", { hypothesis: clean });
        setPlanData((prev) => ({ ...prev, parsed }));
      } catch (e) {
        parsed = null;
      }

      setThreadStatus(0, "running");
      setThreadStatus(1, "running");
      setThreadStatus(3, "running");
      setThreadStatus(4, "running");
      setThreadStatus(5, "running");

      const [litResult, protResult, valResult] = await Promise.allSettled([
        api("/api/literature", { hypothesis: clean })
          .then((data) => {
            setThreadStatus(0, "done");
            setPlanData((prev) => ({ ...prev, literature: data }));
            return data;
          })
          .catch(() => {
            setThreadStatus(0, "error");
            return null;
          }),
        api("/api/protocol", { hypothesis: clean, parsed, corrections })
          .then((data) => {
            setThreadStatus(1, "done");
            setPlanData((prev) => ({ ...prev, protocol: Array.isArray(data) ? data : [] }));
            return data;
          })
          .catch(() => {
            setThreadStatus(1, "error");
            return null;
          }),
        api("/api/validation", { hypothesis: clean, parsed, corrections })
          .then((data) => {
            setThreadStatus(5, "done");
            setPlanData((prev) => ({ ...prev, validation: data }));
            return data;
          })
          .catch(() => {
            setThreadStatus(5, "error");
            return null;
          }),
      ]);

      const literature = litResult.status === "fulfilled" ? litResult.value : null;
      const protocol = protResult.status === "fulfilled" ? protResult.value : null;
      const validation = valResult.status === "fulfilled" ? valResult.value : null;

      setThreadStatus(2, "running");
      const materials = await api("/api/materials", {
        hypothesis: clean,
        steps: protocol || [],
        corrections,
      })
        .then((data) => {
          setThreadStatus(2, "done");
          setPlanData((prev) => ({ ...prev, materials: Array.isArray(data) ? data : [] }));
          return data;
        })
        .catch(() => {
          setThreadStatus(2, "error");
          return null;
        });

      const [budgetResult, timelineResult] = await Promise.allSettled([
        api("/api/budget", { materials: materials || [], corrections })
          .then((data) => {
            setThreadStatus(3, "done");
            setPlanData((prev) => ({ ...prev, budget: data }));
            return data;
          })
          .catch(() => {
            setThreadStatus(3, "error");
            return null;
          }),
        api("/api/timeline", { hypothesis: clean, steps: protocol || [], corrections })
          .then((data) => {
            setThreadStatus(4, "done");
            setPlanData((prev) => ({ ...prev, timeline: data }));
            return data;
          })
          .catch(() => {
            setThreadStatus(4, "error");
            return null;
          }),
      ]);

      const budget = budgetResult.status === "fulfilled" ? budgetResult.value : null;
      const timeline = timelineResult.status === "fulfilled" ? timelineResult.value : null;

      setThreadStatus(6, "running");
      const recombined = await api("/api/recombine", {
        literature,
        protocol,
        materials,
        budget,
        timeline,
        validation,
      })
        .then((data) => {
          setThreadStatus(6, "done");
          setPlanData((prev) => ({
            ...prev,
            conflicts: Array.isArray(data?.conflicts) ? data.conflicts : [],
            trustLevel: data?.trustLevel || null,
          }));
          return data;
        })
        .catch((e) => {
          setThreadStatus(6, "error");
          setError(e instanceof Error ? e.message : "Failed to recombine");
          return null;
        });

      clearInterval(interval);
      timerRef.current = null;
      setAllComplete(true);

      localStorage.setItem(
        "whitecoat_last_plan",
        JSON.stringify({
          hypothesis: clean,
          parsed,
          literature,
          protocol,
          materials,
          budget,
          timeline,
          validation,
          conflicts: recombined?.conflicts || [],
        }),
      );
    },
    [api, setThreadStatus],
  );

  const retryThread = useCallback(
    async (threadId: number, hypothesis: string) => {
      const clean = (hypothesis || "").trim();
      if (!clean) return;
      const corrections = JSON.parse(localStorage.getItem("whitecoat_corrections") || "[]");
      const protocol = Array.isArray(planData.protocol) ? planData.protocol : [];
      const materials = Array.isArray(planData.materials) ? planData.materials : [];

      setThreadStatus(threadId, "running");
      try {
        if (threadId === 0) {
          const data = await api("/api/literature", { hypothesis: clean });
          setPlanData((prev) => ({ ...prev, literature: data }));
        }
        if (threadId === 1) {
          const data = await api("/api/protocol", { hypothesis: clean, parsed: planData.parsed, corrections });
          setPlanData((prev) => ({ ...prev, protocol: Array.isArray(data) ? data : [] }));
        }
        if (threadId === 2) {
          const data = await api("/api/materials", { hypothesis: clean, steps: protocol, corrections });
          setPlanData((prev) => ({ ...prev, materials: Array.isArray(data) ? data : [] }));
        }
        if (threadId === 3) {
          const data = await api("/api/budget", { materials, corrections });
          setPlanData((prev) => ({ ...prev, budget: data }));
        }
        if (threadId === 4) {
          const data = await api("/api/timeline", { hypothesis: clean, steps: protocol, corrections });
          setPlanData((prev) => ({ ...prev, timeline: data }));
        }
        if (threadId === 5) {
          const data = await api("/api/validation", { hypothesis: clean, parsed: planData.parsed, corrections });
          setPlanData((prev) => ({ ...prev, validation: data }));
        }
        if (threadId === 6) {
          const data = await api("/api/recombine", {
            literature: planData.literature,
            protocol,
            materials,
            budget: planData.budget,
            timeline: planData.timeline,
            validation: planData.validation,
          });
          setPlanData((prev) => ({
            ...prev,
            conflicts: Array.isArray(data?.conflicts) ? data.conflicts : [],
            trustLevel: data?.trustLevel || null,
          }));
        }
        setThreadStatus(threadId, "done");
      } catch (e) {
        setThreadStatus(threadId, "error");
      }
    },
    [api, planData, setThreadStatus],
  );

  useEffect(
    () => () => {
      if (timerRef.current) clearInterval(timerRef.current);
    },
    [],
  );

  return { threads, planData, startGeneration, retryThread, elapsedSeconds, allComplete, error };
}