import { CheckCircle, AlertTriangle, GitMerge } from "lucide-react";
import type { Conflict } from "../data/mockPlanData";
import { PlanCard } from "./PlanCard";

export function RecombinerCard({ conflicts, status }: { conflicts: Conflict[]; status: "running" | "done" }) {
  const allClean = conflicts.length === 0;
  return (
    <PlanCard
      title="Cross-section coherence check"
      dotColor="#0D0D0D"
      status={status}
      topAccent
      rightSlot={<GitMerge size={16} className="text-[#0D0D0D]" />}
    >
      {allClean ? (
        <div className="flex items-center gap-2 text-[#15803D]" style={{ fontSize: 14 }}>
          <CheckCircle size={16} />
          All sections consistent — no conflicts detected.
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {conflicts.map((c, i) => (
            <li key={i} className="flex items-start gap-2">
              {c.resolved ? (
                <CheckCircle size={16} className="text-[#16A34A] mt-[2px] shrink-0" />
              ) : (
                <AlertTriangle size={16} className="text-[#D97706] mt-[2px] shrink-0" />
              )}
              <span className="text-[#0D0D0D]" style={{ fontSize: 14, lineHeight: 1.6 }}>
                {c.text}
              </span>
            </li>
          ))}
        </ul>
      )}
    </PlanCard>
  );
}