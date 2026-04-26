import type { ReactNode } from "react";

export type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "purple";

const STYLES: Record<BadgeVariant, string> = {
  default: "bg-[#F3F3F2] text-[#6B6B68]",
  success: "bg-[#DCFCE7] text-[#15803D]",
  warning: "bg-[#FEF3C7] text-[#B45309]",
  danger: "bg-[#FEE2E2] text-[#B91C1C]",
  info: "bg-[#DBEAFE] text-[#1D4ED8]",
  purple: "bg-[#EDE9FE] text-[#6D28D9]",
};

export function Badge({ variant = "default", children }: { variant?: BadgeVariant; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-[4px] px-2 py-[2px] font-medium ${STYLES[variant]}`}
      style={{ fontSize: 12 }}
    >
      {children}
    </span>
  );
}