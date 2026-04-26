import { ChevronDown, ChevronUp } from "lucide-react";
import { useState, type ReactNode } from "react";
import { SkeletonBlock } from "./SkeletonBar";

export interface PlanCardProps {
  title: string;
  dotColor: string;
  status: "running" | "done";
  rightSlot?: ReactNode;
  topAccent?: boolean;
  children: ReactNode;
}

export function PlanCard({ title, dotColor, status, rightSlot, topAccent, children }: PlanCardProps) {
  const [open, setOpen] = useState(true);
  return (
    <section
      className={`bg-[#FFFFFF] border border-[#E5E5E3] rounded-[10px] p-5 transition-opacity duration-300 ease-out ${status === "done" ? "opacity-100" : "opacity-100"}`}
      style={{
        boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
        borderTop: topAccent ? "2px solid #0D0D0D" : undefined,
      }}
    >
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: dotColor }} />
          <h3 className="text-[#0D0D0D] font-semibold" style={{ fontSize: 14 }}>
            {title}
          </h3>
          {rightSlot}
        </div>
        <button
          aria-label={open ? "Collapse" : "Expand"}
          onClick={() => setOpen((v) => !v)}
          className="text-[#9B9B98] hover:text-[#0D0D0D] hover:bg-[#F3F3F2] transition-colors duration-150 ease-out rounded-md p-1"
        >
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </header>
      {open && (status === "done" ? children : <SkeletonBlock lines={4} />)}
    </section>
  );
}