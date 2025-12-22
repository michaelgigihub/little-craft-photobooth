import gifshot from "gifshot";

// Get GIF dimensions based on layout
// Using proportional sizing to maintain aspect ratios
const getGifDimensions = (layout) => {
  switch (layout) {
    case "c":
      // Layout C uses 540:713 aspect ratio
      // Scale to reasonable GIF size: 1080×1426
      return { width: 1080, height: 1426 };
    case "a":
    case "b":
    case "d":
    default:
      // Other layouts use 4:3 aspect ratio
      // Scale to: 1600×1200
      return { width: 1600, height: 1200 };
  }
};

// Function to download photos as GIF
export const downloadAsGIF = async (photos, layout, setIsGeneratingGif) => {
  if (!photos || photos.length === 0) return;

  setIsGeneratingGif(true);

  // Get proper dimensions for this layout
  const { width: gifWidth, height: gifHeight } = getGifDimensions(layout);

  try {
    // Process photos to ensure consistent quality and format
    const processedImages = await Promise.all(
      photos.map(async (photo) => {
        return new Promise((resolve) => {
          // Create a temporary canvas for each image
          const tempCanvas = document.createElement("canvas");
          const tempCtx = tempCanvas.getContext("2d");
          tempCanvas.width = gifWidth;
          tempCanvas.height = gifHeight;

          // Enable high-quality rendering
          tempCtx.imageSmoothingEnabled = true;
          tempCtx.imageSmoothingQuality = "high";

          const img = new Image();
          img.onload = () => {
            // Draw the image to the canvas with layout-specific sizing
            tempCtx.drawImage(img, 0, 0, gifWidth, gifHeight);
            resolve(tempCanvas.toDataURL("image/jpeg", 1.0)); // Maximum quality for GIF frames
          };
          img.src = photo;
        });
      })
    );

    gifshot.createGIF(
      {
        images: processedImages,
        gifWidth: gifWidth,
        gifHeight: gifHeight,
        numFrames: photos.length,
        frameDuration: 3,
        fontWeight: "normal",
        fontSize: "24px",
        fontFamily: "sans-serif",
        fontColor: "#ffffff",
        quality: 10, // Maximum quality (1-10 scale)
        sampleInterval: 10, // Lower sample interval for better quality
      },
      (obj) => {
        setIsGeneratingGif(false);

        if (!obj.error) {
          const link = document.createElement("a");
          link.download = `photo-strip-${layout}-${Date.now()}.gif`;
          link.href = obj.image;
          link.click();
        } else {
          console.error("Error creating GIF:", obj.error);
          alert("Error creating GIF. Please try again.");
        }
      }
    );
  } catch (error) {
    console.error("Error processing images for GIF:", error);
    setIsGeneratingGif(false);
    alert("Error processing images for GIF. Please try again.");
  }
};
