import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { TimelineData } from "../data/mockPlanData";
import { Badge } from "./Badge";
import { PlanCard } from "./PlanCard";

interface ChartRow {
  name: string;
  start: number;
  duration: number;
  critical: boolean;
}

export function TimelineCard({ data, status }: { data: TimelineData; status: "running" | "done" }) {
  const chartData: ChartRow[] = data.tasks.map((t) => ({ ...t }));
  const maxWeek = Math.max(...data.tasks.map((t) => t.start + t.duration));

  return (
    <PlanCard title="Experiment timeline" dotColor="#DC2626" status={status}>
      <div className="flex gap-2 flex-wrap mb-4">
        <Badge variant="default">Minimum duration: {data.minWeeks} weeks</Badge>
        <Badge variant="default">Critical path tasks: {data.criticalCount}</Badge>
      </div>

      <div style={{ width: "100%", height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 8, right: 16, bottom: 8, left: 0 }}
          >
            <CartesianGrid horizontal={false} stroke="#E5E5E3" strokeDasharray="3 3" />
            <XAxis
              type="number"
              domain={[0, Math.ceil(maxWeek)]}
              tick={{ fontSize: 12, fill: "#6B6B68" }}
              stroke="#E5E5E3"
              label={{ value: "Weeks", position: "insideBottom", offset: -2, fontSize: 11, fill: "#9B9B98" }}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={160}
              tick={{ fontSize: 12, fill: "#6B6B68" }}
              stroke="#E5E5E3"
            />
            <Tooltip
              contentStyle={{ background: "#FFFFFF", border: "1px solid #E5E5E3", borderRadius: 6, fontSize: 13 }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const row = payload[0].payload as ChartRow;
                return (
                  <div
                    className="bg-[#FFFFFF] border border-[#E5E5E3] rounded-md p-2"
                    style={{ fontSize: 13 }}
                  >
                    <div className="font-medium text-[#0D0D0D]">{row.name}</div>
                    <div className="text-[#6B6B68]">Start: week {row.start}</div>
                    <div className="text-[#6B6B68]">Duration: {row.duration} weeks</div>
                    <div className="text-[#6B6B68]">{row.critical ? "On critical path" : "Parallel task"}</div>
                  </div>
                );
              }}
            />
            {/* Invisible offset bar */}
            <Bar dataKey="start" stackId="g" fill="transparent" />
            <Bar dataKey="duration" stackId="g" radius={[3, 3, 3, 3]}>
              {chartData.map((row, i) => (
                <Cell key={i} fill={row.critical ? "#0D0D0D" : "#E5E5E3"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="text-[#9B9B98] mt-2" style={{ fontSize: 12 }}>
        Critical path highlighted in black. Parallel tasks shown in gray.
      </div>
    </PlanCard>
  );
}