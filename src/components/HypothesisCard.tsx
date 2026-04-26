export function HypothesisCard({ hypothesis }: { hypothesis: string }) {
  return (
    <section
      className="bg-[#FFFFFF] border border-[#E5E5E3] rounded-[10px] px-5 py-4"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)" }}
    >
      <div
        className="text-[#9B9B98] font-medium uppercase mb-2"
        style={{ fontSize: 12, letterSpacing: "0.06em" }}
      >
        Hypothesis
      </div>
      <p className="text-[#0D0D0D] italic" style={{ fontSize: 14, lineHeight: 1.6 }}>
        {hypothesis}
      </p>
    </section>
  );
}