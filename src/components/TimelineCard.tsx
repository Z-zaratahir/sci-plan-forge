import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import type { TimelineData, TimelineTask } from "../data/mockPlanData";
import { Badge } from "./Badge";
import { PlanCard } from "./PlanCard";

interface Task extends TimelineTask {
  dependsOn?: string[];
}

function computeCriticalPath(tasks: Task[]): string[] {
  const inDegree: Record<string, number> = {};
  const graph: Record<string, string[]> = {};
  const duration: Record<string, number> = {};

  tasks.forEach((t) => {
    inDegree[t.name] = 0;
    graph[t.name] = [];
    duration[t.name] = t.duration;
  });

  tasks.forEach((t) => {
    (t.dependsOn || []).forEach((dep: string) => {
      if (graph[dep]) graph[dep].push(t.name);
      inDegree[t.name] = (inDegree[t.name] || 0) + 1;
    });
  });

  const queue = Object.keys(inDegree).filter((n) => inDegree[n] === 0);
  const earliestFinish: Record<string, number> = {};
  const predecessor: Record<string, string | null> = {};

  tasks.forEach((t) => {
    earliestFinish[t.name] = t.start + t.duration;
    predecessor[t.name] = null;
  });

  while (queue.length > 0) {
    const node = queue.shift()!;
    (graph[node] || []).forEach((neighbor) => {
      const newFinish = earliestFinish[node] + duration[neighbor];
      if (newFinish > earliestFinish[neighbor]) {
        earliestFinish[neighbor] = newFinish;
        predecessor[neighbor] = node;
      }
      inDegree[neighbor]--;
      if (inDegree[neighbor] === 0) queue.push(neighbor);
    });
  }

  const lastTask = Object.entries(earliestFinish).sort((a, b) => b[1] - a[1])[0]?.[0];
  const criticalPath: string[] = [];
  let current: string | null = lastTask || null;
  while (current) {
    criticalPath.unshift(current);
    current = predecessor[current];
  }
  return criticalPath;
}

export function TimelineCard({ data, status }: { data: TimelineData; status: "running" | "done" }) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(600);
  const tasks = (Array.isArray(data?.tasks) ? data.tasks : []) as Task[];
  const criticalPathNames = useMemo(() => computeCriticalPath(tasks), [tasks]);

  useEffect(() => {
    if (!wrapRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const next = Math.max(420, Math.floor(entries[0].contentRect.width));
      setWidth(next);
    });
    observer.observe(wrapRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!svgRef.current || tasks.length === 0) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const height = tasks.length * 36 + 60;
    const margin = { top: 20, right: 20, bottom: 30, left: 160 };
    const maxWeek = Math.max(1, ...tasks.map((t) => t.start + t.duration));

    const xScale = d3
      .scaleLinear()
      .domain([0, maxWeek])
      .range([margin.left, width - margin.right]);
    const yScale = d3
      .scaleBand()
      .domain(tasks.map((t) => t.name))
      .range([margin.top, height - margin.bottom])
      .padding(0.3);

    svg.attr("width", width).attr("height", height);

    const xAxis = d3.axisBottom(xScale).ticks(maxWeek).tickFormat((d) => `W${d}`);
    const yAxis = d3.axisLeft(yScale);

    svg
      .append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(xAxis)
      .call((g) => g.select(".domain").attr("stroke", "#E5E5E3"))
      .call((g) => g.selectAll("line").attr("stroke", "#E5E5E3"))
      .call((g) => g.selectAll("text").attr("fill", "#6B6B68").attr("font-size", 12));

    svg
      .append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(yAxis)
      .call((g) => g.select(".domain").attr("stroke", "#E5E5E3"))
      .call((g) => g.selectAll("line").attr("stroke", "none"))
      .call((g) => g.selectAll("text").attr("fill", "#6B6B68").attr("font-size", 12));

    const tooltip = d3
      .select(wrapRef.current)
      .append("div")
      .style("position", "absolute")
      .style("pointer-events", "none")
      .style("background", "#FFFFFF")
      .style("border", "1px solid #E5E5E3")
      .style("border-radius", "6px")
      .style("padding", "8px 10px")
      .style("font-size", "12px")
      .style("opacity", 0);

    svg
      .append("g")
      .selectAll("rect")
      .data(tasks)
      .join("rect")
      .attr("x", (task) => xScale(task.start))
      .attr("y", (task) => yScale(task.name) ?? 0)
      .attr("width", (task) => xScale(task.start + task.duration) - xScale(task.start))
      .attr("height", yScale.bandwidth())
      .attr("fill", (task) => (criticalPathNames.includes(task.name) ? "#0D0D0D" : "#E5E5E3"))
      .attr("rx", 3)
      .on("mouseenter", function (event, task) {
        d3.select(this).attr("opacity", 0.92);
        tooltip
          .style("opacity", 1)
          .html(
            `<div style="font-weight:600;color:#0D0D0D;">${task.name}</div>
             <div style="color:#6B6B68;">Start week: ${task.start}</div>
             <div style="color:#6B6B68;">Duration: ${task.duration} week(s)</div>
             <div style="color:#6B6B68;">${criticalPathNames.includes(task.name) ? "Critical path" : "Parallel task"}</div>`,
          );
      })
      .on("mousemove", (event) => {
        tooltip.style("left", `${event.offsetX + 18}px`).style("top", `${event.offsetY + 6}px`);
      })
      .on("mouseleave", function () {
        d3.select(this).attr("opacity", 1);
        tooltip.style("opacity", 0);
      });

    return () => {
      tooltip.remove();
      svg.selectAll("*").remove();
    };
  }, [tasks, width, criticalPathNames]);

  return (
    <PlanCard title="Experiment timeline" dotColor="#DC2626" status={status}>
      <div className="flex gap-2 flex-wrap mb-4">
        <Badge variant="default">Minimum: {data.minWeeks} weeks</Badge>
        <Badge variant="default">Critical path: {criticalPathNames.length} tasks</Badge>
      </div>
      <div ref={wrapRef} style={{ width: "100%", position: "relative" }}>
        <svg ref={svgRef} />
      </div>
      <div className="text-[#9B9B98] mt-2" style={{ fontSize: 12 }}>
        Critical path in black (Kahn's topological sort). Gray tasks run in parallel.
      </div>
    </PlanCard>
  );
}