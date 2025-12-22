// Function to determine if a color is dark or light
// Returns true if the color is dark, false if it's light
const isColorDark = (hexColor) => {
  // Remove the # if it exists
  const hex = hexColor.replace("#", "");

  // Convert hex to RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Calculate luminance - using the formula for relative luminance in the sRGB color space
  // See: https://www.w3.org/TR/WCAG20-TECHS/G17.html#G17-tests
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return true if dark (luminance less than 0.5), false if light
  return luminance < 0.5;
};

// Function to load an image from base64 data
const loadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

// Main function to generate the photo strip on canvas
export const generatePhotoStrip = async ({
  canvas,
  photos,
  layout,
  frameColor,
  selectedFrame,
  canvasWidth,
  canvasHeight,
  stripWidth,
  canvasPadding,
  photoGap,
  setStripGenerated,
}) => {
  if (!canvas || !photos) return;

  const ctx = canvas.getContext("2d");
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  // Enable high-quality rendering
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // Set background color to selected frame color
  ctx.fillStyle = frameColor;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  try {
    // Load all images
    const images = await Promise.all(photos.map(loadImage));

    // Calculate layout dimensions based on selected layout
    let photoWidth, photoHeight, cols, rows;

    switch (layout) {
      case "a": // 4 photos, 1 per row (standard 2:6 strip)
        cols = 1;
        rows = 4;
        photoWidth = stripWidth - canvasPadding.left * 2;
        photoHeight = (3 / 4) * photoWidth; // 4:3 aspect ratio
        break;
      case "b": // 3 photos, 1 per row (standard 2:6 strip)
        cols = 1;
        rows = 3;
        photoWidth = stripWidth - canvasPadding.left * 2;
        photoHeight = (3 / 4) * photoWidth; // 4:3 aspect ratio
        break;
      case "c": // 2 photos, 540:713 ratio - scaled 4x
        cols = 1;
        rows = 2;
        photoWidth = 2160; // 4x of 540
        photoHeight = 2852; // 4x of 713
        break;
      case "d": // 2 photos, 4:6 ratio
        cols = 1;
        rows = 2;
        photoWidth = stripWidth - canvasPadding.left * 2;
        photoHeight = (3 / 4) * photoWidth; // 4:3 aspect ratio
        break;
      default:
        cols = 1;
        rows = 4;
    }

    // Draw photos in the grid
    images.forEach((img, index) => {
      if (index >= cols * rows) return; // Don't draw more photos than the layout supports

      const col = index % cols;
      const row = Math.floor(index / cols);

      const x = canvasPadding.left + col * (photoWidth + photoGap);
      const y = canvasPadding.top + row * (photoHeight + photoGap);

      // Since we already cropped the image to 4:3 during capture, we should maintain that ratio
      const imgAspect = img.width / img.height;
      const frameAspect = photoWidth / photoHeight;

      let drawWidth = photoWidth;
      let drawHeight = photoHeight;
      let offsetX = 0;
      let offsetY = 0;

      // The image should already be 4:3, but handle any slight variations
      if (Math.abs(imgAspect - frameAspect) > 0.01) {
        if (imgAspect > frameAspect) {
          // Image is slightly wider than frame - center crop
          drawHeight = photoHeight;
          drawWidth = photoHeight * imgAspect;
          offsetX = (photoWidth - drawWidth) / 2;
        } else {
          // Image is slightly taller than frame - center crop
          drawWidth = photoWidth;
          drawHeight = photoWidth / imgAspect;
          offsetY = (photoHeight - drawHeight) / 2;
        }
      }

      // Clip to photo area to prevent overflow
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, photoWidth, photoHeight);
      ctx.clip();

      // Draw the image (already flipped during capture, so no need to flip again)
      ctx.drawImage(img, x + offsetX, y + offsetY, drawWidth, drawHeight);
      ctx.restore();
    });

    // Add "little craft" watermark to bottom center
    ctx.save();
    const rootStyles = getComputedStyle(document.documentElement);
    const bodyFont = rootStyles.getPropertyValue("--font-family-body").trim();

    // Set watermark font size based on layout - scaled 4x for high-resolution output
    switch (layout) {
      case "a": // 4 strips (2:6)
      case "d": // 2 strips (4:6)
      case "b": // 3 strips (2:6)
        ctx.font = `240px ${bodyFont}`; // 4x of 60px
        ctx.bottomPadding = 280; // 4x of 70
        break;
      case "c": // 2 strips (2:6)
        ctx.font = `140px ${bodyFont}`; // 4x of 35px
        ctx.bottomPadding = 180; // 4x of 45
        break;
      default:
        ctx.font = `0px ${bodyFont}`;
    }

    // Determine watermark color based on frame color brightness
    const isDark = isColorDark(frameColor);
    // Use white for dark backgrounds, semi-transparent black for light backgrounds
    const watermarkColor = isDark
      ? "rgba(255, 255, 255, 0.3)"
      : "rgba(0, 0, 0, 0.3)";

    ctx.fillStyle = watermarkColor;
    const watermarkText = "@LITTLECRAFTS";
    const watermarkWidth = ctx.measureText(watermarkText).width;
    // Position: center bottom in the padding area
    const watermarkX = canvasWidth / 2 - watermarkWidth / 2;
    const watermarkY = canvasHeight - ctx.bottomPadding; // Centered in bottom padding
    ctx.fillText(watermarkText, watermarkX, watermarkY);
    ctx.restore();

    // Apply frame overlay if selected
    if (selectedFrame && selectedFrame.imagePath) {
      try {
        const frameImg = await loadImage(selectedFrame.imagePath);
        // Draw the frame overlay on top of everything
        ctx.drawImage(frameImg, 0, 0, canvasWidth, canvasHeight);
      } catch (error) {
        console.error("Error loading frame image:", error);
      }
    }

    setStripGenerated(true);
  } catch (error) {
    console.error("Error generating photo strip:", error);
  }
};
