import { useCallback, useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { devLog } from "../../utils";

export function useCaptureFrame(captureRef) {
  const { gl } = useThree();

  const captureFrame = useCallback(
    (quality = 0.8) =>
      new Promise((resolve) => {
        gl.domElement.toBlob(
          (blob) => {
            if (!blob) {
              devLog("No blob for image");
              return resolve(null);
            }
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
          },
          "image/jpeg",
          quality,
        );
      }),
    [gl],
  );

  useEffect(() => {
    captureRef.current = captureFrame;
  }, [captureFrame, captureRef]);
}
