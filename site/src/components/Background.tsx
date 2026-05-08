import { FluidText } from "@jayf0x/fluidity-js";
import { useCallback, useEffect, useRef } from "react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { usePerformanceCheckpoint } from "@/hooks/usePerformanceCheckpoint";
import { useMotionValue, useMotionValueEvent } from "framer-motion";

export const Background = () => {
  const fluidRef = useRef<FluidHandle>(null);

  const isMobile = useIsMobile();
  const showBackground = usePerformanceCheckpoint("Fluid", 50);
  const showVoid = usePerformanceCheckpoint("Void", 0, true);
  const showChickenEgg = usePerformanceCheckpoint("🐔🥚", 60);

  const splatCanvas = useCallback(
    (x: number, y: number) => {
      if (isMobile) {
        fluidRef.current?.splat(x, y, x + 20, y + 20, 10);
      } else {
        fluidRef.current?.move({ x, y });
      }
    },
    [isMobile],
  );

  const mx = useMotionValue(0);
  const my = useMotionValue(0);

  useEffect(() => {
    const onPointerMove = (event: MouseEvent) => {
      mx.set(-event.clientX / window.innerWidth);
      my.set(-event.clientY / window.innerHeight);

      splatCanvas(event.clientX, event.clientY);
    };

    window.addEventListener("pointermove", onPointerMove, {
      passive: true,
    });

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
    };
  }, [mx, my, splatCanvas]);

  useMotionValueEvent(mx, "change", (v) => {
    document.documentElement.style.setProperty("--mx", v.toFixed(2));
  });

  useMotionValueEvent(my, "change", (v) => {
    document.documentElement.style.setProperty("--my", v.toFixed(2));
  });

  const fluidTextSpace = " ".repeat(Math.floor(window.innerWidth / 100));

  return (
    <div
      className={`fixed inset-0 overflow-hidden ${showVoid ? "z-10" : "-z-10"}`}
    >
      {showVoid && <Void />}

      {showBackground && (
        <div
          className="absolute inset-0 opacity-100"
          title="bun add @jayf0x/fluidity-js"
        >
          
          <FluidText
            isWorkerEnabled={true}
            isMouseEnabled={false}
            ref={fluidRef}
            text={
              showChickenEgg ? `🐔${fluidTextSpace}<3/>${fluidTextSpace}🥚` : ""
            }
            config={{
              densityDissipation: 0.99,
              waterColor: [0.15, 0.1, 0.1],
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

      
      

      <div className="blob absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-[#4f7cff] to-[#8b5cf6] opacity-[0.1] blur-3xl" />
      <div className="blob absolute -bottom-40 -right-40 h-[420px] w-[420px] rounded-full bg-gradient-to-tr from-[#4f7cff] to-[#8b5cf6] opacity-[0.1] blur-3xl [animation-delay:3s]" />
    </div>
  );
};

const Void = () => {
  const fluidRef = useRef<FluidHandle>(null);

  return (
    <div className="w-full h-full flex justify-center items-center relative">
      
      <div
        className="rounded-[100%] lg:size-[70vw] sm:size-full overflow-hidden relative"
        style={{
          background: "radial-gradient(circle at 100%, #000a, #fff0 50%)",
        }}
      >
        <FluidText
          ref={fluidRef}
          text="{}"
          fontSize={200}
          config={{
            densityDissipation: 1,
            velocityDissipation: 0.98,
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
          style={{
            filter: "grayscale(0.4)",
            opacity: 0.9,
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
