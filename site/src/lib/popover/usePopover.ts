import { useCallback, useLayoutEffect, useRef, useState } from "react";
import {
  BoundaryViolations,
  PopoverState,
  PositionPopover,
  UsePopoverProps,
  UsePopoverResult,
} from "./types";
import {
  EMPTY_RECT,
  CreateContainerProps,
  createContainer,
  createRect,
  getNewPopoverRect,
  getNudgedPopoverRect,
} from "./util";

// Inlined from useElementRef — only ever used here.
const usePopoverElement = ({
  containerClassName,
  containerStyle,
}: CreateContainerProps) => {
  const [element] = useState(() =>
    createContainer({ containerStyle, containerClassName }),
  );
  const ref = useRef<HTMLDivElement>(element);

  useLayoutEffect(() => {
    element.className = containerClassName ?? "";
  }, [containerClassName]);

  return ref;
};

// CSS custom properties drive the transform, enabling CSS transitions on the container:
//   .react-tiny-popover-container { transition: transform 0.2s ease; }
//
// z-index, background, shadow, and border-radius are sensible defaults that users
// can override via the `containerStyle` prop.
const POPOVER_STYLE: Partial<CSSStyleDeclaration> = {
  position: "fixed",
  top: "0px",
  left: "0px",
  overflow: "visible",
  zIndex: "9999",
  willChange: "transform, opacity",
  transform: "translate(var(--popover-x, 0px), var(--popover-y, 0px))",
  transition: "opacity 0.12s ease",
  opacity: "0",
  borderRadius: "8px",
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.12), 0 1px 6px rgba(0, 0, 0, 0.08)",
};

const SCOUT_STYLE: Partial<CSSStyleDeclaration> = {
  position: "fixed",
  top: "0px",
  left: "0px",
  width: "0px",
  height: "0px",
  visibility: "hidden",
};

export const usePopover = (props: UsePopoverProps): UsePopoverResult => {
  // propsRef keeps positionPopover stable. Observers only rebuilt on open/close.
  const propsRef = useRef(props);
  propsRef.current = props;

  const scoutRef = usePopoverElement({
    containerClassName: "react-tiny-popover-scout",
    containerStyle: SCOUT_STYLE,
  });

  const containerClassName =
    props.containerClassName != null &&
    props.containerClassName.length > 0 &&
    props.containerClassName !== "react-tiny-popover-container"
      ? `react-tiny-popover-container ${props.containerClassName}`
      : "react-tiny-popover-container";

  const popoverRef = usePopoverElement({
    containerClassName,
    containerStyle: POPOVER_STYLE,
  });

  const positionPopover = useCallback<PositionPopover>(
    ({
      positionIndex = 0,
      parentRect = propsRef.current.parentElement.getBoundingClientRect(),
      childRect = propsRef.current.childRef?.current?.getBoundingClientRect(),
      scoutRect = scoutRef.current?.getBoundingClientRect(),
      popoverRect = popoverRef.current.getBoundingClientRect(),
      boundaryRect = propsRef.current.boundaryElement ===
      propsRef.current.parentElement
        ? parentRect
        : propsRef.current.boundaryElement.getBoundingClientRect(),
    } = {}) => {
      const {
        isOpen,
        transform,
        transformMode,
        positions,
        align,
        padding,
        reposition,
        boundaryInset,
        onPositionPopover,
      } = propsRef.current;

      if (!childRect || !parentRect || !isOpen) return;

      if (transform && transformMode === "absolute") {
        const { top: inputTop, left: inputLeft } =
          typeof transform === "function"
            ? transform({
                childRect,
                popoverRect,
                parentRect,
                boundaryRect,
                padding,
                align,
                nudgedTop: 0,
                nudgedLeft: 0,
                boundaryInset,
                violations: EMPTY_RECT,
                hasViolations: false,
              })
            : transform;

        const finalLeft = Math.round(
          parentRect.left + inputLeft - scoutRect.left,
        );
        const finalTop = Math.round(parentRect.top + inputTop - scoutRect.top);
        const el = popoverRef.current;
        el.style.setProperty("--popover-x", `${finalLeft}px`);
        el.style.setProperty("--popover-y", `${finalTop}px`);

        onPositionPopover({
          childRect,
          popoverRect: createRect({
            left: finalLeft,
            top: finalTop,
            width: popoverRect.width,
            height: popoverRect.height,
          }),
          parentRect,
          boundaryRect,
          padding,
          align,
          transform: { top: inputTop, left: inputLeft },
          nudgedTop: 0,
          nudgedLeft: 0,
          boundaryInset,
          violations: EMPTY_RECT,
          hasViolations: false,
        });
        return;
      }

      const isExhausted = positionIndex === positions.length;
      const position = isExhausted ? positions[0] : positions[positionIndex];
      const { rect, boundaryViolation } = getNewPopoverRect(
        {
          childRect,
          popoverRect,
          boundaryRect,
          position,
          align,
          padding,
          reposition,
        },
        boundaryInset,
      );

      if (boundaryViolation && reposition && !isExhausted) {
        positionPopover({
          positionIndex: positionIndex + 1,
          childRect,
          popoverRect,
          parentRect,
          boundaryRect,
        });
        return;
      }

      const { top, left, width, height } = rect;
      const shouldNudge = reposition && !isExhausted;
      const { left: nudgedLeft, top: nudgedTop } = getNudgedPopoverRect(
        rect,
        boundaryRect,
        boundaryInset,
      );

      let finalTop = Math.round(
        (shouldNudge ? nudgedTop : top) - scoutRect.top,
      );
      let finalLeft = Math.round(
        (shouldNudge ? nudgedLeft : left) - scoutRect.left,
      );

      const el = popoverRef.current;
      el.style.setProperty("--popover-x", `${finalLeft}px`);
      el.style.setProperty("--popover-y", `${finalTop}px`);
      el.dataset.popoverPosition = position;
      el.dataset.popoverAlign = align;

      const rawViolations: BoundaryViolations = {
        top: boundaryRect.top + boundaryInset - finalTop,
        left: boundaryRect.left + boundaryInset - finalLeft,
        right: finalLeft + width - boundaryRect.right + boundaryInset,
        bottom: finalTop + height - boundaryRect.bottom + boundaryInset,
      };

      const popoverState: PopoverState = {
        childRect,
        popoverRect: createRect({
          left: finalLeft,
          top: finalTop,
          width,
          height,
        }),
        parentRect,
        boundaryRect,
        position,
        align,
        padding,
        nudgedTop: nudgedTop - top,
        nudgedLeft: nudgedLeft - left,
        boundaryInset,
        violations: {
          top: Math.max(0, rawViolations.top),
          left: Math.max(0, rawViolations.left),
          right: Math.max(0, rawViolations.right),
          bottom: Math.max(0, rawViolations.bottom) + 1,
        },
        hasViolations:
          rawViolations.top > 0 ||
          rawViolations.left > 0 ||
          rawViolations.right > 0 ||
          rawViolations.bottom > 0,
      };

      if (transform) {
        onPositionPopover(popoverState);
        const { top: transformTop = 0, left: transformLeft = 0 } =
          typeof transform === "function" ? transform(popoverState) : transform;
        el.style.setProperty(
          "--popover-x",
          `${Math.round(finalLeft + transformLeft)}px`,
        );
        el.style.setProperty(
          "--popover-y",
          `${Math.round(finalTop + transformTop)}px`,
        );
        popoverState.nudgedLeft += transformLeft;
        popoverState.nudgedTop += transformTop;
        popoverState.transform = { top: transformTop, left: transformLeft };
      }

      onPositionPopover(popoverState);
    },
    // Stable: all dynamic values read from propsRef. Only recreates if DOM refs change.
    [scoutRef, popoverRef],
  );

  return { positionPopover, popoverRef, scoutRef } as const;
};
