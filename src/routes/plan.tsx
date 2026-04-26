import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Navbar } from "../components/Navbar";
import { ThreadPanel } from "../components/ThreadPanel";
import { HypothesisCard } from "../components/HypothesisCard";
import { ParsedStructureCard } from "../components/ParsedStructureCard";
import { LiteratureCard } from "../components/LiteratureCard";
import { ProtocolCard } from "../components/ProtocolCard";
import { MaterialsCard } from "../components/MaterialsCard";
import { BudgetCard } from "../components/BudgetCard";
import { TimelineCard } from "../components/TimelineCard";
import { ValidationCard } from "../components/ValidationCard";
import { RecombinerCard } from "../components/RecombinerCard";
import { useThreadSimulator, type ThreadId } from "../hooks/useThreadSimulator";
import { planStore } from "../hooks/usePlanStore";
import { buildMockPlan, MOCK_HYPOTHESIS, MOCK_CONFLICTS, MOCK_LITERATURE, MOCK_STEPS, MOCK_MATERIALS, MOCK_BUDGET, MOCK_TIMELINE, MOCK_VALIDATION, MOCK_PARSED } from "../data/mockPlanData";
import type { TrustLevel } from "../components/TrustBadge";

export const Route = createFileRoute("/plan")({
  head: () => ({
    meta: [
      { title: "Generating plan — WhiteCoat" },
      { name: "description", content: "Live experiment plan generation across 6 parallel AI threads." },
      { property: "og:title", content: "WhiteCoat experiment plan" },
      { property: "og:description", content: "Live experiment plan generation across 6 parallel AI threads." },
    ],
  }),
  component: PlanPage,
});

function PlanPage() {
  const navigate = useNavigate();
  const [hypothesis, setHypothesis] = useState<string>("");
  const sim = useThreadSimulator();

  // Read hypothesis on mount, then start
  useEffect(() => {
    const stored = planStore.getHypothesis();
    const value = stored && stored.length > 0 ? stored : MOCK_HYPOTHESIS;
    setHypothesis(value);
    sim.startGeneration();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist plan when complete
  useEffect(() => {
    if (sim.allComplete && hypothesis) {
      planStore.setPlan(buildMockPlan(hypothesis));
    }
  }, [sim.allComplete, hypothesis]);

  const statusOf = (id: ThreadId) => sim.threads.find((t) => t.id === id)!.status;

  const trust: TrustLevel = useMemo(() => {
    if (statusOf("recombiner") !== "done") return "pending";
    const unresolved = MOCK_CONFLICTS.filter((c) => !c.resolved).length;
    if (unresolved === 0) return "high";
    if (unresolved <= 1) return "medium";
    return "low";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sim.threads]);

  const warnings = useMemo(
    () => (statusOf("recombiner") === "done" ? MOCK_CONFLICTS.filter((c) => !c.resolved).map((c) => c.text) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sim.threads],
  );

  return (
    <div className="min-h-screen bg-[#F8F8F7]">
      <Navbar variant="plan" />
      <main className="pt-14">
        <div className="px-6 py-6 flex flex-col lg:flex-row gap-6 max-w-[1400px] mx-auto">
          <div className="lg:w-[280px] lg:shrink-0">
            <ThreadPanel
              threads={sim.threads}
              elapsedSeconds={sim.elapsedSeconds}
              completeCount={sim.completeCount}
              trust={trust}
              warnings={warnings}
            />
          </div>

          <div className="flex-1 flex flex-col gap-4 min-w-0">
            <HypothesisCard hypothesis={hypothesis} />
            <ParsedStructureCard parsed={sim.parsedReady ? MOCK_PARSED : null} />

            {statusOf("literature") !== "pending" && (
              <LiteratureCard data={MOCK_LITERATURE} status={statusOf("literature") === "done" ? "done" : "running"} />
            )}
            {statusOf("protocol") !== "pending" && (
              <ProtocolCard steps={MOCK_STEPS} status={statusOf("protocol") === "done" ? "done" : "running"} />
            )}
            {statusOf("materials") !== "pending" && (
              <MaterialsCard materials={MOCK_MATERIALS} status={statusOf("materials") === "done" ? "done" : "running"} />
            )}
            {statusOf("budget") !== "pending" && (
              <BudgetCard data={MOCK_BUDGET} status={statusOf("budget") === "done" ? "done" : "running"} />
            )}
            {statusOf("timeline") !== "pending" && (
              <TimelineCard data={MOCK_TIMELINE} status={statusOf("timeline") === "done" ? "done" : "running"} />
            )}
            {statusOf("validation") !== "pending" && (
              <ValidationCard data={MOCK_VALIDATION} status={statusOf("validation") === "done" ? "done" : "running"} />
            )}
            {statusOf("recombiner") !== "pending" && (
              <RecombinerCard conflicts={MOCK_CONFLICTS} status={statusOf("recombiner") === "done" ? "done" : "running"} />
            )}

            {sim.allComplete && (
              <div className="flex items-center justify-between bg-[#FFFFFF] border border-[#E5E5E3] rounded-[10px] p-5">
                <div>
                  <div className="text-[#0D0D0D] font-medium" style={{ fontSize: 14 }}>
                    Plan ready in {sim.elapsedSeconds}s
                  </div>
                  <div className="text-[#6B6B68]" style={{ fontSize: 13 }}>
                    Annotate sections to improve future plans for similar experiments.
                  </div>
                </div>
                <button
                  onClick={() => navigate({ to: "/review" })}
                  className="bg-[#0D0D0D] text-white hover:bg-[#2D2D2D] transition-colors duration-150 ease-out rounded-md font-medium"
                  style={{ fontSize: 14, padding: "10px 20px" }}
                >
                  Review plan
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}