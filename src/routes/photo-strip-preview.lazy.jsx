import { createLazyFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { usePhotoContext } from "../context/PhotoContext";
import "../assets/css/photo-strip-preview.lazy.css";
import "../assets/css/footer.css";
import liloStitchFrameB from "../assets/images/frames/lilo_stitch_frames/lilo_stitch_frame_b.png";
import Footer from "../components/Footer";
import PromoModal from "../components/PromoModal";
import QuoteModal from "../components/QuoteModal";
import QRCodeShare from "../components/QRCodeShare";
import { downloadAsJPEG } from "../assets/javascript/downloadJpeg.js";
import { downloadAsGIF } from "../assets/javascript/downloadGif.js";
import { downloadIndividualImages } from "../assets/javascript/downloadIndividualImages.js";
import { generatePhotoStrip } from "../assets/javascript/generatePhotoStrip.js";
import { fetchPhotosFromSupabase } from "../assets/javascript/photoSharingService.js";

export const Route = createLazyFileRoute("/photo-strip-preview")({
  component: PhotoStripPreviewComponent,
});

function PhotoStripPreviewComponent() {
  const navigate = useNavigate();
  const { photoSession, resetSession, hasActiveSession } = usePhotoContext();
  const canvasRef = useRef(null);
  const [stripGenerated, setStripGenerated] = useState(false);
  const [isGeneratingGif, setIsGeneratingGif] = useState(false);
  const [frameColor, setFrameColor] = useState("#ffffff"); // Default white frame
  const [selectedFrame, setSelectedFrame] = useState(null); // Default no frame
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [pendingDownloadType, setPendingDownloadType] = useState(null); // 'jpeg' or 'gif'
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [hasDownloaded, setHasDownloaded] = useState(false);
  
  // Shared session state
  const [isSharedSession, setIsSharedSession] = useState(false);
  const [sharedPhotos, setSharedPhotos] = useState([]);
  const [sharedLayout, setSharedLayout] = useState(null);
  const [sharedPhotoCount, setSharedPhotoCount] = useState(0);
  const [isLoadingShared, setIsLoadingShared] = useState(false);
  const [sharedError, setSharedError] = useState(null);

  // Determine which photos/layout to use (shared or local session)
  const photos = isSharedSession ? sharedPhotos : photoSession.photos;
  const layout = isSharedSession ? sharedLayout : photoSession.layout;
  const photoCount = isSharedSession ? sharedPhotoCount : photoSession.photoCount;

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
  // Using 4x scale for print-quality output
  const getStripWidth = () => {
    switch (layout) {
      case "a":
      case "b":
      case "d":
        return 4800; // 4x scale of 1200px for high-quality prints
      case "c":
        return 2400; // 4x scale of 600px for high-quality prints
      default:
        return 0;
    }
  };

  const stripWidth = getStripWidth();

  // Gap between photos - scaled 4x for high-resolution output
  const getPhotoGap = () => {
    switch (layout) {
      case "a":
        return 120; // 4x of 30
      case "b":
        return 480; // 4x of 120
      case "c":
      case "d":
        return 160; // 4x of 40
      default:
        return 0;
    }
  };
  const photoGap = getPhotoGap();

  // Adjust padding based on layout - scaled 4x for high-resolution output
  let canvasPadding;
  switch (layout) {
    case "a":
      canvasPadding = { top: 480, left: 268 }; // 4x of { top: 120, left: 67 }
      break;
    case "b":
      canvasPadding = { top: 640, left: 240 }; // 4x of { top: 160, left: 60 }
      break;
    case "c":
      canvasPadding = { top: 240, left: 120 }; // 4x of { top: 60, left: 30 }
      break;
    case "d":
      canvasPadding = { top: 280, left: 388 }; // 4x of { top: 70, left: 97 }
      break;
    default:
      canvasPadding = { top: 0, left: 0 };
  }

  // Calculate height - scaled 4x for high-resolution output
  const getStripHeight = () => {
    switch (layout) {
      case "a": // 4 photos, 1 per row - standard 2:6 aspect ratio
      case "b": // 3 photos, 1 per row - standard 2:6 aspect ratio
        return 14400; // 4x of 3600
      case "c": // 2 photos, 1 per row - standard 4:6 aspect ratio
      case "d": // 2 photos, 1 per row - standard 2:6 aspect ratio
        return 7200; // 4x of 1800
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

  // Check for shared session URL parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get("session");

    if (sessionId) {
      setIsSharedSession(true);
      setIsLoadingShared(true);
      
      fetchPhotosFromSupabase(sessionId)
        .then((result) => {
          if (result.success) {
            setSharedPhotos(result.photos);
            setSharedLayout(result.layout);
            setSharedPhotoCount(result.photoCount);
          } else {
            setSharedError(result.error || "Failed to load shared photos");
          }
        })
        .catch((err) => {
          setSharedError(err.message || "An error occurred");
        })
        .finally(() => {
          setIsLoadingShared(false);
        });
    }
  }, []);

  // Redirect to home if no session (local or shared) is active
  useEffect(() => {
    // Don't redirect while loading shared session
    if (isLoadingShared) return;
    
    // For shared sessions, check if we have shared photos
    if (isSharedSession) {
      if (sharedError || (!isLoadingShared && sharedPhotos.length === 0)) {
        // Only redirect if there's an error or no photos after loading
        if (sharedError) {
          navigate({ to: "/" });
        }
      }
      return;
    }
    
    // For local sessions, use the original logic
    if (!hasActiveSession() || !photoSession.photos || photoSession.photos.length === 0) {
      navigate({ to: "/" });
    }
  }, [hasActiveSession, photoSession.photos, navigate, isSharedSession, sharedPhotos, isLoadingShared, sharedError]);

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
  
  // Show loading state for shared sessions
  if (isLoadingShared) {
    return (
      <div className="photo-strip-container page-container">
        <h2>Loading Shared Photos...</h2>
        <p>Please wait while we fetch your photos.</p>
        <Footer />
      </div>
    );
  }

  // Show error state for shared sessions
  if (isSharedSession && sharedError) {
    return (
      <div className="photo-strip-container page-container">
        <h2>Unable to Load Photos</h2>
        <p>{sharedError}</p>
        <button onClick={() => navigate({ to: "/" })} className="action-btn primary">
          Go to Home
        </button>
        <Footer />
      </div>
    );
  }

  // For local sessions without photos
  if (!isSharedSession && (!hasActiveSession() || !photos || photos.length === 0)) {
    return (
      <div className="photo-strip-container page-container">
        <h2>Redirecting...</h2>
        <p>Loading photo session...</p>
        <Footer />
      </div>
    );
  } // Smart modal display logic - "3-strike" system (JPEG downloads only)
  const shouldShowModal = () => {
    const jpegDownloadCount = parseInt(
      localStorage.getItem("little-craft-download-count") || "0"
    );
    const nextJpegDownloadCount = jpegDownloadCount + 1;

    // Show modal on strategic JPEG downloads: 1st, 5th, and 15th
    const showOnDownloads = [1, 5, 15];
    return showOnDownloads.includes(nextJpegDownloadCount);
  };

  const incrementDownloadCount = () => {
    // Only increment for JPEG downloads (those that can trigger modals)
    const currentCount = parseInt(
      localStorage.getItem("little-craft-download-count") || "0"
    );
    localStorage.setItem(
      "little-craft-download-count",
      (currentCount + 1).toString()
    );
  };

  // Handler functions for downloads
  const handleDownloadJPEG = () => {
    if (shouldShowModal()) {
      setShowPromoModal(true);
      setPendingDownloadType("jpeg");
    } else {
      downloadAsJPEG(canvasRef.current, layout);
      incrementDownloadCount();
    }
  };
  const handleDownloadGIF = () => {
    // GIF downloads bypass the promotional modal and don't count toward 3-strike system
    // since GIF is just animated version, not for printing
    downloadAsGIF(photos, layout, setIsGeneratingGif);
    // Note: No incrementDownloadCount() call here
  };

  const handleDownloadIndividualImages = () => {
    // Individual image downloads bypass the promotional modal and don't count toward 3-strike system
    // since these are just individual photos, not the main photo strip
    downloadIndividualImages(photos, layout);
    // Note: No incrementDownloadCount() call here
  }; // Execute the actual download after modal interaction
  const proceedWithDownload = () => {
    // Increment download count when user proceeds from modal
    incrementDownloadCount();

    // Only JPEG downloads go through the modal now
    if (pendingDownloadType === "jpeg") {
      downloadAsJPEG(canvasRef.current, layout);
    }
    setShowPromoModal(false);
    setPendingDownloadType(null);
  };
  // Close modal without downloading
  const closePromoModal = () => {
    // Don't increment count if user closes without downloading
    setShowPromoModal(false);
    setPendingDownloadType(null);
  };

  // Handle Get Quote button from PromoModal
  const handleGetQuote = () => {
    setShowPromoModal(false);
    setShowQuoteModal(true);
    setHasDownloaded(false); // Reset download state for quote flow
  };
  // Handle download from QuoteModal
  const handleQuoteDownload = () => {
    // Only JPEG downloads go through the quote modal
    if (pendingDownloadType === "jpeg") {
      downloadAsJPEG(canvasRef.current, layout);
    }

    incrementDownloadCount();
    setHasDownloaded(true); // Mark as downloaded for quote modal
  };

  // Close quote modal
  const closeQuoteModal = () => {
    setShowQuoteModal(false);
    setPendingDownloadType(null);
    setHasDownloaded(false);
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
              Download Strip
            </button>
            <button
              onClick={handleDownloadGIF}
              disabled={isGeneratingGif}
              className="action-btn download"
            >
              {isGeneratingGif ? "Creating GIF..." : "Download as GIF"}
            </button>{" "}
            <button
              onClick={handleDownloadIndividualImages}
              className="action-btn download"
            >
              Download Photos
            </button>
          </div>
          
          {/* QR Code Share - only show for local sessions */}
          {!isSharedSession && (
            <QRCodeShare photos={photos} layout={layout} />
          )}
        </div>
      )}{" "}
      <div className="navigation-controls">
        <button onClick={takeNewPhotos} className="action-btn primary">
          Take New Photos
        </button>
      </div>{" "}
      {/* Promotional Modal */}
      <PromoModal
        isOpen={showPromoModal}
        onClose={closePromoModal}
        onProceedAnyway={proceedWithDownload}
        onGetQuote={handleGetQuote}
        downloadCount={
          parseInt(localStorage.getItem("little-craft-download-count") || "0") +
          1
        }
      />
      {/* Quote Modal */}
      <QuoteModal
        isOpen={showQuoteModal}
        onClose={closeQuoteModal}
        onDownload={handleQuoteDownload}
        hasDownloaded={hasDownloaded}
        pendingDownloadType={pendingDownloadType}
      />
      <Footer />
    </div>
  );
}
