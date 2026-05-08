import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, PanelLeftOpen } from "lucide-react";
import { GithubRepo } from "@/utils/fetch-repository";

const spring = { type: "spring" as const, stiffness: 380, damping: 36 };
const topN = 21;

const compareFn =
  <T extends keyof GithubRepo>(key: T) =>
  (a: GithubRepo, b: GithubRepo): number =>
    new Date(b[key] as string).getTime() - new Date(a[key] as string).getTime();

interface SidebarProps {
  repos: GithubRepo[];
  isLoading: boolean;
  onSelect: (name: string) => void;
}

export const Sidebar = ({ repos, isLoading, onSelect }: SidebarProps) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !open) {
      setTimeout(() => {
        setOpen(true);
      }, 500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  return (
    <div className="relative flex shrink-0 self-stretch">
      <AnimatePresence>
        {open && (
          <motion.div
            key="sidebar"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 210, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={spring}
            className="flex flex-col min-h-0 overflow-hidden"
            style={{ minWidth: 0 }}
          >
            <div className="flex flex-col h-full min-h-0 pr-3 gap-1">
              {isLoading ? (
                <div className="flex flex-col gap-2 pt-5">
                  {Array.from({ length: topN }).map((_, i) => (
                    <div
                      key={`skeleton-${i}`}
                      className="mx-1 w-full h-5 animate-pulse rounded bg-[#aaa3]"
                      style={{
                        opacity: 1 - i * 0.12,
                        animationDelay: String(i * 1000),
                      }}
                    />
                  ))}
                </div>
              ) : (
                <>
                  <SidebarSection
                    title="Recently Added"
                    repos={repos}
                    dateKey="created_at"
                    onSelect={onSelect}
                  />
                  <div className="shrink-0 h-px bg-(--border) my-1" />
                  <SidebarSection
                    title="Recently Updated"
                    repos={repos}
                    dateKey="pushed_at"
                    onSelect={onSelect}
                  />
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* toggle tab */}
      <div className="relative flex flex-col justify-start pt-3">
        <div
          onClick={() => setOpen((v) => !v)}
          className="cursor-pointer transition-all hover:scale-150 flex h-6 w-4 items-center justify-center rounded-r-md border border-l-0 border-(--border) bg-(--surface) text-(--muted) hover:text-(--accent)"
        >
          {open ? <ChevronLeft size={10} /> : <PanelLeftOpen size={20} />}
        </div>
      </div>
    </div>
  );
};

const SidebarSection = ({
  title,
  repos,
  dateKey,
  onSelect,
}: {
  title: string;
  repos: GithubRepo[];
  dateKey: "created_at" | "pushed_at";
  onSelect: (name: string) => void;
}) => {
  const projects = repos.slice().sort(compareFn(dateKey)).slice(0, topN);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <span className="mb-1.5 shrink-0 font-mono text-[10px] uppercase tracking-widest text-(--accent)">
        {title}
      </span>
      <div className="relative flex-1 min-h-0">
        <div className="absolute inset-0 overflow-y-auto space-y-px [&::-webkit-scrollbar]:hidden pb-5">
          {projects.map((repo) => (
            <SidebarItem
              key={`sidebar-item-${repo.id}`}
              repo={repo}
              date={repo[dateKey]}
              onClick={() => onSelect(repo.name)}
            />
          ))}
        </div>
        {/* fade-out overlay */}
        <div className="pointer-events-none absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-[var(--bg,#0d0d0d)] to-transparent" />
      </div>
    </div>
  );
};

const timeInits: [number, string][] = [
  [31536000, "year"],
  [2592000, "month"],
  [604800, "week"],
  [86400, "day"],
  [3600, "hour"],
  [60, "min"],
];
const fmt = (iso: string) => {
  const timeAgo = (Date.now() - new Date(iso).getTime()) / 1000;
  const [seconds, unit] = timeInits.find(([time]) => timeAgo / time >= 1) ?? [];

  if (!seconds) {
    return `${Math.floor(timeAgo)} sec`;
  }

  const time = Math.floor(timeAgo / seconds);

  return `${time} ${unit}${time > 1 ? "s" : ""}`;
};

const SidebarItem = ({
  repo,
  date,
  onClick,
}: {
  repo: GithubRepo;
  date: string;
  onClick: () => void;
}) => (
  <button
    type="button"
    className="group flex items-center justify-between w-full gap-1 rounded-md px-1.5 py-[3px] transition-all origin-left duration-100 text-(--muted) hover:bg-(--surface) hover:scale-125 hover:text-(--accent)"
    onClick={onClick}
  >
    <div className="min-w-0 flex-1 truncate text-left font-mono text-[11px]">
      {repo.name}
    </div>
    <div className="shrink-0 font-mono text-[9px] text-(--muted)/40 tabular-nums">
      {fmt(date)}
    </div>
  </button>
);
