import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { BudgetData } from "../data/mockPlanData";
import { Badge } from "./Badge";
import { PlanCard } from "./PlanCard";

const fmt = (n: number) => `$${n.toLocaleString("en-US")}`;

const BAR_COLORS = ["#7C3AED", "#2563EB", "#D97706", "#16A34A"];

export function BudgetCard({ data, status }: { data: BudgetData; status: "running" | "done" }) {
  const chartData = [
    { category: "Reagents", value: data.reagents },
    { category: "Consumables", value: data.consumables },
    { category: "Equipment", value: data.equipment },
    { category: "Personnel", value: Math.max(0, data.total - data.reagents - data.consumables - data.equipment) },
  ];

  return (
    <PlanCard title="Budget estimate" dotColor="#16A34A" status={status}>
      <div className="flex gap-3 flex-wrap mb-4">
        {[
          { label: "Total estimate", value: fmt(data.total) },
          { label: "Reagents", value: fmt(data.reagents) },
          { label: "Equipment", value: fmt(data.equipment) },
        ].map((s) => (
          <div key={s.label} className="flex-1 min-w-[140px] bg-[#F3F3F2] rounded-md px-4 py-3">
            <div className="text-[#9B9B98]" style={{ fontSize: 12 }}>
              {s.label}
            </div>
            <div className="text-[#0D0D0D] font-semibold mt-1" style={{ fontSize: 20 }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      <div style={{ width: "100%", height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
            <CartesianGrid stroke="#E5E5E3" strokeDasharray="3 3" />
            <XAxis dataKey="category" tick={{ fontSize: 12, fill: "#6B6B68" }} stroke="#E5E5E3" />
            <YAxis tick={{ fontSize: 12, fill: "#6B6B68" }} stroke="#E5E5E3" tickFormatter={(v: number) => `$${v}`} />
            <Tooltip
              contentStyle={{ background: "#FFFFFF", border: "1px solid #E5E5E3", borderRadius: 6, fontSize: 13 }}
              formatter={(value: number) => fmt(value)}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {chartData.map((_, i) => (
                <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="overflow-x-auto mt-4">
        <table className="w-full" style={{ tableLayout: "fixed", borderCollapse: "collapse" }}>
          <colgroup>
            <col style={{ width: "40%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "20%" }} />
            <col style={{ width: "20%" }} />
            <col style={{ width: "10%" }} />
          </colgroup>
          <thead>
            <tr className="bg-[#F8F8F7]">
              {["Item", "Qty", "Unit cost", "Total", "Verified"].map((h) => (
                <th key={h} className="text-left text-[#6B6B68] font-medium px-3 py-2" style={{ fontSize: 13 }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.lineItems.map((li, i) => (
              <tr key={i} className="border-b border-[#E5E5E3]">
                <td className="text-[#0D0D0D] px-3 py-[10px]" style={{ fontSize: 14 }}>{li.item}</td>
                <td className="text-[#0D0D0D] px-3 py-[10px]" style={{ fontSize: 14 }}>{li.qty}</td>
                <td className="text-[#0D0D0D] px-3 py-[10px] font-mono" style={{ fontSize: 13 }}>{fmt(li.unit)}</td>
                <td className="text-[#0D0D0D] px-3 py-[10px] font-mono" style={{ fontSize: 13 }}>{fmt(li.total)}</td>
                <td className="px-3 py-[10px]">
                  {li.verified ? <Badge variant="success">Yes</Badge> : <Badge variant="warning">No</Badge>}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-[#F3F3F2]">
              <td className="text-[#0D0D0D] font-semibold px-3 py-3" style={{ fontSize: 14 }}>Total</td>
              <td colSpan={2} />
              <td className="text-[#0D0D0D] font-semibold px-3 py-3 font-mono" style={{ fontSize: 14 }}>{fmt(data.total)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </PlanCard>
  );
}