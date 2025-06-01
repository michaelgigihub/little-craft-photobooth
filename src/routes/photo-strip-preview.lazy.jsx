import { createLazyFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { usePhotoContext } from "../context/PhotoContext";
import "../assets/css/photo-strip-preview.lazy.css";
import "../assets/css/footer.css";
import liloStitchFrameB from "../assets/images/frames/lilo_stitch_frames/lilo_stitch_frame_b.png";
import Footer from "../components/Footer";
import { downloadAsJPEG } from "../assets/javascript/downloadJpeg.js";
import { downloadAsGIF } from "../assets/javascript/downloadGif.js";
import { generatePhotoStrip } from "../assets/javascript/generatePhotoStrip.js";

export const Route = createLazyFileRoute("/photo-strip-preview")({
  component: PhotoStripPreviewComponent,
});

function PhotoStripPreviewComponent() {
  const navigate = useNavigate();
  const { photoSession, resetSession, hasActiveSession } = usePhotoContext();
  const { layout, photoCount, photos } = photoSession;
  const canvasRef = useRef(null);
  const [stripGenerated, setStripGenerated] = useState(false);
  const [isGeneratingGif, setIsGeneratingGif] = useState(false);
  const [frameColor, setFrameColor] = useState("#ffffff"); // Default white frame
  const [selectedFrame, setSelectedFrame] = useState(null); // Default no frame

  // Pastel color palette options
  const colorOptions = [
    { color: "#ffffff", name: "White" },
    { color: "#FFB6C1", name: "Pastel Pink" },
    { color: "#ADD8E6", name: "Pastel Blue" },
    { color: "#BDFCC9", name: "Pastel Green" },
    { color: "#FFDAB9", name: "Peach" },
    { color: "#E6E6FA", name: "Lavender" },
  ];
  // Frame overlay options
  const frameOptions = [
    {
      id: null,
      name: "No Frame",
      supportedLayouts: ["a", "b", "c", "d"],
      imagePath: null,
    },
    {
      id: "lilo_stitch",
      name: "Lilo & Stitch",
      supportedLayouts: ["b"], // Only layout B is supported
      imagePath: liloStitchFrameB,
    },
  ];

  // Photo strip width based on layout
  const getStripWidth = () => {
    switch (layout) {
      case "a":
      case "b":
      case "d":
        return 1200; // Layout A or C: 1200px width
      case "c":
        return 600; // Layout B or D: 600px width
      default:
        return 0; // Default: 0px (to be determined for layouts C and D)
    }
  };

  const stripWidth = getStripWidth();

  const getPhotoGap = () => {
    switch (layout) {
      case "a":
        return 30;
      case "b":
        return 120;
      case "c":
      case "d":
        return 40;
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
      canvasPadding = { top: 160, left: 60 };
      break;
    case "c":
      canvasPadding = { top: 60, left: 30 };
      break;
    case "d":
      canvasPadding = { top: 70, left: 97 };
      break;
    default:
      canvasPadding = { top: 0, left: 0 };
  }

  // Calculate height to ensure standard 2:6 aspect ratio for layouts A and B
  const getStripHeight = () => {
    switch (layout) {
      case "a": // 4 photos, 1 per row - standard 2:6 aspect ratio
      case "b": // 3 photos, 1 per row - standard 2:6 aspect ratio
        return 3600;
      case "c": // 2 photos, 1 per row - standard 4:6 aspect ratio
      case "d": // 2 photos, 1 per row - standard 2:6 aspect ratio
        return 1800;
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
      handleGeneratePhotoStrip();
    }
  }, [photos, frameColor, selectedFrame]);
  // Wrapper function to call the external generatePhotoStrip function
  const handleGeneratePhotoStrip = async () => {
    await generatePhotoStrip({
      canvas: canvasRef.current,
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
    });
  }; // Early return check - must be AFTER all hooks have been called
  if (!hasActiveSession() || !photos || photos.length === 0) {
    return (
      <div className="photo-strip-container page-container">
        <h2>Redirecting...</h2>
        <p>Loading photo session...</p>
        <Footer />
      </div>
    );
  }

  // Handler functions for downloads
  const handleDownloadJPEG = () => {
    downloadAsJPEG(canvasRef.current, layout);
  };

  const handleDownloadGIF = () => {
    downloadAsGIF(photos, layout, setIsGeneratingGif);
  };

  return (
    <div className="photo-strip-container page-container">
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
            />{" "}
            <span className="color-value">{frameColor}</span>
          </div>

          {/* Frame Selector */}
          <div className="frame-picker-container">
            <p>Choose Frame:</p>
            <div className="frame-options">
              {frameOptions.map((frame) => {
                const isSupported = frame.supportedLayouts.includes(layout);
                const isSelected = selectedFrame?.id === frame.id;

                return (
                  <button
                    key={frame.id || "no-frame"}
                    className={`frame-option ${!isSupported ? "disabled" : ""} ${isSelected ? "selected" : ""}`}
                    disabled={!isSupported}
                    onClick={() => setSelectedFrame(frame)}
                    aria-label={`Select ${frame.name} frame`}
                    title={
                      !isSupported
                        ? `${frame.name} is only available for layout ${frame.supportedLayouts.join(", ").toUpperCase()}`
                        : frame.name
                    }
                  >
                    {frame.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      {stripGenerated && (
        <div className="download-controls">
          <p>Download Your Photo Strip</p>{" "}
          <div className="download-buttons">
            <button
              onClick={handleDownloadJPEG}
              className="action-btn download"
            >
              Download as JPEG
            </button>
            <button
              onClick={handleDownloadGIF}
              disabled={isGeneratingGif}
              className="action-btn download"
            >
              {isGeneratingGif ? "Creating GIF..." : "Download as GIF"}
            </button>
          </div>
        </div>
      )}{" "}
      <div className="navigation-controls">
        <button onClick={takeNewPhotos} className="action-btn primary">
          Take New Photos
        </button>
      </div>
      <Footer />
    </div>
  );
}
