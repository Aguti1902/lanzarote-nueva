export const ADMIN_LANG_TABS = [
  { id: "es", label: "Español" },
  { id: "en", label: "Inglés" },
  { id: "de", label: "Alemán" },
  { id: "fr", label: "Francés" },
] as const;

export type AdminLang = (typeof ADMIN_LANG_TABS)[number]["id"];

/** Pestañas de idioma del panel: español, inglés, alemán y francés. */
export function AdminLangTabs({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: AdminLang) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 border-b border-sand-line pb-3">
      {ADMIN_LANG_TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`rounded px-3 py-1.5 text-sm font-semibold transition ${
            value === tab.id
              ? "bg-ocean text-white"
              : "bg-bg text-ink-muted hover:text-ink"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

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
