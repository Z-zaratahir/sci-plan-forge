import { BookOpen, ListChecks, Package, DollarSign, CalendarDays, CheckCircle, GitMerge, Loader2, Check, AlertTriangle } from "lucide-react";
import type { ThreadId, ThreadState } from "../hooks/useThreadSimulator";
import { TrustBadge, type TrustLevel } from "./TrustBadge";

const META: Record<ThreadId, { label: string; color: string; Icon: typeof BookOpen }> = {
  literature: { label: "Literature QC", color: "#7C3AED", Icon: BookOpen },
  protocol: { label: "Protocol", color: "#2563EB", Icon: ListChecks },
  materials: { label: "Materials", color: "#D97706", Icon: Package },
  budget: { label: "Budget", color: "#16A34A", Icon: DollarSign },
  timeline: { label: "Timeline", color: "#DC2626", Icon: CalendarDays },
  validation: { label: "Validation", color: "#0891B2", Icon: CheckCircle },
  recombiner: { label: "Recombiner", color: "#0D0D0D", Icon: GitMerge },
};

export interface ThreadPanelProps {
  threads: ThreadState[];
  elapsedSeconds: number;
  completeCount: number;
  trust: TrustLevel;
  warnings: string[];
}

export function ThreadPanel({ threads, elapsedSeconds, completeCount, trust, warnings }: ThreadPanelProps) {
  return (
    <aside
      className="bg-[#FFFFFF] border border-[#E5E5E3] rounded-[10px] p-5 sticky"
      style={{ top: 80, boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)" }}
    >
      <div
        className="text-[#9B9B98] font-medium uppercase mb-4"
        style={{ fontSize: 13, letterSpacing: "0.06em" }}
      >
        Analysis threads
      </div>
      <ul className="flex flex-col">
        {threads.map((t) => {
          const m = META[t.id];
          const isDone = t.status === "done";
          const isPending = t.status === "pending";
          const labelColor = isDone ? "#0D0D0D" : isPending ? "#9B9B98" : "#0D0D0D";
          const iconColor = t.status === "running" ? m.color : isDone ? m.color : "#9B9B98";
          return (
            <li key={t.id} className="h-9 flex items-center gap-[10px]">
              <m.Icon size={15} color={iconColor} />
              <span style={{ fontSize: 14, color: labelColor }} className="flex-1">
                {m.label}
              </span>
              {t.status === "pending" && (
                <span className="w-2 h-2 rounded-full bg-[#E5E5E3]" />
              )}
              {t.status === "running" && (
                <Loader2 size={14} className="animate-spin text-[#0D0D0D]" />
              )}
              {t.status === "done" && <Check size={14} className="text-[#16A34A]" />}
            </li>
          );
        })}
      </ul>

      <div className="my-4 h-px bg-[#E5E5E3]" />

      <div className="flex flex-col gap-3 mb-4">
        <div>
          <div className="text-[#9B9B98]" style={{ fontSize: 12 }}>
            Time elapsed
          </div>
          <div className="text-[#0D0D0D] font-medium" style={{ fontSize: 13 }}>
            {elapsedSeconds}s
          </div>
        </div>
        <div>
          <div className="text-[#9B9B98]" style={{ fontSize: 12 }}>
            Threads complete
          </div>
          <div className="text-[#0D0D0D] font-medium" style={{ fontSize: 13 }}>
            {completeCount} / 7
          </div>
        </div>
      </div>

      <div
        className="text-[#9B9B98] font-medium uppercase mb-2"
        style={{ fontSize: 12, letterSpacing: "0.06em" }}
      >
        Trust score
      </div>
      <TrustBadge level={trust} />

      {warnings.length > 0 && (
        <ul className="flex flex-col gap-2 mt-3">
          {warnings.map((w, i) => (
            <li key={i} className="flex items-start gap-2">
              <AlertTriangle size={13} className="mt-[2px] text-[#D97706] shrink-0" />
              <span className="text-[#6B6B68]" style={{ fontSize: 12, lineHeight: 1.5 }}>
                {w}
              </span>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}