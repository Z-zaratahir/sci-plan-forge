import { SkeletonBar } from "./SkeletonBar";
import type { ParsedStructure } from "../data/mockPlanData";

export interface ParsedStructureCardProps {
  parsed: ParsedStructure | null;
}

const ROWS: { key: keyof ParsedStructure; label: string }[] = [
  { key: "intervention", label: "Intervention" },
  { key: "outcome", label: "Outcome + threshold" },
  { key: "mechanism", label: "Mechanism" },
  { key: "control", label: "Control condition" },
];

const SKELE_WIDTHS = ["80%", "60%", "90%", "70%"];

export function ParsedStructureCard({ parsed }: ParsedStructureCardProps) {
  return (
    <section
      className="bg-[#FFFFFF] border border-[#E5E5E3] rounded-[10px] p-5"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)" }}
    >
      <div
        className="text-[#9B9B98] font-medium uppercase mb-3"
        style={{ fontSize: 12, letterSpacing: "0.06em" }}
      >
        Parsed structure
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-y-3 gap-x-4">
        {ROWS.map((row, i) => (
          <div key={row.key} className="contents">
            <div className="text-[#6B6B68]" style={{ fontSize: 13 }}>
              {row.label}
            </div>
            <div className="text-[#0D0D0D] font-medium" style={{ fontSize: 13, lineHeight: 1.6 }}>
              {parsed ? parsed[row.key] : <SkeletonBar width={SKELE_WIDTHS[i]} />}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}