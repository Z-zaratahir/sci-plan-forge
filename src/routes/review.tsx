import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, ThumbsUp, ThumbsDown, Flag, Trash2 } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { Badge } from "../components/Badge";
import { useCorrections, planStore } from "../hooks/usePlanStore";
import type { PlanData } from "../data/mockPlanData";

export const Route = createFileRoute("/review")({
  head: () => ({
    meta: [
      { title: "Scientist review loop — WhiteCoat" },
      { name: "description", content: "Annotate sections of your experiment plan. Corrections improve future plans." },
      { property: "og:title", content: "WhiteCoat scientist review loop" },
      { property: "og:description", content: "Annotate sections of your experiment plan. Corrections improve future plans." },
    ],
  }),
  component: ReviewPage,
});

type Rating = "up" | "down" | "flag" | null;

interface SectionMeta {
  key: keyof PlanData;
  label: string;
  color: string;
  preview: (p: PlanData) => string;
}

const SECTIONS: SectionMeta[] = [
  { key: "literature", label: "Literature review", color: "#7C3AED", preview: (p) => `${p.literature.references.length} references — novelty: ${p.literature.novelty}` },
  { key: "steps", label: "Step-by-step protocol", color: "#2563EB", preview: (p) => `${p.steps.length} steps` },
  { key: "materials", label: "Materials & reagents", color: "#D97706", preview: (p) => `${p.materials.length} items` },
  { key: "budget", label: "Budget estimate", color: "#16A34A", preview: (p) => `Total $${p.budget.total.toLocaleString("en-US")}` },
  { key: "timeline", label: "Experiment timeline", color: "#DC2626", preview: (p) => `${p.timeline.minWeeks} weeks · ${p.timeline.criticalCount} critical tasks` },
  { key: "validation", label: "Validation approach", color: "#0891B2", preview: (p) => p.validation.endpoint.slice(0, 110) + "…" },
];

function ReviewPage() {
  const [plan, setPlan] = useState<PlanData | null>(null);
  const { corrections, add, remove } = useCorrections();

  useEffect(() => {
    setPlan(planStore.getPlan());
  }, []);

  return (
    <div className="min-h-screen bg-[#F8F8F7]">
      <Navbar variant="review" />
      <main className="pt-14">
        <div className="max-w-[760px] mx-auto px-6 py-8">
          <h1 className="text-[#0D0D0D] font-semibold" style={{ fontSize: 24, letterSpacing: "-0.02em" }}>
            Scientist review loop
          </h1>
          <p className="text-[#6B6B68] mt-2 mb-8" style={{ fontSize: 14, lineHeight: 1.6 }}>
            Annotate sections of your plan. Corrections are stored and used to improve future plans of the same experiment type.
          </p>

          {!plan ? (
            <div
              className="bg-[#FFFFFF] border border-[#E5E5E3] rounded-[10px] p-8 text-center"
              style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)" }}
            >
              <div className="text-[#0D0D0D] font-medium" style={{ fontSize: 14 }}>
                No plan to review yet.
              </div>
              <p className="text-[#6B6B68] mt-2" style={{ fontSize: 13 }}>
                Generate a plan first to leave annotations.
              </p>
              <Link
                to="/"
                className="inline-flex items-center mt-4 bg-[#0D0D0D] text-white hover:bg-[#2D2D2D] transition-colors duration-150 ease-out rounded-md font-medium"
                style={{ fontSize: 14, padding: "10px 20px" }}
              >
                Start a new hypothesis
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {SECTIONS.map((s) => (
                <ReviewSection
                  key={s.key}
                  meta={s}
                  plan={plan}
                  onSave={(text) =>
                    add({
                      experiment_type: plan.parsed.intervention.slice(0, 60),
                      section: s.label,
                      original_text: s.preview(plan),
                      correction: text,
                    })
                  }
                />
              ))}
            </div>
          )}

          <div className="mt-12">
            <div
              className="text-[#9B9B98] font-medium uppercase mb-3"
              style={{ fontSize: 13, letterSpacing: "0.06em" }}
            >
              Stored corrections
            </div>
            {corrections.length === 0 ? (
              <div
                className="bg-[#FFFFFF] border border-[#E5E5E3] rounded-[10px] p-5 text-[#6B6B68]"
                style={{ fontSize: 13 }}
              >
                No corrections stored yet.
              </div>
            ) : (
              <ul className="flex flex-col gap-3">
                {corrections.map((c) => (
                  <li
                    key={c.id}
                    className="bg-[#FFFFFF] border border-[#E5E5E3] rounded-[10px] p-4"
                    style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)" }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap gap-2 mb-2">
                          <Badge variant="default">{c.section}</Badge>
                          <Badge variant="purple">{c.experiment_type}</Badge>
                        </div>
                        <div className="text-[#0D0D0D]" style={{ fontSize: 14, lineHeight: 1.6 }}>
                          {c.correction}
                        </div>
                        <div className="text-[#9B9B98] mt-2" style={{ fontSize: 12 }}>
                          {new Date(c.timestamp).toLocaleString()}
                        </div>
                      </div>
                      <button
                        aria-label="Delete"
                        onClick={() => remove(c.id)}
                        className="text-[#9B9B98] hover:text-[#DC2626] hover:bg-[#F3F3F2] transition-colors duration-150 ease-out rounded-md p-2 shrink-0"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function ReviewSection({
  meta,
  plan,
  onSave,
}: {
  meta: SectionMeta;
  plan: PlanData;
  onSave: (text: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const [rating, setRating] = useState<Rating>(null);
  const [text, setText] = useState("");
  const showPanel = rating === "down" || rating === "flag";

  const fillIf = (r: Rating) => (rating === r ? meta.color : "#9B9B98");

  return (
    <section
      className="bg-[#FFFFFF] border border-[#E5E5E3] rounded-[10px]"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)" }}
    >
      <header className="flex items-center justify-between p-5">
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: meta.color }} />
          <div className="min-w-0">
            <h3 className="text-[#0D0D0D] font-medium truncate" style={{ fontSize: 14 }}>
              {meta.label}
            </h3>
            <div className="text-[#6B6B68] truncate" style={{ fontSize: 13 }}>
              {meta.preview(plan)}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            aria-label="Thumbs up"
            onClick={() => setRating(rating === "up" ? null : "up")}
            className="text-[#9B9B98] hover:bg-[#F3F3F2] transition-colors duration-150 ease-out rounded-md p-2"
          >
            <ThumbsUp size={15} fill={rating === "up" ? meta.color : "none"} color={fillIf("up")} />
          </button>
          <button
            aria-label="Thumbs down"
            onClick={() => setRating(rating === "down" ? null : "down")}
            className="text-[#9B9B98] hover:bg-[#F3F3F2] transition-colors duration-150 ease-out rounded-md p-2"
          >
            <ThumbsDown size={15} fill={rating === "down" ? meta.color : "none"} color={fillIf("down")} />
          </button>
          <button
            aria-label="Flag"
            onClick={() => setRating(rating === "flag" ? null : "flag")}
            className="text-[#9B9B98] hover:bg-[#F3F3F2] transition-colors duration-150 ease-out rounded-md p-2"
          >
            <Flag size={15} fill={rating === "flag" ? meta.color : "none"} color={fillIf("flag")} />
          </button>
          <button
            aria-label={open ? "Collapse" : "Expand"}
            onClick={() => setOpen((v) => !v)}
            className="text-[#9B9B98] hover:bg-[#F3F3F2] transition-colors duration-150 ease-out rounded-md p-2"
          >
            {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </header>

      <div
        className="overflow-hidden transition-all duration-200 ease-out"
        style={{ maxHeight: open && showPanel ? 360 : 0 }}
      >
        <div
          className="p-4 border-t border-[#E5E5E3] bg-[#F8F8F7]"
          style={{ borderRadius: "0 0 10px 10px" }}
        >
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Describe what's wrong and what the correct approach should be…"
            className="w-full bg-[#FFFFFF] border border-[#E5E5E3] rounded-md p-3 outline-none focus:border-[#0D0D0D] resize-y placeholder:text-[#9B9B98] text-[#0D0D0D]"
            style={{ height: 80, fontSize: 14, fontFamily: "Inter, sans-serif" }}
          />
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={() => {
                if (!text.trim()) return;
                onSave(text.trim());
                setText("");
                setRating(null);
              }}
              disabled={!text.trim()}
              className="bg-[#0D0D0D] text-white hover:bg-[#2D2D2D] active:scale-[0.98] transition-colors duration-150 ease-out rounded-md font-medium disabled:bg-[#D1D1CE] disabled:text-[#9B9B98] disabled:cursor-not-allowed"
              style={{ fontSize: 13, padding: "8px 16px" }}
            >
              Save correction
            </button>
            <button
              onClick={() => {
                setText("");
                setRating(null);
              }}
              className="text-[#6B6B68] hover:text-[#0D0D0D] hover:bg-[#F3F3F2] transition-colors duration-150 ease-out rounded-md"
              style={{ fontSize: 13, padding: "8px 12px" }}
            >
              Cancel
            </button>
          </div>
          <div className="text-[#9B9B98] mt-2" style={{ fontSize: 12 }}>
            This correction will be used as a reference when generating similar plans in the future.
          </div>
        </div>
      </div>
    </section>
  );
}