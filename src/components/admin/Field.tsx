export function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-sm font-medium text-ink">{label}</span>
      {children}
    </label>
  );
}

export const adminInput =
  "w-full rounded-lg border border-sand-line bg-white px-3 py-2 text-sm outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/20";

export const adminTextarea = `${adminInput} min-h-[96px] resize-y`;

export function linesToArray(value: string): string[] {
  return value
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

export function arrayToLines(value: string[] | undefined): string {
  return (value || []).join("\n");
}
