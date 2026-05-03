import { FluidText } from "@jayf0x/fluidity-js";
import { useEffect, useRef } from "react";
import { useIsMobile } from "../hooks/useIsMobile";

export const Background = () => {
  const fluidRef = useRef<FluidHandle>(null);

  useEffect(() => {
    const onMouseMove = (event: MouseEvent) => {
      const x = -event.clientX / window.innerWidth;
      const y = -event.clientY / window.innerHeight;
      document.documentElement.style.setProperty("--mx", x.toFixed(2));
      document.documentElement.style.setProperty("--my", y.toFixed(2));

      requestAnimationFrame(() => {
        fluidRef.current?.move({ x: event.clientX, y: event.clientY });
      });
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });

    return () => window.removeEventListener("mousemove", onMouseMove);
  }, []);

  const isMobile = useIsMobile();
  const fluidTextSpace =  " ".repeat(Math.floor(window.innerWidth/ 100))

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {
        // no use on mobile
        !isMobile && (
          <div className="absolute inset-0 opacity-50 hue_rot" title="Ever seen a chicken ">
            <FluidText
              isWorkerEnabled={true}
              isMouseEnabled={false}
              ref={fluidRef}
              text={`🐔${fluidTextSpace}<3/>${fluidTextSpace}🥚`}
              config={{
                densityDissipation: 0.99,
                // waterColor: [0.8, 0.3, 0.5],
                waterColor: [0.15, 0.1, 0.1],
                // glowColor: [0.8, 0.3, 0.5].reverse() as [number, number, number],
                shine: 0.1,
                splatRadius: 0.005,
                specularExp: 7,
                pressureIterations: 0,
              }}
              fontSize={200}
              fontFamily="Ubuntu"
              algorithm="ripple"
              style={{
                filter: "grayscale(0.5)",
              }}
            />
          </div>
        )
      }
      <div className="absolute inset-0 opacity-[0.16]">
        <svg
          className="h-full w-full"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            transform:
              "translate3d(calc(var(--mx, 0) * 8px), calc(var(--my, 0) * 8px), 0)",
          }}
        >
          <defs>
            <pattern
              id="dotPattern"
              x="0"
              y="0"
              width="24"
              height="24"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="2" cy="2" r="1.2" fill="currentColor" />
            </pattern>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="url(#dotPattern)"
            className="text-[#DD3162]"
          />
        </svg>
      </div>

      <div className="absolute inset-0 opacity-[0.16]">
        <svg
          className="h-full w-full"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            transform:
              "translate3d(calc(var(--mx, 0) * 4px), calc(var(--my, 0) * 4px), 0)",
          }}
        >
          <defs>
            <pattern
              id="dotPattern2"
              x="0"
              y="0"
              width="24"
              height="24"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="3" cy="3" r="2" fill="currentColor" />
            </pattern>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="url(#dotPattern2)"
            className="text-[#27449F]"
          />
        </svg>
      </div>

      <div className="blob absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-[#4f7cff] to-[#8b5cf6] opacity-[0.08] blur-3xl" />
      <div className="blob absolute -bottom-40 -right-40 h-[420px] w-[420px] rounded-full bg-gradient-to-tr from-[#4f7cff] to-[#8b5cf6] opacity-[0.08] blur-3xl [animation-delay:3s]" />
    </div>
  );
};
