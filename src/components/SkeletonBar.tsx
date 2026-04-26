export function SkeletonBar({ width = "100%", height = 16 }: { width?: string | number; height?: number }) {
  return (
    <div
      className="animate-pulse bg-[#F3F3F2] rounded-[4px]"
      style={{ width, height }}
    />
  );
}

export function SkeletonBlock({ lines = 3 }: { lines?: number }) {
  const widths = ["80%", "60%", "90%", "70%", "50%"];
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBar key={i} width={widths[i % widths.length]} />
      ))}
    </div>
  );
}