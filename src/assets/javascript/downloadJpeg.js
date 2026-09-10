import { triggerBlobDownload } from "./downloadUtils.js";

// Function to download canvas content as JPEG
// Uses canvas.toBlob() instead of toDataURL() for iOS compatibility —
// toDataURL() produces oversized base64 strings that iOS Safari can't download.
export const downloadAsJPEG = (canvas, layout) => {
  if (!canvas) return;

  const filename = `photo-strip-${layout}-${Date.now()}.jpg`;

  canvas.toBlob(
    (blob) => {
      if (!blob) {
        console.error("Failed to create blob from canvas");
        alert("Error creating download. Please try again.");
        return;
      }
      triggerBlobDownload(blob, filename);
    },
    "image/jpeg",
    1.0 // Maximum quality
  );
};
