import {
  useRef,
  useLayoutEffect,
  useState,
  useCallback,
  useEffect,
  forwardRef,
  cloneElement,
  Ref,
  useMemo,
} from "react";
import { PopoverPortal } from "./PopoverPortal";
import { PopoverPosition, PopoverProps, PopoverState } from "./types";
import { EMPTY_RECT, getScrollableAncestors } from "./util";
import { usePopover } from "./usePopover";

const DEFAULT_POSITIONS: PopoverPosition[] = ["top", "left", "right", "bottom"];

const PopoverInternal = forwardRef(
  (
    {
      isOpen: externalIsOpen,
      children,
      content,
      positions: externalPositions = DEFAULT_POSITIONS,
      align = "center",
      padding = 0,
      reposition = true,
      parentElement = window.document.body,
      boundaryElement = parentElement,
      containerClassName,
      containerStyle,
      transform,
      transformMode = "absolute",
      boundaryInset = 0,
      onClickOutside,
      clickOutsideCapture = false,
      trigger,
      defaultOpen = false,
      onOpenChange,
    }: PopoverProps,
    externalRef: Ref<HTMLElement>,
  ) => {
    // Uncontrolled: manage open state internally. Controlled: use externalIsOpen.
    const [managedOpen, setManagedOpen] = useState(defaultOpen);
    const isControlled = externalIsOpen !== undefined;
    const isOpen = isControlled ? externalIsOpen : managedOpen;

    const updateOpen = useCallback(
      (open: boolean) => {
        if (!isControlled) setManagedOpen(open);
        onOpenChange?.(open);
      },
      [isControlled, onOpenChange],
    );

    const positions = useMemoizedArray(
      Array.isArray(externalPositions)
        ? externalPositions
        : [externalPositions],
    );

    const childRef = useRef<HTMLElement>();
    const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
    // Keeps the current isOpen value accessible inside stable callbacks.
    const isOpenRef = useRef(isOpen);
    isOpenRef.current = isOpen;

    const [popoverState, setPopoverState] = useState<PopoverState>({
      align,
      nudgedLeft: 0,
      nudgedTop: 0,
      position: positions[0],
      padding,
      childRect: EMPTY_RECT,
      popoverRect: EMPTY_RECT,
      parentRect: EMPTY_RECT,
      boundaryRect: EMPTY_RECT,
      boundaryInset,
      violations: EMPTY_RECT,
      hasViolations: false,
    });

    const onPositionPopover = useCallback(
      (state: PopoverState) => setPopoverState(state),
      [],
    );

    const { positionPopover, popoverRef, scoutRef } = usePopover({
      isOpen,
      childRef,
      containerClassName,
      parentElement,
      boundaryElement,
      transform,
      transformMode,
      positions,
      align,
      padding,
      boundaryInset,
      reposition,
      onPositionPopover,
    });

    // ─── Positioning ────────────────────────────────────────────────────────────

    // Reposition synchronously when positioning props change or popover opens.
    useLayoutEffect(() => {
      if (!isOpen) return;
      positionPopover();
    }, [
      isOpen,
      positionPopover,
      align,
      padding,
      positions,
      reposition,
      boundaryInset,
      boundaryElement,
      transformMode,
      transform,
    ]);

    // Set up event-driven observers once per open/close cycle.
    // positionPopover is stable (propsRef pattern), so this only re-runs on isOpen toggle.
    useLayoutEffect(() => {
      if (!isOpen) return;

      let rafId: number | null = null;
      const scheduleUpdate = () => {
        if (rafId !== null) return;
        rafId = requestAnimationFrame(() => {
          rafId = null;
          positionPopover();
        });
      };

      const resizeObserver = new ResizeObserver(scheduleUpdate);
      if (childRef.current) resizeObserver.observe(childRef.current);
      if (popoverRef.current) resizeObserver.observe(popoverRef.current);

      const scrollTargets = getScrollableAncestors(childRef.current);
      for (const el of scrollTargets)
        el.addEventListener("scroll", scheduleUpdate, { passive: true });
      window.addEventListener("resize", scheduleUpdate, { passive: true });

      return () => {
        if (rafId !== null) cancelAnimationFrame(rafId);
        resizeObserver.disconnect();
        for (const el of scrollTargets)
          el.removeEventListener("scroll", scheduleUpdate);
        window.removeEventListener("resize", scheduleUpdate);
      };
    }, [isOpen, positionPopover, popoverRef]);

    // ─── Visibility ─────────────────────────────────────────────────────────────

    // The portal is always mounted so the container element is always in the DOM.
    // We toggle opacity + pointer-events to show/hide with a CSS fade transition.
    // Opacity is deferred one frame after opening so the browser sees the positioned
    // element before starting the transition (prevents "fly in" from 0,0).
    useLayoutEffect(() => {
      const el = popoverRef.current;
      if (!el) return;
      if (isOpen) {
        el.removeAttribute("inert");
        const raf = requestAnimationFrame(() => {
          el.style.opacity = "1";
          el.style.pointerEvents = "auto";
        });
        return () => cancelAnimationFrame(raf);
      } else {
        el.setAttribute("inert", "");
        el.style.opacity = "0";
        el.style.pointerEvents = "none";
      }
    }, [isOpen, popoverRef]);

    // ─── containerStyle ─────────────────────────────────────────────────────────

    // Diff-apply to avoid unnecessary DOM writes.
    const appliedStyleKeysRef = useRef<Set<string>>(new Set());
    useEffect(() => {
      const el = popoverRef.current;
      if (!el) return;
      const newKeys = new Set(Object.keys(containerStyle ?? {}));
      appliedStyleKeysRef.current.forEach((key) => {
        if (!newKeys.has(key))
          delete (el.style as unknown as Record<string, unknown>)[key];
      });
      if (containerStyle) Object.assign(el.style, containerStyle);
      appliedStyleKeysRef.current = newKeys;
    }, [containerStyle, popoverRef]);

    // ─── Trigger / hover mode ───────────────────────────────────────────────────

    const scheduleClose = useCallback(() => {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = setTimeout(() => updateOpen(false), 80);
    }, [updateOpen]);

    const cancelClose = useCallback(
      () => clearTimeout(hoverTimeoutRef.current),
      [],
    );

    // Wire popover container mouse events when trigger="hover"
    useEffect(() => {
      if (trigger !== "hover" || isControlled) return;
      const el = popoverRef.current;
      const onEnter = () => cancelClose();
      const onLeave = (e: MouseEvent) => {
        if (!childRef.current?.contains(e.relatedTarget as Node))
          scheduleClose();
      };
      el.addEventListener("mouseenter", onEnter);
      el.addEventListener("mouseleave", onLeave);
      return () => {
        el.removeEventListener("mouseenter", onEnter);
        el.removeEventListener("mouseleave", onLeave);
      };
    }, [trigger, isControlled, popoverRef, cancelClose, scheduleClose]);

    // Cleanup hover timeout on unmount
    useEffect(() => () => clearTimeout(hoverTimeoutRef.current), []);

    // ─── Click outside ──────────────────────────────────────────────────────────

    const handleClickOutside = useCallback(
      (e: MouseEvent) => {
        if (
          !popoverRef.current?.contains(e.target as Node) &&
          !childRef.current?.contains(e.target as Node)
        ) {
          onClickOutside?.(e);
          if (trigger === "click" && !isControlled) updateOpen(false);
        }
      },
      [onClickOutside, trigger, isControlled, updateOpen, popoverRef],
    );

    useEffect(() => {
      const needsListener =
        isOpen &&
        (onClickOutside != null || (trigger === "click" && !isControlled));
      if (!needsListener) return;
      const body = parentElement.ownerDocument.body;
      body.addEventListener("click", handleClickOutside, clickOutsideCapture);
      body.addEventListener(
        "contextmenu",
        handleClickOutside,
        clickOutsideCapture,
      );
      return () => {
        body.removeEventListener(
          "click",
          handleClickOutside,
          clickOutsideCapture,
        );
        body.removeEventListener(
          "contextmenu",
          handleClickOutside,
          clickOutsideCapture,
        );
      };
    }, [
      isOpen,
      onClickOutside,
      trigger,
      isControlled,
      clickOutsideCapture,
      handleClickOutside,
      parentElement,
    ]);

    // ─── Ref merge ──────────────────────────────────────────────────────────────

    const handleRef = useCallback(
      (node: HTMLElement) => {
        childRef.current = node;
        if (externalRef == null) return;
        if (typeof externalRef === "function") externalRef(node);
        else
          (externalRef as React.MutableRefObject<HTMLElement>).current = node;
      },
      [externalRef],
    );

    // ─── Trigger props injected into child ─────────────────────────────────────

    const triggerProps: Record<string, unknown> = {};
    if (!isControlled && trigger) {
      if (trigger === "hover") {
        triggerProps.onMouseEnter = () => {
          cancelClose();
          updateOpen(true);
        };
        triggerProps.onMouseLeave = (e: React.MouseEvent) => {
          if (!popoverRef.current?.contains(e.relatedTarget as Node))
            scheduleClose();
        };
      } else if (trigger === "click") {
        triggerProps.onClick = () => updateOpen(!isOpenRef.current);
      } else if (trigger === "focus") {
        triggerProps.onFocus = () => updateOpen(true);
        triggerProps.onBlur = (e: React.FocusEvent) => {
          if (!popoverRef.current?.contains(e.relatedTarget as Node))
            updateOpen(false);
        };
      }
    }

    // ─── Render ─────────────────────────────────────────────────────────────────

    return (
      <>
        {cloneElement(children, { ref: handleRef, ...triggerProps })}
        {/* Portal is always mounted — the container div stays in the DOM.
            Visibility is controlled via opacity + inert, not mount/unmount,
            which enables CSS fade transitions and prevents the hover-to-content bug. */}
        <PopoverPortal
          element={popoverRef.current}
          scoutElement={scoutRef.current}
          container={parentElement}
        >
          {typeof content === "function" ? content(popoverState) : content}
        </PopoverPortal>
      </>
    );
  },
);

const Popover = forwardRef<HTMLElement, PopoverProps>((props, ref) => {
  if (typeof window === "undefined") return props.children;
  return <PopoverInternal {...props} ref={ref} />;
});

const useMemoizedArray = <T extends number | string>(
  externalArray: T[],
) => {
  const prevArrayRef = useRef(externalArray);
  const array = useMemo(() => {
    if (prevArrayRef.current === externalArray) return prevArrayRef.current;

    if (prevArrayRef.current.length !== externalArray.length) {
      prevArrayRef.current = externalArray;
      return externalArray;
    }

    for (let i = 0; i < externalArray.length; i += 1) {
      if (externalArray[i] !== prevArrayRef.current[i]) {
        prevArrayRef.current = externalArray;
        return externalArray;
      }
    }

    return prevArrayRef.current;
  }, [externalArray]);

  return array;
};


export { usePopover, Popover };