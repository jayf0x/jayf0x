export function captureFrame(gl, quality = 0.8) {
  return new Promise((resolve) => {
    gl.domElement.toBlob(
      (blob) => {
        if (!blob) return resolve(null);
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      },
      "image/jpeg",
      quality,
    );
  });
}
