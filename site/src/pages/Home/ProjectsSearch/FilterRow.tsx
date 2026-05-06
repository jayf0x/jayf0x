import { getStackMeta } from "../../../lib/stackMeta";

export const FilterRow = ({
  label,
  items,
  filters,
  onToggle,
}: {
  label: string;
  items: string[];
  filters: Set<string>;
  onToggle: (v: string) => void;
}) => (
  <div className="flex flex-col gap-1">
    <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--muted)]">
      {label}
    </span>
    <div className="flex gap-1.5 overflow-x-scroll pb-1">
      {items.map((name) => (
        <FilterItem
          key={name}
          name={name}
          active={filters.has(name)}
          onToggle={() => onToggle(name)}
        />
      ))}
    </div>
  </div>
);

const FilterItem = ({
  name,
  active,
  onToggle,
}: {
  name: string;
  active: boolean;
  onToggle: () => void;
}) => {
  const m = getStackMeta(name);
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`shrink-0 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-xs transition-all duration-150 ${
        active
          ? "border-[var(--accent)] bg-[var(--accent-glow)] text-[var(--text)]"
          : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--text)]"
      }`}
    >
      {m.bg !== "transparent" && (
        <span
          className="inline-block h-2 w-2 rounded-sm"
          style={{ background: m.bg }}
        />
      )}
      {name}
    </button>
  );
};
