import type { ValidationData } from "../data/mockPlanData";
import { PlanCard } from "./PlanCard";

export function ValidationCard({ data, status }: { data: ValidationData; status: "running" | "done" }) {
  const sections: { label: string; value: string; warn?: boolean }[] = [
    { label: "Primary endpoint", value: data.endpoint },
    { label: "Statistical test", value: data.stat_test },
    { label: "Sample size estimate", value: data.sample_size },
    { label: "Negative result criteria", value: data.negative_criteria, warn: true },
  ];
  return (
    <PlanCard title="Validation approach" dotColor="#0891B2" status={status}>
      <div className="flex flex-col gap-4">
        {sections.map((s) => (
          <div key={s.label}>
            <div
              className="text-[#9B9B98] font-medium uppercase mb-[6px]"
              style={{ fontSize: 12, letterSpacing: "0.06em" }}
            >
              {s.label}
            </div>
            <div
              className="text-[#0D0D0D]"
              style={
                s.warn
                  ? {
                      fontSize: 14,
                      lineHeight: 1.6,
                      borderLeft: "3px solid #D97706",
                      background: "#FEFCE8",
                      padding: "10px 14px",
                      borderRadius: "0 6px 6px 0",
                    }
                  : { fontSize: 14, lineHeight: 1.6 }
              }
            >
              {s.value}
            </div>
          </div>
        ))}
      </div>
    </PlanCard>
  );
}