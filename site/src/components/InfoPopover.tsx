import { Info } from "lucide-react";
import { ArrowContainer, Popover } from "../lib/popover";

type InfoItem = [label: string, href?: string];

type InfoPopoverProps = {
  title: string;
  items: InfoItem[] | string;
};

export const InfoPopover = ({ title, items = [] }: InfoPopoverProps) => {
  const content = (
    <div className="flex flex-row items-center">
      <span className="pr-1">{title}</span>
      <Info size={15} className="text-[var(--accent)]" />
    </div>
  );

  if (!Array.isArray(items)) {
    return content;
  }

  return (
    <div className="flex flex-row items-center sha">
      <span className="pr-1">{title}</span>
      <Popover
        trigger="click"
        // align="start"
        content={({ position, childRect, popoverRect }) => (
      <ArrowContainer
        position={position}
        childRect={childRect}
        popoverRect={popoverRect}
        // match arrow color to the popover accent (purple)
        arrowColor={"#7c4fff"}
        arrowSize={12}
        className="popover-arrow-container floaty"
        arrowClassName="popover-arrow"
      >
        <ul
          className="p-2 flex flex-col gap-2 rounded-xl"
          style={{
            background: "linear-gradient(135deg, #4f7cff 0%, #7c4fff 100%)",
            border: "1px solid rgba(124,79,255,0.12)",
            boxShadow: "0 16px 48px rgba(124,79,255,0.14)",
            color: "white",
            minWidth: "180px",
          }}
        >
          {items.map(([label, href]) => (
            <li key={label}>
              {href ? (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                  style={{ color: "rgba(255,255,255,0.95)" }}
                >
                  {label}
                </a>
              ) : (
                <span>{label}</span>
              )}
            </li>
          ))}
        </ul>
      </ArrowContainer>
        )}

        // containerClassName=""
      >
        <Info size={15} className="text-[var(--accent)]" />
      </Popover>
    </div>
  );
};
