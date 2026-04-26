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
import { useThreadSimulator } from "../hooks/useThreadSimulator";
import type { BudgetData, Conflict, LiteratureData, Material, ParsedStructure, ProtocolStep, TimelineData, ValidationData } from "../data/mockPlanData";
import type { TrustLevel } from "../components/TrustBadge";
import { SkeletonBlock } from "../components/SkeletonBar";

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

  useEffect(() => {
    const stored = localStorage.getItem("whitecoat_hypothesis");
    const value = stored && stored.length > 0 ? stored : "";
    setHypothesis(value);
    if (value) {
      sim.startGeneration(value);
    }
  }, []);

  const statusOf = (id: number) => sim.threads.find((t) => t.id === id)?.status ?? "pending";

  const parsedData = (sim.planData.parsed ?? null) as ParsedStructure | null;
  const protocolData = (Array.isArray(sim.planData.protocol) ? sim.planData.protocol : []) as ProtocolStep[];
  const materialsData = (Array.isArray(sim.planData.materials) ? sim.planData.materials : []) as Material[];
  const budgetData = (sim.planData.budget ?? null) as BudgetData | null;
  const timelineData = (sim.planData.timeline ?? null) as TimelineData | null;
  const validationData = (sim.planData.validation ?? null) as ValidationData | null;
  const conflictsData = (Array.isArray(sim.planData.conflicts) ? sim.planData.conflicts : []) as Conflict[];

  const literatureData = useMemo(() => {
    const raw = (sim.planData.literature ?? null) as { novelty?: string; references?: unknown[] } | null;
    if (!raw) return null;
    const noveltyMap: Record<string, LiteratureData["novelty"]> = {
      not_found: "novel",
      similar: "similar",
      exact_match: "match",
      novel: "novel",
      match: "match",
    };
    return {
      novelty: noveltyMap[raw.novelty || "similar"] || "similar",
      references: Array.isArray(raw.references) ? raw.references : [],
    } as LiteratureData;
  }, [sim.planData.literature]);

  const trust: TrustLevel = useMemo(() => {
    if (sim.planData.trustLevel === "high" || sim.planData.trustLevel === "amber" || sim.planData.trustLevel === "low") {
      return sim.planData.trustLevel;
    }
    const unresolved = conflictsData.filter((c) => !c.resolved).length;
    return unresolved === 0 ? "high" : unresolved <= 2 ? "amber" : "low";
  }, [sim.planData.trustLevel, conflictsData]);

  const warnings = useMemo(() => (statusOf(6) === "done" ? conflictsData : []), [sim.threads, conflictsData]);

  const retry = async (threadId: number) => {
    const hypothesisValue = hypothesis || localStorage.getItem("whitecoat_hypothesis") || "";
    if (!hypothesisValue) return;
    await sim.retryThread(threadId, hypothesisValue);
  };

  return (
    <div className="min-h-screen bg-[#F8F8F7]">
      <Navbar variant="plan" />
      <main className="pt-14">
        <div className="px-6 py-6 flex flex-col lg:flex-row gap-6 max-w-[1400px] mx-auto">
          <div className="lg:w-[280px] lg:shrink-0">
            <ThreadPanel
              threads={sim.threads}
              elapsedSeconds={sim.elapsedSeconds}
              trust={trust}
              warnings={warnings}
              allComplete={sim.allComplete}
            />
          </div>

          <div className="flex-1 flex flex-col gap-4 min-w-0">
            <HypothesisCard hypothesis={hypothesis} />
            <ParsedStructureCard parsed={parsedData} />

            {statusOf(0) === "running" && <LoadingCard title="Literature review" color="#7C3AED" />}
            {statusOf(0) === "done" && literatureData && <LiteratureCard data={literatureData} status="done" />}
            {statusOf(0) === "error" && <ErrorCard onRetry={() => retry(0)} />}

            {statusOf(1) === "running" && <LoadingCard title="Step-by-step protocol" color="#2563EB" />}
            {statusOf(1) === "done" && <ProtocolCard steps={protocolData} status="done" />}
            {statusOf(1) === "error" && <ErrorCard onRetry={() => retry(1)} />}

            {statusOf(2) === "running" && <LoadingCard title="Materials & reagents" color="#D97706" />}
            {statusOf(2) === "done" && <MaterialsCard materials={materialsData} status="done" />}
            {statusOf(2) === "error" && <ErrorCard onRetry={() => retry(2)} />}

            {statusOf(3) === "running" && <LoadingCard title="Budget estimate" color="#16A34A" />}
            {statusOf(3) === "done" && budgetData && <BudgetCard data={budgetData} status="done" />}
            {statusOf(3) === "error" && <ErrorCard onRetry={() => retry(3)} />}

            {statusOf(4) === "running" && <LoadingCard title="Experiment timeline" color="#DC2626" />}
            {statusOf(4) === "done" && timelineData && <TimelineCard data={timelineData} status="done" />}
            {statusOf(4) === "error" && <ErrorCard onRetry={() => retry(4)} />}

            {statusOf(5) === "running" && <LoadingCard title="Validation approach" color="#0891B2" />}
            {statusOf(5) === "done" && validationData && <ValidationCard data={validationData} status="done" />}
            {statusOf(5) === "error" && <ErrorCard onRetry={() => retry(5)} />}

            {sim.allComplete && <RecombinerCard conflicts={conflictsData} status={statusOf(6) === "done" ? "done" : "running"} />}

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

function LoadingCard({ title, color }: { title: string; color: string }) {
  return (
    <section
      className="bg-[#FFFFFF] border border-[#E5E5E3] rounded-[10px] p-5"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)" }}
    >
      <div className="flex items-center gap-3 mb-4">
        <span className="w-2 h-2 rounded-full" style={{ background: color }} />
        <h3 className="text-[#0D0D0D] font-semibold" style={{ fontSize: 14 }}>
          {title}
        </h3>
      </div>
      <SkeletonBlock lines={4} />
    </section>
  );
}

function ErrorCard({ onRetry }: { onRetry: () => void }) {
  return (
    <section className="bg-[#FEE2E2] border-l-[3px] border-[#DC2626] rounded-[10px] p-4">
      <div className="text-[#7F1D1D]" style={{ fontSize: 14 }}>
        This section failed to load.
      </div>
      <button
        onClick={onRetry}
        className="mt-3 border border-[#E5E5E3] bg-white text-[#0D0D0D] rounded-md"
        style={{ fontSize: 12, padding: "6px 10px" }}
      >
        Retry
      </button>
    </section>
  );
}