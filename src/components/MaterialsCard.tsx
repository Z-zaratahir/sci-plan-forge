import type { Material } from "../data/mockPlanData";
import { Badge } from "./Badge";
import { PlanCard } from "./PlanCard";

export function MaterialsCard({ materials, status }: { materials: Material[]; status: "running" | "done" }) {
  return (
    <PlanCard title="Materials & reagents" dotColor="#D97706" status={status}>
      <div className="overflow-x-auto">
        <table className="w-full" style={{ tableLayout: "fixed", borderCollapse: "collapse" }}>
          <colgroup>
            <col style={{ width: "40%" }} />
            <col style={{ width: "20%" }} />
            <col style={{ width: "20%" }} />
            <col style={{ width: "20%" }} />
          </colgroup>
          <thead>
            <tr className="bg-[#F8F8F7]">
              {["Item", "Catalog no.", "Supplier", "Status"].map((h) => (
                <th
                  key={h}
                  className="text-left text-[#6B6B68] font-medium px-3 py-2"
                  style={{ fontSize: 13 }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {materials.map((m, i) => (
              <tr
                key={m.catalog}
                className={`border-b border-[#E5E5E3] ${i % 2 === 1 ? "bg-[#F8F8F7]" : "bg-[#FFFFFF]"}`}
              >
                <td className="text-[#0D0D0D] px-3 py-[10px]" style={{ fontSize: 14 }}>
                  {m.item}
                </td>
                <td className="text-[#0D0D0D] px-3 py-[10px] font-mono" style={{ fontSize: 13 }}>
                  {m.catalog}
                </td>
                <td className="text-[#0D0D0D] px-3 py-[10px]" style={{ fontSize: 14 }}>
                  {m.supplier}
                </td>
                <td className="px-3 py-[10px]">
                  {m.status === "verified" ? (
                    <Badge variant="success">Verified</Badge>
                  ) : (
                    <Badge variant="warning">Verify before ordering</Badge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PlanCard>
  );
}