// Function to download canvas content as JPEG
export const downloadAsJPEG = (canvas, layout) => {
  if (!canvas) return;

  const link = document.createElement("a");
  link.download = `photo-strip-${layout}-${Date.now()}.jpg`;
  link.href = canvas.toDataURL("image/jpeg", 1.0); // Maximum quality
  link.click();
};
