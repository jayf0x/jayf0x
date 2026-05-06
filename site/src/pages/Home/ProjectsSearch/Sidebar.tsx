import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  PanelLeftOpen,
} from "lucide-react";
import { GithubRepo } from "../../../utils/fetch-repository";

const spring = { type: "spring" as const, stiffness: 380, damping: 36 };

const fmt = (iso: string) => {
  const d = new Date(iso);
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return sameYear
    ? d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
};

interface SidebarProps {
  repos: GithubRepo[];
  onSelect: (name: string) => void;
  isLoading: boolean;
}

export const Sidebar = ({ repos, onSelect, isLoading }: SidebarProps) => {
  const [open, setOpen] = useState(true);

  const recentlyAdded = [...repos]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
    .slice(0, 30);

  const recentlyUpdated = [...repos]
    .sort(
      (a, b) =>
        new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime(),
    )
    .slice(0, 30);

  return (
    <div className="relative flex shrink-0 self-stretch">
      <AnimatePresence initial={false}>
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
              <SidebarSection
                title="Recently Added"
                repos={recentlyAdded}
                dateKey="created_at"
                onSelect={onSelect}
                isLoading={isLoading}
              />
              <div className="shrink-0 h-px bg-[var(--border)] my-1" />
              <SidebarSection
                title="Recently Updated"
                repos={recentlyUpdated}
                dateKey="pushed_at"
                onSelect={onSelect}
                isLoading={isLoading}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* toggle tab */}
      <div className="relative flex flex-col justify-start pt-3">
        <motion.button
          type="button"
          onClick={() => setOpen((v) => !v)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.92 }}
          transition={spring}
          className="flex h-6 w-4 items-center justify-center rounded-r-md border border-l-0 border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] transition-colors hover:text-[var(--accent)]"
          title={open ? "Collapse sidebar" : "Expand sidebar"}
        >
          {open ? <ChevronLeft size={10} /> : <PanelLeftOpen size={20} />}
        </motion.button>
      </div>
    </div>
  );
};

const SidebarSection = ({
  title,
  repos,
  dateKey,
  onSelect,
  isLoading,
}: {
  title: string;
  repos: GithubRepo[];
  dateKey: "created_at" | "pushed_at";
  onSelect: (name: string) => void;
  isLoading: boolean;
}) => (
  <div className="flex flex-col flex-1 min-h-0">
    <span className="mb-1.5 shrink-0 font-mono text-[10px] uppercase tracking-widest text-[var(--accent)]">
      {title}
    </span>
    <div className="relative flex-1 min-h-0">
      <div className="absolute inset-0 overflow-y-auto space-y-px [&::-webkit-scrollbar]:hidden">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="mx-1 h-6 animate-pulse rounded bg-[var(--surface)]"
                style={{ opacity: 1 - i * 0.12 }}
              />
            ))
          : repos.map((repo) => (
              <SidebarItem
                key={repo.id}
                repo={repo}
                date={repo[dateKey]}
                onSelect={onSelect}
              />
            ))}
      </div>
      {/* fade-out overlay */}
      <div className="pointer-events-none absolute bottom-0 inset-x-0 h-10 bg-gradient-to-t from-[var(--bg,#0d0d0d)] to-transparent" />
    </div>
  </div>
);

const SidebarItem = ({
  repo,
  date,
  onSelect,
}: {
  repo: GithubRepo;
  date: string;
  onSelect: (name: string) => void;
}) => (
  <div className="group flex items-center gap-1 rounded-md px-1.5 py-[3px] transition-colors duration-100 hover:bg-[var(--surface)]">
    <button
      type="button"
      onClick={() => onSelect(repo.name)}
      className="min-w-0 flex-1 truncate text-left font-mono text-[11px] text-[var(--muted)] transition-colors duration-100 hover:text-[var(--accent)]"
    >
      {repo.name}
    </button>
    <span className="shrink-0 font-mono text-[9px] text-[var(--muted)]/40 tabular-nums">
      {fmt(date)}
    </span>
    {/* <a
      href={repo.html_url}
      target="_blank"
      rel="noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="shrink-0 text-[var(--muted)]/40 transition-colors duration-100 hover:text-[var(--accent)]"
    >
      <ExternalLink size={12} className="hover:scale-150" />
    </a> */}
  </div>
);
