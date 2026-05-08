import { useState } from "react";
import { Info, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import { Popover } from "@/lib/popover";
import "@/styles/info-popover.css";

type InfoItem = [label: string, href?: string];
type InfoPopoverProps = { title?: string; items: InfoItem[] };

export const InfoPopover = ({ title, items }: InfoPopoverProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-row items-center gap-1">
      {title && <span className="text-inherit">{title}</span>}
      <Popover
        trigger="click"
        onOpenChange={setIsOpen}
        padding={8}
        content={isOpen ? <PopoverContent items={items} /> : null}
      >
        <button
          type="button"
          className={`flex items-center justify-center rounded-full transition-all duration-200 size-4.5 ${
            isOpen
              ? "text-(--accent) bg-[rgba(79,124,255,0.12)]"
              : "text-[rgba(79,124,255,0.6)] bg-transparent"
          }`}
        >
          <Info size={13} strokeWidth={2} />
        </button>
      </Popover>
    </div>
  );
};

const PopoverContent = ({ items }: { items: InfoPopoverProps["items"] }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.94, y: 6 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
    className="relative p-[1.5px] rounded-2xl"
    style={{
      background: "rgba(79,124,255,0.06)",
      boxShadow: "0 24px 64px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.03) inset",
    }}
  >
    
    <div className="ip-snake" aria-hidden />

    
    <div className="relative z-10 backdrop-blur-[28px] backdrop-saturate-200 rounded-[14.5px] overflow-hidden min-w-[196px] max-w-[276px] bg-(--ip-glass)">
      {items.map(([label, href], i) => (
        <motion.div
          key={`${label}-${href}`}
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.15, delay: i * 0.04, ease: "easeOut" }}
        >
          <div
            className={`group flex items-center gap-2.5 px-3.5 py-2.5 transition-colors duration-150 ${
              i < items.length - 1 ? "border-b border-[rgba(255,255,255,0.04)]" : ""
            }`}
          >
            <span className="shrink-0 size-1 rounded-full transition-all duration-200 bg-[rgba(79,124,255,0.45)] group-hover:bg-(--accent) group-hover:shadow-[0_0_6px_rgba(79,124,255,0.7)]" />
            <div className="flex-1">
              {href ? (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-[11.5px] font-mono leading-snug text-[rgba(255,255,255,0.6)] transition-colors duration-150"
                >
                  <div className="flex items-center justify-between">
                    <span>{label}</span>
                    <ArrowUpRight
                      size={11}
                      className="shrink-0 ml-2 transition-all duration-150 text-[rgba(79,124,255,0.3)]"
                    />
                  </div>
                </a>
              ) : (
                <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-[rgba(255,255,255,0.2)]">
                  {label}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  </motion.div>
);
