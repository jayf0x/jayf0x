import { useRef, useCallback } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useCamera } from "./hooks/useCamera";
import { useAnalyze } from "./hooks/useAnalyze";
import CaveScene from "./scene";
import VisionPanel from "./components/VisionPanel";

const queryClient = new QueryClient();

// Isolated so useAnalyze re-renders never propagate up to Cave or CaveScene.
function AnalysisOverlay({ captureFrame }) {
  const { isLoading, result, error } = useAnalyze(captureFrame);
  return (
    <VisionPanel
      status={isLoading ? "analyzing" : "ready"}
      result={error ? `Error: ${error.message}` : result}
    />
  );
}

function Cave() {
  const canvasRef = useRef(null);
  const { videoRef, isActive, toggle } = useCamera();

  const captureFrame = useCallback(() => {
    return canvasRef.current?.captureFrame() ?? null;
  }, []);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <CaveScene ref={canvasRef} videoRef={videoRef} isActive={isActive} />

      <button
        onClick={toggle}
        style={{
          position: "fixed",
          top: 16,
          right: 16,
          padding: "8px 16px",
          background: isActive ? "#aa3bff" : "rgba(8,6,13,0.6)",
          color: "#e8e0f5",
          border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: 6,
          fontSize: 13,
          fontFamily: "system-ui, sans-serif",
          cursor: "pointer",
          backdropFilter: "blur(6px)",
          transition: "background 0.2s",
          zIndex: 20,
        }}
      >
        {isActive ? "Shadow On" : "Enable Shadow"}
      </button>

      <AnalysisOverlay captureFrame={captureFrame} />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Cave />
    </QueryClientProvider>
  );
}
