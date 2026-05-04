import React, { useLayoutEffect } from "react";
import { createPortal } from "react-dom";

type PopoverPortalProps = {
  container: Element;
  element: Element;
  scoutElement: Element;
  children: React.ReactNode;
};

export const PopoverPortal = ({
  container,
  element,
  scoutElement,
  children,
}: PopoverPortalProps) => {
  useLayoutEffect(() => {
    container.appendChild(element);
    container.appendChild(scoutElement);
    return () => {
      if (container.contains(element)) container.removeChild(element);
      if (container.contains(scoutElement)) container.removeChild(scoutElement);
    };
  }, [container, element, scoutElement]);

  return createPortal(children, element);
};
