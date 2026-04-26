import { Link } from "@tanstack/react-router";
import { FlaskConical, Download } from "lucide-react";

export interface NavbarProps {
  variant?: "landing" | "plan" | "review";
}

export function Navbar({ variant = "landing" }: NavbarProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-14 bg-[#FFFFFF] border-b border-[#E5E5E3]">
      <div className="h-full px-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <FlaskConical size={16} className="text-[#0D0D0D]" />
          <span
            className="text-[#0D0D0D] font-semibold"
            style={{ fontSize: 20, letterSpacing: "-0.02em" }}
          >
            WhiteCoat
          </span>
        </Link>
        <nav className="flex items-center gap-2">
          {variant === "landing" && (
            <button className="text-[#6B6B68] hover:text-[#0D0D0D] hover:bg-[#F3F3F2] transition-colors duration-150 ease-out rounded-md px-3 py-2 text-[13px]">
              Sign in
            </button>
          )}
          {(variant === "plan" || variant === "review") && (
            <>
              <Link
                to="/"
                className="text-[#6B6B68] hover:text-[#0D0D0D] hover:bg-[#F3F3F2] transition-colors duration-150 ease-out rounded-md px-3 py-2 text-[13px]"
              >
                New hypothesis
              </Link>
              <Link
                to="/review"
                className="text-[#6B6B68] hover:text-[#0D0D0D] hover:bg-[#F3F3F2] transition-colors duration-150 ease-out rounded-md px-3 py-2 text-[13px]"
              >
                Review
              </Link>
              <button className="bg-[#0D0D0D] text-white hover:bg-[#2D2D2D] transition-colors duration-150 ease-out active:scale-[0.98] rounded-md px-5 py-2 text-[14px] font-medium flex items-center gap-2">
                <Download size={16} />
                Export
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}