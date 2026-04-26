import { ExternalLink } from "lucide-react";
import type { LiteratureData, NoveltyState } from "../data/mockPlanData";
import { PlanCard } from "./PlanCard";

const BANNERS: Record<NoveltyState, { bg: string; text: string; border: string; label: string }> = {
  novel: { bg: "#DCFCE7", text: "#15803D", border: "#16A34A", label: "No exact match found — this hypothesis appears novel." },
  similar: { bg: "#FEF3C7", text: "#B45309", border: "#D97706", label: "Similar protocols exist. Review references before proceeding." },
  match: { bg: "#FEE2E2", text: "#B91C1C", border: "#DC2626", label: "This protocol has been published. Replication study or novel angle needed." },
};

export function LiteratureCard({ data, status }: { data: LiteratureData; status: "running" | "done" }) {
  const b = BANNERS[data.novelty];
  return (
    <PlanCard title="Literature review" dotColor="#7C3AED" status={status}>
      <div
        className="rounded-md px-4 py-3 font-medium"
        style={{ background: b.bg, color: b.text, borderLeft: `3px solid ${b.border}`, fontSize: 13 }}
      >
        {b.label}
      </div>
      <div
        className="text-[#9B9B98] font-medium uppercase mt-4 mb-1"
        style={{ fontSize: 12, letterSpacing: "0.06em" }}
      >
        References
      </div>
      <ul>
        {data.references.map((r, i) => (
          <li
            key={r.doi}
            className={`py-3 flex items-start gap-3 ${i < data.references.length - 1 ? "border-b border-[#E5E5E3]" : ""}`}
          >
            <div className="flex-1">
              <div className="text-[#0D0D0D] font-medium" style={{ fontSize: 14, lineHeight: 1.5 }}>
                {r.title}
              </div>
              <div className="text-[#6B6B68] mt-1" style={{ fontSize: 12 }}>
                {r.authors} · {r.year} · <span className="font-mono">{r.doi}</span>
              </div>
            </div>
            <a
              href={`https://doi.org/${r.doi}`}
              target="_blank"
              rel="noreferrer"
              className="text-[#6B6B68] hover:text-[#0D0D0D] hover:bg-[#F3F3F2] transition-colors duration-150 ease-out rounded-md px-3 py-2 flex items-center gap-1 shrink-0"
              style={{ fontSize: 13 }}
            >
              <ExternalLink size={13} />
              View
            </a>
          </li>
        ))}
      </ul>
    </PlanCard>
  );
}