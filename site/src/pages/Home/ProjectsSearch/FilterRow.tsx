import { getStackMeta } from "@/lib/stackMeta";

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
    <span className="font-mono text-[10px] uppercase tracking-widest text-(--muted)">
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
      className={`shrink-0 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-xs transition-all duration-150 hover:scale-110 origin-top-left ${
        active
          ? "border-(--accent) bg-(--accent) text-(--text)"
          : "border-(--border) text-(--muted) hover:border-(--accent) hover:text-(--text)"
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
