import { useEffect, useRef } from "react";
import SquareCursor from "../../lib/sqrcsr-cursor"

export const Resume = () => {
  const refMain = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (refMain.current) {
      const cursorEff = SquareCursor(refMain.current, {
        colors: ["#fff1"],
      });
      return () => cursorEff.destroy();
    }
  }, []);

  return (
    <main className="p-6 h-full">
      <div className="flex justify-center items-center center  h-full w-full">
        <a
          href="https://raw.githubusercontent.com/jayf0x/jayf0x/main/assets/Jonatan-Verstraete-resume-2026.pdf"
          download
        >
          <button className="text-2xl border border-white size-[70px] hover:bg-[#3337] rounded-sm">
            PDF
          </button>
        </a>
      </div>

      <div className="absolute w-full h-full" ref={refMain}></div>
    </main>
  );
};
