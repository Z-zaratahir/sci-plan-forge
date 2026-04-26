export type TrustLevel = "pending" | "high" | "medium" | "low";

const STATES: Record<TrustLevel, { bg: string; text: string; label: string }> = {
  pending: { bg: "#F3F3F2", text: "#9B9B98", label: "Pending…" },
  high: { bg: "#DCFCE7", text: "#15803D", label: "High confidence" },
  medium: { bg: "#FEF3C7", text: "#B45309", label: "Review flagged items" },
  low: { bg: "#FEE2E2", text: "#B91C1C", label: "Low confidence — check warnings" },
};

export function TrustBadge({ level }: { level: TrustLevel }) {
  const s = STATES[level];
  return (
    <div
      className="w-full h-12 rounded-md flex items-center justify-center font-medium"
      style={{ backgroundColor: s.bg, color: s.text, fontSize: 13 }}
    >
      {s.label}
    </div>
  );
}