import gifshot from "gifshot";

// Function to download photos as GIF
export const downloadAsGIF = async (photos, layout, setIsGeneratingGif) => {
  if (!photos || photos.length === 0) return;

  setIsGeneratingGif(true);

  try {
    // Process photos to ensure consistent quality and format
    const processedImages = await Promise.all(
      photos.map(async (photo) => {
        return new Promise((resolve) => {
          // Create a temporary canvas for each image to ensure consistent sizing
          const tempCanvas = document.createElement("canvas");
          const tempCtx = tempCanvas.getContext("2d");
          tempCanvas.width = 1200; // High resolution for GIF
          tempCanvas.height = 900; // 4:3 aspect ratio

          // Enable high-quality rendering
          tempCtx.imageSmoothingEnabled = true;
          tempCtx.imageSmoothingQuality = "high";

          const img = new Image();
          img.onload = () => {
            // Draw the image to the canvas with consistent sizing
            tempCtx.drawImage(img, 0, 0, 1200, 900);
            resolve(tempCanvas.toDataURL("image/jpeg", 0.95)); // High quality JPEG for GIF frames
          };
          img.src = photo;
        });
      })
    );

    gifshot.createGIF(
      {
        images: processedImages,
        gifWidth: 1200, // Higher resolution
        gifHeight: 900, // 4:3 aspect ratio
        numFrames: photos.length,
        frameDuration: 3,
        fontWeight: "normal",
        fontSize: "24px", // Scaled up font
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
