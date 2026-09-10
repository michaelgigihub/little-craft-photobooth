/**
 * Shared download utilities for iOS-compatible file downloads.
 *
 * iOS Safari cannot download files from data URLs — the download dialog appears
 * but the file is empty/corrupt. Using Blob + URL.createObjectURL() fixes this
 * because Safari's download manager handles blob URLs natively.
 */

/**
 * Convert a base64 data URL to a Blob object.
 * @param {string} dataURL - A base64-encoded data URL (e.g., "data:image/jpeg;base64,...")
 * @returns {Blob} The resulting Blob object
 */
export const dataURLtoBlob = (dataURL) => {
  const parts = dataURL.split(",");
  const mime = parts[0].match(/:(.*?);/)[1];
  const binaryStr = atob(parts[1]);
  const length = binaryStr.length;
  const uint8Array = new Uint8Array(length);

  for (let i = 0; i < length; i++) {
    uint8Array[i] = binaryStr.charCodeAt(i);
  }

  return new Blob([uint8Array], { type: mime });
};

/**
 * Trigger a file download from a Blob using a blob URL.
 * Works on iOS Safari/Chrome, Android Chrome, and Desktop browsers.
 *
 * @param {Blob} blob - The Blob to download
 * @param {string} filename - The desired filename for the download
 */
export const triggerBlobDownload = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Revoke after a delay to ensure the download has started
  setTimeout(() => URL.revokeObjectURL(url), 10000);
};
