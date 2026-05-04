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
            arrowColor={"white"}
            arrowSize={15}
            className="popover-arrow-container floaty"
            arrowClassName="popover-arrow"
          >
            <ul className="bg-[linear-gradient(90deg,rgba(255,_227,_227,_1)_0%,_rgba(235,_255,_237,_1)_100%)] p-1 flex flex-col gap-1  rounded-md">
              {items.map(([label, href]) => (
                <li key={label}>
                  {href ? (
                    <a
                      href={href}
                      target="_blank"
                      className="text-blue-600 hover:underline"
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
