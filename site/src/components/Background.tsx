import { FluidImage, FluidText } from "@jayf0x/fluidity-js";
import { useCallback, useEffect, useRef } from "react";
import { useIsMobile } from "@/hooks/useIsMobile";

export const Background = () => {
  const fluidRef = useRef<FluidHandle>(null);

  const isMobile = useIsMobile();

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
      const x = -event.clientX / window.innerWidth;
      const y = -event.clientY / window.innerHeight;
      document.documentElement.style.setProperty("--mx", x.toFixed(2));
      document.documentElement.style.setProperty("--my", y.toFixed(2));

      requestAnimationFrame(() => {
        splat(event.clientX, event.clientY);
      });
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });

    return () => window.removeEventListener("mousemove", onMouseMove);
  }, [splat]);

  const fluidTextSpace = " ".repeat(Math.floor(window.innerWidth / 100));

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* <img
        className="absolute inset-0 w-full h-full object-cover opacity-100"
        // src="https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3ODg5b3B2ZXF0YjkyM3NlcnpjM2g1bGpham9ic21idGl5MTd1eTlnOCZlcD12MV9naWZzX3JlbGF0ZWQmY3Q9Zw/sCIIl5TVOzdfmRfMI0/giphy.gif"
        src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHY5NXR6MDVsbmZ4OHdjYzd3enpvcGV1NjF2eWpicjBhd25nN2R6ZyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/hFhygTRHt4jvGQo52q/giphy.gif"
        // src="https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3ZWppdWE5YWlmb3RqdWFjcHN1cmZycDUyN2VtdWR3dnFtbWJxcWx3MCZlcD12MV9naWZzX3JlbGF0ZWQmY3Q9Zw/9QnnIp6RTb7YpcVko6/giphy.gif"
        src="https://imgs.search.brave.com/3l_2KEk1pPWi7rPFvX5y43ksxKouA0ym2ZICphc15lM/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93YWxs/cGFwZXJzLmNvbS9p/bWFnZXMvaGQvd2lu/ZG93cy1oaWxsLWJh/Y2tncm91bmQtajcz/M2k2MzB4ZzV4OWZo/eS5qcGc"

        
      /> */}

      {
        <div
          className="absolute inset-0 opacity-100"
          title="Ever seen a chicken "
        >
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
      }

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
