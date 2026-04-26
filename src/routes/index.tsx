import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, FlaskConical } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { planStore } from "../hooks/usePlanStore";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "WhiteCoat — From hypothesis to runnable experiment" },
      { name: "description", content: "Type a hypothesis. WhiteCoat generates a complete experiment plan — protocol, materials, budget, and timeline — in under 30 seconds." },
      { property: "og:title", content: "WhiteCoat — From hypothesis to runnable experiment" },
      { property: "og:description", content: "AI-powered scientific experiment planning across 6 parallel threads." },
    ],
  }),
  component: Landing,
});

const EXAMPLE = "A paper-based electrochemical biosensor functionalized with anti-CRP antibodies will detect C-reactive protein in whole blood at concentrations below 0.5 mg/L within 10 minutes, matching laboratory ELISA sensitivity without requiring sample preprocessing.";

function Landing() {
  const [hypothesis, setHypothesis] = useState("");
  const navigate = useNavigate();

  const handleGenerate = () => {
    const value = hypothesis.trim();
    if (!value) return;
    planStore.setHypothesis(value);
    navigate({ to: "/plan" });
  };

  return (
    <div className="min-h-screen bg-[#F8F8F7]">
      <Navbar variant="landing" />
      <main className="pt-14 min-h-screen flex items-center justify-center px-6">
        <div className="w-full max-w-[560px] flex flex-col items-start py-16">
          <span
            className="bg-[#F3F3F2] text-[#6B6B68] font-medium rounded-[4px] mb-5"
            style={{ fontSize: 12, padding: "4px 10px" }}
          >
            Hypothesis → Experiment Plan
          </span>

          <h1
            className="text-[#0D0D0D] font-semibold mb-4"
            style={{ fontSize: 36, letterSpacing: "-0.02em", lineHeight: 1.2 }}
          >
            From question to runnable experiment.
          </h1>

          <p className="text-[#6B6B68] mb-8" style={{ fontSize: 16, lineHeight: 1.6 }}>
            WhiteCoat reads your scientific hypothesis and generates a complete experiment plan — protocol, materials, budget, and timeline — in under 30 seconds.
          </p>

          <textarea
            value={hypothesis}
            onChange={(e) => setHypothesis(e.target.value)}
            placeholder="e.g. Supplementing C57BL/6 mice with Lactobacillus rhamnosus GG for 4 weeks will reduce intestinal permeability by at least 30% compared to controls, measured by FITC-dextran assay."
            className="w-full bg-[#FFFFFF] border border-[#E5E5E3] rounded-md p-3 outline-none focus:border-[#0D0D0D] resize-y placeholder:text-[#9B9B98] text-[#0D0D0D]"
            style={{
              height: 120,
              fontSize: 14,
              fontFamily: "Inter, sans-serif",
              boxShadow: undefined,
            }}
            onFocus={(e) => {
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(13,13,13,0.08)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.boxShadow = "";
            }}
          />

          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={handleGenerate}
              disabled={!hypothesis.trim()}
              className="bg-[#0D0D0D] text-white hover:bg-[#2D2D2D] active:scale-[0.98] transition-colors duration-150 ease-out rounded-md font-medium flex items-center gap-2 disabled:bg-[#D1D1CE] disabled:text-[#9B9B98] disabled:cursor-not-allowed"
              style={{ fontSize: 14, padding: "10px 20px" }}
            >
              Generate plan
              <ArrowRight size={16} />
            </button>
            <button
              onClick={() => setHypothesis(EXAMPLE)}
              className="text-[#6B6B68] hover:text-[#0D0D0D] hover:bg-[#F3F3F2] transition-colors duration-150 ease-out rounded-md"
              style={{ fontSize: 13, padding: "8px 12px" }}
            >
              or try an example →
            </button>
          </div>

          <div className="flex flex-wrap gap-3 mt-12">
            {["6 parallel AI threads", "Real catalog numbers", "Critical path timeline"].map((c) => (
              <div
                key={c}
                className="bg-[#FFFFFF] border border-[#E5E5E3] rounded-md text-[#6B6B68] flex items-center gap-2"
                style={{ fontSize: 13, padding: "10px 14px" }}
              >
                <FlaskConical size={13} className="text-[#0D0D0D]" />
                {c}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
