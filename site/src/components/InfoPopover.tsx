import { Info } from "lucide-react";
import { useState } from "react";
import { Popover } from "react-tiny-popover";

type InfoItem = [label: string, href?: string];

type InfoPopoverProps = {
  title: string;
  items?: InfoItem[];
};

export const InfoPopover = ({ title, items = [] }: InfoPopoverProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover
      isOpen={isOpen}
      positions={["top", "right", "bottom", "left"]}
      padding={8}
      reposition
      onClickOutside={() => setIsOpen(false)}
      containerClassName="z-100"
      content={
        <div
          className="bg-white shadow-md rounded-sm p-2 text-sm max-w-xs"
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
        >
          {items.length > 0 && (
            <>
              <hr className="my-1" />
              <ul className="flex flex-col gap-1">
                {items.map(([label, href], i) => (
                  <li key={i}>
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
            </>
          )}
        </div>
      }
    >
      <div
        className="inline-flex cursor-pointer"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onClick={() => setIsOpen((v) => !v)}
      >
       {title ?  `${title} ` : ''}<Info size={15} className="text-[var(--accent)]" />
      </div>
    </Popover>
  );
};
