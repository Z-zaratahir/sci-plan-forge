import { ExternalLink } from "lucide-react";
import type { ProtocolStep } from "../data/mockPlanData";
import { PlanCard } from "./PlanCard";

export function ProtocolCard({ steps, status }: { steps: ProtocolStep[]; status: "running" | "done" }) {
  return (
    <PlanCard title="Step-by-step protocol" dotColor="#2563EB" status={status}>
      <ol>
        {steps.map((s, i) => (
          <li
            key={s.number}
            className={`flex gap-3 py-3 ${i < steps.length - 1 ? "border-b border-[#E5E5E3]" : ""}`}
          >
            <div
              className="w-6 h-6 rounded-full bg-[#F3F3F2] text-[#6B6B68] flex items-center justify-center font-medium shrink-0"
              style={{ fontSize: 13 }}
            >
              {s.number}
            </div>
            <div className="flex-1">
              <div className="text-[#0D0D0D] font-medium" style={{ fontSize: 14 }}>
                {s.title}
              </div>
              <div className="text-[#6B6B68] mt-1" style={{ fontSize: 13, lineHeight: 1.5 }}>
                {s.description}
              </div>
              {s.source && (
                <span
                  className="inline-flex items-center gap-1 mt-2 bg-[#EDE9FE] text-[#6D28D9] font-medium rounded-[4px] px-2 py-[2px] font-mono"
                  style={{ fontSize: 12 }}
                >
                  <ExternalLink size={11} />
                  {s.source}
                </span>
              )}
            </div>
          </li>
        ))}
      </ol>
    </PlanCard>
  );
}