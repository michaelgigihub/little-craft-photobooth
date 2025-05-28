import { createLazyFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import gifshot from "gifshot";
import { usePhotoContext } from "../context/PhotoContext";
import "../assets/css/photo-strip-preview.lazy.css";

export const Route = createLazyFileRoute("/photo-strip-preview")({
  component: PhotoStripPreviewComponent,
});

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

function PhotoStripPreviewComponent() {
  const navigate = useNavigate();
  const { photoSession, resetSession, hasActiveSession } = usePhotoContext();
  const { layout, photoCount, photos } = photoSession;
  const canvasRef = useRef(null);
  const [stripGenerated, setStripGenerated] = useState(false);
  const [isGeneratingGif, setIsGeneratingGif] = useState(false);
  const [frameColor, setFrameColor] = useState("#ffffff"); // Default white frame

  // Pastel color palette options
  const colorOptions = [
    { color: "#ffffff", name: "White" },
    { color: "#FFB6C1", name: "Pastel Pink" },
    { color: "#ADD8E6", name: "Pastel Blue" },
    { color: "#BDFCC9", name: "Pastel Green" },
    { color: "#FFDAB9", name: "Peach" },
    { color: "#E6E6FA", name: "Lavender" },
  ];

  // Photo strip width based on layout
  const getStripWidth = () => {
    switch (layout) {
      case "a":
        return 1200; // Layout A: 1200px width
      case "b":
        return 600; // Layout B: 600px width
      default:
        return 0; // Default: 0px (to be determined for layouts C and D)
    }
  };

  const stripWidth = getStripWidth();

  const getSidePhotoPad = () => {
    switch (layout) {
      case "a":
        return 60; // Layout A: 1200px width
      case "b":
        return 30; // Layout B: 600px width
      default:
        return 0; // Default: 0px (to be determined for layouts C and D)
    }
  };
  const photoSidePad = getSidePhotoPad(); // Margin between photos

  const getPhotoGap = () => {
    switch (layout) {
      case "a":
        return 30; // Layout A: 1200px width
      case "b":
        return 60; // Layout B: 600px width
      default:
        return 0; // Default: 0px (to be determined for layouts C and D)
    }
  };
  const photoGap = getPhotoGap(); // Margin between photos

  // Adjust padding based on layout
  let canvasPadding;
  switch (layout) {
    case "a":
      canvasPadding = { top: 120, left: 67 };
      break;
    case "b":
      canvasPadding = { top: 80, left: 30 };
      break;
    default:
      canvasPadding = { top: 0, left: 0 };
  }

  // Calculate height to ensure standard 2:6 aspect ratio for layouts A and B
  const getStripHeight = () => {
    switch (layout) {
      case "a": // 4 photos, 1 per row - standard 2:6 aspect ratio
        return 3600; //fixed 3600(3100 + 470 bottom pad) height for 4 photos
      case "b": // 3 photos, 1 per row - standard 2:6 aspect ratio
        return 1800; //fixed 1800px(1300px + 470 bottom pad) height for 3 photos
      case "c": // 2 photos, 1 per row - shorter strip
        const photoHeight = ((stripWidth - photoSidePad * 2) * 3) / 4; // 4:3 aspect ratio
        return (photoHeight + photoSidePad) * 2 + photoSidePad;
      case "d": // 6 photos, 2 per row (3 rows) - compact layout
        // For layout d, calculate based on 2-column layout
        const layoutDPhotoWidth = (stripWidth - photoSidePad * 3) / 2; // Width for 2 columns
        const layoutDPhotoHeight = (layoutDPhotoWidth * 3) / 4; // 4:3 aspect ratio
        return (layoutDPhotoHeight + photoSidePad) * 3 + photoSidePad;
      default:
        return stripWidth * 3; // Default to 2:6 ratio
    }
  };
  const stripHeight = getStripHeight();

  // Canvas dimensions including padding
  const canvasWidth = stripWidth;
  const canvasHeight = stripHeight;

  // Function to go back and take new photos
  const takeNewPhotos = () => {
    resetSession();
    navigate({ to: "/" });
  };

  // Redirect to home if no session is active or no photos captured
  useEffect(() => {
    if (!hasActiveSession() || !photos || photos.length === 0) {
      navigate({ to: "/" });
    }
  }, [hasActiveSession, photos, navigate]);
  // Generate the photo strip when component mounts or frame color changes
  useEffect(() => {
    if (photos && photos.length > 0) {
      generatePhotoStrip();
    }
  }, [photos, frameColor]);

  // Function to load an image from base64 data
  const loadImage = (src) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  };

  // Early return check - must be AFTER all hooks have been called
  if (!hasActiveSession() || !photos || photos.length === 0) {
    return (
      <div className="photo-strip-container">
        <h2>Redirecting...</h2>
        <p>Loading photo session...</p>
      </div>
    );
  }

  // Function to generate the photo strip on canvas
  const generatePhotoStrip = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !photos) return;

    const ctx = canvas.getContext("2d");
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Enable high-quality rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high"; // Set background color to selected frame color
    ctx.fillStyle = frameColor;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    try {
      // Load all images
      const images = await Promise.all(photos.map(loadImage)); // Calculate layout dimensions based on selected layout
      let photoWidth, photoHeight, cols, rows;

      switch (layout) {
        case "a": // 4 photos, 1 per row (standard 2:6 strip)
          cols = 1;
          rows = 4;
          photoWidth = stripWidth - canvasPadding.left * 2;
          // For 2:6 ratio strip, distribute height evenly among 4 photos plus margins
          photoHeight = (3 / 4) * photoWidth; //to make it 4:3 aspect ratio base on the photo width
          break;
        case "b": // 3 photos, 1 per row (standard 2:6 strip)
          cols = 1;
          rows = 3;
          photoWidth = stripWidth - canvasPadding.left * 2; // fix size considering the side margins
          photoHeight = (3 / 4) * photoWidth;
          break;
        case "c": // 2 photos, 1 per row (shorter strip)
          cols = 1;
          rows = 2;
          photoWidth = stripWidth - photoSidePad * 2;
          photoHeight = (photoWidth * 3) / 4; // Maintain 4:3 aspect ratio
          break;
        case "d": // 6 photos, 2 per row (3 rows)
          cols = 2;
          rows = 3;
          photoWidth = (stripWidth - photoSidePad * 3) / 2;
          photoHeight = (photoWidth * 3) / 4; // Maintain 4:3 aspect ratio
          break;
        default:
          cols = 1;
          rows = 4;
          photoWidth = stripWidth - photoSidePad * 2;
          photoHeight = (stripHeight - photoSidePad * 5) / 4;
      } // Draw photos in the grid
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
      }); // Add "little craft" watermark to bottom center
      ctx.save();
      // Set watermark font size based on layout
      switch (layout) {
        case "a":
          ctx.font = "50px Arial";
          break;
        case "b":
          ctx.font = "25px Arial";
          break;
        default:
          ctx.font = "0px Arial";
      }

      // Determine watermark color based on frame color brightness
      const isDark = isColorDark(frameColor);
      // Use white for dark backgrounds, semi-transparent black for light backgrounds
      const watermarkColor = isDark
        ? "rgba(255, 255, 255, 0.3)"
        : "rgba(0, 0, 0, 0.3)";

      ctx.fillStyle = watermarkColor;
      const watermarkText = "@LITTLECRAFTSPH";
      const watermarkWidth = ctx.measureText(watermarkText).width;
      // Position: center bottom in the padding area
      const watermarkX = canvasWidth / 2 - watermarkWidth / 2;
      const watermarkY = canvasHeight - 40; // Centered in bottom padding
      ctx.fillText(watermarkText, watermarkX, watermarkY);
      ctx.restore();

      setStripGenerated(true);
    } catch (error) {
      console.error("Error generating photo strip:", error);
    }
  };

  // Function to download as JPEG
  const downloadAsJPEG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = `photo-strip-${layout}-${Date.now()}.jpg`;
    link.href = canvas.toDataURL("image/jpeg", 1.0); // Maximum quality
    link.click();
  }; // Function to download as GIF
  const downloadAsGIF = async () => {
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
          //interval: 0.5, // 0.5 seconds per frame
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

  return (
    <div className="photo-strip-container">
      <h2>Your Photo Strip</h2>{" "}
      <div className="strip-info">
        Layout: {layout.toUpperCase()} - {photoCount} photos
      </div>{" "}
      <div className="strip-preview-container">
        <div className="canvas-container">
          <canvas
            ref={canvasRef}
            className={`photo-strip-canvas ${layout === "d" ? "layout-d" : ""}`}
          />
        </div>{" "}
        <div className="color-picker-container">
          <p>Choose Frame Color:</p>
          <div className="color-options">
            {colorOptions.map((option) => (
              <button
                key={option.color}
                className="color-option"
                style={{
                  backgroundColor: option.color,
                  border:
                    frameColor === option.color
                      ? "3px solid #000"
                      : "1px solid #ccc",
                }}
                title={option.name}
                onClick={() => setFrameColor(option.color)}
                aria-label={`Select ${option.name} frame color`}
              />
            ))}
          </div>
          <div className="custom-color-picker">
            <label htmlFor="custom-color">Custom Color:</label>
            <input
              type="color"
              id="custom-color"
              value={frameColor}
              onChange={(e) => setFrameColor(e.target.value)}
              aria-label="Choose custom frame color"
            />
            <span className="color-value">{frameColor}</span>
          </div>
        </div>
      </div>
      {stripGenerated && (
        <div className="download-controls">
          <h3>Download Your Photo Strip</h3>
          <div className="download-buttons">
            <button onClick={downloadAsJPEG} className="action-btn download">
              Download as JPEG
            </button>
            <button
              onClick={downloadAsGIF}
              disabled={isGeneratingGif}
              className="action-btn download"
            >
              {isGeneratingGif ? "Creating GIF..." : "Download as GIF"}
            </button>
          </div>
        </div>
      )}
      <div className="navigation-controls">
        <button onClick={takeNewPhotos} className="action-btn primary">
          Take New Photos
        </button>
      </div>
    </div>
  );
}
