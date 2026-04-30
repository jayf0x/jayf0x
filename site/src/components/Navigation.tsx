import type { Page } from "../App";

type NavigationProps = {
  current: Page;
  onNavigate: (page: Page) => void;
};

const pages: [string, Page][] = [
  ["127.0.0.1", "home"],
  ["~/Resume", "resume"],
];

export const Navigation = ({ current, onNavigate }: NavigationProps) => {
  return (
    <nav className="fixed inset-x-0 top-0 z-40 flex items-center justify-between px-6 py-4 backdrop-blur-md">
      <button
        type="button"
        onClick={() => onNavigate("home")}
        className="font-mono text-sm font-semibold text-[var(--accent)] transition hover:text-[var(--accent)]"
      >
        Jayf0x
      </button>
      <div className="flex items-center gap-6">
        {pages.map(([label, page]) => (
          <button
            key={`page-${page}`}
            type="button"
            onClick={() => onNavigate(page)}
            className={`text-lg capitalize transition hover:underline ${
              current === page
                ? "text-[var(--accent)]"
                : "text-[var(--muted)] hover:text-[var(--text)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </nav>
  );
};
