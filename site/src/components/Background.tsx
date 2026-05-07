import { FluidImage, FluidText } from "@jayf0x/fluidity-js";
import { useCallback, useEffect, useRef } from "react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { usePerformanceCheckpoint } from "@/hooks/usePerformanceCheckpoint";

export const Background = () => {
  const fluidRef = useRef<FluidHandle>(null);

  const isMobile = useIsMobile();
  const showBackground = usePerformanceCheckpoint("Fluid", 50);
  const showVoid = usePerformanceCheckpoint("Void", 0, true);
  const showChickenEgg = usePerformanceCheckpoint("🐔🥚", 60);

  const splat = useCallback(
    (x: number, y: number) => {
      if (isMobile) {
        fluidRef.current?.splat(x, y, x + 20, y + 20, 10);
      } else {
        fluidRef.current?.move({ x, y });
      }
    },
    [isMobile],
  );

  useEffect(() => {
    const onMouseMove = (event: MouseEvent) => {
      requestAnimationFrame(() => {
        const x = -event.clientX / window.innerWidth;
        const y = -event.clientY / window.innerHeight;
        document.documentElement.style.setProperty("--mx", x.toFixed(2));
        document.documentElement.style.setProperty("--my", y.toFixed(2));

        splat(event.clientX, event.clientY);
      });
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });

    return () => window.removeEventListener("mousemove", onMouseMove);
  }, [splat]);

  const fluidTextSpace = " ".repeat(Math.floor(window.innerWidth / 100));

  return (
    <div
      className={`fixed inset-0 overflow-hidden ${showVoid ? "z-10" : "-z-10"}`}
      title="bun add @jayf0x/fluidity-js"
    >
      {showVoid && <Void />}

      {showBackground && (
        <div className="absolute inset-0 opacity-100">
          {/* <FluidImage
            isWorkerEnabled={true}
            isMouseEnabled={false}
            ref={fluidRef}
            src={`https://imgs.search.brave.com/oQjIn6Se4KSp7e5a8AuHWlDYTa2ywpf0ylx1h7HGuFA/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93YWxs/cGFwZXJzLmNvbS9p/bWFnZXMvaGQvd2lu/ZG93cy1oaWxsLWJh/Y2tncm91bmQtaGNj/YTZmNm8yZjh3dXA4/aC5qcGc`}
            config={{
              densityDissipation: 0.99,
              velocityDissipation: 0.99,
              // waterColor: [0.8, 0.3, 0.5],
              waterColor: [0.15, 0.1, 0.1],
              // glowColor: [0.8, 0.3, 0.5].reverse() as [number, number, number],
              shine: 0.01,
              splatRadius: 0.005,
              specularExp: 7,
              refraction: 1,
              pressureIterations: 1,
            }}
            algorithm="aurora"
            style={{
              filter: "grayscale(0.5)",
            }}
          /> */}
          <FluidText
            isWorkerEnabled={true}
            isMouseEnabled={false}
            ref={fluidRef}
            text={showChickenEgg ? `🐔${fluidTextSpace}<3/>${fluidTextSpace}🥚` : ''}
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
      )}

      {/* 
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
      } */}
      {/* 
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
      </div> */}

      <div className="blob absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-[#4f7cff] to-[#8b5cf6] opacity-[0.1] blur-3xl" />
      <div className="blob absolute -bottom-40 -right-40 h-[420px] w-[420px] rounded-full bg-gradient-to-tr from-[#4f7cff] to-[#8b5cf6] opacity-[0.1] blur-3xl [animation-delay:3s]" />
    </div>
  );
};

const Void = () => {
  const fluidRef = useRef<FluidHandle>(null);

  return (
    <div className="w-full h-full flex justify-center items-center relative">
      {/* <div className="absolute py-[10vw] z-10 pointer-events-none *:pointer-events-auto">
        <h2
          className="text-[5rem] font-black"
          style={{ fontFamily: "Courier New" }}
        >
          <a href="https://en.wikipedia.org/wiki/Pale_Blue_Dot">
            Pale Blue Dot
          </a>
        </h2>
      </div> */}
      <div
        className="rounded-[100%] lg:size-[60vw] sm:size-full overflow-hidden relative"
        style={{
          background: "radial-gradient(circle at 100%, #000a, #fff0 50%)",
        }}
      >
        <FluidText
          ref={fluidRef}
          text="{}"
          // text="𓃠"
          // isMouseEnabled={false}
          fontSize={200}
          config={{
            densityDissipation: 1,
            velocityDissipation: 0.98,
            // waterColor: [0, 0, 0],
            waterColor: [0.1, 0.1, 0.1],
            glowColor: [0.5, 0.5, 0.5],
            curl: 0.98,
            shine: 0.05,
            splatRadius: 0.001,
            splatForce: 3,
            specularExp: 0.5,
            refraction: 0,
          }}
          backgroundColor="radial-gradient(circle at 100%, #000a, #fff0 50%)"
          // algorithm="aurora"
          style={{
            // filter: "blur(1px)",
            filter: "grayscale(0.4)",
            // width: "50vw",
            opacity: 0.9,
            // zIndex:9999
          }}
        />
        <div
          className="absolute z-10 w-full h-full inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(circle, #fff0,  #000 50%, #000 100%)",
          }}
        ></div>
      </div>
    </div>
  );
};
