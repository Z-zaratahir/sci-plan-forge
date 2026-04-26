import { useCallback, useEffect, useRef, useState } from "react";

export type ThreadId = "literature" | "protocol" | "materials" | "budget" | "timeline" | "validation" | "recombiner";
export type ThreadStatus = "pending" | "running" | "done";

export interface ThreadState {
  id: ThreadId;
  status: ThreadStatus;
}

const INITIAL: ThreadState[] = [
  { id: "literature", status: "pending" },
  { id: "protocol", status: "pending" },
  { id: "materials", status: "pending" },
  { id: "budget", status: "pending" },
  { id: "timeline", status: "pending" },
  { id: "validation", status: "pending" },
  { id: "recombiner", status: "pending" },
];

export function useThreadSimulator() {
  const [threads, setThreads] = useState<ThreadState[]>(INITIAL);
  const [parsedReady, setParsedReady] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const set = (id: ThreadId, status: ThreadStatus) =>
    setThreads((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));

  const clearAll = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
  };

  const startGeneration = useCallback(() => {
    clearAll();
    setThreads(INITIAL);
    setParsedReady(false);
    setElapsedSeconds(0);
    setRunning(true);

    const start = Date.now();
    intervalRef.current = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - start) / 1000));
    }, 250);

    const t = (ms: number, fn: () => void) => {
      timersRef.current.push(setTimeout(fn, ms));
    };

    t(800, () => {
      setParsedReady(true);
      // Start threads 1,2,4,5,6 simultaneously. Thread 3 waits for 2.
      set("literature", "running");
      set("protocol", "running");
      set("budget", "running");
      set("timeline", "running");
      set("validation", "running");

      t(4000, () => set("literature", "done"));
      t(6000, () => {
        set("protocol", "done");
        set("materials", "running");
        t(3000, () => set("materials", "done"));
      });
      t(5000, () => set("budget", "done"));
      t(4500, () => set("timeline", "done"));
      t(3500, () => set("validation", "done"));
    });
  }, []);

  // Watch for all 6 done -> start recombiner
  useEffect(() => {
    const sixDone = threads.slice(0, 6).every((t) => t.status === "done");
    const recomb = threads[6];
    if (sixDone && recomb.status === "pending") {
      set("recombiner", "running");
      const id = setTimeout(() => set("recombiner", "done"), 2000);
      timersRef.current.push(id);
    }
    if (recomb.status === "done" && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      setRunning(false);
    }
  }, [threads]);

  useEffect(() => () => clearAll(), []);

  const allComplete = threads.every((t) => t.status === "done");
  const completeCount = threads.filter((t) => t.status === "done").length;

  return { threads, parsedReady, elapsedSeconds, allComplete, completeCount, running, startGeneration };
}