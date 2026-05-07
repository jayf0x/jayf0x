import { useState } from "react";
import { Info, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import { Popover } from "@/lib/popover";

type InfoItem = [label: string, href?: string];

type InfoPopoverProps = {
  title?: string;
  items: InfoItem[] | [string];
};

// Separate component so it only mounts when open
const PopoverContent = ({ items }: { items: InfoPopoverProps["items"] }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.94, y: 6 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
    // Gradient border driven by --mx/--my: bright spot tracks the cursor, giving a 3-D lit feel
    style={{
      padding: "1.5px",
      borderRadius: "16px",
      background: `radial-gradient(
        ellipse at calc(50% + var(--mx, 0) * 120%) calc(50% + var(--my, 0) * 120%),
        rgba(79, 124, 255, 0.9) 0%,
        rgba(79, 124, 255, 0.28) 38%,
        rgba(79, 124, 255, 0.04) 68%
      )`,
      boxShadow:
        "0 24px 64px rgba(0,0,0,0.65), 0 0 0 1px rgba(79,124,255,0.04) inset",
    }}
  >
    {/* Inner glass panel */}
    <div
      style={{
        background: "rgba(7, 7, 11, 0.97)",
        backdropFilter: "blur(28px) saturate(2)",
        borderRadius: "14.5px",
        overflow: "hidden",
        minWidth: "196px",
        maxWidth: "276px",
      }}
    >
      {(items as InfoItem[]).map(([label, href], i) => (
        <motion.div
          key={`${label}-${href}`}
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.15, delay: i * 0.04, ease: "easeOut" }}
        >
          {href ? (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2.5 px-3.5 py-2.5 transition-colors duration-150"
              style={{
                borderBottom:
                  i < (items as InfoItem[]).length - 1
                    ? "1px solid rgba(255,255,255,0.04)"
                    : "none",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.background =
                  "rgba(79,124,255,0.07)")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.background = "")
              }
            >
              {/* Dot accent */}
              <span
                className="flex-shrink-0 w-1 h-1 rounded-full transition-all duration-200"
                style={{
                  background: "rgba(79,124,255,0.5)",
                  boxShadow: "0 0 4px rgba(79,124,255,0)",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = "rgba(79,124,255,1)";
                  el.style.boxShadow = "0 0 6px rgba(79,124,255,0.8)";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = "rgba(79,124,255,0.5)";
                  el.style.boxShadow = "0 0 4px rgba(79,124,255,0)";
                }}
              />
              {/* Label */}
              <span
                className="flex-1 text-[11.5px] font-mono leading-snug transition-colors duration-150"
                style={{ color: "rgba(255,255,255,0.65)" }}
              >
                {label}
              </span>
              {/* Arrow icon */}
              <ArrowUpRight
                size={11}
                className="flex-shrink-0 transition-all duration-150"
                style={{ color: "rgba(79,124,255,0.35)" }}
              />
            </a>
          ) : (
            <div
              className="px-3.5 py-2 text-[10px] font-mono uppercase tracking-[0.16em]"
              style={{
                color: "rgba(255,255,255,0.22)",
                borderBottom:
                  i < (items as InfoItem[]).length - 1
                    ? "1px solid rgba(255,255,255,0.04)"
                    : "none",
              }}
            >
              {label}
            </div>
          )}
        </motion.div>
      ))}
    </div>
  </motion.div>
);

export const InfoPopover = ({ title, items = [] }: InfoPopoverProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-row items-center gap-1">
      {title && <span className="text-[inherit]">{title}</span>}
      <Popover
        trigger="click"
        onOpenChange={setIsOpen}
        padding={8}
        content={isOpen ? <PopoverContent items={items} /> : null}
      >
        <button
          type="button"
          className="flex items-center justify-center rounded-full transition-all duration-200"
          style={{
            color: isOpen ? "var(--accent)" : "rgba(79,124,255,0.6)",
            background: isOpen ? "rgba(79,124,255,0.12)" : "transparent",
            width: 18,
            height: 18,
          }}
        >
          <Info size={13} strokeWidth={2} />
        </button>
      </Popover>
    </div>
  );
};
